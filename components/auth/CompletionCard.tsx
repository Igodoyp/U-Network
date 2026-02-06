"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BookOpen, Sparkles, Users } from "lucide-react"

interface Ramo {
  id: string
  nombre: string
}

interface UserData {
  id: string
  nombre: string
  correo: string
  carrera?: string
  semestre?: string
}

interface CompletionCardProps {
  userData: UserData | null
  selectedInterests: string[]
  selectedSubjects: Ramo[]
  onContinue: () => void
}

/**
 * Tarjeta de completado del onboarding
 * Muestra un resumen de la configuración del usuario y permite continuar al dashboard
 */
export function CompletionCard({
  userData,
  selectedInterests,
  selectedSubjects,
  onContinue,
}: CompletionCardProps) {
  return (
    <Card className="w-full shadow-xl border-0">
      <CardHeader className="text-center space-y-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-t-lg">
        <div className="mx-auto w-32 h-32 flex items-center justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            UNet
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-green-800">
            ¡Todo listo! 🎉
          </CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            ¡Bienvenido {userData?.nombre}! Ya estás listo para encontrar el
            mejor material de estudio
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600 font-medium">
            🚀 ¡Hora de encontrar el material que necesitas para dominar tus
            estudios!
          </p>
          <Button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all transform hover:scale-[1.02]"
          >
            Explorar material 📚✨
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
