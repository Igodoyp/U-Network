"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Toggle } from "@/components/ui/toggle"
import { Spinner } from "@/components/ui/spinner"
import { InfoTooltip } from "@/components/ui/info-tooltip"
import { BookOpen, CheckCircle, Sparkles, FileText, Target, GraduationCap, User, LogOut } from "lucide-react"
import { getPublicAvatarUrl } from "@/lib/authService"
import * as authService from "@/lib/authService"
import { CARRERAS, AÑOS, INTEREST_CATEGORIES, OnboardingStepId } from "@/lib/constants"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

interface OnboardingFormProps {
  usuarioId: string
  userName: string
  carreraActual?: string
  anioActual?: string
  onSaveProfile?: (carrera: string, anio: string, nombre: string) => Promise<void>
  onSaveIntereses: (records: { usuario_id: string; interes: string }[]) => Promise<void>
  onSaveRamos: (records: { usuario_id: string; ramo_id: string }[]) => Promise<void>
  onFinish: () => void
  onStepChange?: (step: OnboardingStepId) => void
  onSkipIntereses?: () => void
  onSkipRamos?: () => void
  isExistingUser?: boolean
  needsProfile?: boolean
  initialStep?: OnboardingStep
}

type OnboardingStep = 'profile' | 'interests' | 'subjects'

interface Ramo {
  id: string
  nombre: string
}

