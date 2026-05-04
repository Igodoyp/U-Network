"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  FileText,
  ImageIcon,
  File,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  User,
  GraduationCap,
  Calendar,
  Tag,
  FileUp,
  Sparkles,
  PartyPopper,
  Heart,
} from "lucide-react"
import { Header } from "@/components/header"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { supabase } from "@/lib/supabaseClient" // Importa el cliente de Supabase
import { useUserContext } from "@/context/UserContext"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils" // Asegúrate de que esta utilidad esté disponible
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { CATEGORIAS_MATERIAL } from "@/lib/constants"

const semestres = ["2026-1", "2025-1", "2024-2", "2024-1", "2023-2", "2023-1", "2022-2", "2022-1", "2021-2", "2021-1"]

const MATERIAL_TYPE_CONFIG = {
  Certamen: {
    requiresProfesor: true,
    requiresSolucion: true,
    requiresDificultad: true,
    subtitle: "Evaluacion formal del ramo",
  },
  Control: {
    requiresProfesor: true,
    requiresSolucion: true,
    requiresDificultad: true,
    subtitle: "Evaluacion corta o parcial",
  },
  "Guía": {
    requiresProfesor: true,
    requiresSolucion: true,
    requiresDificultad: true,
    subtitle: "Guia de ejercicios o trabajo",
  },
  Apunte: {
    requiresProfesor: false,
    requiresSolucion: false,
    requiresDificultad: false,
    subtitle: "Material personal de apoyo",
  },
  Resumen: {
    requiresProfesor: false,
    requiresSolucion: false,
    requiresDificultad: false,
    subtitle: "Sintesis personal de contenidos",
  },
  Laboratorio: {
    requiresProfesor: true,
    requiresSolucion: true,
    requiresDificultad: true,
    subtitle: "Informe, pauta o actividad de laboratorio",
  },
  Formulario: {
    requiresProfesor: false,
    requiresSolucion: false,
    requiresDificultad: false,
    subtitle: "Formulario de formulas o referencia rapida",
  },
  Otro: {
    requiresProfesor: false,
    requiresSolucion: false,
    requiresDificultad: false,
    subtitle: "Otro tipo de material academico",
  },
}

const DEFAULT_MATERIAL_CONFIG = {
  requiresProfesor: true,
  requiresSolucion: true,
  requiresDificultad: true,
  subtitle: "Material academico",
}

