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
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  FileText, 
  Eye, 
  Download, 
  EyeOff,
  Trash2, 
  Filter
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    fetchMaterials()
  }, [currentPage, filter, categoryFilter])

  const fetchMaterials = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("materiales_metadata")
        .select(`
          *,
          ramos:ramo_id (
            nombre,
            carrera,
            semestre
          ),
          profesores:profesor_id (
            nombre
          ),
          usuarios:autor_id (
            nombre
          )
        `)
        .order("created_at", { ascending: false })
      
      // Aplicar filtros
      if (filter === "visible") {
        query = query.eq("oculto", false)
      } else if (filter === "hidden") {
        query = query.eq("oculto", true)
      }
      
      // Filtrar por categoría
      if (categoryFilter !== "all") {
        query = query.eq("categoria", categoryFilter)
      }
      
      // Obtener el total de registros para la paginación
      const { count, error: countError } = await query.select("id", { count: "exact", head: true })
      
      if (countError) throw countError
      
      const totalPages = Math.ceil(count / itemsPerPage)
      setTotalPages(totalPages || 1)
      
      // Obtener los materiales para la página actual
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      
      const { data, error } = await query
        .range(from, to)
        
      if (error) throw error
      
      setMaterials(data || [])
    } catch (err) {
      console.error("Error al cargar materiales:", err)
      alert("Error al cargar los materiales")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSearch = async () => {
    if (!searchTerm) {
      fetchMaterials()
      return
    }
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("materiales_metadata")
        .select(`
          *,
          ramos:ramo_id (
            nombre,
            carrera,
            semestre
          ),
          profesores:profesor_id (
            nombre
          ),
          usuarios:autor_id (
            nombre
          )
        `)
        .ilike("titulo", `%${searchTerm}%`)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      
      setMaterials(data || [])
      setTotalPages(1) // En búsquedas no usamos paginación
      setCurrentPage(1)
    } catch (err) {
      console.error("Error en la búsqueda:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMaterialVisibility = async (materialId, currentlyHidden) => {
    try {
      const { error } = await supabase
        .from("materiales_metadata")
        .update({ oculto: !currentlyHidden })
        .eq("id", materialId)
      
      if (error) throw error
      
      // Actualizar el estado local
      setMaterials(materials.map(material => 
        material.id === materialId ? {...material, oculto: !material.oculto} : material
      ))
      
      alert(currentlyHidden 
        ? "Material visible de nuevo" 
        : "Material ocultado correctamente")
    } catch (err) {
      console.error("Error al cambiar visibilidad:", err)
      alert("Error al actualizar la visibilidad del material")
    }
  }
  
  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return;
    
    try {
      // Eliminar el registro de la base de datos
      const { error } = await supabase
        .from("materiales_metadata")
        .delete()
        .eq("id", selectedMaterial.id)
      
      if (error) throw error
      
      // Si hay una URL de archivo, eliminarla del storage
      if (selectedMaterial.file_url) {
        const { error: storageError } = await supabase.storage
          .from("materiales")
          .remove([selectedMaterial.file_url])
          
        if (storageError) {
          console.error("Error al eliminar archivo:", storageError)
          // Continuamos aunque falle la eliminación del archivo
        }
      }
      
      // Actualizar la lista local
      setMaterials(materials.filter(m => m.id !== selectedMaterial.id))
      setShowDeleteDialog(false)
      setSelectedMaterial(null)
      
      alert("Material eliminado correctamente")
    } catch (err) {
      console.error("Error al eliminar material:", err)
      alert("Error al eliminar el material")
    }
  }

  const getCategoryLabel = (category) => {
    const categories = {
      "guia": "Guía",
      "prueba": "Prueba",
      "apunte": "Apunte",
      "taller": "Taller",
      "proyecto": "Proyecto",
      "resumen": "Resumen",
      "libro": "Libro",
      "otro": "Otro"
    }
    return categories[category] || category
  }
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Materiales</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex w-full sm:w-auto">
                <Input
                  placeholder="Buscar por título..."
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
              
              <div className="flex gap-2">
                <Select value={filter} onValueChange={(value) => {
                  setFilter(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Visibilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="visible">Visibles</SelectItem>
                    <SelectItem value="hidden">Ocultos</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={(value) => {
                  setCategoryFilter(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="guia">Guías</SelectItem>
                    <SelectItem value="prueba">Pruebas</SelectItem>
                    <SelectItem value="apunte">Apuntes</SelectItem>
                    <SelectItem value="taller">Talleres</SelectItem>
                    <SelectItem value="proyecto">Proyectos</SelectItem>
                    <SelectItem value="resumen">Resúmenes</SelectItem>
                    <SelectItem value="libro">Libros</SelectItem>
                    <SelectItem value="otro">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {materials.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Material</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ramo</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Categoría</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Descargas</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map(material => (
                          <tr key={material.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="max-w-xs">
                                  <p className="font-medium text-gray-900 truncate">{material.titulo}</p>
                                  <p className="text-xs text-gray-500">
                                    Por: {material.usuarios?.nombre || "Usuario desconocido"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="max-w-[180px]">
                                <p className="truncate">{material.ramos?.nombre || "Sin ramo"}</p>
                                <p className="text-xs text-gray-500">
                                  {material.ramos?.carrera} • Semestre {material.ramos?.semestre || "N/A"}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                              {formatDate(material.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary">
                                {getCategoryLabel(material.categoria)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant="outline" 
                                className={material.oculto 
                                  ? "bg-red-50 text-red-700 border-red-200" 
                                  : "bg-green-50 text-green-700 border-green-200"
                                }
                              >
                                {material.oculto ? "Oculto" : "Visible"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-medium">{material.descargas || 0}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/document/${material.id}`, '_blank')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleMaterialVisibility(material.id, material.oculto)}
                                  className={material.oculto 
                                    ? "border-green-200 text-green-600 hover:bg-green-50" 
                                    : "border-red-200 text-red-600 hover:bg-red-50"
                                  }
                                >
                                  {material.oculto ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMaterial(material)
                                    setShowDeleteDialog(true)
                                  }}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
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
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron materiales</h3>
                  <p className="text-gray-600">Intenta con otra búsqueda o filtro</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el material "{selectedMaterial?.titulo}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMaterial}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}