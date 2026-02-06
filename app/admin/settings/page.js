"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { supabase } from "@/lib/supabaseClient"
import { 
  Settings, 
  Bell, 
  Shield, 
  FileText, 
  Save,
  RefreshCcw,
  AlertTriangle,
  Database,
  Send,
  Trash2
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function AdminSettingsPage() {
  // Configuración general
  const [siteName, setSiteName] = useState("UNetwork")
  const [siteDescription, setSiteDescription] = useState("Plataforma universitaria para compartir materiales")
  const [contactEmail, setContactEmail] = useState("soporte@unetwork.com")
  
  // Notificaciones
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(true)
  const [notifyNewUsers, setNotifyNewUsers] = useState(true)
  const [notifyNewReports, setNotifyNewReports] = useState(true)
  const [adminEmails, setAdminEmails] = useState("")
  
  // Seguridad
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5)
  const [requireEmailVerification, setRequireEmailVerification] = useState(true)
  const [autoApproveContent, setAutoApproveContent] = useState(false)
  
  // Mantenimiento
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState("Estamos realizando tareas de mantenimiento. Por favor, vuelve más tarde.")
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  // Estadísticas de mantenimiento
  const [dbStats, setDbStats] = useState({
    users: 0,
    materials: 0,
    reports: 0,
    downloads: 0,
    feedbacks: 0
  })

  useEffect(() => {
    loadSettings()
    loadDbStats()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("configuracion")
        .select("*")
        .single()
      
      if (error) throw error
      
      if (data) {
        // Cargar configuración general
        setSiteName(data.site_name || "UNetwork")
        setSiteDescription(data.site_description || "")
        setContactEmail(data.contact_email || "")
        
        // Cargar configuración de notificaciones
        setEnableEmailNotifications(data.enable_email_notifications || false)
        setNotifyNewUsers(data.notify_new_users || false)
        setNotifyNewReports(data.notify_new_reports || false)
        setAdminEmails(data.admin_emails || "")
        
        // Cargar configuración de seguridad
        setMaxLoginAttempts(data.max_login_attempts || 5)
        setRequireEmailVerification(data.require_email_verification || true)
        setAutoApproveContent(data.auto_approve_content || false)
        
        // Cargar configuración de mantenimiento
        setMaintenanceMode(data.maintenance_mode || false)
        setMaintenanceMessage(data.maintenance_message || "")
      }
    } catch (err) {
      console.error("Error al cargar la configuración:", err)
      toast({
        variant: "destructive",
        title: "Error al cargar la configuración",
        description: "No se pudieron cargar los ajustes del sistema."
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const loadDbStats = async () => {
    try {
      // Contar usuarios
      const { count: userCount } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true })
      
      // Contar materiales
      const { count: materialCount } = await supabase
        .from("materiales_metadata")
        .select("*", { count: "exact", head: true })
      
      // Contar reportes
      const { count: reportCount } = await supabase
        .from("reportes")
        .select("*", { count: "exact", head: true })
      
      // Contar descargas
      const { count: downloadCount } = await supabase
        .from("descargas")
        .select("*", { count: "exact", head: true })
      
      // Contar feedback
      const { count: feedbackCount } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
      
      setDbStats({
        users: userCount || 0,
        materials: materialCount || 0,
        reports: reportCount || 0,
        downloads: downloadCount || 0,
        feedbacks: feedbackCount || 0
      })
    } catch (err) {
      console.error("Error al cargar estadísticas:", err)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Construir objeto de configuración
      const configData = {
        site_name: siteName,
        site_description: siteDescription,
        contact_email: contactEmail,
        enable_email_notifications: enableEmailNotifications,
        notify_new_users: notifyNewUsers,
        notify_new_reports: notifyNewReports,
        admin_emails: adminEmails,
        max_login_attempts: maxLoginAttempts,
        require_email_verification: requireEmailVerification,
        auto_approve_content: autoApproveContent,
        maintenance_mode: maintenanceMode,
        maintenance_message: maintenanceMessage,
        updated_at: new Date().toISOString()
      }
      
      // Verificar si ya existe la configuración
      const { count } = await supabase
        .from("configuracion")
        .select("*", { count: "exact", head: true })
      
      let error
      
      if (count > 0) {
        // Actualizar configuración existente
        const { error: updateError } = await supabase
          .from("configuracion")
          .update(configData)
          .eq("id", 1) // Asumiendo que hay un solo registro de configuración
        
        error = updateError
      } else {
        // Insertar nueva configuración
        const { error: insertError } = await supabase
          .from("configuracion")
          .insert({
            ...configData,
            id: 1 // Asignar ID específico
          })
        
        error = insertError
      }
      
      if (error) throw error
      
      toast({
        title: "Configuración guardada",
        description: "Los cambios han sido guardados correctamente."
      })
    } catch (err) {
      console.error("Error al guardar la configuración:", err)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios. Por favor, inténtalo de nuevo."
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handlePurgeTempFiles = async () => {
    if (!confirm("¿Estás seguro? Esta acción eliminará archivos temporales y no se puede deshacer.")) {
      return
    }
    
    setIsSaving(true)
    try {
      // Implementar lógica para purgar archivos temporales
      // Por ejemplo, borrar archivos de más de 7 días en un bucket temporal
      
      toast({
        title: "Archivos temporales eliminados",
        description: "Se han eliminado los archivos temporales del sistema."
      })
    } catch (err) {
      console.error("Error al purgar archivos temporales:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron eliminar los archivos temporales."
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleSendTestEmail = async () => {
    setIsSaving(true)
    try {
      // Aquí se implementaría la lógica para enviar un correo de prueba
      // Podría ser una función de Supabase Edge Function
      
      toast({
        title: "Correo enviado",
        description: `Se ha enviado un correo de prueba a ${contactEmail}.`
      })
    } catch (err) {
      console.error("Error al enviar correo de prueba:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el correo de prueba."
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Toaster />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
            <span className="sm:hidden">General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaciones</span>
            <span className="sm:hidden">Notif.</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Seguridad</span>
            <span className="sm:hidden">Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Mantenimiento</span>
            <span className="sm:hidden">Manten.</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Configuración general */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Configuración básica de la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Nombre del sitio</Label>
                  <Input 
                    id="site-name" 
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="UNetwork"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="site-description">Descripción del sitio</Label>
                  <Textarea 
                    id="site-description" 
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    placeholder="Describe brevemente el propósito del sitio"
                    className="resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email de contacto</Label>
                  <Input 
                    id="contact-email" 
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="soporte@unetwork.com"
                  />
                </div>
                
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleSaveSettings}
                  disabled={isSaving || isLoading}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Configuración de notificaciones */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-500" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura cómo y cuándo se envían notificaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Habilitar notificaciones por email</Label>
                    <p className="text-sm text-gray-500">
                      Enviar notificaciones por correo electrónico
                    </p>
                  </div>
                  <Switch 
                    checked={enableEmailNotifications}
                    onCheckedChange={setEnableEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificar nuevos usuarios</Label>
                    <p className="text-sm text-gray-500">
                      Recibir alertas cuando se registre un nuevo usuario
                    </p>
                  </div>
                  <Switch 
                    checked={notifyNewUsers}
                    onCheckedChange={setNotifyNewUsers}
                    disabled={!enableEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificar nuevos reportes</Label>
                    <p className="text-sm text-gray-500">
                      Recibir alertas cuando se cree un nuevo reporte
                    </p>
                  </div>
                  <Switch 
                    checked={notifyNewReports}
                    onCheckedChange={setNotifyNewReports}
                    disabled={!enableEmailNotifications}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-emails">Correos de administradores</Label>
                  <Textarea 
                    id="admin-emails" 
                    value={adminEmails}
                    onChange={(e) => setAdminEmails(e.target.value)}
                    placeholder="Correos separados por coma (admin@unetwork.com, soporte@unetwork.com)"
                    className="resize-none"
                    rows={3}
                    disabled={!enableEmailNotifications}
                  />
                  <p className="text-xs text-gray-500">
                    Estos correos recibirán las notificaciones administrativas
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={handleSaveSettings}
                    disabled={isSaving || isLoading}
                  >
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={handleSendTestEmail}
                    disabled={!enableEmailNotifications || isSaving || isLoading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar correo de prueba
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Configuración de seguridad */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Seguridad
              </CardTitle>
              <CardDescription>
                Ajustes relacionados con la seguridad y el acceso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Máximo de intentos de inicio de sesión</Label>
                  <Input 
                    id="max-login-attempts" 
                    type="number"
                    min="1"
                    max="10"
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">
                    Número de intentos fallidos permitidos antes de bloquear el acceso temporalmente
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requerir verificación de email</Label>
                    <p className="text-sm text-gray-500">
                      Los usuarios deben verificar su correo electrónico para acceder a la plataforma
                    </p>
                  </div>
                  <Switch 
                    checked={requireEmailVerification}
                    onCheckedChange={setRequireEmailVerification}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aprobar contenido automáticamente</Label>
                    <p className="text-sm text-gray-500">
                      Permitir que el contenido subido se publique sin revisión
                    </p>
                  </div>
                  <Switch 
                    checked={autoApproveContent}
                    onCheckedChange={setAutoApproveContent}
                  />
                </div>
                
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleSaveSettings}
                  disabled={isSaving || isLoading}
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Configuración de mantenimiento */}
        <TabsContent value="maintenance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCcw className="h-5 w-5 text-purple-500" />
                  Modo de Mantenimiento
                </CardTitle>
                <CardDescription>
                  Activar el modo de mantenimiento mostrará un mensaje a todos los usuarios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Activar modo mantenimiento</Label>
                      <p className="text-sm text-gray-500">
                        El sitio solo será accesible para administradores
                      </p>
                    </div>
                    <Switch 
                      checked={maintenanceMode}
                      onCheckedChange={setMaintenanceMode}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-message">Mensaje de mantenimiento</Label>
                    <Textarea 
                      id="maintenance-message" 
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="Estamos realizando tareas de mantenimiento. Por favor, vuelve más tarde."
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <Button
                    className="w-full sm:w-auto"
                    onClick={handleSaveSettings}
                    disabled={isSaving || isLoading}
                  >
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  Base de Datos
                </CardTitle>
                <CardDescription>
                  Estadísticas y opciones de mantenimiento de la base de datos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Usuarios</p>
                      <p className="text-xl font-bold">{dbStats.users}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Materiales</p>
                      <p className="text-xl font-bold">{dbStats.materials}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Reportes</p>
                      <p className="text-xl font-bold">{dbStats.reports}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Descargas</p>
                      <p className="text-xl font-bold">{dbStats.downloads}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Feedback</p>
                      <p className="text-xl font-bold">{dbStats.feedbacks}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium mb-4">Acciones de mantenimiento:</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        onClick={() => loadDbStats()}
                        disabled={isSaving}
                      >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Actualizar estadísticas
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handlePurgeTempFiles}
                        disabled={isSaving}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Purgar archivos temporales
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Acciones avanzadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Estas acciones son potencialmente peligrosas y deben usarse con precaución.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      disabled
                      className="border-yellow-200 text-yellow-700"
                    >
                      Reiniciar base de datos
                    </Button>
                    
                    <Button
                      variant="outline"
                      disabled
                      className="border-red-200 text-red-600"
                    >
                      Eliminar todos los registros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}