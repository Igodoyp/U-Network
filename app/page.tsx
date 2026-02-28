"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserContext } from "@/context/UserContext"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { AzureLoginView } from "@/components/auth/AzureLoginView"
import { OnboardingForm } from "@/components/auth/OnboardingForm"
import { Button } from "@/components/ui/button"
import { ONBOARDING_STEPS, OnboardingStepId } from "@/lib/constants"
import * as authService from "@/lib/authService"
import { supabase } from "@/lib/supabaseClient"
import { signInWithUDD } from "@/lib/authService"
import { GraduationCap } from "lucide-react"

// ============================================================================
// TIPOS
// ============================================================================

interface Ramo {
  id: string
  nombre: string
}

type OnboardingStep = OnboardingStepId

// ============================================================================
// COMPONENTE PRINCIPAL - Página de autenticación con Azure
// ============================================================================

export default function UNetworkAuth() {
  const router = useRouter()
  const { userData: contextUserData, setUserData: setContextUserData } = useUserContext()
  const aeroFontStyle = {
    fontFamily: "'Avenir Next', 'Frutiger', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  }
  
  // Estado local del usuario para esta página
  const [userData, setUserData] = useState(contextUserData)
  
  // Estado del flujo de onboarding
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("auth")
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  // ============================================================================
  // EFECTO: Sincronizar userData del contexto
  // ============================================================================
  useEffect(() => {
    if (contextUserData) {
      setUserData(contextUserData)
    }
  }, [contextUserData])

  // ============================================================================
  // EFECTO: Verificar sesión activa al cargar (después del callback de Azure)
  // ============================================================================
  useEffect(() => {
    // Solo ejecutar una vez
    if (initialCheckDone) return

    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timeout")), ms)
        promise
          .then((value) => {
            clearTimeout(timer)
            resolve(value)
          })
          .catch((err) => {
            clearTimeout(timer)
            reject(err)
          })
      })
    }

    const checkSession = async () => {
      try {
        // Evitar cuelgue infinito si Supabase no responde
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 5000)
        
        if (!session?.user) {
          // No hay sesión, mostrar login
          setCurrentStep("auth")
          setIsLoading(false)
          setInitialCheckDone(true)
          return
        }

        // Verificar si el usuario existe en la tabla usuarios
        const { data: usuarioData, error } = await authService.getUsuarioById(session.user.id)

        if (error || !usuarioData) {
          // Usuario nuevo autenticado con Azure pero sin registro en DB
          // Crear objeto de usuario temporal para el onboarding
          const newUser = {
            id: session.user.id,
            correo: session.user.email || "",
            nombre: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuario",
            carrera: "",
            anio: "",
            avatar: session.user.user_metadata?.avatar_url,
            university: "Universidad del Desarrollo",
          }

          setUserData(newUser)
          setCurrentStep("profile")
          setIsLoading(false)
          setInitialCheckDone(true)
        } else {
          // Usuario existente - verificar si necesita completar onboarding
          await handleExistingUser(usuarioData)
          setIsLoading(false)
          setInitialCheckDone(true)
        }
      } catch (err) {
        console.error("Error al verificar sesión:", err)
        // En caso de error o timeout, mostrar login en vez de quedarse cargando
        setCurrentStep("auth")
        setIsLoading(false)
        setInitialCheckDone(true)
      }
    }

    checkSession()
  }, [initialCheckDone])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Maneja el flujo para usuarios existentes
   */
  const handleExistingUser = async (data: any) => {
    setUserData(data)

    try {
      // Si el usuario ya tiene carrera y año, debería haber sido mandado al dashboard
      // por el callback. Si aún así llegó aquí, lo mandamos al dashboard.
      if (data.carrera && data.anio) {
        console.log("Usuario con perfil completo detectado en page.tsx, yendo a dashboard")
        router.push("/dashboard")
        return
      }

      // Si no tiene perfil completo, mostrar onboarding
      setCurrentStep("profile")
    } catch (err) {
      console.error("Error inesperado:", err)
    }
  }

  /**
   * Guarda los ramos seleccionados
   */
  const handleSaveRamos = async (records: { usuario_id: string; ramo_id: string }[]) => {
    const { error } = await authService.insertUsuariosRamos(records)
    if (error) {
      console.error("Error al guardar ramos:", error)
      throw error
    }
  }

  /**
   * Guarda el perfil del usuario (carrera y año)
   */
  const handleSaveProfile = async (carrera: string, anio: string, nombre: string) => {
    if (!userData) return

    try {
      const updatedUser = {
        ...userData,
        nombre,
        carrera,
        anio,
      }

      // Usar upsert para crear o actualizar
      const { error } = await authService.upsertUsuario(updatedUser)
      if (error) {
        console.error("Error al guardar perfil:", error)
        throw error
      }

      setUserData(updatedUser)
      setContextUserData(updatedUser)
    } catch (err) {
      console.error("Error al guardar perfil:", err)
      throw err
    }
  }

  /**
   * Finaliza el onboarding
   */
  const handleOnboardingFinish = () => {
    router.push("/dashboard")
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={aeroFontStyle}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: "url('https://i.pinimg.com/736x/c6/de/b1/c6deb1f7fe2c888f227a600e1e4e6a47.jpg')" }}
        />
        <div className="absolute inset-0 bg-white/25 backdrop-blur-[3px]" />
        <div className="relative z-10 text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-800 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  // Maneja el click en el botón de login
  const handleUDDLogin = async () => {
    setIsSigningIn(true)
    try {
      await signInWithUDD()
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      setIsSigningIn(false)
    }
  }

  // Si estamos en auth (antes de login), mostrar H1, H2 y botón
  if (currentStep === "auth") {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden" style={aeroFontStyle}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: "url('https://i.pinimg.com/736x/c6/de/b1/c6deb1f7fe2c888f227a600e1e4e6a47.jpg')" }}
        />
        <div className="absolute inset-0 bg-white/25 backdrop-blur-[3px]" />
        <div className="relative z-10 w-full max-w-2xl space-y-8">
          {/* H1 */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Que aprobar dependa de tu esfuerzo, no de tus contactos
            </h1>
          </div>

          {/* H2 */}
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 leading-relaxed">
              democratizamos el acceso al material de estudio para derribar barreras. 
            </h2>
          </div>

          {/* Botón de login */}
          <div>
            <Button
              type="button"
              className="w-full text-white font-semibold py-6 rounded-lg border-white/45 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 hover:from-fuchsia-400 hover:via-purple-500 hover:to-blue-400 shadow-[0_5px_14px_rgba(147,51,234,0.22)] hover:shadow-[0_8px_16px_rgba(147,51,234,0.28)] active:from-gray-300 active:via-gray-300 active:to-gray-300 active:text-gray-900 active:shadow-[0_2px_6px_rgba(89,74,56,0.10)]"
              onClick={handleUDDLogin}
              disabled={isLoading || isSigningIn}
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              {isSigningIn ? "Redirigiendo..." : "Continuar con correo institucional"}
            </Button>
          </div>

          {/* Resto del manifiesto */}
          <div className="space-y-6 text-gray-900 border-t pt-8">
            <div>
              <strong className="text-gray-900">El problema:</strong>
              <p className="mt-2">
                Entrar a la universidad puede sentirse como llegar a una fiesta donde todos se conocen menos tú. Si no tienes los contactos y el profe no sube cosas al canvas, no tienes el material. Y si no tienes el material, te aislas estudiando el doble para lograr la mitad.
              </p>
            </div>

            <div>
              <strong className="text-gray-900">Nuestra solución:</strong>
              <p className="mt-2">
                Creemos que el verdadero networking no nace del interés ("¿me pasas la prueba?"), sino de la colaboración. Al liberar el conocimiento, transformamos la competencia tóxica en cooperación. Queremos que dejes de buscar archivos desesperadamente y empieces a conectar con quienes ya recorrieron tu camino.
              </p>
            </div>

            <div>
              <strong className="text-gray-900 block mb-3">Los 3 pilares de unetwork</strong>
              <ul className="space-y-3">
                <li>
                  <span className="text-2xl mr-2">⚖️</span>
                  <strong>Emparejar la Cancha</strong>
                  <p className="ml-8 text-sm mt-1">
                    Que tu éxito académico dependa de tus neuronas y tu disciplina, no de tus contactos o grupos. El material de calidad es un derecho de todos, no un privilegio de pocos.
                  </p>
                </li>
                <li>
                  <span className="text-2xl mr-2">🔗</span>
                  <strong>Conexión Real</strong>
                  <p className="ml-8 text-sm mt-1">
                    No queremos que seas un ermitaño descargando PDFs en tu pieza. Queremos que sepas quién subió ese resumen bacán, que le puedas agradecer, y que entiendas que hay una red de futuros colegas dispuestos a ayudarte. Unetwork conecta personas a través del conocimiento.
                  </p>
                </li>
                <li>
                  <span className="text-2xl mr-2">🌱</span>
                  <strong>El Legado</strong>
                  <p className="ml-8 text-sm mt-1">
                    Para el estudiante más viejo, subir un material es tenderle una mano al que viene llegando. Es decirle al mechón: "Yo estuve ahí, sé que es difícil, toma estas herramientas y ponele weno".
                  </p>
                </li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <strong className="text-gray-900 block mb-2">¿Eres mechón?</strong>
              <p className="text-sm">
                Bienvenido a tu red de apoyo. Olvídate del miedo a quedarte atrás por no estar en el grupo de WhatsApp "correcto". Aquí partes con las mismas herramientas que el resto. Úsalo, aprende y, cuando domines el ramo, devuélvele la mano a la siguiente generación.
              </p>
            </div>

            <div className="italic text-center text-sm text-gray-800 border-t pt-4">
              "El conocimiento crece cuando se comparte, y nosotros crecemos cuando ayudamos." Unetwork: Comunidad, Estudio y Colaboración.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-2 sm:p-4 overflow-hidden" style={aeroFontStyle}>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('https://i.pinimg.com/736x/c6/de/b1/c6deb1f7fe2c888f227a600e1e4e6a47.jpg')" }}
      />
      <div className="absolute inset-0 bg-white/25 backdrop-blur-[3px]" />
      <div className="relative z-10 w-full max-w-lg">
        {/* Indicador de progreso */}
        <ProgressIndicator steps={ONBOARDING_STEPS} currentStep={currentStep} />

        {/* Steps 2-3: Onboarding (perfil y ramos) */}
        {(currentStep === "profile" || currentStep === "subjects") && userData && (
          <div className="animate-fadeIn">
            <OnboardingForm
              usuarioId={userData.id}
              userName={userData.nombre}
              carreraActual={userData.carrera}
              anioActual={userData.anio}
              needsProfile={!userData.carrera}
              onSaveProfile={handleSaveProfile}
              onSaveIntereses={async () => {}}
              onSaveRamos={handleSaveRamos}
              onFinish={handleOnboardingFinish}
              onStepChange={setCurrentStep}
              initialStep={currentStep as any}
              onSkipRamos={() => {}}
              isExistingUser={isExistingUser}
            />
          </div>
        )}
      </div>
    </div>
  )
}
