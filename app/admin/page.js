"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { FileText, Users, BookOpen, AlertTriangle, ThumbsUp, Download, MessageSquare } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMaterials: 0,
    totalSubjects: 0,
    pendingReports: 0,
    materialsToday: 0,
    downloadsToday: 0,
    newUsersToday: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true)
      try {
        // Fecha de hoy (inicio)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = today.toISOString()

        // Total de usuarios
        const { count: userCount, error: userError } = await supabase
          .from("usuarios")
          .select("*", { count: "exact", head: true })
        
        // Total de materiales
        const { count: materialsCount, error: materialsError } = await supabase
          .from("materiales_metadata")
          .select("*", { count: "exact", head: true })
        
        // Total de ramos
        const { count: subjectsCount, error: subjectsError } = await supabase
          .from("ramos")
          .select("*", { count: "exact", head: true })
        
        // Reportes pendientes
        const { count: pendingReportsCount, error: reportsError } = await supabase
          .from("reportes")
          .select("*", { count: "exact", head: true })
          .eq("estado", "pendiente")
        
        // Materiales subidos hoy
        const { count: materialsTodayCount, error: materialsTodayError } = await supabase
          .from("materiales_metadata")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayStr)
        
        // Descargas de hoy
        const { count: downloadsTodayCount, error: downloadsTodayError } = await supabase
          .from("descargas")
          .select("*", { count: "exact", head: true })
          .gte("fecha", todayStr)
        
        // Usuarios nuevos de hoy
        const { count: newUsersTodayCount, error: newUsersTodayError } = await supabase
          .from("usuarios")
          .select("*", { count: "exact", head: true })
          .gte("fecha_registro", todayStr)
          
        setStats({
          totalUsers: userCount || 0,
          totalMaterials: materialsCount || 0,
          totalSubjects: subjectsCount || 0,
          pendingReports: pendingReportsCount || 0,
          materialsToday: materialsTodayCount || 0,
          downloadsToday: downloadsTodayCount || 0,
          newUsersToday: newUsersTodayCount || 0,
        })
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Vista General</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Usuarios"
          value={stats.totalUsers}
          icon={Users}
          color="bg-blue-500"
        />
        <StatsCard 
          title="Materiales"
          value={stats.totalMaterials}
          icon={FileText}
          color="bg-green-500"
        />
        <StatsCard 
          title="Ramos"
          value={stats.totalSubjects}
          icon={BookOpen}
          color="bg-purple-500"
        />
        <StatsCard 
          title="Reportes pendientes"
          value={stats.pendingReports}
          icon={AlertTriangle}
          color="bg-yellow-500"
          alert={stats.pendingReports > 0}
        />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-8">Actividad Hoy</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Nuevos materiales"
          value={stats.materialsToday}
          icon={FileText}
          color="bg-green-500"
        />
        <StatsCard 
          title="Descargas"
          value={stats.downloadsToday}
          icon={Download}
          color="bg-blue-500"
        />
        <StatsCard 
          title="Nuevos usuarios"
          value={stats.newUsersToday}
          icon={Users}
          color="bg-purple-500"
        />
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon: Icon, color, alert = false }) {
  return (
    <Card className={alert ? "border-l-4 border-l-yellow-500" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value.toLocaleString()}</h3>
          </div>
          <div className={`${color} p-3 rounded-full`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}