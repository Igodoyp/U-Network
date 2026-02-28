
// Indica que este archivo es un componente cliente de Next.js
"use client"


// Importa hooks de React y componentes de UI reutilizables
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, GraduationCap } from "lucide-react"
// Importa funciones auxiliares para obtener el logo y realizar login con Azure
import { getPublicAvatarUrl, signInWithUDD } from "@/lib/authService"


// Props opcionales para mostrar estado de carga
interface AzureLoginViewProps {
  isLoading?: boolean
}


// Componente principal de login con Azure/UDD
export function AzureLoginView({ isLoading = false }: AzureLoginViewProps) {
  // Estado para la URL del logo y para mostrar "Redirigiendo..."
  const [logoUrl, setLogoUrl] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)


  // Al montar el componente, obtiene la URL pública del logo desde Supabase Storage
  useEffect(() => {
    const url = getPublicAvatarUrl('Logo inicio.png')
    setLogoUrl(url)
  }, [])


  // Maneja el click en el botón de login: inicia el flujo de autenticación con Azure
  const handleUDDLogin = async () => {
    setIsSigningIn(true)
    try {
      await signInWithUDD()
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      setIsSigningIn(false)
    }
  }

  // Renderiza la tarjeta de login con branding, botón y mensajes
  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://i.pinimg.com/736x/c6/de/b1/c6deb1f7fe2c888f227a600e1e4e6a47.jpg')" }}
      />
      <div className="absolute inset-0 bg-white/25 backdrop-blur-[3px]" />
      <Card className="relative z-10 w-full shadow-xl border-0 bg-white/80">
      {/* Encabezado con logo y bienvenida */}
      <CardHeader className="text-center space-y-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-t-lg">
        <div className="mx-auto w-32 h-32 flex items-center justify-center">
          {/* Logo de la app, si está disponible */}
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="UNetwork Logo"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              UNet
            </div>
          )}
        </div>
        <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ¡Bienvenido a UNetwork! 🎓
        </CardTitle>
        <CardDescription className="text-base text-gray-600">
          La plataforma de estudiantes UDD para compartir material académico, conectar y aprender juntos
        </CardDescription>
      </CardHeader>
      {/* Contenido principal: botón de login y mensajes */}
      <CardContent className="p-8 space-y-6">
        {/* Línea divisoria y mensaje */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">Inicia sesión con tu cuenta UDD</span>
          </div>
        </div>

        {/* Botón para iniciar sesión con Azure/UDD */}
        <Button
          type="button"
          className="w-full text-white font-semibold py-6 rounded-lg border-white/45 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 hover:from-fuchsia-400 hover:via-purple-500 hover:to-blue-400 shadow-[0_5px_14px_rgba(147,51,234,0.22)] hover:shadow-[0_8px_16px_rgba(147,51,234,0.28)] active:from-gray-300 active:via-gray-300 active:to-gray-300 active:text-gray-900 active:shadow-[0_2px_6px_rgba(89,74,56,0.10)] transition-all transform hover:scale-[1.02]"
          onClick={handleUDDLogin}
          disabled={isLoading || isSigningIn}
        >
          <GraduationCap className="w-5 h-5 mr-2" />
          {isSigningIn ? "Redirigiendo..." : "Continuar con cuenta UDD"}
        </Button>

        {/* Mensajes informativos */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            Encuentra material, conecta con compañeros, domina tus ramos 💪
          </p>
          <p className="text-xs text-gray-400">
            Usa tu correo institucional (@udd.cl) para acceder
          </p>
        </div>
      </CardContent>
      </Card>
    </div>
  )
}
