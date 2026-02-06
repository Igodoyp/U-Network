"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useUserContext } from "@/context/UserContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Mail,
  BookOpen,
  School,
  Calendar,
  FileText,
  Download,
  Star,
  Clock,
  ArrowLeft,
  ThumbsUp,
  MessageSquare
} from "lucide-react"

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

export default function UserProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const { userData: currentUser } = useUserContext()

  console.log("=== PROFILE PAGE DEBUG ===")
  console.log("URL id:", id)
  console.log("Current user:", currentUser)
  console.log("Current user id:", currentUser?.id)
  console.log("Is user logged in:", !!currentUser)
  console.log("==========================")
  const [profileUser, setProfileUser] = useState(null)
  const [userMaterials, setUserMaterials] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    totalMateriales: 0,
    totalDescargas: 0,
    promedioPuntuacion: 0,
    contribucionesRecientes: 0,
  })

  useEffect(() => {
    console.log("useEffect ejecutándose con id:", id)

    if (!id) {
      console.log("❌ No hay ID en la URL, redirigiendo a dashboard")
      router.push("/dashboard")
      return
    }

    if (!currentUser) {
      console.log("❌ Usuario no logueado, redirigiendo a /")
      router.push("/")
      return
    }

    const fetchUserProfile = async () => {
      setIsLoading(true)

      try {
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select(`
            id, 
            nombre, 
            correo, 
            carrera, 
            anio,
            avatar,
            fecha_registro,
            descripcion,
            ramos_favoritos:usuarios_ramos(
              ramo_id,
              ramos(id, nombre)
            )
          `)
          .eq("id", id)
          .single()

        if (userError) {
          console.error("Error fetching user:", userError)
          return
        }

        if (!userData) {
          router.push("/dashboard")
          return
        }

        // Procesar los datos del usuario
        const processedUser = {
          ...userData,
          ramos: userData.ramos_favoritos
            ?.filter(r => r.ramos)
            .map(r => r.ramos) || []
        }

        console.log("Processed user anio:", processedUser.anio)
        console.log("Processed user semestre:", processedUser.semestre)

        setProfileUser(processedUser)

        // Fetch user materials
        const { data: materials, error: materialsError } = await supabase
          .from("materiales_metadata")
          .select(`
            id,
            titulo,
            descripcion,
            categoria,
            created_at,
            descargas,
            ramo_id,
            ramos(nombre),
            profesor_id,
            profesores(nombre),
            status
          `)
          .eq("autor_id", id)
          .eq("status", "public")
          .order("created_at", { ascending: false })

        if (materialsError) {
          console.error("Error fetching materials:", materialsError)
        } else {
          // Una vez obtenidos los materiales, consultar sus valoraciones
          const processedMaterials = await Promise.all(materials ? materials.map(async (material) => {
            // Consultar valoraciones positivas
            const { data: positivas, error: positivasError } = await supabase
              .from("valoraciones")
              .select("count")
              .eq("material_id", material.id)
              .eq("es_positiva", true) // Usar el campo booleano es_positiva=true

            // Consultar valoraciones negativas
            const { data: negativas, error: negativasError } = await supabase
              .from("valoraciones")
              .select("count")
              .eq("material_id", material.id)
              .eq("es_positiva", false) // Usar el campo booleano es_positiva=false
            
            const positivasCount = positivasError ? 0 : positivas?.length || 0;
            const negativasCount = negativasError ? 0 : negativas?.length || 0;
            
            const totalVotos = positivasCount + negativasCount;
            const puntuacion = totalVotos > 0 ? (positivasCount / totalVotos) * 5 : 0;
            
            return {
              ...material,
              puntuacion,
              fecha_subida: material.created_at // Usar created_at como fecha_subida
            };
          }) : [])
          
          setUserMaterials(processedMaterials)
          
          // Actualizar las estadísticas
          if (processedMaterials.length > 0) {
            const currentDate = new Date()
            const oneMonthAgo = new Date()
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

            const stats = {
              totalMateriales: processedMaterials.length,
              totalDescargas: processedMaterials.reduce((sum, mat) => sum + (mat.descargas || 0), 0),
              promedioPuntuacion: processedMaterials.length 
                ? processedMaterials.reduce((sum, mat) => sum + (mat.puntuacion || 0), 0) / processedMaterials.length
                : 0,
              contribucionesRecientes: processedMaterials.filter(mat => 
                new Date(mat.fecha_subida) >= oneMonthAgo
              ).length
            }
            
            setUserStats(stats)
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchUserProfile()
    }
  }, [id, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Cargando perfil...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16">
        <div className="container max-w-5xl mx-auto px-4 text-center py-20">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Usuario no encontrado</h3>
          <p className="text-gray-600 mb-6">No pudimos encontrar el perfil que buscas</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-6">
      <div className="container max-w-5xl mx-auto px-4">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        {/* Perfil header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-24 h-24 md:w-32 md:h-32">
              <AvatarImage src={profileUser.avatar} />
              <AvatarFallback className="bg-blue-100 text-blue-800 text-2xl">
                {profileUser.nombre
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold mb-2">{profileUser.nombre}</h1>
              <div className="space-y-1 text-gray-600">
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <School className="w-4 h-4" />
                  {profileUser.carrera || "Carrera no especificada"}
                </p>
                {Number(profileUser.anio) ? (
                  <p className="flex items-center justify-center md:justify-start gap-2">
                    <BookOpen className="w-4 h-4" />
                    {getOrdinalYear(profileUser.anio)}
                  </p>
                ) : (
                  <p className="flex items-center justify-center md:justify-start gap-2">
                    <BookOpen className="w-4 h-4" />
                    Año no especificado
                  </p>
                )}
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  {profileUser.correo}
                </p>
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  Miembro desde {formatDate(profileUser.fecha_registro)}
                </p>
              </div>
              {profileUser.descripcion && (
                <p className="mt-4 text-gray-700 bg-gray-50 p-3 rounded-md italic">
                  "{profileUser.descripcion}"
                </p>
              )}
            </div>
            {/* Botones de acción en pantallas más grandes */}
            <div className="hidden md:flex md:flex-col gap-2 min-w-[120px] self-start">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                variant="default"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Mensaje
              </Button>
            </div>
          </div>
          
          {/* Botones de acción para móvil */}
          <div className="mt-4 flex gap-2 md:hidden">
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              variant="default"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Mensaje
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={FileText}
            title={userStats.totalMateriales.toString()}
            subtitle="Materiales"
            color="bg-blue-50 text-blue-600"
          />
          <StatCard 
            icon={Download}
            title={userStats.totalDescargas.toString()}
            subtitle="Descargas"
            color="bg-green-50 text-green-600"
          />
          <StatCard 
            icon={Star}
            title={userStats.promedioPuntuacion.toFixed(1)}
            subtitle="Puntuación"
            color="bg-amber-50 text-amber-600"
          />
          <StatCard 
            icon={Clock}
            title={userStats.contribucionesRecientes.toString()}
            subtitle="Último mes"
            color="bg-purple-50 text-purple-600"
          />
        </div>

        {/* Contenido en pestañas */}
        <Tabs defaultValue="materiales" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="materiales">Materiales</TabsTrigger>
            <TabsTrigger value="ramos">Ramos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="materiales" className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Materiales compartidos</h2>
            
            {userMaterials.length > 0 ? (
              userMaterials.map(material => (
                <Card key={material.id} className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/document/${material.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-medium text-lg mb-1">{material.titulo}</h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {material.ramos?.nombre || "Sin ramo"} • {material.categoria} • {formatDate(material.fecha_subida)}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {material.descripcion || "Sin descripción"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Download className="w-3 h-3 mr-1" />
                          {material.descargas || 0}
                        </span>
                        <span className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-amber-500" />
                          {material.puntuacion ? material.puntuacion.toFixed(1) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Este usuario no ha compartido materiales aún</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ramos" className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Ramos favoritos</h2>
            
            {profileUser.ramos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profileUser.ramos.map(ramo => (
                  <Card key={ramo.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/search?ramo=${ramo.id}`)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-50">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{ramo.nombre}</h3>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Este usuario no ha añadido ramos favoritos</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, subtitle, color }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold">{title}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  )
}