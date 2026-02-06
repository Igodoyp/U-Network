"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Share2,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  User,
  Calendar,
  Tag,
  Star,
  MessageCircle,
  Eye,
  FileText,
  ZoomIn,
  ZoomOut,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { Header } from "@/components/header"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useUserContext } from "@/context/UserContext"
// Importar los componentes de vista previa
import DocumentPreview from "./components/DocumentPreview"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Función para convertir el año a formato ordinal
const getOrdinalYear = (year) => {
  const yearNum = parseInt(year)
  switch(yearNum) {
    case 1: return "1ero"
    case 2: return "2do"
    case 3: return "3ero"
    case 4: return "4to"
    case 5: return "5to"
    case 6: return "6to"
    default: return `Año ${year}`
  }
}

export default function DocumentPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useUserContext()
  const documentId = params?.id
  const [isSaved, setIsSaved] = useState(false)
  const [userRating, setUserRating] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRatingLoading, setIsRatingLoading] = useState(false)
  const [document, setDocument] = useState(null)
  const [author, setAuthor] = useState(null)
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [zoom, setZoom] = useState(100)

  // Estados para el reporte
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Cargar datos del documento
  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) return;

      setIsLoading(true);
      try {
        // 1. Obtener los datos del documento
        const { data: docData, error: docError } = await supabase
          .from("materiales_metadata")
          .select(`
            *,
            ramos:ramo_id (
              id,
              nombre,
              semestre,
              trimestre,
              carrera
            ),
            profesores:profesor_id (
              id,
              nombre
            )
          `)
          .eq("id", documentId)
          .single();

        if (docError) {
          console.error("Error al cargar el documento:", docError);
          setError("No se pudo cargar el documento");
          return;
        }

        if (!docData) {
          setError("Documento no encontrado");
          return;
        }

        // Verificar si el documento está public
        if (docData.status !== "public") {
          // Si es administrador, mostrar alerta pero permitir ver
          if (userData?.rol === 'admin') {
            alert("Este material no está disponible públicamente. Solo visible para administradores.");
          } else {
            // Si no es admin, redirigir al dashboard
            setError("Este contenido no está disponible actualmente.");
            return;
          }
        }

        // Verificar si el documento está oculto
        if (docData.oculto) {
          // Si es administrador, mostrar alerta pero permitir ver
          if (userData?.rol === 'admin') {
            alert("Este material está oculto debido a reportes de la comunidad. Solo visible para administradores.");
          } else {
            // Si no es admin, redirigir al dashboard
            setError("Este contenido no está disponible actualmente porque ha sido reportado por la comunidad.");
            return;
          }
        }
        
        // Manejo de vistas - reemplazar código existente
        if (docData) {
          // Verificar si el usuario está autenticado para registrar la vista
          let incrementView = true;
          
          if (userData?.id) {
            // Verificar si el usuario ya ha visto este material
            const { data: existingView, error: viewError } = await supabase
              .from("vistas")
              .select("id")
              .eq("material_id", documentId)
              .eq("usuario_id", userData.id)
              .single();
              
            if (!viewError && existingView) {
              // El usuario ya ha visto este material
              incrementView = false;
              console.log("Vista ya registrada para este usuario");
            } else {
              // Registrar la vista en la tabla vistas
              await supabase.from("vistas").insert({
                material_id: documentId,
                usuario_id: userData.id,
                fecha: new Date().toISOString()
              });
            }
          }
          
          // Solo incrementar el contador si es necesario (primera vista o usuario no autenticado)
          if (incrementView) {
            const { error: updateError } = await supabase
              .from("materiales_metadata")
              .update({ vistas: (docData.vistas || 0) + 1 })
              .eq("id", documentId);
            
            if (updateError) {
              console.error("Error al actualizar contador de vistas:", updateError);
            } else {
              // Actualizar el valor de vistas localmente
              docData.vistas = (docData.vistas || 0) + 1;
              console.log("Contador de vistas incrementado a:", docData.vistas);
            }
          }
        }

        // Generar URL de vista previa
        if (docData.file_url) {
          const { data } = supabase.storage
            .from("materiales")
            .getPublicUrl(docData.file_url)
          
          setPreviewUrl(data?.publicUrl)
          console.log("URL de vista previa generada:", data?.publicUrl)
        }

        // 2. Obtener datos del autor
        const { data: authorData, error: userError } = await supabase
          .from("usuarios")
          .select("id, nombre, carrera, anio, fecha_registro, avatar")
          .eq("id", docData.autor_id)
          .single()

        if (userError && userError.code !== 'PGRST116') {
          console.error("Error al cargar información del autor:", userError)
        }

        // 3. Verificar si el usuario actual ha valorado este documento
        if (userData?.id) {
          const { data: ratingData, error: ratingError } = await supabase
            .from("valoraciones")
            .select("es_positiva")
            .eq("material_id", documentId)
            .eq("usuario_id", userData.id)
            .single()

          if (!ratingError && ratingData) {
            setUserRating(ratingData.es_positiva ? "up" : "down")
          }
        }
        {/*
        // 4. Verificar si el usuario ha guardado este documento
        if (userData?.id) {
          const { data: savedData } = await supabase
            .from("favoritos")
            .select("id")
            .eq("material_id", documentId)
            .eq("usuario_id", userData.id)
            .single()

          setIsSaved(!!savedData)
        }
          */}

        // 5. Procesar los datos del documento
        const calculatedRating = docData.val_positivas + docData.val_negativas > 0
          ? Math.round((docData.val_positivas / (docData.val_positivas + docData.val_negativas)) * 100)
          : 0

  

        // 7. Crear el objeto de documento procesado
        const processedDoc = {
          ...docData,
          rating: calculatedRating,
          date: new Date(docData.created_at).toLocaleDateString("es-CL"),
          // Usar el nombre del ramo desde la relación
          ramo: docData.ramos ? docData.ramos.nombre : "No especificado",
          // Usar el nombre del profesor desde la relación
          profesor: docData.profesores ? docData.profesores.nombre : "No especificado",
          uploader: authorData || {
            name: "Usuario",
            avatar: null,
            career: "No disponible",
            semester: "No disponible",
            rating: 0,
            uploads: 0,
            joinDate: "No disponible"
          }
        }

        setDocument(processedDoc)

        // 8. Preparar datos del autor para mostrar estadísticas
        if (authorData) {
          // Contar publicaciones del autor
          const { count: uploadsCount } = await supabase
            .from("materiales_metadata")
            .select("id", { count: "exact" })
            .eq("autor_id", authorData.id)

          // Calcular rating promedio del autor
          const { data: ratings } = await supabase
            .from("materiales_metadata")
            .select("val_positivas, val_negativas")
            .eq("autor_id", authorData.id)

          let authorRating = 0
          if (ratings && ratings.length > 0) {
            const totalPos = ratings.reduce((sum, item) => sum + (item.val_positivas || 0), 0)
            const totalNeg = ratings.reduce((sum, item) => sum + (item.val_negativas || 0), 0)
            authorRating = totalPos + totalNeg > 0 
              ? Number((totalPos / (totalPos + totalNeg) * 5).toFixed(1))
              : 0
          }

          setAuthor({
            ...authorData,
            name: authorData.nombre,
            career: authorData.carrera,
            semester: `${authorData.anio || "No disponible"}`,
            rating: authorRating,
            uploads: uploadsCount || 0,
            joinDate: new Date(authorData.fecha_registro).toLocaleDateString("es-CL", {
              year: "numeric",
              month: "long"
            })
          })
        }

      } catch (err) {
        console.error("Error inesperado:", err)
        setError("Ocurrió un error inesperado")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [documentId, userData?.id])

  const handleDownload = async () => {
    if (!document?.file_url) {
      alert("No hay archivo disponible para descargar")
      return
    }

    setIsDownloading(true)
    try {
      // Obtener URL pública para descargar
      const { data } = supabase.storage
        .from("materiales")
        .getPublicUrl(document.file_url)

      if (!data?.publicUrl) {
        alert("No se pudo generar el enlace de descarga")
        return
      }

      // Verificar si el usuario está autenticado
      let incrementDownload = true
      if (userData?.id) {
        // Verificar si el usuario ya descargó este material
        const { data: existingDownload, error: checkError } = await supabase
          .from("descargas")
          .select("id")
          .eq("material_id", documentId)
          .eq("usuario_id", userData.id)
          .single()

        if (!checkError && existingDownload) {
          // El usuario ya ha descargado este archivo, no incrementar contador
          incrementDownload = false
          console.log("Usuario ya descargó este archivo anteriormente")
        }
      }

      // Iniciar descarga del archivo
      fetch(data.publicUrl)
        .then(response => response.blob())
        .then(blob => {
          const fileName = document.file_url.split('/').pop() || `${document.titulo}.pdf`
          
          // Crear objeto URL para el blob
          const blobUrl = window.URL.createObjectURL(blob)
          
          // Crear elemento <a> para forzar la descarga
          const link = window.document.createElement('a')
          link.href = blobUrl
          link.download = fileName
          
          // Añadir a DOM, hacer clic y luego eliminar
          window.document.body.appendChild(link)
          link.click()
          window.document.body.removeChild(link)
          
          // Liberar el objeto URL
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl)
          }, 100)
        })
    
    // Solo incrementar contador de descargas si es la primera vez
    if (incrementDownload) {
      try {
        // Registrar la descarga en la tabla descargas
        if (userData?.id) {
          const { error: insertError } = await supabase.from("descargas").insert({
            material_id: documentId,
            usuario_id: userData.id,
            fecha: new Date().toISOString()
          });
          
          if (insertError) {
            console.error("Error al registrar la descarga:", insertError);
            // Continuar con el incremento del contador aunque falle el registro
          }
        }
        
        // Obtener el valor actual del contador
        const { data: currentData, error: fetchError } = await supabase
          .from("materiales_metadata")
          .select("descargas")
          .eq("id", documentId)
          .single();
        
        if (fetchError) {
          console.error("Error al obtener contador actual:", fetchError);
          return;
        }
        
        // Incrementar contador en materiales_metadata
        const currentCount = currentData.descargas || 0;
        const newCount = currentCount + 1;
        
        console.log("Actualizando contador de", currentCount, "a", newCount);
        
        const { error: updateError } = await supabase
          .from("materiales_metadata")
          .update({ descargas: newCount })
          .eq("id", documentId);
        
        if (updateError) {
          console.error("Error al actualizar contador de descargas:", updateError);
          return;
        }
        
        console.log("Contador actualizado correctamente a:", newCount);
        
        // Actualizar el estado local
        setDocument({
          ...document,
          descargas: newCount
        });
      } catch (err) {
        console.error("Error durante el proceso de actualización de descargas:", err);
      }
    }

    // Refrescar los datos después de la descarga
    await refreshDocumentData()
  } catch (err) {
    console.error("Error al descargar:", err)
    alert("Error al descargar el archivo")
  } finally {
    setIsDownloading(false)
  }
}

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document?.titulo || "Material compartido",
        text: `Revisa este material: ${document?.titulo || ""}`,
        url: window.location.href,
      })
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href)
      alert("Enlace copiado al portapapeles")
    }
  }

  
  const handleSave = async () => {
    if (!userData?.id) {
    alert("Debes iniciar sesión para guardar materiales")
    return
    }
    
  }

  const handleRating = async (rating) => {
    if (!userData?.id) {
      alert("Debes iniciar sesión para valorar materiales")
      return
    }

    // Si ya tiene esta valoración, la quitamos
    if (userRating === rating) {
      setUserRating(null)
      setIsRatingLoading(true)

      try {
        // 1. Eliminar la valoración existente
        const { error: deleteError } = await supabase
          .from("valoraciones")
          .delete()
          .eq("material_id", documentId)
          .eq("usuario_id", userData.id)
      
        if (deleteError) {
          console.error("Error al eliminar valoración:", deleteError)
          alert("No se pudo actualizar tu valoración")
          return
        }

        // 2. Actualizar contador en la tabla materiales_metadata
        const field = rating === "up" ? "val_positivas" : "val_negativas"
        const { error: updateError } = await supabase
          .from("materiales_metadata")
          .update({ [field]: Math.max(0, document[field] - 1) })
          .eq("id", documentId)
      
        if (updateError) {
          console.error("Error al actualizar contadores:", updateError)
          alert("No se pudo actualizar la valoración del documento")
          return
        }

        // Actualizar el estado local
        setDocument({
          ...document,
          [field]: Math.max(0, document[field] - 1),
          rating: recalculateRating(
            field === "val_positivas" ? document.val_positivas - 1 : document.val_positivas,
            field === "val_negativas" ? document.val_negativas - 1 : document.val_negativas
          )
        })
      } catch (err) {
        console.error("Error al eliminar valoración:", err)
        alert("No se pudo actualizar tu valoración")
        setUserRating(rating) // Restaurar estado
      } finally {
        setIsRatingLoading(false)
      }
      return
    }

    // Si tiene la valoración contraria o no tiene valoración, actualizamos
    setIsRatingLoading(true)
    const isPositive = rating === "up"

    try {
      // Verificar si ya existe una valoración
      const { data: existingRating, error: checkError } = await supabase
        .from("valoraciones")
        .select("id, es_positiva")
        .eq("material_id", documentId)
        .eq("usuario_id", userData.id)
        .single()
    
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 es "no se encontró ningún registro"
        console.error("Error al verificar valoración existente:", checkError)
        alert("Error al actualizar valoración")
        return
      }

      if (existingRating) {
        // Actualizar valoración existente
        const { error: updateError } = await supabase
          .from("valoraciones")
          .update({ es_positiva: isPositive })
          .eq("id", existingRating.id)
      
        if (updateError) {
          console.error("Error al actualizar valoración:", updateError)
          alert("No se pudo actualizar tu valoración")
          return
        }

        // Si estamos cambiando de negativa a positiva o viceversa
        if (existingRating.es_positiva !== isPositive) {
          // Actualizar contadores: restar uno del anterior y sumar uno al nuevo
          let updatedDoc = { ...document }
          if (isPositive) {
            // De negativa a positiva
            updatedDoc.val_negativas = Math.max(0, document.val_negativas - 1)
            updatedDoc.val_positivas = (document.val_positivas || 0) + 1
          } else {
            // De positiva a negativa
            updatedDoc.val_positivas = Math.max(0, document.val_positivas - 1)
            updatedDoc.val_negativas = (document.val_negativas || 0) + 1
          }

          const { error: updateMetaError } = await supabase
            .from("materiales_metadata")
            .update({
              val_positivas: updatedDoc.val_positivas,
              val_negativas: updatedDoc.val_negativas
            })
            .eq("id", documentId)
        
          if (updateMetaError) {
            console.error("Error al actualizar valoraciones:", updateMetaError)
            alert("Error al actualizar valoraciones del documento")
            return
          }

          // Actualizar estado local
          updatedDoc.rating = recalculateRating(updatedDoc.val_positivas, updatedDoc.val_negativas)
          setDocument(updatedDoc)
        }
      } else {
        // Crear nueva valoración
        const { error: insertError } = await supabase
          .from("valoraciones")
          .insert({
            material_id: documentId,
            usuario_id: userData.id,
            es_positiva: isPositive,
            fecha: new Date().toISOString()
          })
      
        if (insertError) {
          console.error("Error al crear valoración:", insertError)
          alert("No se pudo registrar tu valoración")
          return
        }

        // Incrementar el contador correspondiente
        const field = isPositive ? "val_positivas" : "val_negativas"
        const { error: updateError } = await supabase
          .from("materiales_metadata")
          .update({ [field]: (document[field] || 0) + 1 })
          .eq("id", documentId)
      
        if (updateError) {
          console.error("Error al actualizar contador:", updateError)
          alert("Error al actualizar valoración del documento")
          return
        }

        // Actualizar estado local
        const updatedDoc = { ...document, [field]: (document[field] || 0) + 1 }
        updatedDoc.rating = recalculateRating(updatedDoc.val_positivas, updatedDoc.val_negativas)
        setDocument(updatedDoc)
      }

      setUserRating(rating)
    } catch (err) {
      console.error("Error al valorar:", err)
      alert("No se pudo registrar tu valoración")
    } finally {
      setIsRatingLoading(false)
      await refreshDocumentData()
    }
  }

  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 10, 50))
  }

  // Función auxiliar para recalcular rating
  const recalculateRating = (positives, negatives) => {
    return positives + negatives > 0
      ? Math.round((positives / (positives + negatives)) * 100)
      : 0
  }

  const refreshDocumentData = async () => {
    try {
      const { data: refreshedData, error } = await supabase
        .from("materiales_metadata")
        .select("*")
        .eq("id", documentId)
        .single()
        
      if (error) {
        console.error("Error al refrescar datos:", error)
        return false
      }
      
      if (refreshedData) {
        const calculatedRating = refreshedData.val_positivas + refreshedData.val_negativas > 0
          ? Math.round((refreshedData.val_positivas / (refreshedData.val_positivas + refreshedData.val_negativas)) * 100)
          : 0
        
        // Actualizar solo los campos de conteo manteniendo el resto de datos
        setDocument({
          ...document,
          descargas: refreshedData.descargas || 0,
          vistas: refreshedData.vistas || 0,
          val_positivas: refreshedData.val_positivas || 0,
          val_negativas: refreshedData.val_negativas || 0,
          rating: calculatedRating
        })
        
        return true
      }
    } catch (err) {
      console.error("Error al refrescar datos del documento:", err)
      return false
    }
    
    return false
  }

  // Función para manejar el envío del reporte
  const handleReportSubmit = async () => {
    if (!userData?.id) {
      alert("Debes iniciar sesión para reportar contenido");
      return;
    }
    if (!reportType) {
      alert("Por favor, selecciona un motivo para el reporte");
      return;
    }
    setIsSubmittingReport(true);
    try {
      // 1. Verificar si el usuario ya reportó este material
      const { data: existingReport, error: checkError } = await supabase
        .from("reportes")
        .select("id")
        .eq("material_id", documentId)
        .eq("usuario_id", userData.id)
        .single();
      if (!checkError && existingReport) {
        alert("Ya has reportado este material anteriormente. Tu reporte está siendo revisado.");
        setReportDialogOpen(false);
        setIsSubmittingReport(false);
        return;
      }
      // 2. Insertar el nuevo reporte
      const { error } = await supabase
        .from("reportes")
        .insert({
          material_id: documentId,
          usuario_id: userData.id,
          tipo_reporte: reportType,
          descripcion: reportDescription,
          estado: "pendiente"
        });
      if (error) throw error;
      // 3. Cambiar el status de la publicación a 'review'
      const { error: statusError } = await supabase
        .from("materiales_metadata")
        .update({ status: "review" })
        .eq("id", documentId);
      if (statusError) {
        console.error("Error al actualizar status de la publicación:", statusError);
      }
      // 4. Verificar el número de reportes para este material
      const { count, error: countError } = await supabase
        .from("reportes")
        .select("*", { count: "exact", head: true })
        .eq("material_id", documentId);
      if (!countError && count >= 5) {
        // Si hay 5 o más reportes, ocultar automáticamente el material
        const { error: updateError } = await supabase
          .from("materiales_metadata")
          .update({ oculto: true })
          .eq("id", documentId);
        if (updateError) {
          console.error("Error al ocultar material:", updateError);
        } else {
          console.log("Material ocultado automáticamente por múltiples reportes");
          setTimeout(() => {
            alert("Este material ha sido ocultado automáticamente debido a múltiples reportes de la comunidad.");
            router.push("/dashboard");
          }, 1500);
        }
      }
      setReportDialogOpen(false);
      setReportType("");
      setReportDescription("");
      alert("Reporte enviado correctamente. Este material ha sido ocultado y será revisado por nuestro equipo.");
      // Redirigir al dashboard después de 1.5 segundos
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Error al enviar reporte:", err);
      alert("No se pudo enviar el reporte. Intenta de nuevo más tarde.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto px-4 py-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Cargando documento...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Documento no encontrado</h1>
            <p className="text-gray-600 mb-8">{error || "El documento que buscas no existe o ha sido eliminado."}</p>
            <Button onClick={() => router.push('/dashboard')} className="bg-blue-600">
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Información del documento */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Título y tipo */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-gray-900">{document.titulo}</h1>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-500" />
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                      {document.categoria}
                    </Badge>
                    {document.solucion && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Con solución
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={handleDownload} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Descargando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                  
                  {/* Botón de reporte */}
                  <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Reportar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reportar contenido</DialogTitle>
                        <DialogDescription>
                          Ayúdanos a mantener nuestra plataforma segura reportando contenido inapropiado o que viole las normas.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="report-reason" className="font-medium">Motivo del reporte</Label>
                          <RadioGroup value={reportType} onValueChange={setReportType}>
                            <div className="flex items-start space-x-2 py-2">
                              <RadioGroupItem value="contenido_inapropiado" id="r1" />
                              <Label htmlFor="r1" className="font-normal cursor-pointer">
                                <span className="font-medium">Contenido inapropiado</span>
                                <p className="text-xs text-gray-500">Material ofensivo, obsceno o que no cumple con las normas éticas.</p>
                              </Label>
                            </div>
                            <div className="flex items-start space-x-2 py-2">
                              <RadioGroupItem value="plagio" id="r2" />
                              <Label htmlFor="r2" className="font-normal cursor-pointer">
                                <span className="font-medium">Plagio o infracción de derechos</span>
                                <p className="text-xs text-gray-500">Material que infringe derechos de autor o está copiado sin atribución.</p>
                              </Label>
                            </div>
                            <div className="flex items-start space-x-2 py-2">
                              <RadioGroupItem value="informacion_erronea" id="r3" />
                              <Label htmlFor="r3" className="font-normal cursor-pointer">
                                <span className="font-medium">Información errónea</span>
                                <p className="text-xs text-gray-500">Material con errores significativos que podrían confundir a otros estudiantes.</p>
                              </Label>
                            </div>
                            <div className="flex items-start space-x-2 py-2">
                              <RadioGroupItem value="spam" id="r4" />
                              <Label htmlFor="r4" className="font-normal cursor-pointer">
                                <span className="font-medium">Spam o publicidad</span>
                                <p className="text-xs text-gray-500">Contenido no educativo o publicitario.</p>
                              </Label>
                            </div>
                            <div className="flex items-start space-x-2 py-2">
                              <RadioGroupItem value="otro" id="r5" />
                              <Label htmlFor="r5" className="font-normal cursor-pointer">
                                <span className="font-medium">Otro</span>
                                <p className="text-xs text-gray-500">Otra razón no listada aquí.</p>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="report-description" className="font-medium">Descripción (opcional)</Label>
                          <Textarea 
                            id="report-description"
                            placeholder="Proporciona más detalles sobre el problema..."
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                      </div>

                      <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setReportDialogOpen(false)}
                          className="w-full sm:w-auto"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleReportSubmit}
                          disabled={isSubmittingReport || !reportType}
                          className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                        >
                          {isSubmittingReport ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Enviando...
                            </>
                          ) : (
                            <>Enviar reporte</>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Información del material */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {document.ramo} - {document.carrera}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{document.profesor || "No especificado"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{document.semestre || "No especificado"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>{document.vistas || 0} vistas</span>
                </div>
              </div>

              {/* Valoración y estadísticas */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{document.rating}%</span>
                  </div>
                  <span className="text-sm text-gray-500">{document.descargas || 0} descargas</span>
                </div>

                {/* Botones de valoración */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating("up")}
                    className={userRating === "up" ? "bg-green-50 border-green-300 text-green-700" : ""}
                    disabled={isRatingLoading}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating("down")}
                    className={userRating === "down" ? "bg-red-50 border-red-300 text-red-700" : ""}
                    disabled={isRatingLoading}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Descripción */}
              {document.descripcion && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium text-gray-900 mb-2">Descripción</h3>
                  <p className="text-gray-600 text-sm">{document.descripcion}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vista previa del documento - NUEVA IMPLEMENTACIÓN */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Vista previa</h2>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">{zoom}%</span>
                    <Button variant="outline" size="sm" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Contenedor de vista previa con altura dinámica */}
                <div className="bg-gray-100 rounded-lg p-4 min-h-[600px] overflow-auto">
                  {document && previewUrl ? (
                    <div style={{ zoom: `${zoom}%` }}>
                      <DocumentPreview 
                        document={{ 
                          ...document, 
                          fileUrl: previewUrl 
                        }} 
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <div className="w-32 h-40 bg-white rounded-lg shadow-md mx-auto flex items-center justify-center border">
                          <div className="text-center">
                            <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded mx-auto mb-2 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Vista previa no disponible</p>
                          <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
                            {isDownloading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                                Descargando...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Descargar para ver completo
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Perfil del usuario - se mantiene igual */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Subido por</h2>

                <div className="space-y-4">
                  {/* Avatar y nombre */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={author?.avatar || undefined} />
                      <AvatarFallback>
                        {author?.name
                          ? author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{author?.name || "Usuario"}</h3>
                      <p className="text-sm text-gray-600">{author?.career || "No disponible"}</p>
                    </div>
                  </div>

                  {/* Información del usuario */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Año:</span>
                      <span className="font-medium">{author?.semester ? getOrdinalYear(author.semester) : (author?.anio ? getOrdinalYear(author.anio) : "No disponible")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valoración:</span>
                      <div className="flex items-center gap-1">
                        <Star className={`w-4 h-4 ${author?.rating > 0 ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
                        <span className="font-medium">{author?.rating || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material subido:</span>
                      <span className="font-medium">{author?.uploads || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Miembro desde:</span>
                      <span className="font-medium">{author?.joinDate || "No disponible"}</span>
                    </div>
                  </div>
                  {/*
                  Botones de acción
                  <div className="space-y-2 pt-4 border-t">
                    <Button variant="outline" className="w-full bg-transparent">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enviar mensaje
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent"
                      onClick={() => router.push(`/profile/${author?.id || ""}`)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Ver perfil completo
                    </Button>
                  </div>
                  */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
