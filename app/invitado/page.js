"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

export default function InvitadoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code") || ""
  const [status, setStatus] = useState("idle")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!code) {
      setStatus("missing")
    }
  }, [code])

  const signInGuest = async () => {
    if (!code) return
    setStatus("loading")
    setErrorMessage("")

    try {
      const response = await fetch(
        `/api/invitado?code=${encodeURIComponent(code)}&mode=session`,
        { cache: "no-store" }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        setStatus("error")
        setErrorMessage(errorData?.error || "ErrorInvitado")
        return
      }

      const payload = await response.json()
      const session = payload?.session

      if (!session?.access_token || !session?.refresh_token) {
        setStatus("error")
        setErrorMessage("SesionInvalida")
        return
      }

      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })

      if (error) {
        setStatus("error")
        setErrorMessage(error.message || "ErrorInvitado")
        return
      }

      router.replace("/dashboard")
    } catch (err) {
      setStatus("error")
      setErrorMessage(err?.message || "ErrorInvitado")
    }
  }

  if (status === "missing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 sm:p-6">
        <div className="text-center space-y-4">
          <p className="text-gray-700 font-medium">Falta el codigo del invitado.</p>
          <Button type="button" onClick={() => router.replace("/")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold"
          >
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Que aprobar dependa de tu esfuerzo, no de tus contactos
          </h1>
        </div>

        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-700 leading-relaxed">
            democratizamos el acceso al material de estudio para derribar barreras.
          </h2>
        </div>

        <div>
          <Button
            type="button"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-6 rounded-lg shadow-lg transition-all transform hover:scale-[1.02] text-lg"
            onClick={signInGuest}
            disabled={status === "loading"}
          >
            <GraduationCap className="w-5 h-5 mr-2" />
            {status === "loading" ? "Ingresando..." : "Ingresar al dashboard"}
          </Button>
          {status === "error" && (
            <p className="text-sm text-red-600 mt-3 text-center">
              No se pudo iniciar sesion. {errorMessage}
            </p>
          )}
        </div>

        <div className="space-y-6 text-gray-700 border-t pt-8">
          <div>
            <strong className="text-gray-900">El problema:</strong>
            <p className="mt-2">
              Entrar a la universidad puede sentirse como llegar a una fiesta donde todos se conocen menos tu. Si no tienes los contactos, no tienes el material. Y si no tienes el material, te aislas estudiando el doble para lograr la mitad.
            </p>
          </div>

          <div>
            <strong className="text-gray-900">Nuestra solucion:</strong>
            <p className="mt-2">
              Creemos que el verdadero networking no nace del interes ("¿me pasas la prueba?"), sino de la colaboracion. Al liberar el conocimiento, transformamos la competencia toxica en cooperacion. Queremos que dejes de buscar archivos desesperadamente y empieces a conectar con quienes ya recorrieron tu camino.
            </p>
          </div>

          <div>
            <strong className="text-gray-900 block mb-3">Los 3 pilares de unetwork</strong>
            <ul className="space-y-3">
              <li>
                <span className="text-2xl mr-2">⚖️</span>
                <strong>Emparejar la Cancha</strong>
                <p className="ml-8 text-sm mt-1">
                  Que tu exito academico dependa de tus neuronas y tu disciplina, no de tus contactos o grupos. El material de calidad es un derecho de todos, no un privilegio de pocos.
                </p>
              </li>
              <li>
                <span className="text-2xl mr-2">🔗</span>
                <strong>Conexion Real</strong>
                <p className="ml-8 text-sm mt-1">
                  No queremos que seas un ermitano descargando PDFs en tu pieza. Queremos que sepas quien subio ese resumen bacan, que le puedas agradecer, y que entiendas que hay una red de futuros colegas dispuestos a ayudarte. Unetwork conecta personas a traves del conocimiento.
                </p>
              </li>
              <li>
                <span className="text-2xl mr-2">🌱</span>
                <strong>El Legado</strong>
                <p className="ml-8 text-sm mt-1">
                  Para el estudiante mas viejo, subir un material es tenderle una mano al que viene llegando. Es decirle al mechon: "Yo estuve ahi, se que es dificil, toma estas herramientas y ponele weno".
                </p>
              </li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <strong className="text-gray-900 block mb-2">¿Eres mechon?</strong>
            <p className="text-sm">
              Bienvenido a tu red de apoyo. Olvidate del miedo a quedarte atras por no estar en el grupo de WhatsApp "correcto". Aqui partes con las mismas herramientas que el resto. Usalo, aprende y, cuando domines el ramo, devuelvele la mano a la siguiente generacion.
            </p>
          </div>

          <div className="italic text-center text-sm border-t pt-4">
            "El conocimiento crece cuando se comparte, y nosotros crecemos cuando ayudamos." Unetwork: Comunidad, Estudio y Colaboracion.
          </div>
        </div>
      </div>
    </div>
  )
}