export function OnboardingForm({
  usuarioId,
  userName,
  carreraActual,
  anioActual,
  onSaveProfile,
  onSaveIntereses,
  onSaveRamos,
  onFinish,
  onStepChange,
  onSkipIntereses,
  onSkipRamos,
  isExistingUser = false,
  needsProfile = false,
  initialStep
}: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep || (needsProfile ? 'profile' : 'interests'))
  const [carrera, setCarrera] = useState(carreraActual || '')
  const [nombre, setNombre] = useState(userName || '')
  
  // Sincronizar paso con el padre
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep)
    }
  }, [currentStep, onStepChange])

  const [anio, setAnio] = useState(anioActual || '')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [ramosSeleccionados, setRamosSeleccionados] = useState<Ramo[]>([])
  const [ramosPorAnio, setRamosPorAnio] = useState<Record<string, Ramo[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState("")
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    window.location.reload()
  }

  useEffect(() => {
    const url = getPublicAvatarUrl('Logo inicio.png')
    setLogoUrl(url)
  }, [])

  // Cargar ramos cuando estamos en el step de subjects
  useEffect(() => {
    const fetchRamos = async () => {
      if (currentStep !== 'subjects' || !carrera) return

      try {
        const { data: ramosAgrupados, error } = await authService.getRamosPorCarrera(carrera)

        if (error) {
          console.error("Error al obtener ramos:", error)
          return
        }

        setRamosPorAnio(ramosAgrupados)
      } catch (err) {
        console.error("Error inesperado al obtener ramos:", err)
      }
    }

    fetchRamos()
  }, [currentStep, carrera])

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleCompleteProfile = async () => {
    if (!nombre.trim()) {
      alert("Por favor ingresa tu nombre")
      return
    }
    
    if (!carrera || !anio) {
      alert("Por favor selecciona tu carrera y año")
      return
    }

    setIsLoading(true)
    try {
      if (onSaveProfile) {
        await onSaveProfile(carrera, anio, nombre.trim())
      }
      setCurrentStep('interests')
    } catch (err) {
      console.error("Error al guardar perfil:", err)
      alert("Ocurrió un error al guardar tu perfil.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteInterests = async () => {
    setIsLoading(true)
    
    try {
      if (selectedInterests.length > 0) {
        const interesesData = selectedInterests.map((interes) => ({
          usuario_id: usuarioId,
          interes: interes
        }))

        await onSaveIntereses(interesesData)
      }

      setCurrentStep('subjects')
    } catch (err) {
      console.error("Error al guardar intereses:", err)
      alert("Ocurrió un error al guardar tus intereses.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipInterests = () => {
    if (onSkipIntereses) {
      onSkipIntereses()
    }
    setCurrentStep('subjects')
  }

  const handleRamoChange = (ramo: Ramo, checked: boolean) => {
    if (checked) {
      setRamosSeleccionados((prev) => [...prev, ramo])
    } else {
      setRamosSeleccionados((prev) => prev.filter((r) => r.id !== ramo.id))
    }
  }

  const handleCompleteSubjects = async () => {
    setIsLoading(true)
    
    try {
      if (ramosSeleccionados.length > 0) {
        const ramosData = ramosSeleccionados.map((ramo) => ({
          usuario_id: usuarioId,
          ramo_id: ramo.id
        }))

        await onSaveRamos(ramosData)
      }

      onFinish()
    } catch (err) {
      console.error("Error al guardar ramos:", err)
      alert("Ocurrió un error al guardar tus ramos.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipSubjects = () => {
    if (onSkipRamos) {
      onSkipRamos()
    }
    onFinish()
  }

  const getOrdinalYear = (year: string): string => {
    const yearNum = parseInt(year)
    switch(yearNum) {
      case 1: return "1ero"
      case 2: return "2do"
      case 3: return "3ero"
      case 4: return "4to"
      case 5: return "5to"
      case 6: return "6to"
      default: return `Año ${year}`
    }
  }

  // Profile step (for Azure OAuth users)
  if (currentStep === 'profile') {
    return (
      <Card className="w-full shadow-xl border-0">
        <CardHeader className="text-center space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-t-lg relative">
          {/* Botón de cerrar sesión */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Usar otra cuenta
          </Button>

          <div className="mx-auto w-40 h-40 flex items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo UNetWork"
                className="w-40 h-40 object-contain"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                UNet
              </div>
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-blue-800">¡Completa tu perfil! 🎓</CardTitle>
            <CardDescription className="text-gray-600">
              ¡Hola {userName}! Cuéntanos un poco más sobre ti para personalizar tu experiencia
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">Información académica</p>
            </div>
            <p className="text-sm text-blue-700">
              Necesitamos saber tu nombre, carrera y año para mostrarte material específico
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <User className="w-4 h-4 text-blue-500" />
              ¿Cómo te llamas?
            </Label>
            <Input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre completo"
              className="focus:border-blue-500 py-3 text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              ¿Qué carrera estás estudiando?
            </Label>
            <Select value={carrera} onValueChange={setCarrera} required>
              <SelectTrigger className="focus:border-purple-500 py-3 text-base">
                <SelectValue placeholder="Selecciona tu carrera" />
              </SelectTrigger>
              <SelectContent>
                {CARRERAS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {carrera && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-medium">
                <BookOpen className="w-4 h-4 text-orange-500" />
                ¿En qué año vas?
              </Label>
              <Select value={anio} onValueChange={setAnio} required>
                <SelectTrigger className="focus:border-orange-500 py-3 text-base">
                  <SelectValue placeholder="Selecciona tu año actual" />
                </SelectTrigger>
                <SelectContent>
                  {AÑOS.map((año) => (
                    <SelectItem key={año} value={año}>
                      {getOrdinalYear(año)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleCompleteProfile}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg py-6"
            disabled={isLoading || !nombre.trim() || !carrera || !anio}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner />
                Guardando...
              </div>
            ) : (
              "Continuar ✨"
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (currentStep === 'interests') {
    return (
      <Card className="w-full shadow-xl border-0">
        <CardHeader className="text-center space-y-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-t-lg">
          <div className="mx-auto w-40 h-40 flex items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo UNetWork"
                className="w-40 h-40 object-contain"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                UNet
              </div>
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-indigo-800">Personaliza tu experiencia ✨</CardTitle>
            <CardDescription className="text-gray-600">
              ¡Hola {userName}! Selecciona tus intereses para que podamos mostrarte contenido relevante
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <p className="text-sm font-medium text-indigo-800">Selecciona todo lo que te interese</p>
            </div>
            <p className="text-sm text-indigo-700">
              Esto nos ayudará a personalizar tu experiencia y conectarte con material y compañeros afines.
            </p>
          </div>

          {INTEREST_CATEGORIES.map((category) => (
            <div key={category.name} className="space-y-2">
              <Label className="flex items-center gap-2 font-medium text-indigo-700">
                {category.name === "Áreas de Estudio" && <BookOpen className="w-4 h-4 text-indigo-500" />}
                {category.name === "Tipo de Material" && <FileText className="w-4 h-4 text-purple-500" />}
                {category.name === "Objetivos" && <Target className="w-4 h-4 text-blue-500" />}
                {category.name}
                <InfoTooltip message={
                  category.name === "Áreas de Estudio" 
                    ? "Selecciona las áreas académicas que más te interesan para recibir contenido relevante" 
                    : category.name === "Tipo de Material"
                      ? "Escoge qué tipo de materiales de estudio prefieres"
                      : "Define tus objetivos académicos para personalizar tu experiencia"
                }/>
              </Label>
              <div className="flex flex-wrap gap-2">
                {category.interests.map(interest => (
                  <Toggle
                    key={interest}
                    pressed={selectedInterests.includes(interest)}
                    onPressedChange={() => toggleInterest(interest)}
                    className="px-3 py-1.5 rounded-full text-sm data-[state=on]:bg-indigo-500 data-[state=on]:text-white data-[state=off]:bg-gray-100 data-[state=off]:text-gray-700"
                  >
                    {selectedInterests.includes(interest) ? `✓ ${interest}` : interest}
                  </Toggle>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-1 pt-2">
            {selectedInterests.length > 0 ? (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Has seleccionado {selectedInterests.length} intereses
              </p>
            ) : (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                Selecciona al menos un interés para mejorar tus recomendaciones
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSkipInterests}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent"
              disabled={isLoading}
            >
              {isLoading ? "Procesando..." : "Omitir este paso"}
            </Button>
            <Button
              onClick={handleCompleteInterests}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner />
                  Guardando...
                </div>
              ) : (
                selectedInterests.length > 0 ? "Guardar y continuar" : "Continuar sin seleccionar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Subjects step
  return (
    <Card className="w-full shadow-xl border-0">
      <CardHeader className="text-center space-y-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-t-lg">
        <div className="mx-auto w-40 h-40 flex items-center justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo UNetWork"
              className="w-40 h-40 object-contain"
            />
          ) : (
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              UNet
            </div>
          )}
        </div>
        <div>
          {isExistingUser ? (
            <>
              <CardTitle className="text-2xl font-bold text-blue-800">¡Un paso más! 📚</CardTitle>
              <CardDescription className="text-gray-600">
                ¡Hola {userName}! Aún no has seleccionado tus ramos. Personaliza tu experiencia eligiendo los ramos que estás cursando para recibir recomendaciones específicas.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold text-green-900">¡Cuenta creada! 🎉</CardTitle>
              <CardDescription className="text-gray-600">
                ¡Hola {userName}! Ahora puedes elegir tus ramos para encontrar material específico
              </CardDescription>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">Selecciona tus ramos 📚</p>
          </div>
          <p className="text-sm text-blue-700">
            Puedes elegir tus ramos ahora para que te mostremos material específico, o hacerlo después desde tu perfil.
            ¡Tú decides!
          </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-medium">
            <BookOpen className="w-4 h-4 text-purple-500" />
            Ramos disponibles para {carrera}
          </Label>
          <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-3 p-3 sm:p-4 border rounded-lg bg-gray-50">
            {Object.entries(ramosPorAnio).map(([anio, ramos]) => (
              <div key={anio} className="space-y-2">
                <h4 className="font-medium text-sm text-blue-700 border-b border-blue-200 pb-1 flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Año {anio}
                </h4>
                <div className="space-y-1 pl-3">
                  {ramos.map((ramo) => (
                    <div key={ramo.id} className="flex items-center space-x-3 py-1">
                      <Checkbox
                        id={ramo.id}
                        checked={ramosSeleccionados.some((r) => r.id === ramo.id)}
                        onCheckedChange={(checked) => handleRamoChange(ramo, checked as boolean)}
                        className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 w-5 h-5"
                      />
                      <Label
                        htmlFor={ramo.id}
                        className="text-sm font-normal cursor-pointer hover:text-purple-600 flex-1 py-2"
                      >
                        {ramo.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {ramosSeleccionados.length > 0 && (
            <p className="text-xs text-purple-600 font-medium">
              ✨ {ramosSeleccionados.length} ramo{ramosSeleccionados.length !== 1 ? "s" : ""} seleccionado
              {ramosSeleccionados.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSkipSubjects}
            variant="outline"
            className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent"
            disabled={isLoading}
          >
            {isLoading ? "Procesando..." : "Lo haré después 😊"}
          </Button>
          <Button
            onClick={handleCompleteSubjects}
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || ramosSeleccionados.length === 0}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner />
                Guardando...
              </div>
            ) : ramosSeleccionados.length > 0 ? (
              `Agregar ${ramosSeleccionados.length} ramo${ramosSeleccionados.length !== 1 ? "s" : ""} 🚀`
            ) : (
              "Selecciona al menos un ramo"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
