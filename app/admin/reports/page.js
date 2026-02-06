// Implementar un panel de administración para gestionar reportes

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { supabase } from "@/lib/supabaseClient"
import { useUserContext } from "@/context/UserContext"
import { AlertTriangle, CheckCircle, Clock, Eye, X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminReportsPage() {
  const router = useRouter()
  const { userData } = useUserContext()
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si el usuario es administrador
    if (userData?.rol !== 'admin') {
      router.push("/dashboard")
      return
    }

    fetchReports()
  }, [userData, router])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("reportes")
        .select(`
          id,
          tipo_reporte,
          descripcion,
          estado,
          created_at,
          material_id,
          materiales_metadata:material_id (
            id,
            titulo,
            categoria,
            oculto
          ),
          usuario_id,
          usuarios:usuario_id (
            id,
            nombre,
            correo
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (err) {
      console.error("Error al cargar reportes:", err)
      alert("Error al cargar los reportes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from("reportes")
        .update({ 
          estado: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", reportId)

      if (error) throw error
      
      // Actualizar reportes localmente
      await fetchReports()
    } catch (err) {
      console.error("Error al actualizar estado:", err)
      alert("Error al actualizar el estado del reporte")
    }
  }

  const toggleMaterialVisibility = async (materialId, currentlyHidden) => {
    try {
      const { error } = await supabase
        .from("materiales_metadata")
        .update({ oculto: !currentlyHidden })
        .eq("id", materialId)

      if (error) throw error
      
      // Refrescar los reportes para ver los cambios
      await fetchReports()
      
      alert(currentlyHidden 
        ? "Material restaurado y visible para todos los usuarios" 
        : "Material ocultado correctamente")
    } catch (err) {
      console.error("Error al cambiar visibilidad:", err)
      alert("Error al actualizar la visibilidad del material")
    }
  }

  // Resto del componente con la UI para mostrar reportes
  // y acciones para gestionarlos...

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Reportes</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.length > 0 ? (
              reports.map(report => (
                <Card key={report.id} className={`border-l-4 ${
                  report.estado === "pendiente" ? "border-l-yellow-500" :
                  report.estado === "revisado" ? "border-l-green-500" :
                  "border-l-red-500"
                }`}>
                  <CardContent className="p-6">
                    {/* Contenido del reporte */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <h3 className="font-semibold text-lg">
                            {report.tipo_reporte === "contenido_inapropiado" ? "Contenido inapropiado" :
                             report.tipo_reporte === "plagio" ? "Plagio o infracción de derechos" :
                             report.tipo_reporte === "informacion_erronea" ? "Información errónea" :
                             report.tipo_reporte === "spam" ? "Spam o publicidad" :
                             report.tipo_reporte}
                          </h3>
                          <Badge variant="outline" className={
                            report.materiales_metadata?.oculto 
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }>
                            {report.materiales_metadata?.oculto ? "Material oculto" : "Material visible"}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-700 font-medium">Material reportado:</p>
                          <p className="text-sm">{report.materiales_metadata?.titulo || "Material no disponible"}</p>
                        </div>
                        
                        {report.descripcion && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-500">"{report.descripcion}"</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:items-end gap-2">
                        <Button 
                          onClick={() => window.open(`/document/${report.material_id}`, '_blank')}
                          variant="outline" 
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver material
                        </Button>
                        
                        <Button 
                          onClick={() => toggleMaterialVisibility(
                            report.material_id, 
                            report.materiales_metadata?.oculto
                          )}
                          variant={report.materiales_metadata?.oculto ? "outline" : "destructive"}
                          size="sm"
                        >
                          {report.materiales_metadata?.oculto 
                            ? "Restaurar material" 
                            : "Ocultar material"}
                        </Button>
                        
                        {report.estado === "pendiente" && (
                          <div className="flex gap-2 mt-2">
                            <Button 
                              onClick={() => handleUpdateStatus(report.id, "revisado")}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marcar revisado
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-900 mb-2">No hay reportes pendientes</h2>
                <p className="text-gray-600">Todos los reportes han sido atendidos.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}