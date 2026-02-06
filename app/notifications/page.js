"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, ThumbsUp, MessageCircle, Star, Download, Users, CheckCircle, Trash2, Settings } from "lucide-react"
import { Header } from "@/components/header"

// Datos simulados de notificaciones expandidos
const allNotifications = [
  {
    id: 1,
    type: "like",
    title: "Tu material recibió una valoración positiva",
    description: "Certamen 1 Optimización - 95% de valoración",
    time: "Hace 2 horas",
    date: "2024-12-30",
    icon: ThumbsUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
    read: false,
  },
  {
    id: 2,
    type: "comment",
    title: "Nuevo comentario en tu publicación",
    description: "Carlos comentó en 'Apuntes Análisis de Datos': '¡Excelente material, me ayudó mucho!'",
    time: "Hace 5 horas",
    date: "2024-12-30",
    icon: MessageCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    read: false,
  },
  {
    id: 3,
    type: "rating",
    title: "¡Excelente valoración!",
    description: "Ejercicios Gestión de Proyectos - 92% de valoración",
    time: "Hace 1 día",
    date: "2024-12-29",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    read: true,
  },
  {
    id: 4,
    type: "download",
    title: "Tu material fue descargado",
    description: "Resumen Economía ha sido descargado 25 veces esta semana",
    time: "Hace 1 día",
    date: "2024-12-29",
    icon: Download,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    read: true,
  },
  {
    id: 5,
    type: "like",
    title: "Material muy útil",
    description: "Resumen Economía recibió 15 nuevas valoraciones positivas",
    time: "Hace 2 días",
    date: "2024-12-28",
    icon: ThumbsUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
    read: true,
  },
  {
    id: 6,
    type: "milestone",
    title: "¡Felicidades! Alcanzaste 100 descargas",
    description: "Tu material ha ayudado a más de 100 estudiantes",
    time: "Hace 3 días",
    date: "2024-12-27",
    icon: Users,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    read: true,
  },
  {
    id: 7,
    type: "comment",
    title: "Nuevo comentario en tu publicación",
    description: "Ana comentó en 'Control 1 Estadística': 'Muy bien explicado, gracias!'",
    time: "Hace 4 días",
    date: "2024-12-26",
    icon: MessageCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    read: true,
  },
  {
    id: 8,
    type: "rating",
    title: "Nueva valoración recibida",
    description: "Apuntes Análisis de Datos - 88% de valoración",
    time: "Hace 5 días",
    date: "2024-12-25",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    read: true,
  },
]

function NotificationCard({ notification, onMarkAsRead, onDelete }) {
  const IconComponent = notification.icon

  return (
    <Card
      className={`transition-all hover:shadow-md ${notification.read ? "opacity-75" : "border-l-4 border-l-blue-500"}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${notification.bgColor} flex-shrink-0`}
          >
            <IconComponent className={`w-6 h-6 ${notification.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 text-sm">{notification.title}</h3>
                  {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </div>
                <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                <p className="text-xs text-gray-500">{notification.time}</p>
              </div>
              <div className="flex gap-1">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(notification.id)}
                    className="h-8 w-8 p-0"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onDelete(notification.id)} className="h-8 w-8 p-0">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(allNotifications)
  const [activeTab, setActiveTab] = useState("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "unread") return !notification.read
    if (activeTab === "read") return notification.read
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header de la página */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notificaciones</h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  {unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : "Todas las notificaciones están al día"}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead} className="bg-transparent text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar todas como leídas
                </Button>
              )}
              <Button variant="outline" onClick={clearAll} className="bg-transparent text-sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar todo
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs de filtrado */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="all" className="flex items-center gap-2 py-2 text-sm">
              Todas
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2 py-2 text-sm">
              Sin leer
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center gap-2 py-2 text-sm">
              Leídas
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                {notifications.length - unreadCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === "unread"
                      ? "No tienes notificaciones sin leer"
                      : activeTab === "read"
                        ? "No tienes notificaciones leídas"
                        : "No tienes notificaciones"}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === "unread"
                      ? "¡Genial! Estás al día con todas tus notificaciones."
                      : activeTab === "read"
                        ? "Las notificaciones que marques como leídas aparecerán aquí."
                        : "Cuando recibas notificaciones, aparecerán aquí."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Configuración de notificaciones */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-gray-600" />
              Configuración de Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Personaliza qué tipo de notificaciones quieres recibir y cómo quieres recibirlas.
            </p>
            <Button variant="outline" className="bg-transparent">
              <Settings className="w-4 h-4 mr-2" />
              Configurar notificaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
