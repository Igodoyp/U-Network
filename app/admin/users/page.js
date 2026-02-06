"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { ChevronLeft, ChevronRight, Search, User, UserCheck, UserX } from "lucide-react"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState("all")
  const itemsPerPage = 10

  useEffect(() => {
    fetchUsers()
  }, [currentPage, filter])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("usuarios")
        .select(`
          *,
          carreras (
            nombre
          )
        `)
        .order("fecha_registro", { ascending: false })
      
      // Aplicar filtros
      if (filter === "admin") {
        query = query.eq("rol", "admin")
      } else if (filter === "active") {
        query = query.eq("activo", true)
      } else if (filter === "inactive") {
        query = query.eq("activo", false)
      }
      
      // Obtener el total de registros para la paginación
      const { count, error: countError } = await query.select("id", { count: "exact", head: true })
      
      if (countError) throw countError
      
      const totalPages = Math.ceil(count / itemsPerPage)
      setTotalPages(totalPages)
      
      // Obtener los usuarios para la página actual
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      
      const { data, error } = await query
        .range(from, to)
        
      if (error) throw error
      
      setUsers(data || [])
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
      alert("Error al cargar los usuarios")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSearch = async () => {
    if (!searchTerm) {
      fetchUsers()
      return
    }
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          *,
          carreras (
            nombre
          )
        `)
        .or(`nombre.ilike.%${searchTerm}%,correo.ilike.%${searchTerm}%`)
        .order("fecha_registro", { ascending: false })
      
      if (error) throw error
      
      setUsers(data || [])
      setTotalPages(1) // En búsquedas no usamos paginación
      setCurrentPage(1)
    } catch (err) {
      console.error("Error en la búsqueda:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ activo: !currentStatus })
        .eq("id", userId)
      
      if (error) throw error
      
      // Actualizar el estado local
      setUsers(users.map(user => 
        user.id === userId ? {...user, activo: !user.activo} : user
      ))
    } catch (err) {
      console.error("Error al cambiar estado de usuario:", err)
      alert("Error al actualizar el usuario")
    }
  }
  
  const toggleUserAdmin = async (userId, isCurrentlyAdmin) => {
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ rol: isCurrentlyAdmin ? "user" : "admin" })
        .eq("id", userId)
      
      if (error) throw error
      
      // Actualizar el estado local
      setUsers(users.map(user => 
        user.id === userId ? {...user, rol: user.rol === "admin" ? "user" : "admin"} : user
      ))
    } catch (err) {
      console.error("Error al cambiar rol de usuario:", err)
      alert("Error al actualizar el rol del usuario")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex w-full sm:w-auto">
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-r-none"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button 
                  onClick={handleSearch}
                  className="rounded-l-none"
                  disabled={isLoading}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Select value={filter} onValueChange={(value) => {
                setFilter(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {users.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Usuario</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Carrera</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Registro</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rol</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
                                  {user.nombre ? user.nombre.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{user.nombre || "Sin nombre"}</p>
                                  <p className="text-sm text-gray-500">{user.correo}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {user.carreras?.nombre || user.carrera || "No especificado"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString("es-CL") : "N/A"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant="outline" 
                                className={user.activo 
                                  ? "bg-green-50 text-green-700 border-green-200" 
                                  : "bg-red-50 text-red-700 border-red-200"
                                }
                              >
                                {user.activo ? "Activo" : "Inactivo"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant="outline" 
                                className={user.rol === "admin" 
                                  ? "bg-purple-50 text-purple-700 border-purple-200" 
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                                }
                              >
                                {user.rol === "admin" ? "Administrador" : "Usuario"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleUserStatus(user.id, user.activo)}
                                  className={user.activo 
                                    ? "border-red-200 text-red-600 hover:bg-red-50" 
                                    : "border-green-200 text-green-600 hover:bg-green-50"
                                  }
                                >
                                  {user.activo ? (
                                    <UserX className="h-4 w-4" />
                                  ) : (
                                    <UserCheck className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleUserAdmin(user.id, user.rol === "admin")}
                                >
                                  {user.rol === "admin" ? "Quitar admin" : "Hacer admin"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Paginación */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Mostrando página {currentPage} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || isLoading}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
                  <p className="text-gray-600">Intenta con otra búsqueda o filtro</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}