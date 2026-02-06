"use client"

import { useState, useEffect } from "react"
import { useUserContext } from "@/context/UserContext"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { User, Mail, BookOpen, Search, School, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function ConectarPage() {
  const { userData } = useUserContext()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [carreraFilter, setCarreraFilter] = useState("todas")
  const [carreras, setCarreras] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        // Cargar lista de carreras para el filtro
        setCarreras([
          "Ingeniería Plan Común",
          "Ingeniería Civil Industrial",
          "Ingeniería Civil en BioMedicina",
          "Ingeniería Civil en Informática e Innovación Tecnológica",
          "Ingeniería Civil en Informática e Inteligencia Artificial",
          "Ingeniería Civil en Minería",
          "Ingeniería Civil en Obras Civiles",
          "Geología",
        ])

        // Cargar usuarios
        let query = supabase
          .from("usuarios")
          .select(`
            id, 
            nombre, 
            correo, 
            carrera, 
            anio,
            avatar,
            ramos_favoritos:usuarios_ramos(
              ramo_id,
              ramos(id, nombre)
            )
          `)
          .neq("id", userData?.id)
          .order("nombre")
          .limit(50)

        const { data, error } = await query

        if (error) {
          console.error("Error al obtener usuarios:", error)
          return
        }

        // Procesar los datos para incluir ramos favoritos
        const processedUsers = data.map(user => ({
          id: user.id,
          nombre: user.nombre || "Usuario sin nombre",
          correo: user.correo || "",
          carrera: user.carrera || "No especificada",
          anio: user.anio || "No especificado",
          avatar: user.avatar || null,
          ramos: user.ramos_favoritos
            ?.filter(r => r.ramos) // Filtrar relaciones nulas
            .map(r => r.ramos.nombre) || []
        }))

        setUsers(processedUsers)
        setFilteredUsers(processedUsers)
      } catch (err) {
        console.error("Error al cargar usuarios:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [userData])

  // Filtrar usuarios cuando cambien los criterios
  useEffect(() => {
    let result = [...users]
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        user => 
          user.nombre.toLowerCase().includes(query) || 
          user.carrera.toLowerCase().includes(query)
      )
    }
    
    // Filtrar por carrera
    if (carreraFilter !== "todas") {
      result = result.filter(user => user.carrera === carreraFilter)
    }
    
    setFilteredUsers(result)
  }, [searchQuery, carreraFilter, users])

  const handleViewProfile = (userId) => {
    console.log("Navegando a perfil de usuario:", userId)
    console.log("Tipo de userId:", typeof userId)
    router.push(`/perfil/${userId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Conectar con otros estudiantes</h1>
        
        {/* Filtros y búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar estudiantes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-gray-500 w-4 h-4" />
                <Select value={carreraFilter} onValueChange={setCarreraFilter}>
                  <SelectTrigger className="bg-transparent">
                    <SelectValue placeholder="Filtrar por carrera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las carreras</SelectItem>
                    {carreras.map((carrera) => (
                      <SelectItem key={carrera} value={carrera}>
                        {carrera}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Cargando usuarios...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {user.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-lg truncate">{user.nombre}</h3>
                        <div className="space-y-1 mt-1">
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <School className="w-3 h-3" />
                            {user.carrera}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {user.anio ? getOrdinalYear(user.anio) : "Año no especificado"}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.correo || "Sin correo"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ramos del usuario */}
                    {user.ramos.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Ramos:</p>
                        <div className="flex flex-wrap gap-1">
                          {user.ramos.slice(0, 3).map((ramo) => (
                            <Badge key={ramo} variant="secondary" className="bg-blue-50 text-blue-700">
                              {ramo}
                            </Badge>
                          ))}
                          {user.ramos.length > 3 && (
                            <Badge variant="outline" className="text-gray-500">
                              +{user.ramos.length - 3} más
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Botones de acción */}
                    <div className="mt-4 pt-4 border-t flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => handleViewProfile(user.id)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Ver perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
                <p className="text-gray-600">Intenta ajustar los criterios de búsqueda</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}