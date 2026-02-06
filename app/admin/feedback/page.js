"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { MessageSquare, CheckCircle, Bug, Lightbulb, HelpCircle } from "lucide-react"

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, pending, resolved

  useEffect(() => {
    fetchFeedback()
  }, [filter])

  const fetchFeedback = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("feedback")
        .select(`
          *,
          usuarios:usuario_id (
            id,
            nombre,
            correo
          )
        `)
        .order("created_at", { ascending: false })
      
      if (filter === "pending") {
        query = query.eq("estado", "pendiente")
      } else if (filter === "resolved") {
        query = query.eq("estado", "resuelto")
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setFeedback(data || [])
    } catch (err) {
      console.error("Error al cargar feedback:", err)
      alert("Error al cargar el feedback")
    } finally {
      setIsLoading(false)
    }
  }

  const updateFeedbackStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ 
          estado: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", id)
      
      if (error) throw error
      
      // Actualizar el estado local
      setFeedback(feedback.map(item => 
        item.id === id ? {...item, estado: newStatus} : item
      ))
    } catch (err) {
      console.error("Error al actualizar estado:", err)
      alert("Error al actualizar el estado del feedback")
    }
  }

  const getFeedbackTypeIcon = (type) => {
    switch(type) {
      case "suggestion":
        return <Lightbulb className="h-5 w-5 text-yellow-500" />
      case "bug":
        return <Bug className="h-5 w-5 text-red-500" />
      case "question":
        return <HelpCircle className="h-5 w-5 text-blue-500" />
      default:
        return <MessageSquare className="h-5 w-5 text-purple-500" />
    }
  }

  const getFeedbackTypeName = (type) => {
    switch(type) {
      case "suggestion": return "Sugerencia"
      case "bug": return "Error reportado"
      case "question": return "Pregunta"
      default: return "Feedback"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Feedback de Usuarios</h2>
        
        <div className="flex gap-2">
          <Button 
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
          <Button 
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pendientes
          </Button>
          <Button 
            variant={filter === "resolved" ? "default" : "outline"}
            onClick={() => setFilter("resolved")}
          >
            Resueltos
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.length > 0 ? (
            feedback.map(item => (
              <Card key={item.id} className={`border-l-4 ${
                item.estado === "pendiente" ? "border-l-yellow-500" : "border-l-green-500"
              }`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getFeedbackTypeIcon(item.tipo)}
                        <h3 className="font-semibold text-lg">
                          {getFeedbackTypeName(item.tipo)}
                        </h3>
                        <Badge variant="outline" className={
                          item.estado === "pendiente" 
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }>
                          {item.estado === "pendiente" ? "Pendiente" : "Resuelto"}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-gray-700">"{item.mensaje}"</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                        <p>De: <span className="font-medium">{item.usuarios?.nombre || item.usuario_email || "Anónimo"}</span></p>
                        <p>Fecha: <span className="font-medium">{new Date(item.created_at).toLocaleDateString("es-CL", {
                          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}</span></p>
                        <p>Página: <span className="font-medium">{item.url_pagina}</span></p>
                      </div>
                    </div>
                    
                    <div>
                      {item.estado === "pendiente" ? (
                        <Button 
                          onClick={() => updateFeedbackStatus(item.id, "resuelto")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como resuelto
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={() => updateFeedbackStatus(item.id, "pendiente")}
                        >
                          Reabrir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay feedback {filter !== "all" ? `${filter === "pending" ? "pendiente" : "resuelto"}` : ""}</h3>
              <p className="text-gray-600">Cuando los usuarios envíen feedback, aparecerá aquí.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}