"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserContext } from "@/context/UserContext"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { AzureLoginView } from "@/components/auth/AzureLoginView"
import { OnboardingForm } from "@/components/auth/OnboardingForm"
import { CompletionCard } from "@/components/auth/CompletionCard"
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
  
  // Estado local del usuario para esta página
  const [userData, setUserData] = useState(contextUserData)
  
  // Estado del flujo de onboarding
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("auth")
  const [selectedSubjects, setSelectedSubjects] = useState<Ramo[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
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
   * Guarda los intereses del usuario
   */
  const handleSaveIntereses = async (records: { usuario_id: string; interes: string }[]) => {
    const { error } = await authService.insertUsuariosIntereses(records)
    if (error) {
      console.error("Error al guardar intereses:", error)
      throw error
    }
    setSelectedInterests(records.map((r) => r.interes))
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
    // Guardar IDs de ramos (los nombres vendrán del form)
    setSelectedSubjects(records.map((r) => ({ id: r.ramo_id, nombre: "Ramo" })))
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
    setCurrentStep("complete")
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl space-y-8">
          {/* H1 */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Que aprobar dependa de tu esfuerzo, no de tus contactos
            </h1>
          </div>

          {/* H2 */}
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-700 leading-relaxed">
              democratizamos el acceso al material de estudio para derribar barreras. 
            </h2>
          </div>

          {/* Botón de login */}
          <div>
            <Button
              type="button"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-6 rounded-lg shadow-lg transition-all transform hover:scale-[1.02] text-lg"
              onClick={handleUDDLogin}
              disabled={isLoading || isSigningIn}
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              {isSigningIn ? "Redirigiendo..." : "Continuar con cuenta UDD"}
            </Button>
          </div>

          {/* Resto del manifiesto */}
          <div className="space-y-6 text-gray-700 border-t pt-8">
            <div>
              <strong className="text-gray-900">el problema:</strong>
              <p className="mt-2">
                entrar a la universidad puede sentirse como llegar a una fiesta donde todos se conocen menos tú. Si no tienes los contactos, no tienes el material. Y si no tienes el material, te aislas estudiando el doble para lograr la mitad.
              </p>
            </div>

            <div>
              <strong className="text-gray-900">nuestra solución:</strong>
              <p className="mt-2">
                creemos que el verdadero networking no nace del interés ("¿me pasas la prueba?"), sino de la colaboración. Al liberar el conocimiento, transformamos la competencia tóxica en cooperación. Queremos que dejes de buscar archivos desesperadamente y empieces a conectar con quienes ya recorrieron tu camino.
              </p>
            </div>

            <div>
              <strong className="text-gray-900 block mb-3">los 3 pilares de unetwork</strong>
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
              <strong className="text-gray-900 block mb-2">¿eres mechón?</strong>
              <p className="text-sm">
                bienvenido a tu red de apoyo. Olvídate del miedo a quedarte atrás por no estar en el grupo de WhatsApp "correcto". Aquí partes con las mismas herramientas que el resto. Úsalo, aprende y, cuando domines el ramo, devuélvele la mano a la siguiente generación.
              </p>
            </div>

            <div className="italic text-center text-sm border-t pt-4">
              "El conocimiento crece cuando se comparte, y nosotros crecemos cuando ayudamos." Unetwork: Comunidad, Estudio y Colaboración.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-lg">
        {/* Indicador de progreso (solo después del login) */}
        {currentStep !== "auth" && (
          <ProgressIndicator steps={ONBOARDING_STEPS} currentStep={currentStep} />
        )}

        {/* Steps 2-4: Onboarding (perfil, intereses y ramos) */}
        {(currentStep === "profile" || currentStep === "interests" || currentStep === "subjects") && userData && (
          <div className="animate-fadeIn">
            <OnboardingForm
              usuarioId={userData.id}
              userName={userData.nombre}
              carreraActual={userData.carrera}
              anioActual={userData.anio}
              needsProfile={!userData.carrera}
              onSaveProfile={handleSaveProfile}
              onSaveIntereses={handleSaveIntereses}
              onSaveRamos={handleSaveRamos}
              onFinish={handleOnboardingFinish}
              onStepChange={setCurrentStep}
              initialStep={currentStep as any}
              onSkipIntereses={() => {}}
              onSkipRamos={() => {}}
              isExistingUser={isExistingUser}
            />
          </div>
        )}

        {/* Step 4: Completado */}
        {currentStep === "complete" && (
          <div className="animate-fadeIn">
            <CompletionCard
              userData={userData}
              selectedInterests={selectedInterests}
              selectedSubjects={selectedSubjects}
              onContinue={() => router.push("/dashboard")}
            />
          </div>
        )}
      </div>
    </div>
  )
}
