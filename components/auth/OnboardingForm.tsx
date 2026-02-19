"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { BookOpen, CheckCircle, GraduationCap, User, LogOut, Search, X } from "lucide-react"
import { getPublicAvatarUrl } from "@/lib/authService"
import * as authService from "@/lib/authService"
import { CARRERAS, AÑOS, OnboardingStepId } from "@/lib/constants"
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
  onSaveRamos,
  onFinish,
  onStepChange,
  onSkipRamos,
  isExistingUser = false,
  needsProfile = false,
  initialStep
}: OnboardingFormProps) {
  // Skip interests step — go straight from profile to subjects
  const resolvedInitial = initialStep === 'interests' ? 'subjects' : initialStep
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    resolvedInitial || (needsProfile ? 'profile' : 'subjects')
  )
  const [carrera, setCarrera] = useState(carreraActual || '')
  const [nombre, setNombre] = useState(userName || '')

  // Sincronizar paso con el padre
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep === 'interests' ? 'subjects' : currentStep)
    }
  }, [currentStep, onStepChange])

  const [anio, setAnio] = useState(anioActual || '')
  const [ramosSeleccionados, setRamosSeleccionados] = useState<Ramo[]>([])
  const [ramosPorAnio, setRamosPorAnio] = useState<Record<string, Ramo[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState("")
  const [ramoSearch, setRamoSearch] = useState("")
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

  // Normalize text: strip diacritics so "calculo" matches "Cálculo"
  const normalize = (text: string) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

  // Filtered ramos based on search
  const filteredRamosPorAnio = useMemo(() => {
    if (!ramoSearch.trim()) return ramosPorAnio

    const query = normalize(ramoSearch.trim())
    const filtered: Record<string, Ramo[]> = {}

    for (const [anioKey, ramos] of Object.entries(ramosPorAnio)) {
      const matching = ramos.filter(r => normalize(r.nombre).includes(query))
      if (matching.length > 0) {
        filtered[anioKey] = matching
      }
    }

    return filtered
  }, [ramosPorAnio, ramoSearch])

  const totalRamosCount = useMemo(() => {
    return Object.values(ramosPorAnio).reduce((acc, ramos) => acc + ramos.length, 0)
  }, [ramosPorAnio])

  const filteredRamosCount = useMemo(() => {
    return Object.values(filteredRamosPorAnio).reduce((acc, ramos) => acc + ramos.length, 0)
  }, [filteredRamosPorAnio])

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
      setCurrentStep('subjects')
    } catch (err) {
      console.error("Error al guardar perfil:", err)
      alert("Ocurrió un error al guardar tu perfil.")
    } finally {
      setIsLoading(false)
    }
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
    switch (yearNum) {
      case 1: return "1ero"
      case 2: return "2do"
      case 3: return "3ero"
      case 4: return "4to"
      case 5: return "5to"
      case 6: return "6to"
      default: return `Año ${year}`
    }
  }

  // ============================================================================
  // PROFILE STEP
  // ============================================================================
  if (currentStep === 'profile') {
    return (
      <Card className="w-full shadow-xl border-0 overflow-hidden">
        <CardHeader className="text-center space-y-3 bg-gradient-to-br from-blue-50 to-purple-50 pb-6 relative">
          {/* Botón de cerrar sesión */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 hover:bg-white/60 text-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Otra cuenta
          </Button>

          <div className="mx-auto w-28 h-28 flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo UNetWork" className="w-28 h-28 object-contain" />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                UN
              </div>
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Completa tu perfil</CardTitle>
            <CardDescription className="text-gray-500 text-sm">
              Hola {userName}, cuéntanos sobre ti para personalizar tu experiencia
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="w-4 h-4 text-blue-500" />
              Nombre
            </Label>
            <Input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              className="h-11 text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              Carrera
            </Label>
            <Select value={carrera} onValueChange={setCarrera} required>
              <SelectTrigger className="h-11 text-sm border-gray-200 focus:border-purple-400">
                <SelectValue placeholder="Selecciona tu carrera" />
              </SelectTrigger>
              <SelectContent>
                {CARRERAS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {carrera && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <BookOpen className="w-4 h-4 text-orange-500" />
                Año
              </Label>
              <Select value={anio} onValueChange={setAnio} required>
                <SelectTrigger className="h-11 text-sm border-gray-200 focus:border-orange-400">
                  <SelectValue placeholder="¿En qué año vas?" />
                </SelectTrigger>
                <SelectContent>
                  {AÑOS.map((año) => (
                    <SelectItem key={año} value={año}>{getOrdinalYear(año)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleCompleteProfile}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md text-sm"
            disabled={isLoading || !nombre.trim() || !carrera || !anio}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner />
                Guardando...
              </div>
            ) : (
              "Continuar"
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ============================================================================
  // SUBJECTS STEP (with search bar)
  // ============================================================================
  return (
    <Card className="w-full shadow-xl border-0 overflow-hidden">
      <CardHeader className="text-center space-y-3 bg-gradient-to-br from-blue-50 to-purple-50 pb-6">
        <div className="mx-auto w-28 h-28 flex items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo UNetWork" className="w-28 h-28 object-contain" />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              UN
            </div>
          )}
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
            {isExistingUser ? "Elige tus ramos" : "Selecciona tus ramos"}
          </CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            {isExistingUser
              ? `${userName}, personaliza tu experiencia eligiendo los ramos que cursas`
              : `${userName}, elige tus ramos para encontrar material relevante`
            }
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar ramo..."
            value={ramoSearch}
            onChange={(e) => setRamoSearch(e.target.value)}
            className="h-10 pl-9 pr-9 text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400"
          />
          {ramoSearch && (
            <button
              type="button"
              onClick={() => setRamoSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ramos list */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Ramos de {carrera}
            </Label>
            {ramoSearch && (
              <span className="text-xs text-gray-400">
                {filteredRamosCount} de {totalRamosCount}
              </span>
            )}
          </div>

          <div className="max-h-64 sm:max-h-72 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50">
            {Object.entries(filteredRamosPorAnio).length > 0 ? (
              Object.entries(filteredRamosPorAnio).map(([anioKey, ramos]) => (
                <div key={anioKey}>
                  <div className="sticky top-0 z-10 bg-gray-100/95 backdrop-blur-sm px-3 py-1.5 border-b border-gray-200">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Año {anioKey}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {ramos.map((ramo) => {
                      const isSelected = ramosSeleccionados.some((r) => r.id === ramo.id)
                      return (
                        <label
                          key={ramo.id}
                          htmlFor={ramo.id}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/80'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <Checkbox
                            id={ramo.id}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleRamoChange(ramo, checked as boolean)}
                            className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 h-4 w-4 flex-shrink-0"
                          />
                          <span className={`text-sm ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                            {ramo.nombre}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {ramoSearch ? 'No se encontraron ramos' : 'Cargando ramos...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selected count */}
        {ramosSeleccionados.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-blue-600">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">
              {ramosSeleccionados.length} ramo{ramosSeleccionados.length !== 1 ? 's' : ''} seleccionado{ramosSeleccionados.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleSkipSubjects}
            variant="outline"
            className="flex-1 h-11 border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent text-sm"
            disabled={isLoading}
          >
            Omitir por ahora
          </Button>
          <Button
            onClick={handleCompleteSubjects}
            className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md text-sm"
            disabled={isLoading || ramosSeleccionados.length === 0}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner />
                Guardando...
              </div>
            ) : ramosSeleccionados.length > 0 ? (
              "Explorar material"
            ) : (
              "Selecciona al menos uno"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
