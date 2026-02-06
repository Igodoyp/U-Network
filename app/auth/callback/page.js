"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Esperar a que Supabase procese la sesión
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Forzar verificación de sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.error("Error durante la autenticación:", sessionError)
          router.push("/")
          return
        }

        // Verificar si el usuario existe en la tabla usuarios
        const { data: usuarioData, error: userError } = await supabase
          .from("usuarios")
          .select("id, carrera, anio")
          .eq("id", session.user.id)
          .single()

        // Logging para debug
        console.log("Usuario existente:", usuarioData)
        console.log("Error:", userError?.code)

        // Si el usuario existe y tiene perfil completo, ir al dashboard
        if (usuarioData && usuarioData.carrera && usuarioData.anio) {
          console.log("Usuario con perfil completo, yendo a dashboard")
          router.replace("/dashboard")
        } else {
          // Si no existe o no tiene perfil completo, ir al onboarding
          console.log("Usuario nuevo o sin perfil, yendo a onboarding")
          router.replace("/")
        }
      } catch (err) {
        console.error("Error en el callback:", err)
        // En caso de error, ir al home para que maneje el flujo
        router.push("/")
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 font-medium">Verificando credenciales...</p>
      </div>
    </div>
  )
}
