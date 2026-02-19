"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, Settings, User, LogOut, Home, ThumbsUp, MessageCircle, Star, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUserContext } from "@/context/UserContext" // Añadir esta importación
import { supabase } from "@/lib/supabaseClient"

/*

// Datos simulados de notificaciones
const notifications = [
  {
    id: 1,
    type: "like",
    title: "Tu material recibió una valoración positiva",
    description: "Certamen 1 Optimización - 95% de valoración",
    time: "Hace 2 horas",
    icon: ThumbsUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: 2,
    type: "comment",
    title: "Nuevo comentario en tu publicación",
    description: "Carlos comentó en 'Apuntes Análisis de Datos'",
    time: "Hace 5 horas",
    icon: MessageCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: 3,
    type: "rating",
    title: "¡Excelente valoración!",
    description: "Ejercicios Gestión de Proyectos - 92% de valoración",
    time: "Hace 1 día",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    id: 4,
    type: "like",
    title: "Material muy útil",
    description: "Resumen Economía recibió 15 nuevas valoraciones positivas",
    time: "Hace 2 días",
    icon: ThumbsUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
]
*/

export function Header() {
  const router = useRouter()
  const { userData } = useUserContext() // Obtener userData del contexto
  const [logoUrl, setLogoUrl] = useState("") // Nuevo estado para almacenar la URL del logo
  //const [notificationCount] = useState(notifications.length)
  //const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Obtener la URL del logo al cargar el componente
  useEffect(() => {
    // Obtenemos la URL pública del logo desde el bucket avatars
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl('App logo unetwork.png')
    
    setLogoUrl(data.publicUrl)
  }, [])

  // Función para generar iniciales para el AvatarFallback
  const getInitials = () => {
    if (!userData?.nombre) return "UN"
    
    return userData.nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

 /* const markAllAsRead = () => {
    // Lógica para marcar todas como leídas
    console.log("Marcando todas las notificaciones como leídas")
    setIsNotificationsOpen(false)
  }

  const viewAllNotifications = () => {
    router.push("/notifications")
    setIsNotificationsOpen(false)
  }*/

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Logo reducido para móviles */}
          <div className="flex items-center gap-1 sm:gap-1.5 cursor-pointer" onClick={() => router.push("/dashboard")}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="UNetWork Logo" 
                className="w-12 h-12 sm:w-20 sm:h-20 object-contain" // Tamaño reducido en móvil
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                UN
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">UNetWork</h1>
              <p className="text-xs text-gray-500">Material Universitario</p>
            </div>
          </div>

          {/* Navegación y usuario - botones más grandes para táctil */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push("/dashboard")} 
              className="h-10 w-10 rounded-full md:hidden flex items-center justify-center"
            >
              <Home className="w-5 h-5" />
            </Button>

            {/* Botón Home con texto solo en desktop */}
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="hidden md:flex">
              <Home className="w-4 h-4 mr-2" />
              Inicio
            </Button>

            {/* Menú de usuario con área táctil más grande */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full flex items-center justify-center p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={userData?.avatar || "https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.webp"} 
                      alt={userData?.nombre || "Usuario"} 
                    />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{userData?.nombre || "Usuario"}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {userData?.correo || "usuario@example.com"}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
