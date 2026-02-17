"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Mail,
  GraduationCap,
  Calendar,
  Upload,
  ThumbsUp,
  MessageCircle,
  Users,
  Edit3,
  FileText,
  BookOpen,
  Star,
  TrendingUp,
  Camera,
  Settings,
  Trash2,
} from "lucide-react"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useUserContext } from "@/context/UserContext"

// Función para convertir el año a formato ordinal
const getOrdinalYear = (year) => {
  const yearNum = parseInt(year)
  switch(yearNum) {
    case 1: return "1ero año"
    case 2: return "2do año"
    case 3: return "3ero año"
    case 4: return "4to año"
    case 5: return "5to año"
    case 6: return "6to año"
    default: return `Año ${year}`
  }
}

const ProfilePage = () => {
  const { userData, setUserData, isLoading: userLoading } = useUserContext()
  const router = useRouter()
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [isEditingSubjects, setIsEditingSubjects] = useState(false)
  const [tempSelectedSubjects, setTempSelectedSubjects] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [userMaterial, setUserMaterial] = useState([])
  const [isUploading, setIsUploading] = useState(false) // Nuevo estado para controlar la carga de imágenes
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false); // Estado para controlar la eliminación de material


  useEffect(() => {
    const fetchUserMaterial = async () => {
      if (!userData?.id) {
        console.log("No hay userData o id de usuario");
        return;
      }

      

      try {
        // Actualizar la consulta para incluir el campo solucion
        const { data, error } = await supabase
          .from("materiales_metadata")
          .select(`
            id,
            titulo,
            ramo_id,
            ramos:ramo_id (
              nombre,
              carrera,
              semestre
            ),
            profesor_id,
            profesores:profesor_id (
              id, 
              nombre
            ),
            carrera,
            semestre,
            autor_id,
            categoria,
            file_url,
            descripcion,
            created_at,
            val_positivas,
            val_negativas,
            descargas,
            solucion,
            status
          `)
          .eq("autor_id", userData.id)
          .eq("status", "public")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error al obtener materiales del usuario:", error);
          return;
        }

        // Añadir el campo solucion al mapeo de datos
        const mapped = data.map((m) => ({
          id: m.id,
          title: m.titulo,
          type: m.categoria,
          rating: m.val_positivas + m.val_negativas > 0
            ? Math.round((m.val_positivas / (m.val_positivas + m.val_negativas)) * 100)
            : 0,
          subject: m.ramos ? m.ramos.nombre : "No especificado",
          date: new Date(m.created_at).toLocaleDateString("es-CL"),
          downloads: m.descargas ?? 0,
          file_url: m.file_url,
          description: m.descripcion,
          profesor: m.profesores ? m.profesores.nombre : "No especificado",
          semestre: m.semestre,
          carrera: m.carrera,
          hasSolution: m.solucion || false // Añadir hasSolution
        }));

        setUserMaterial(mapped);
      } catch (err) {
        console.error("Error inesperado al obtener materiales del usuario:", err);
      }
    };

    fetchUserMaterial();
  }, [userData])

  // Modificar useEffect que carga los ramos del usuario
  useEffect(() => {
    const fetchUserSubjects = async () => {
      if (!userData?.id) return;
      
      setIsLoading(true);
      try {
        // Cargar ramos del usuario usando la tabla de unión
        const { data: userRamos, error } = await supabase
          .from("usuarios_ramos")
          .select(`
            ramo_id,
            ramos(id, nombre, carrera)
          `)
          .eq("usuario_id", userData.id);
          
        if (error) {
          console.error("Error al obtener ramos:", error);
        } else {
          // Extraer información completa de los ramos
          const subjects = userRamos
            .filter(item => item.ramos) // Asegurar que existe la relación
            .map(item => ({
              id: item.ramos.id,
              nombre: item.ramos.nombre,
              carrera: item.ramos.carrera
            }));
            
          // Usar Set para eliminar duplicados por ID
          const uniqueSubjects = Array.from(
            new Map(subjects.map(item => [item.id, item])).values()
          );
          
          setSelectedSubjects(uniqueSubjects);
          setTempSelectedSubjects(uniqueSubjects);
        }
        
        // Cargar todos los ramos disponibles para la carrera del usuario
        const { data: allRamos, error: ramosError } = await supabase
          .from("ramos")
          .select("id, nombre, carrera, semestre")
          .eq("carrera", userData?.carrera);
          
        if (ramosError) {
          console.error("Error al obtener ramos disponibles:", ramosError);
        } else {
          setAvailableSubjects(allRamos);
        }
      } catch (err) {
        console.error("Error inesperado:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserSubjects();
  }, [userData])

  // Modificar la función que maneja la selección de ramos
  const handleSubjectChange = (ramoId, checked) => {
    if (checked) {
      // Buscar el ramo completo en los disponibles
      const ramoToAdd = availableSubjects.find(r => r.id === ramoId);
      if (ramoToAdd) {
        setTempSelectedSubjects([...tempSelectedSubjects, ramoToAdd]);
      }
    } else {
      setTempSelectedSubjects(tempSelectedSubjects.filter(r => r.id !== ramoId));
    }
  };

  // Modificar la función de guardado
  const saveSubjects = async () => {
    setIsLoading(true);
    try {
      if (!userData?.id) return;
      
      // 1. Obtener solo los IDs de los ramos seleccionados
      const selectedIds = tempSelectedSubjects.map(ramo => ramo.id);
      
      // 2. Eliminar todas las relaciones existentes
      const { error: deleteError } = await supabase
        .from("usuarios_ramos")
        .delete()
        .eq("usuario_id", userData.id);
        
      if (deleteError) throw deleteError;
      
      // 3. Preparar nuevas relaciones - sin necesidad de filtrar duplicados ya que trabajamos con IDs únicos
      const nuevasRelaciones = selectedIds.map(ramoId => ({
        usuario_id: userData.id,
        ramo_id: ramoId
      }));
      
      // 4. Insertar nuevas relaciones
      const { error: insertError } = await supabase
        .from("usuarios_ramos")
        .insert(nuevasRelaciones);
        
      if (insertError) throw insertError;
      
      // 5. Actualizar estado local
      setSelectedSubjects(tempSelectedSubjects);
      setIsEditingSubjects(false);
      
    } catch (err) {
      console.error("Error al guardar ramos:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const cancelEditSubjects = () => {
    setTempSelectedSubjects(selectedSubjects)
    setIsEditingSubjects(false)
  }

  // Y un renderizado condicional al principio del componente:
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Cargando perfil...</span>
      </div>
    );
  }

  // Calcula la cantidad de material subido
  const uploads = userMaterial.length

  // Calcula las descargas totales
  const totalDownloads = userMaterial.reduce((acc, material) => acc + (material.downloads || 0), 0)

  // Calcula la valoración promedio (en porcentaje)
  const avgRating =
    userMaterial.length > 0
      ? (
          userMaterial.reduce((acc, m) => acc + (isNaN(m.rating) ? 0 : m.rating), 0) / userMaterial.length
        ).toFixed(1)
      : 0

  const ramosConMaterial = Array.from(
    new Set(userMaterial.map((m) => m.subject))
  ).filter(Boolean);

  // Mover handleAvatarChange DENTRO del componente
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen es demasiado grande. El tamaño máximo es 2MB.");
      return;
    }
    
    try {
      // Mostrar estado de carga
      setIsUploading(true); // Usa el nuevo estado para evitar conflictos
      
      // 1. Subir la imagen al bucket de Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${userData.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error("Error completo:", uploadError);
        throw new Error(`Error al subir la imagen: ${JSON.stringify(uploadError)}`);
      }
      
      // 2. Obtener la URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // 3. Actualizar el perfil del usuario con la nueva URL de avatar
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar: publicUrl })
        .eq('id', userData.id);
      
      if (updateError) {
        throw new Error(`Error al actualizar el perfil: ${updateError.message}`);
      }
      
      // 4. Actualizar el contexto del usuario (aquí está el problema - estamos accediendo directamente al contexto)
      setUserData({
        ...userData,
        avatar: publicUrl
      });
      
      alert("Foto de perfil actualizada correctamente");
    } catch (err) {
      console.error("Error al cambiar la foto de perfil:", err);
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Función para eliminar material
  const handleDeleteMaterial = async (materialId, fileUrl) => {
    if (!userData?.id) return;
    
    setIsDeletingMaterial(true);
    try {
      // 1. Eliminar el registro de la base de datos
      const { data: deletedRows, error: dbError } = await supabase
        .from("materiales_metadata")
        .delete()
        .eq("id", materialId)
        .eq("autor_id", userData.id) // Verificar que sea el propietario
        .select("id, file_url");
      
      if (dbError) throw new Error(`Error al eliminar el registro: ${dbError.message}`);

      if (!deletedRows || deletedRows.length === 0) {
        throw new Error("No se pudo eliminar el material (no existe o no tienes permisos).")
      }

      const deletedFileUrl = fileUrl || deletedRows[0]?.file_url
      
      // 2. Eliminar el archivo de storage si existe la URL
      if (deletedFileUrl) {
        const { error: storageError } = await supabase.storage
          .from("materiales")
          .remove([deletedFileUrl]);
        
        if (storageError) {
          console.error("Error al eliminar archivo de storage:", storageError);
          // Continuar aunque falle la eliminación del archivo
        }
      }
      
      // 3. Actualizar el estado local eliminando el material
      setUserMaterial(userMaterial.filter(m => String(m.id) !== String(materialId)));
      
      // 4. Mostrar mensaje de éxito
      alert("Material eliminado correctamente");
      
    } catch (err) {
      console.error("Error al eliminar material:", err);
      alert(`No se pudo eliminar el material: ${err.message}`);
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header del perfil */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Avatar y botón de cambiar foto */}
              <div className="relative mx-auto sm:mx-0">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32">
                  <AvatarImage 
                    src={userData?.avatar || "https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.webp"} 
                    alt={userData?.nombre || "Usuario"} 
                  />
                  <AvatarFallback className="text-xl sm:text-2xl">
                    {userData?.nombre
                      ? userData.nombre
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "?"} {/* Muestra un placeholder si `userData.nombre` es undefined */}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center justify-center cursor-pointer">
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                  <input 
                    id="avatar-upload"
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              {/* Información personal */}
              <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {userData?.nombre || "Usuario"}
                  </h1>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm sm:text-base">{userData?.correo || "Sin correo"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-sm sm:text-base">
                        {userData?.carrera || "Sin carrera"} • {userData?.university || "Sin universidad"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm sm:text-base">
                        {userData?.anio ? getOrdinalYear(userData.anio) : "Año no especificado"} • Miembro desde {userData?.fecha_registro ? new Date(userData?.fecha_registro).toLocaleDateString("es-ES") : "Fecha no disponible"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón de configuración */}
                <Button
                  onClick={() => router.push("/settings")}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent w-full sm:w-auto"
                >
                  <Settings className="w-4 h-4" />
                  Editar perfil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            icon={Upload}
            title="Material subido"
            value={uploads}
            subtitle="archivos compartidos"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Star}
            title="Valoración promedio"
            value={`${avgRating}%`}
            subtitle="de tus publicaciones"
            color="bg-gradient-to-br from-yellow-500 to-orange-500"
          />
          <StatCard
            icon={Users}
            title="Personas ayudadas"
            value={totalDownloads}
            subtitle="descargas totales"
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>

        {/* Contenido con tabs */}
        <Tabs defaultValue="publications" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger value="publications" className="flex items-center gap-2 py-2 sm:py-3 text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Publicaciones</span>
              <span className="sm:hidden">Publicaciones</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2 py-2 sm:py-3 text-sm">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Ramos</span>
              <span className="sm:hidden">Ramos</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab de publicaciones */}
          <TabsContent value="publications" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Material Subido ({userMaterial.length})
                  </span>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 w-fit">
                    {totalDownloads} descargas totales
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {isDeletingMaterial ? (
                    <div className="col-span-2 flex justify-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">Eliminando material...</span>
                    </div>
                  ) : userMaterial.length > 0 ? (
                    userMaterial.map((material) => (
                      <MaterialCard 
                        key={material.id} 
                        material={material} 
                        onDelete={handleDeleteMaterial} 
                      />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Aún no has subido material</p>
                      <p className="text-sm text-gray-400 mb-4">
                        Comparte tus conocimientos con la comunidad
                      </p>
                      <Button 
                        onClick={() => router.push('/upload')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Subir material
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de ramos */}
          <TabsContent value="subjects" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="flex items-center gap-2 text-base sm:text-lg">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    Ramos Actuales ({selectedSubjects.length})
                  </span>
                  <Dialog open={isEditingSubjects} onOpenChange={setIsEditingSubjects}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-transparent w-full sm:w-auto"
                      >
                        <Edit3 className="w-4 h-4" />
                        Editar ramos
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md mx-4">
                      <DialogHeader>
                        <DialogTitle>Editar Ramos</DialogTitle>
                        <DialogDescription>
                          Selecciona los ramos que estás cursando actualmente para recibir material específico.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="max-h-80 overflow-y-auto space-y-3 py-4">
                        {isLoading ? (
                          <div className="flex justify-center items-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-sm text-gray-600">Cargando ramos...</span>
                          </div>
                        ) : availableSubjects.length > 0 ? (
                          availableSubjects.map((subject) => (
                            <div key={subject.id} className="flex items-center space-x-3">
                              <Checkbox
                                id={`ramo-${subject.id}`}
                                checked={tempSelectedSubjects.some(r => r.id === subject.id)}
                                onCheckedChange={(checked) => handleSubjectChange(subject.id, checked)}
                              />
                              <Label htmlFor={`ramo-${subject.id}`} className="text-sm cursor-pointer flex-1">
                                {subject.nombre} 
                                <span className="text-xs text-gray-500"> • {subject.carrera}</span>
                              </Label>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No se encontraron ramos para tu carrera</p>
                          </div>
                        )}
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          onClick={cancelEditSubjects}
                          className="w-full sm:w-auto bg-transparent"
                          disabled={isLoading}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={saveSubjects} 
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Guardando...</span>
                            </div>
                          ) : "Guardar cambios"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Estos son los ramos que tienes configurados. El material de estos ramos aparecerá prioritariamente en tu feed.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map((subject) => (
                      <Badge key={subject.id} variant="secondary" className="bg-green-50 text-green-700 px-3 py-1">
                        {subject.nombre}
                      </Badge>
                    ))}
                  </div>
                  {selectedSubjects.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No tienes ramos configurados</p>
                      <p className="text-sm text-gray-400">
                        Agrega tus ramos actuales para recibir material personalizado
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas por ramo */}
            {ramosConMaterial.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Estadísticas por Ramo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {ramosConMaterial.map((subject) => {
                      const subjectMaterial = userMaterial.filter((m) => m.subject === subject)
                      const totalDownloads = subjectMaterial.reduce((acc, m) => acc + m.downloads, 0)
                      const avgRating =
                        subjectMaterial.length > 0
                          ? subjectMaterial.reduce((acc, m) => acc + m.rating, 0) / subjectMaterial.length
                          : 0

                      return (
                        <div key={subject} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-2">
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">{subject}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {subjectMaterial.length} archivo{subjectMaterial.length !== 1 ? "s" : ""} subido
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm font-medium text-gray-900">{totalDownloads} descargas</p>
                            {avgRating > 0 && (
                              <p className="text-xs sm:text-sm text-gray-600">{avgRating.toFixed(1)}% valoración</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-700">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MaterialCard({ material, onDelete }) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Prevenir la propagación del clic para que no navegue al documento
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-4">
          <div 
            className="flex-1 min-w-0 space-y-1 sm:space-y-2"
            onClick={() => router.push(`/document/${material.id}`)}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{material.title}</h3>
                {material.hasSolution && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">
                    Con solución
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {material.type}
                </Badge>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">{material.rating}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <BookOpen className="w-3 h-3" />
              <span>{material.subject}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{material.date}</span>
              <span>{material.downloads} descargas</span>
            </div>
          </div>
          
          {/* Botón de eliminar */}
          <div className="flex items-start">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDeleteClick}
              className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            {/* Diálogo de confirmación */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Eliminar material</DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de que deseas eliminar "{material.title}"? Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteDialog(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      onDelete(material.id, material.file_url);
                      setShowDeleteDialog(false);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Eliminar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfilePage
