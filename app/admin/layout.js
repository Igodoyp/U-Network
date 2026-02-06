"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { useRouter, usePathname } from "next/navigation"
import { useUserContext } from "@/context/UserContext"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Flag,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronDown,
  FileText,
  AlertTriangle,
} from "lucide-react"

export default function AdminLayout({ children }) {
  const router = useRouter()
  const { userData, isLoading } = useUserContext() // Asegúrate de extraer isLoading también
  const [isClient, setIsClient] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Solo verificar si no estamos cargando datos
    if (!isLoading && userData) {
      console.log("Estado del rol:", userData.rol)
      
      // Verificar si el usuario es administrador
      if (userData.rol !== 'admin') {
        router.push("/dashboard")
        return
      }
    }
  }, [userData, router, isLoading])

  // Mostrar indicador de carga mientras se verifica el estado
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (userData.rol !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Panel Admin</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Sidebar móvil como drawer */}
          <div 
            className={`fixed inset-0 z-50 lg:relative lg:z-0 transform transition-transform duration-300 ease-in-out lg:col-span-1 ${
              showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50 lg:hidden" onClick={() => setShowSidebar(false)}></div>
            <div className="relative w-3/4 sm:w-64 h-full bg-white shadow-lg overflow-y-auto lg:w-full">
              <div className="p-4 border-b lg:hidden flex justify-between items-center">
                <h2 className="font-semibold text-lg">Navegación</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <nav className="space-y-1 p-2">
                {/* Items de navegación existentes pero con padding aumentado para mejor toque */}
                <NavItem href="/admin" icon={LayoutDashboard} text="Dashboard" exact className="py-3" />
                <NavItem href="/admin/users" icon={Users} text="Usuarios" className="py-3" />
                <NavItem href="/admin/materials" icon={FileText} text="Materiales" className="py-3" />
                <NavItem href="/admin/subjects" icon={BookOpen} text="Ramos" className="py-3" />
                <NavItem href="/admin/reports" icon={AlertTriangle} text="Reportes" className="py-3" />
                <NavItem href="/admin/feedback" icon={MessageSquare} text="Feedback" className="py-3" />
                <NavItem href="/admin/settings" icon={Settings} text="Configuración" className="py-3" />
              </nav>
            </div>
          </div>
          
          {/* Contenido principal */}
          <div className="lg:col-span-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({ href, icon: Icon, text, exact = false, children, className }) {
  const router = useRouter()
  const pathname = usePathname() // Usar usePathname en lugar de router.pathname
  const [isOpen, setIsOpen] = useState(false)
  const isActive = exact 
    ? pathname === href
    : pathname.startsWith(href)
  
  return (
    <div>
      <Link href={href}>
        <div 
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            isActive 
              ? "bg-blue-50 text-blue-700" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            className
          )}
          onClick={() => children && setIsOpen(!isOpen)}
        >
          <Icon className="w-4 h-4" />
          <span className="flex-1">{text}</span>
          {children && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
        </div>
      </Link>
      
      {children && isOpen && (
        <div className="ml-6 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  )
}