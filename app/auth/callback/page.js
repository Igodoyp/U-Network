"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const authError = params.get("error_description") || params.get("error")

        if (authError) {
          console.error("Error devuelto por el proveedor de autenticación:", authError)
          router.replace(`/?authError=${encodeURIComponent(authError)}`)
          return
        }

        const code = params.get("code")
        let sessionError = null

        if (code) {
          const result = await supabase.auth.exchangeCodeForSession(code)
          sessionError = result.error
        }

        let { data: { session }, error: currentSessionError } = await supabase.auth.getSession()
        sessionError = sessionError || currentSessionError

        // Supabase procesa automáticamente los retornos implícitos que llegan en el hash.
        if (!session && !sessionError && window.location.hash) {
          session = await new Promise((resolve) => {
            let subscription
            const timeout = setTimeout(() => {
              subscription?.unsubscribe()
              resolve(null)
            }, 3000)
            const result = supabase.auth.onAuthStateChange((_event, nextSession) => {
              if (nextSession) {
                clearTimeout(timeout)
                result.data.subscription.unsubscribe()
                resolve(nextSession)
              }
            })
            subscription = result.data.subscription
          })
        }

        const authenticationError = sessionError
        
        if (authenticationError || !session?.user) {
          console.error(
            "Error durante la autenticación:",
            authenticationError || {
              message: "No se recibió una sesión desde el proveedor",
              hasCode: true,
              hasHash: Boolean(window.location.hash),
            }
          )
          router.replace("/")
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