// SuccessMessage SIN bloques de agradecimiento ni estadísticas motivacionales
function SuccessMessage({ onViewFeed, onUploadMore }) {
  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-0">
      <CardContent className="p-6 sm:p-8 text-center">
        <div className="space-y-6">
          {/* Icono de éxito */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          {/* Mensaje principal */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              ¡Material subido exitosamente! <PartyPopper className="w-6 h-6 text-yellow-500" />
            </h2>
            <p className="text-gray-600">
              Tu material ya está disponible para que otros estudiantes puedan descargarlo y beneficiarse de él.
            </p>
          </div>

          {/* Botones de acción actualizados con callbacks separados */}
          <div className="space-y-3">
            <Button
              onClick={onViewFeed}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg shadow-lg"
            >
              Ver mi material en el feed
            </Button>
            <Button 
              variant="outline" 
              onClick={onUploadMore} 
              className="w-full bg-transparent"
            >
              Subir otro material
            </Button>
          </div>

          {/* Mensaje adicional */}
          <p className="text-xs text-gray-500">
            Tu material será revisado por la comunidad y recibirás notificaciones sobre valoraciones y comentarios 📬
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function UploadPage() {
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    titulo: "",
    categoria: "",
    semestre: "",
    ramo: "",
    ramo_id: null,
    profesor_id: null,
    profesorNombre: "",
    id_carrera: null,
    descripcion: "",
    solucion: false,
    dificultad: "",
    file_hash: "",
    file_size: null,
    file_type: "",
  })
  const [ramosDisponibles, setRamosDisponibles] = useState([])
  const [profesores, setProfesores] = useState([])
  const [profesorSearch, setProfesorSearch] = useState("")
  const [openProfesor, setOpenProfesor] = useState(false)
  const [isCreatingProfesor, setIsCreatingProfesor] = useState(false)
  const [openRamo, setOpenRamo] = useState(false); // Añadir este estado al inicio del componente junto con los demás estados
  const [rightsAccepted, setRightsAccepted] = useState(false)
  const { userData } = useUserContext()
  
  // Mover este hook aquí, antes de cualquier renderizado condicional
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  const stepTitles = {
  1: "¿Qué vas a compartir hoy?",
  2: "Subir archivo",
  3: "Información del material"
  }

  // 1. Primero añadimos un estado para guardar el ID del material subido
  const [uploadedMaterialId, setUploadedMaterialId] = useState(null);

  // Estados para análisis con IA
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [storagePath, setStoragePath] = useState(null)
  const [aiGenerated, setAiGenerated] = useState({
    titulo: false,
    categoria: false,
    ramo: false,
    semestre: false,
    profesor: false,
    descripcion: false,
    solucion: false,
    dificultad: false,
  })

  const [carreras, setCarreras] = useState([])

  // Cargar carreras desde la tabla `carrera`
  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const { data, error } = await supabase
          .from("carrera")
          .select("*")
          .order("nombre")
        
        if (error) {
          console.error("Error al cargar carreras:", error)
          return
        }
        
        setCarreras(data || [])
      } catch (err) {
        console.error("Error inesperado al cargar carreras:", err)
      }
    }
    fetchCarreras()
  }, [])

  // Monitorear cambios en formData
  useEffect(() => {
    console.log("👁️ FormData cambió:", formData)
  }, [formData])

  // Preseleccionar la carrera del usuario si el formulario aún no tiene una
  useEffect(() => {
    if (!userData?.id_carrera) return

    setFormData((prev) => {
      if (prev.id_carrera) return prev
      return { ...prev, id_carrera: userData.id_carrera }
    })
  }, [userData?.id_carrera])

  // Limpiar archivo del Storage si se abandona la página sin guardar
  useEffect(() => {
    return () => {
      // Este callback se ejecuta cuando el componente se desmonta
      if (storagePath && !uploadedMaterialId) {
        // Solo limpiar si hay un archivo en Storage pero NO se ha guardado el material
        console.log("🗑️ Limpiando archivo abandonado del Storage:", storagePath)
        supabase.storage
          .from("materiales")
          .remove([storagePath])
          .then(() => console.log("✅ Archivo abandonado eliminado"))
          .catch((err) => console.error("⚠️ Error limpiando archivo abandonado:", err))
      }
    }
  }, [storagePath, uploadedMaterialId])

  // Advertir al usuario si intenta salir sin guardar el material
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (storagePath && !uploadedMaterialId && currentStep !== 1) {
        // Si hay archivo pero no se guardó
        const message = "Tienes un archivo sin guardar. ¿Estás seguro de que quieres salir?"
        e.returnValue = message
        return message
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [storagePath, uploadedMaterialId, currentStep])

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0]
      setUploadedFile({
        file: rejectedFiles[0].file,
        error: error.code === "file-too-large" ? "El archivo es muy grande (máx. 50MB)" : "Tipo de archivo no válido",
      })
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      console.log("📁 Archivo seleccionado:", file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      
      setUploadedFile({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      })

      // Subida optimista a Storage
      if (!userData?.id) {
        console.error("❌ Usuario no autenticado")
        return
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${userData.id}-${Date.now()}.${fileExt}`
      const filePath = `uploads/${fileName}`

      try {
        // PASO 1: Subir archivo a Storage
        console.log("1️⃣ Iniciando subida a Storage...")
        setIsAnalyzing(true)
        
        const { error: uploadError } = await supabase.storage
          .from("materiales")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("❌ Error subiendo archivo:", uploadError)
          setUploadedFile({
            file,
            error: "Error al subir el archivo",
          })
          setIsAnalyzing(false)
          return
        }

        console.log("✅ Archivo subido a Storage:", filePath)
        setStoragePath(filePath)

        // PASO 2: Analizar con IA
        console.log("2️⃣ Enviando a análisis con IA (Gemini)...")
        const response = await fetch("/api/analyze-material", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath, userId: userData.id }),
        })

        console.log("API Response Status:", response.status)
        const data = await response.json()
        console.log("API Response Data:", data)

        // MANEJO DE DUPLICADOS DETECTADOS EN BACKEND (HTTP 409)
        if (response.status === 409 && data.isDuplicate) {
          console.warn("⚠️ DUPLICADO DETECTADO EN BACKEND:", data.error)
          setUploadedFile({
            file,
            error: `⚠️ ${data.error}. Sube un archivo diferente.`,
          })
          // El backend ya eliminó el archivo de Storage, así que no necesitamos hacerlo
          setStoragePath(null)
          setIsAnalyzing(false)
          return
        }

        // MANEJO DE ARCHIVOS RECHAZADOS POR MODERACIÓN (HTTP 422)
        if (response.status === 422 && data.isValid === false) {
          const motivoRechazo = data.motivo_rechazo || "El contenido no cumple las normas de la plataforma."
          console.warn("⛔ MATERIAL RECHAZADO:", motivoRechazo)
          setUploadedFile({
            file,
            error: `⛔ Archivo rechazado: ${motivoRechazo}`,
          })
          // El backend elimina el archivo de Storage en este caso
          setStoragePath(null)
          setIsAnalyzing(false)
          return
        }

        if (response.ok && data.success) {
          const { metadata } = data

          // Fallback defensivo por si el backend devolviera éxito con moderación negativa
          if (metadata?.es_valido === false || metadata?.es_valido === "false") {
            const motivoRechazo = metadata?.motivo_rechazo || "El contenido no cumple las normas de la plataforma."
            console.warn("⛔ MATERIAL RECHAZADO (fallback):", motivoRechazo)
            setUploadedFile({
              file,
              error: `⛔ Archivo rechazado: ${motivoRechazo}`,
            })
            setStoragePath(null)
            setIsAnalyzing(false)
            return
          }

          console.log("✅ IA análisis completado! Metadatos extraídos:", metadata)
          console.log("📦 Tipo de metadata:", typeof metadata)
          console.log("📋 Keys en metadata:", Object.keys(metadata))
          console.log("📌 Valores individuales:")
          console.log("  - titulo:", metadata.titulo, `(${typeof metadata.titulo})`)
          console.log("  - categoria:", metadata.categoria, `(${typeof metadata.categoria})`)
          console.log("  - semestre:", metadata.semestre, `(${typeof metadata.semestre})`)
          console.log("  - ramo:", metadata.ramo, `(${typeof metadata.ramo})`)
          console.log("  - profesor:", metadata.profesor, `(${typeof metadata.profesor})`)
          console.log("  - descripcion:", metadata.descripcion, `(${typeof metadata.descripcion})`)
          console.log("  - solucion:", metadata.solucion, `(${typeof metadata.solucion})`)
          console.log("  - file_hash:", metadata.file_hash, `(${typeof metadata.file_hash})`)

          // Pre-completar formulario con datos de IA
          console.log("6️⃣ Actualizando formData con metadatos de IA...")
          const newFormData = {
            titulo: metadata.titulo || "",
            categoria: normalizeCategoria(metadata.categoria),
            semestre: metadata.semestre || "",  // Este debería venir en formato "2023-2"
            descripcion: metadata.descripcion || "",
            solucion: metadata.solucion || false,
            dificultad: metadata.dificultad || "",
            file_hash: metadata.file_hash || "",
            file_size: metadata.file_size || null,
            file_type: metadata.file_type || "",
          }
          console.log("📝 Nuevo formData antes de set:", newFormData)
          setFormData((prev) => {
            const updated = { ...prev, ...newFormData, categoria: prev.categoria || newFormData.categoria }
            console.log("✨ FormData actualizado en estado:", updated)
            return updated
          })

          // Marcar campos completados por IA
          setAiGenerated({
            titulo: !!metadata.titulo,
            categoria: !!metadata.categoria,
            ramo: !!metadata.ramo,
            semestre: !!metadata.semestre,
            profesor: !!metadata.profesor,
            descripcion: !!metadata.descripcion,
            solucion: !!metadata.solucion,
            dificultad: !!metadata.dificultad,
          })

          // Guardar nombre de ramo y profesor para búsqueda posterior
          if (metadata.ramo) {
            console.log("🎯 Ramo detectado:", metadata.ramo)
            searchAndSelectRamo(metadata.ramo)
          }
          if (metadata.profesor) {
            console.log("👨‍🏫 Profesor detectado:", metadata.profesor)
            // Buscar y seleccionar automáticamente si existe
            searchAndSelectProfesor(metadata.profesor)
          }

          console.log("✨ Campos completados automáticamente!")
        } else {
          const errorMsg = data.error || "Error desconocido"
          console.error("⚠️ Error en análisis IA:", errorMsg)
          console.log("💡 Puedes completar los campos manualmente")
          // No es crítico, el usuario puede continuar manualmente
        }
      } catch (error) {
        console.error("❌ Error en proceso de upload/análisis:", error.message)
        console.error("Stack:", error.stack)
        // No bloquear el flujo
      } finally {
        setIsAnalyzing(false)
        console.log("3️⃣ Proceso finalizado!")
      }
    }
  }, [userData])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  })

  const removeFile = async () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview)
    }

    // Borrar archivo de Storage si existe
    if (storagePath) {
      try {
        await supabase.storage.from("materiales").remove([storagePath])
      } catch (error) {
        console.error("Error borrando archivo de Storage:", error)
      }
      setStoragePath(null)
    }

    setUploadedFile(null)
    setRightsAccepted(false)
    setAiGenerated({
      titulo: false,
      categoria: false,
      ramo: false,
      semestre: false,
      profesor: false,
      descripcion: false,
      solucion: false,
      dificultad: false,
    })
  }

  const getFileIcon = (file) => {
    if (file.type.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />
    if (file.type.includes("image")) return <ImageIcon className="w-8 h-8 text-green-500" />
    if (file.type.includes("word") || file.type.includes("document"))
      return <FileText className="w-8 h-8 text-blue-500" />
    if (file.type.includes("presentation")) return <FileText className="w-8 h-8 text-orange-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // 2. Modificamos la función handleSubmit para guardar el ID del material creado
  const handleSubmit = async (e) => {
    e?.preventDefault?.()

    if (!rightsAccepted) {
      alert("Debes confirmar que tienes los derechos y aceptar los Términos y Condiciones.")
      return
    }

    if (!userData || !userData.id) {
      alert("No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.")
      return
    }

    if (!uploadedFile || uploadedFile.error) {
      alert("Por favor, selecciona un archivo válido para subir.")
      return
    }

    if (!storagePath) {
      alert("Error: No se pudo encontrar el archivo. Por favor, intenta subirlo nuevamente.")
      return
    }

    setIsUploading(true)

    try {
      // El archivo YA fue subido a Storage en onDrop, solo guardamos metadata
      // Guardar metadata en la base de datos
      console.log("7️⃣ Guardando metadata en la BD...")
      console.log("   Datos a insertar:")
      console.log(`     - file_hash: "${formData.file_hash}" (tipo: ${typeof formData.file_hash}, longitud: ${formData.file_hash?.length || 'null'})`)
      console.log(`     - file_size: ${formData.file_size} (tipo: ${typeof formData.file_size})`)
      console.log(`     - file_type: "${formData.file_type}" (tipo: ${typeof formData.file_type})`)
      
      const { data: metadataData, error: metadataError } = await supabase.from("material").insert([
        {
          titulo: formData.titulo,
          categoria: formData.categoria,
          semestre: formData.semestre,
          ramo_id: formData.ramo_id,
          id_carrera: formData.id_carrera,
          descripcion: formData.descripcion,
          file_url: storagePath, // Usar el path ya guardado
          autor_id: userData.id,
          solucion: formData.solucion,
          dificultad: formData.dificultad,
          file_hash: formData.file_hash,
          file_size: formData.file_size,
          file_type: formData.file_type,
        },
      ]).select()  // Añadir .select() para recibir los datos insertados

      if (metadataError) {
        console.error("Error al guardar metadata:", metadataError)
        alert("Error al guardar información del material.")
        setIsUploading(false)
        return
      }

      console.log("Metadata guardada exitosamente:", metadataData)
      console.log("🔐 Verificación de datos guardados:")
      if (metadataData && metadataData.length > 0) {
        console.log(`   - file_hash guardado: "${metadataData[0].file_hash}" (tipo: ${typeof metadataData[0].file_hash})`)
        console.log(`   - file_size guardado: ${metadataData[0].file_size}`)
        console.log(`   - file_type guardado: ${metadataData[0].file_type}`)

        if (formData.profesor_id) {
          const { error: relationError } = await supabase
            .from("material_profesor")
            .insert({
              id_material: metadataData[0].id,
              id_profesor: formData.profesor_id,
            })

          if (relationError) {
            console.error("Error al guardar relación material-profesor:", relationError)
            alert("El material se subió, pero hubo un problema al asociar el profesor.")
          }
        }

        setUploadedMaterialId(metadataData[0].id)
      }


      // Mostrar página de agradecimiento
      setShowSuccess(true)
    } catch (err) {
      console.error("Error inesperado:", err)
      alert("Ocurrió un error inesperado.")
    } finally {
      setIsUploading(false)
    }
  }

  // 3. Modificamos la función handleGoToFeed para redirigir al documento específico
  const handleGoToFeed = () => {
    // Resetear formulario
    setUploadedFile(null)
    setRightsAccepted(false)
    setFormData({
      titulo: "",
      categoria: "",
      semestre: "",
      ramo: "",
      ramo_id: null,
      profesor_id: null,
      profesorNombre: "",
      id_carrera: userData?.id_carrera || null,
      descripcion: "",
      solucion: false,
      dificultad: "",
      file_hash: "",
      file_size: null,
      file_type: "",
    })
    setShowSuccess(false)

    // Redirigir a la página del documento específico
    if (uploadedMaterialId) {
      router.push(`/document/${uploadedMaterialId}`)
    } else {
      // Fallback en caso de que no tengamos el ID
      router.push("/dashboard")
    }
  }

  // Nueva función para manejar "subir otro material"
  const handleUploadMore = () => {
    // Resetear formulario sin navegar
    setUploadedFile(null)
    setRightsAccepted(false)
    setFormData({
      titulo: "",
      categoria: "",
      semestre: "",
      ramo: "",
      ramo_id: null,
      profesor_id: null,
      profesorNombre: "",
      id_carrera: userData?.id_carrera || null,
      descripcion: "",
      solucion: false,
      dificultad: "",
      file_hash: "",
      file_size: null,
      file_type: "",
    })
    setShowSuccess(false)
    // Reiniciar en el paso 1
    setCurrentStep(1)
  }

  const handleCategoriaChange = (categoria) => {
    const config = MATERIAL_TYPE_CONFIG[categoria] || DEFAULT_MATERIAL_CONFIG

    setFormData((prev) => ({
      ...prev,
      categoria,
      profesor_id: config.requiresProfesor ? prev.profesor_id : null,
      profesorNombre: config.requiresProfesor ? prev.profesorNombre : "",
      solucion: config.requiresSolucion ? prev.solucion : false,
      dificultad: config.requiresDificultad ? prev.dificultad : "",
    }))
  }

  const handleSelectCategoria = (categoria) => {
    handleCategoriaChange(categoria)
    setCurrentStep(2)
  }
  const normalizeText = (value) => (value || "").toString().trim().toLowerCase()
  const normalizeCategoria = (value) => {
    const normalized = normalizeText(value)
    if (!normalized) return ""

    const match = CATEGORIAS_MATERIAL.find(
      (categoria) => normalizeText(categoria) === normalized
    )

    return match || ""
  }

  // Efecto para cargar los ramos cuando se selecciona una carrera
  useEffect(() => {
    const cargarRamos = async () => {
      if (!formData.id_carrera) {
        setRamosDisponibles([])
        return
      }
      
      try {
        const { data, error } = await supabase
          .from("ramos")
          .select("id, nombre")
          .eq("id_carrera", formData.id_carrera)
          .order("nombre")
        
        if (error) {
          console.error("Error al cargar ramos:", error)
          return
        }
        
        setRamosDisponibles(data || [])
      } catch (err) {
        console.error("Error al cargar ramos:", err)
      }
    }
    
    cargarRamos()
  }, [formData.id_carrera])

  // Efecto para sincronizar ramo_id si el nombre ya está en el formulario
  useEffect(() => {
    if (!formData.ramo || formData.ramo_id || ramosDisponibles.length === 0) return

    const normalizedTarget = normalizeText(formData.ramo)
    const match = ramosDisponibles.find(
      (ramo) => normalizeText(ramo.nombre) === normalizedTarget
    )

    if (match) {
      console.log("✅ Ramo sincronizado desde lista cargada:", match)
      setFormData((prev) => ({
        ...prev,
        ramo: match.nombre,
        ramo_id: match.id,
      }))
    }
  }, [formData.ramo, formData.ramo_id, ramosDisponibles])

  // Efecto para buscar profesores al escribir en el input de búsqueda
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchProfesores(profesorSearch)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [profesorSearch])

  const searchProfesores = async (search) => {
    setProfesorSearch(search);
    
    if (search.trim().length < 2) return;
    
    try {
      const { data, error } = await supabase
        .from("profesor")
        .select("id, nombre")
        .ilike("nombre", `%${search}%`)
        .limit(5);
      
      if (error) {
        console.error("Error al buscar profesores:", error);
        return;
      }
      
      setProfesores(data || []);
    } catch (err) {
      console.error("Error inesperado al buscar profesores:", err);
    }
  };

  // Nueva función: Buscar profesor y si existe, seleccionarlo automáticamente
  const searchAndSelectProfesor = async (nombreProfesor) => {
    console.log("🔍 Buscando profesor:", nombreProfesor);
    setProfesorSearch(nombreProfesor);
    
    if (nombreProfesor.trim().length < 2) {
      console.log("⚠️ Nombre muy corto");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("profesor")
        .select("id, nombre")
        .ilike("nombre", `%${nombreProfesor}%`)
        .limit(5);
      
      if (error) {
        console.error("❌ Error al buscar profesores:", error);
        return;
      }
      
      console.log("✅ Búsqueda encontró:", data?.length || 0, "resultado(s)");
      setProfesores(data || []);
      
      // Si encuentra exactamente un profesor, seleccionarlo automáticamente
      if (data && data.length === 1) {
        console.log("⚡ Auto-seleccionando profesor único:", data[0].nombre);
        selectProfesor(data[0]);
      }
    } catch (err) {
      console.error("❌ Error inesperado al buscar profesores:", err);
    }
  };

  // Buscar y seleccionar ramo automáticamente usando nombre
  const searchAndSelectRamo = async (nombreRamo) => {
    console.log("🔍 Buscando ramo:", nombreRamo)
    const normalizedTarget = normalizeText(nombreRamo)

    if (!normalizedTarget) return

    // Guardar el nombre en el formulario
    setFormData((prev) => ({ ...prev, ramo: nombreRamo }))

    // 1) Intentar resolver desde ramos ya cargados en la UI
    const localMatch = ramosDisponibles.find(
      (ramo) => normalizeText(ramo.nombre) === normalizedTarget
    )
    if (localMatch) {
      console.log("✅ Ramo encontrado en lista local:", localMatch)
      setFormData((prev) => ({
        ...prev,
        ramo: localMatch.nombre,
        ramo_id: localMatch.id,
      }))
      return
    }

    // 2) Si no está cargado, buscar en BD
    try {
      let query = supabase
        .from("ramos")
        .select("id, nombre, id_carrera")
        .ilike("nombre", `%${nombreRamo}%`)
        .limit(5)

      if (formData.id_carrera) {
        query = query.eq("id_carrera", formData.id_carrera)
      }

      const { data, error } = await query

      if (error) {
        console.error("❌ Error al buscar ramos:", error)
        return
      }

      if (!data || data.length === 0) {
        console.log("⚠️ No se encontraron ramos en BD")
        return
      }

      const exactMatch = data.find(
        (ramo) => normalizeText(ramo.nombre) === normalizedTarget
      )

      const selected = exactMatch || (data.length === 1 ? data[0] : null)
      if (selected) {
        console.log("✅ Ramo seleccionado automáticamente:", selected)
        setFormData((prev) => ({
          ...prev,
          ramo: selected.nombre,
          ramo_id: selected.id,
          id_carrera: prev.id_carrera || selected.id_carrera || null,
        }))
      } else {
        console.log("⚠️ Múltiples ramos encontrados; requiere selección manual")
      }
    } catch (err) {
      console.error("❌ Error inesperado al buscar ramos:", err)
    }
  }

  // Añadir función para crear un nuevo profesor
  const createNewProfesor = async () => {
    if (!profesorSearch.trim()) return;
    
    setIsCreatingProfesor(true);
    try {
      const { data, error } = await supabase
        .from("profesor")
        .insert({ nombre: profesorSearch.trim() })
        .select();
      
      if (error) {
        console.error("Error al crear nuevo profesor:", error);
        alert("Error al crear el nuevo profesor. Intente nuevamente.");
        return;
      }
      
      if (data && data.length > 0) {
        // Actualizar formData con el nuevo profesor
        setFormData((prev) => ({
          ...prev,
          profesor_id: data[0].id,
          profesorNombre: data[0].nombre,
        }))
        setOpenProfesor(false)
      }
    } catch (err) {
      console.error("Error inesperado al crear profesor:", err);
      alert("Ocurrió un error inesperado. Intente nuevamente.");
    } finally {
      setIsCreatingProfesor(false);
    }
  };

  // Añadir función para seleccionar un profesor existente
  const selectProfesor = (profesor) => {
    setFormData((prev) => ({
      ...prev,
      profesor_id: profesor.id,
      profesorNombre: profesor.nombre,
    }))
    setProfesorSearch(profesor.nombre)
    setOpenProfesor(false)
  }

  const materialConfig = MATERIAL_TYPE_CONFIG[formData.categoria] || DEFAULT_MATERIAL_CONFIG
  const missingProfesor = materialConfig.requiresProfesor && !formData.profesor_id
  const missingDificultad = materialConfig.requiresDificultad && !formData.dificultad
  const isFormValid = uploadedFile && !uploadedFile.error && formData.titulo && formData.categoria && formData.id_carrera && !missingProfesor && !missingDificultad
  const pendingFieldClass = "bg-yellow-50 border-yellow-200 focus-visible:ring-yellow-300"

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
          <SuccessMessage 
            onViewFeed={handleGoToFeed} 
            onUploadMore={handleUploadMore} 
          />
        </div>
      </div>
    )
  }

  // Renderizado condicional basado en pasos
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ELIMINAR: <Header /> Ya no es necesario */}

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header con pasos */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-center mb-4"> 
            {stepTitles[currentStep]}
          </h1>
          
          {/* Indicador de pasos */}
          <div className="flex items-center justify-center space-x-1">
            {[...Array(totalSteps)].map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all ${
                  i+1 === currentStep ? "w-8 bg-blue-600" : 
                  i+1 < currentStep ? "w-4 bg-blue-400" : "w-4 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* PASO 1: Selección de tipo de material */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  ¿Qué vas a compartir hoy?
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Elige el tipo de material para comenzar.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATEGORIAS_MATERIAL.map((categoria) => {
                    const config = MATERIAL_TYPE_CONFIG[categoria] || DEFAULT_MATERIAL_CONFIG
                    return (
                      <button
                        key={categoria}
                        type="button"
                        onClick={() => handleSelectCategoria(categoria)}
                        className="text-left border rounded-lg p-4 transition-all hover:border-blue-500 hover:bg-blue-50"
                      >
                        <p className="font-medium text-gray-900">{categoria}</p>
                        <p className="text-xs text-gray-600 mt-1">{config.subtitle}</p>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-start mt-6">
              <Button variant="outline" onClick={() => router.back()} className="w-1/3 sm:w-auto">
                Atrás
              </Button>
            </div>
          </div>
        )}

        {/* PASO 2: Subida de archivo */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                {/* Mostrar dropzone solo si NO hay archivo subido */}
                {!uploadedFile && (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                      ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-3">
                      <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {isDragActive ? "Suelta el archivo aquí" : "Arrastra y suelta el archivo aquí"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">o haz clic para seleccionar</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Formatos permitidos: PDF, DOC, DOCX, PPT, PPTX, PNG, JPG (máx. 50MB)
                      </p>
                    </div>
                  </div>
                )}

                {/* Información del archivo subido */}
                {uploadedFile && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">Archivo subido</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="text-gray-400 hover:text-red-500 text-sm"
                        disabled={isAnalyzing}
                      >
                        Cambiar archivo
                      </button>
                    </div>

                    <div className="border rounded-lg p-3 bg-blue-50">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(uploadedFile.file)}
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                          <p className="text-xs text-gray-600">{formatFileSize(uploadedFile.file.size)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Estado del análisis */}
                    {isAnalyzing && (
                      <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-yellow-600 animate-spin" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Analizando documento...</p>
                            <p className="text-xs text-yellow-700">Extrayendo información con IA</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {uploadedFile.error && (
                      <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Error al procesar</p>
                            <p className="text-xs text-red-700 mt-1">{uploadedFile.error}</p>
                            <button
                              onClick={() => removeFile()}
                              className="text-xs text-red-600 hover:text-red-800 font-medium mt-2"
                            >
                              Intentar con otro archivo
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isAnalyzing && !uploadedFile.error && formData.titulo && (
                      <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Análisis completado</p>
                            <p className="text-xs text-green-700">El formulario se ha rellenado automáticamente</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reglas de contenido permitido y no permitido */}
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="p-1">
                  <h4 className="text-sm font-semibold text-green-800">Sí puedes subir</h4>
                  <ul className="mt-2 space-y-2 text-sm text-green-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>Certámenes, guías, etc.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>Apuntes o resúmenes hechos por estudiantes.</span>
                    </li>
                    {/* <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>Material propio o autorizado por su autor.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>Formularios y material de apoyo para estudiar.</span>
                    </li> */}
                  </ul>
                </div>

                <div className="p-1">
                  <h4 className="text-sm font-semibold text-red-800">No puedes subir</h4>
                  <ul className="mt-2 space-y-2 text-sm text-red-700">
                    <li className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <span>Libros comerciales escaneados o protegidos por copyright.</span>
                    </li>
                    {/* <li className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <span>Archivos con datos personales de terceros.</span>
                    </li> */}
                    {/* <li className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <span>Material sin permiso del autor original.</span>
                    </li> */}
                    <li className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <span>Contenido ajeno al contexto académico o que infrinja normas.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-1 py-1 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="rights-confirmation"
                    className="mt-0.5"
                    checked={rightsAccepted}
                    onCheckedChange={(checked) => setRightsAccepted(checked === true)}
                  />
                  <label htmlFor="rights-confirmation" className="leading-relaxed">
                    Confirmo que tengo los derechos para compartir este material y acepto los{" "}
                    <Link
                      href="/terms"
                      className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                    >
                      Términos y Condiciones
                    </Link>
                    .
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="w-1/3 sm:w-auto">
                Atrás
              </Button>
              <Button
                disabled={!uploadedFile || uploadedFile.error || isAnalyzing || !rightsAccepted}
                onClick={() => setCurrentStep(3)}
                className="w-2/3 sm:w-auto ml-2 bg-blue-600"
              >
                {isAnalyzing ? "Analizando..." : "Continuar"}
              </Button>
            </div>
          </div>
        )}

        {/* PASO 3: Información del material */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
                  <div className="pb-4 border-b">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Información básica
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="titulo">Título del material</Label>
                          {aiGenerated.titulo && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              IA
                            </Badge>
                          )}
                        </div>
                        <Input
                          id="titulo"
                          placeholder="Ej: Certamen 1 de Cálculo - 2024"
                          value={formData.titulo}
                          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                          className={cn(!formData.titulo && pendingFieldClass)}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="categoria">Categoría</Label>
                          {aiGenerated.categoria && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              IA
                            </Badge>
                          )}
                        </div>
                        <Select
                          value={formData.categoria}
                          onValueChange={handleCategoriaChange}
                        >
                          <SelectTrigger id="categoria" className={cn(!formData.categoria && pendingFieldClass)}>
                            <SelectValue placeholder="Selecciona la categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIAS_MATERIAL.map((categoria) => (
                              <SelectItem key={categoria} value={categoria}>
                                {categoria}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
          <Label htmlFor="carrera">Carrera</Label>
                        <Select
                          value={formData.id_carrera?.toString()}
                          onValueChange={(value) => setFormData({ ...formData, id_carrera: parseInt(value) })}
                        >
                          <SelectTrigger id="carrera" className={cn(!formData.id_carrera && pendingFieldClass)}>
                            <SelectValue placeholder="Selecciona la carrera" />
                          </SelectTrigger>
                          <SelectContent>
                            {carreras.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: DETALLES ACADÉMICOS */}
                  <div className="pb-4 border-b">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Detalles académicos
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="semestre">Semestre</Label>
                          {aiGenerated.semestre && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              IA
                            </Badge>
                          )}
                        </div>
                        <Select
                          value={formData.semestre}
                          onValueChange={(value) => setFormData({ ...formData, semestre: value })}
                        >
                          <SelectTrigger id="semestre" className={cn(!formData.semestre && pendingFieldClass)}>
                            <SelectValue placeholder="Selecciona el semestre" />
                          </SelectTrigger>
                          <SelectContent>
                            {semestres.map((semestre) => (
                              <SelectItem key={semestre} value={semestre}>
                                {semestre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Ramo</Label>
                          {aiGenerated.ramo && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              IA
                            </Badge>
                          )}
                        </div>
                        <Popover open={openRamo} onOpenChange={setOpenRamo}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between", !formData.ramo_id && pendingFieldClass)}
                              disabled={!formData.id_carrera}
                            >
                              {formData.ramo || "Seleccionar ramo"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar ramo..." />
                              <CommandList>
                                <CommandEmpty>No se encontraron ramos.</CommandEmpty>
                                <CommandGroup>
                                  {ramosDisponibles.map((ramo) => (
                                    <CommandItem
                                      key={ramo.id}
                                      onSelect={() => {
                                        setFormData({
                                          ...formData,
                                          ramo: ramo.nombre,
                                          ramo_id: ramo.id
                                        });
                                        setOpenRamo(false);
                                      }}
                                    >
                                      {ramo.nombre}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Profesor</Label>
                          {aiGenerated.profesor && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              IA
                            </Badge>
                          )}
                        </div>
                        {materialConfig.requiresProfesor ? (
                          <Popover open={openProfesor} onOpenChange={setOpenProfesor}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !formData.profesor_id && pendingFieldClass)}
                              >
                                {formData.profesorNombre || "Seleccionar o crear profesor"}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput 
                                  placeholder="Buscar o crear profesor..." 
                                  value={profesorSearch}
                                  onValueChange={setProfesorSearch}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start"
                                      onClick={createNewProfesor}
                                      disabled={isCreatingProfesor}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Crear "{profesorSearch}"
                                    </Button>
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {profesores.map((profesor) => (
                                      <CommandItem
                                        key={profesor.id}
                                        onSelect={() => selectProfesor(profesor)}
                                      >
                                        {profesor.nombre}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                            Para {formData.categoria || "este tipo de material"}, no se requiere profesor.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 3: DESCRIPCIÓN Y DETALLES */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <FileUp className="w-4 h-4" />
                      Descripción
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="descripcion">Descripción del material</Label>
                          {aiGenerated.descripcion && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              IA
                            </Badge>
                          )}
                        </div>
                        <Textarea
                          id="descripcion"
                          placeholder="Breve descripción del contenido..."
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          rows={3}
                          className={cn(!formData.descripcion && pendingFieldClass)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {materialConfig.requiresDificultad && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Label htmlFor="dificultad">Dificultad</Label>
                              {aiGenerated.dificultad && (
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  IA
                                </Badge>
                              )}
                            </div>
                            <Select
                              value={formData.dificultad}
                              onValueChange={(value) => setFormData({ ...formData, dificultad: value })}
                            >
                              <SelectTrigger id="dificultad" className={cn(!formData.dificultad && pendingFieldClass)}>
                                <SelectValue placeholder="Selecciona dificultad" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Fácil">Fácil</SelectItem>
                                <SelectItem value="Media">Media</SelectItem>
                                <SelectItem value="Difícil">Difícil</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {materialConfig.requiresSolucion && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Label htmlFor="solucion">Incluye solución</Label>
                              {aiGenerated.solucion && (
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  IA
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="solucion"
                                checked={formData.solucion}
                                onCheckedChange={(checked) => setFormData({ ...formData, solucion: checked })}
                              />
                              <Label htmlFor="solucion" className="cursor-pointer text-sm text-muted-foreground">
                                {formData.solucion ? "Sí" : "No"}
                              </Label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="w-1/3">
                Atrás
              </Button>
              <Button
                disabled={!formData.titulo || !formData.categoria || !formData.id_carrera || !rightsAccepted || missingProfesor || missingDificultad}
                onClick={(e) => handleSubmit(e)}
                className="w-2/3 ml-2 bg-blue-600"
              >
                Guardar material
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

