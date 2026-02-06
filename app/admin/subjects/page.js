"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { ChevronLeft, ChevronRight, Search, BookOpen, Plus, FileText, Edit, Trash2 } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [subjectMaterials, setSubjectMaterials] = useState([])
  const [showMaterialsDialog, setShowMaterialsDialog] = useState(false)
  
  // Campos de edición/creación
  const [nombre, setNombre] = useState("")
  const [codigo, setCodigo] = useState("")
  const [carrera, setCarrera] = useState("")
  const [semestre, setSemestre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const itemsPerPage = 10

  useEffect(() => {
    fetchSubjects()
  }, [currentPage, filter])

  const fetchSubjects = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("ramos")
        .select(`
          *,
          materialesMeta:materiales_metadata(count)
        `, { count: "exact" })
        .order("carrera", { ascending: true })
        .order("semestre", { ascending: true })
        .order("nombre", { ascending: true })
      
      // Aplicar filtro por carrera
      if (filter !== "all") {
        query = query.eq("carrera", filter)
      }
      
      // Obtener el total de registros para la paginación
      const { count, error: countError } = await query.select("id", { count: "exact", head: true })
      
      if (countError) throw countError
      
      const totalPages = Math.ceil(count / itemsPerPage)
      setTotalPages(totalPages || 1)
      
      // Obtener los ramos para la página actual
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      
      const { data, error } = await query
        .range(from, to)
        
      if (error) throw error
      
      setSubjects(data || [])
    } catch (err) {
      console.error("Error al cargar ramos:", err)
      alert("Error al cargar los ramos")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSearch = async () => {
    if (!searchTerm) {
      fetchSubjects()
      return
    }
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("ramos")
        .select(`
          *,
          materialesMeta:materiales_metadata(count)
        `, { count: "exact" })
        .ilike("nombre", `%${searchTerm}%`)
        .order("carrera", { ascending: true })
        .order("semestre", { ascending: true })
        .order("nombre", { ascending: true })
      
      if (error) throw error
      
      setSubjects(data || [])
      setTotalPages(1) // En búsquedas no usamos paginación
      setCurrentPage(1)
    } catch (err) {
      console.error("Error en la búsqueda:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject)
    setNombre(subject.nombre)
    setCodigo(subject.codigo || "")
    setCarrera(subject.carrera || "")
    setSemestre(subject.semestre || "")
    setDescripcion(subject.descripcion || "")
    setIsEditing(true)
  }
  
  const handleCreateNew = () => {
    setNombre("")
    setCodigo("")
    setCarrera("")
    setSemestre("")
    setDescripcion("")
    setIsCreating(true)
  }
  
  const handleSubmit = async () => {
    if (!nombre || !carrera) {
      alert("El nombre y la carrera son obligatorios")
      return
    }
    
    setIsSubmitting(true)
    try {
      if (isEditing) {
        // Actualizar ramo existente
        const { error } = await supabase
          .from("ramos")
          .update({
            nombre,
            codigo,
            carrera,
            semestre,
            descripcion,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedSubject.id)
        
        if (error) throw error
        
        // Actualizar la lista local
        setSubjects(subjects.map(subject => 
          subject.id === selectedSubject.id 
            ? { ...subject, nombre, codigo, carrera, semestre, descripcion } 
            : subject
        ))
        
        alert("Ramo actualizado correctamente")
      } else {
        // Crear nuevo ramo
        const { data, error } = await supabase
          .from("ramos")
          .insert({
            nombre,
            codigo,
            carrera,
            semestre,
            descripcion
          })
          .select()
        
        if (error) throw error
        
        // Actualizar la lista local
        if (data && data.length > 0) {
          setSubjects([...subjects, { ...data[0], materialesMeta: [{ count: 0 }] }])
        }
        
        alert("Ramo creado correctamente")
      }
      
      // Cerrar el diálogo
      setIsEditing(false)
      setIsCreating(false)
      
    } catch (err) {
      console.error("Error al guardar ramo:", err)
      alert(`Error al ${isEditing ? "actualizar" : "crear"} el ramo`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    
    try {
      // Verificar si hay materiales asociados
      const { count, error: countError } = await supabase
        .from("materiales_metadata")
        .select("id", { count: "exact", head: true })
        .eq("ramo_id", selectedSubject.id)
      
      if (countError) throw countError
      
      if (count > 0) {
        alert(`No se puede eliminar este ramo porque tiene ${count} materiales asociados. Elimina o reasigna los materiales primero.`)
        setShowDeleteDialog(false)
        return
      }
      
      // Eliminar el ramo
      const { error } = await supabase
        .from("ramos")
        .delete()
        .eq("id", selectedSubject.id)
      
      if (error) throw error
      
      // Actualizar la lista local
      setSubjects(subjects.filter(subject => subject.id !== selectedSubject.id))
      setShowDeleteDialog(false)
      setSelectedSubject(null)
      
      alert("Ramo eliminado correctamente")
    } catch (err) {
      console.error("Error al eliminar ramo:", err)
      alert("Error al eliminar el ramo")
    }
  }
  
  const handleViewMaterials = async (subjectId, subjectName) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("materiales_metadata")
        .select(`
          id,
          titulo,
          categoria,
          created_at,
          descargas,
          val_positivas,
          val_negativas,
          autor_id,
          usuarios:autor_id (nombre)
        `)
        .eq("ramo_id", subjectId)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      
      setSubjectMaterials(data || [])
      setSelectedSubject({ id: subjectId, nombre: subjectName })
      setShowMaterialsDialog(true)
    } catch (err) {
      console.error("Error al cargar materiales del ramo:", err)
      alert("Error al cargar los materiales")
    } finally {
      setIsLoading(false)
    }
  }
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Ramos</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex w-full sm:w-auto">
                <Input
                  placeholder="Buscar por nombre..."
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
                    <SelectValue placeholder="Carrera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Ingeniería Civil Informática">Ing. Civil Informática</SelectItem>
                    <SelectItem value="Ingeniería Civil Industrial">Ing. Civil Industrial</SelectItem>
                    <SelectItem value="Ingeniería Comercial">Ing. Comercial</SelectItem>
                    <SelectItem value="Derecho">Derecho</SelectItem>
                    <SelectItem value="Medicina">Medicina</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Ramo
                </Button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {subjects.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Código</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Carrera</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Semestre</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Materiales</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map(subject => (
                          <tr key={subject.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{subject.nombre}</p>
                                  {subject.descripcion && (
                                    <p className="text-xs text-gray-500 truncate max-w-xs">{subject.descripcion}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {subject.codigo || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {subject.carrera || "No especificado"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-center">
                              {subject.semestre ? `${subject.semestre}° semestre` : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button 
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewMaterials(subject.id, subject.nombre)}
                                className="px-2 py-1 h-auto text-blue-600 hover:text-blue-800"
                              >
                                {subject.materialesMeta?.[0]?.count || 0} materiales
                              </Button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditSubject(subject)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSubject(subject)
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
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron ramos</h3>
                  <p className="text-gray-600">Intenta con otra búsqueda o agrega un nuevo ramo</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Diálogo de edición/creación */}
      <Dialog open={isEditing || isCreating} onOpenChange={(open) => {
        if (!open) {
          setIsEditing(false)
          setIsCreating(false)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar ramo" : "Crear nuevo ramo"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Actualiza la información del ramo." : "Completa el formulario para crear un nuevo ramo."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input 
                id="nombre" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del ramo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input 
                id="codigo" 
                value={codigo} 
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Código del ramo (opcional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="carrera">Carrera</Label>
              <Select value={carrera} onValueChange={setCarrera}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una carrera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ingeniería Civil Informática">Ingeniería Civil Informática</SelectItem>
                  <SelectItem value="Ingeniería Civil Industrial">Ingeniería Civil Industrial</SelectItem>
                  <SelectItem value="Ingeniería Comercial">Ingeniería Comercial</SelectItem>
                  <SelectItem value="Derecho">Derecho</SelectItem>
                  <SelectItem value="Medicina">Medicina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="semestre">Semestre</Label>
              <Input 
                id="semestre" 
                type="number" 
                value={semestre} 
                onChange={(e) => setSemestre(e.target.value)}
                placeholder="Semestre (1-10)"
                min="1"
                max="10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input 
                id="descripcion" 
                value={descripcion} 
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción breve (opcional)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false)
                setIsCreating(false)
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !nombre || !carrera}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isEditing ? "Guardando..." : "Creando..."}
                </>
              ) : (
                isEditing ? "Guardar cambios" : "Crear ramo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el ramo "{selectedSubject?.nombre}"? Esta acción no se puede deshacer.
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
              onClick={handleDeleteSubject}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para ver materiales del ramo */}
      <Dialog open={showMaterialsDialog} onOpenChange={setShowMaterialsDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Materiales de {selectedSubject?.nombre}</DialogTitle>
            <DialogDescription>
              Listado de todos los materiales asociados a este ramo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {subjectMaterials.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Material</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Categoría</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Fecha</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Descargas</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Valoración</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectMaterials.map(material => (
                    <tr key={material.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900">{material.titulo}</p>
                            <p className="text-xs text-gray-500">
                              Por: {material.usuarios?.nombre || "Usuario desconocido"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary">
                          {getCategoryLabel(material.categoria)}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {formatDate(material.created_at)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="font-medium">{material.descargas || 0}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-green-600">+{material.val_positivas || 0}</span>
                          <span>/</span>
                          <span className="text-red-600">-{material.val_negativas || 0}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay materiales para este ramo</p>
              </div>
            )}
          </div>
          
          <Button 
            onClick={() => setShowMaterialsDialog(false)}
            className="w-full"
          >
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}