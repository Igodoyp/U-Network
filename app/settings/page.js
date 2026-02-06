"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  User,
  GraduationCap,
  Calendar,
  SettingsIcon,
  LogOut,
  Trash2,
  Save,
  Camera,
  AlertTriangle,
} from "lucide-react"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { useUserContext } from "@/context/UserContext"
import { supabase } from "@/lib/supabaseClient"
import { AÑOS } from "@/lib/constants"

const carreras = [
  "Ingeniería Plan Común",
  "Ingeniería Civil Industrial",
  "Ingeniería Civil en BioMedicina",
  "Ingeniería Civil en Informática e Innovación Tecnológica",
  "Ingeniería Civil en Informática e Inteligencia Artificial",
  "Ingeniería Civil en Minería",
  "Ingeniería Civil en Obras Civiles",
  "Geología",
]

const semestres = [
  "1er Semestre",
  "2do Semestre",
  "3er Semestre",
  "4to Semestre",
  "5to Semestre",
  "6to Semestre",
  "7mo Semestre",
  "8vo Semestre",
  "9no Semestre",
  "10mo Semestre",
]

// Función para convertir el año a formato ordinal
const getOrdinalYear = (year) => {
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

export default function SettingsPage() {
  const router = useRouter()
  const { userData, setUserData, clearUserData } = useUserContext()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    carrera: "",
    anio: "",
  })
  const [originalData, setOriginalData] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")

  // Cargar datos del usuario al montar
  useEffect(() => {
    if (userData) {
      // Separar nombre y apellido (asumiendo formato "Nombre Apellido")
      const nombreCompleto = userData.nombre || ""
      const partes = nombreCompleto.split(" ")
      const nombre = partes[0] || ""
      const apellido = partes.slice(1).join(" ") || ""

      const datosIniciales = {
        nombre,
        apellido,
        carrera: userData.carrera || "",
        anio: userData.anio || "",
      }

      setFormData(datosIniciales)
      setOriginalData(datosIniciales)
      
      // Establecer URL de la imagen de perfil si existe
      if (userData.avatar) {
        setPreviewUrl(userData.avatar)
      }
    }
  }, [userData])

  // Verificar si hay cambios en el formulario
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData) || selectedFile !== null

  // Manejar cambio de archivo de imagen
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      
      // Crear URL de vista previa
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Guardar cambios en el perfil
  const handleSave = async () => {
    setIsLoading(true)
    try {
      let avatarUrl = userData?.avatar || null
      
      // 1. Si hay una nueva imagen, subirla primero
      if (selectedFile) {
        const fileName = `avatar-${userData.id}-${Date.now()}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: true
          })
          
        if (uploadError) {
          console.error("Error al subir la imagen:", uploadError)
          alert("Error al subir la imagen de perfil")
          setIsLoading(false)
          return
        }
        
        // Obtener URL pública de la imagen
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
          
        avatarUrl = publicUrl
      }

      // 2. Actualizar nombre completo y otros datos
      const nombreCompleto = `${formData.nombre} ${formData.apellido}`.trim()
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({
          nombre: nombreCompleto,
          carrera: formData.carrera,
          anio: formData.anio,
          avatar: avatarUrl
        })
        .eq("id", userData.id)

      if (updateError) {
        alert("Error al guardar los cambios: " + updateError.message)
      } else {
        // 3. Actualizar contexto
        setUserData({
          ...userData,
          nombre: nombreCompleto,
          carrera: formData.carrera,
          anio: formData.anio,
          avatar: avatarUrl
        })
        
        // Actualizar datos originales para resetear la detección de cambios
        setOriginalData(formData)
        setSelectedFile(null)
        
        alert("Configuración guardada exitosamente")
      }
    } catch (err) {
      console.error("Error al guardar cambios:", err)
      alert("Error inesperado al guardar los cambios")
    }
    setIsLoading(false)
  }

  // Cerrar sesión
  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      clearUserData()
      router.push("/")
    } catch (err) {
      console.error("Error al cerrar sesión:", err)
      alert("Error al cerrar sesión")
      setIsLoading(false)
    }
  }

  // Eliminar cuenta
  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar la cuenta");
      }

      await supabase.auth.signOut();
      clearUserData();
      
      alert("Tu cuenta ha sido eliminada correctamente. Gracias por usar UNetwork.");
      router.push("/");
      
    } catch (err) {
      console.error("Error al eliminar cuenta:", err);
      alert("Error al eliminar la cuenta: " + err.message);
      setIsLoading(false);
    }
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header de la página */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configuración</h1>
              <p className="text-gray-600 text-sm sm:text-base">Gestiona tu información personal y preferencias</p>
            </div>
          </div>
          <div className="mb-4">
            <Button variant="outline" onClick={() => router.push("/profile")}>Volver al perfil</Button>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="w-5 h-5 text-blue-500" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Foto de perfil */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                    <AvatarImage 
                      src={previewUrl || userData.avatar} 
                      alt="Foto de perfil" 
                    />
                    <AvatarFallback className="text-lg sm:text-xl">
                      {formData.nombre[0]}
                      {formData.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center justify-center cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <input 
                      id="avatar-upload"
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-medium text-gray-900 mb-1">Foto de perfil</h3>
                  <p className="text-sm text-gray-600 mb-3">Sube una foto para personalizar tu perfil</p>
                  <label htmlFor="avatar-upload-btn">
                    <Button variant="outline" size="sm" className="bg-transparent" asChild>
                      <span>Cambiar foto</span>
                    </Button>
                  </label>
                  <input 
                    id="avatar-upload-btn"
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <Separator />

              {/* Formulario de datos personales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="flex items-center gap-2 font-medium">
                    <User className="w-4 h-4 text-green-500" />
                    Nombre
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="focus:border-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido" className="flex items-center gap-2 font-medium">
                    <User className="w-4 h-4 text-green-500" />
                    Apellido
                  </Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="focus:border-green-500"
                  />
                </div>

                {/* No se muestra campo de correo - es inmutable */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <GraduationCap className="w-4 h-4 text-purple-500" />
                    Carrera
                  </Label>
                  <Select
                    value={formData.carrera}
                    onValueChange={(value) => setFormData({ ...formData, carrera: value })}
                  >
                    <SelectTrigger className="focus:border-purple-500">
                      <SelectValue placeholder="Selecciona tu carrera" />
                    </SelectTrigger>
                    <SelectContent>
                      {carreras.map((carrera) => (
                        <SelectItem key={carrera} value={carrera}>
                          {carrera}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-medium">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Año actual
                  </Label>
                  <Select
                    value={formData.anio}
                    onValueChange={(value) => setFormData({ ...formData, anio: value })}
                  >
                    <SelectTrigger className="focus:border-orange-500">
                      <SelectValue placeholder="Selecciona tu año" />
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
              </div>

              {/* Botón guardar */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acciones de Cuenta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Acciones de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cerrar sesión */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg gap-3">
                <div>
                  <h3 className="font-medium text-yellow-800">Cerrar sesión</h3>
                  <p className="text-sm text-yellow-700">Cierra tu sesión actual en este dispositivo</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 bg-transparent w-full sm:w-auto"
                  disabled={isLoading}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>

              {/* Eliminar cuenta */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-red-50 border border-red-200 rounded-lg gap-3">
                <div>
                  <h3 className="font-medium text-red-800">Eliminar cuenta</h3>
                  <p className="text-sm text-red-700">Esta acción es permanente y eliminará todos tus datos</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-100 bg-transparent w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar cuenta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        ¿Estás seguro?
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2">
                          <div>Esta acción eliminará permanentemente tu cuenta y todos los datos asociados:</div>
                          <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                            <li>Todo el material que has subido</li>
                            <li>Tus valoraciones y comentarios</li>
                            <li>Tu perfil y configuraciones</li>
                            <li>Tu historial de descargas</li>
                          </ul>
                          <div className="font-medium text-red-600 mt-4">Esta acción no se puede deshacer.</div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Eliminando...
                          </div>
                        ) : (
                          "Sí, eliminar mi cuenta"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


