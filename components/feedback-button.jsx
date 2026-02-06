"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useUserContext } from "@/context/UserContext"

export function FeedbackButton() {
  const { userData } = useUserContext()
  const [open, setOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState("suggestion")
  const [feedbackText, setFeedbackText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!feedbackText.trim()) return
    
    setIsSending(true)
    try {
      // Guardar en Supabase
      const { error } = await supabase.from("feedback").insert({
        tipo: feedbackType,
        mensaje: feedbackText,
        usuario_id: userData?.id || null,
        usuario_email: userData?.correo || null,
        url_pagina: window.location.pathname,
        estado: "pendiente"
      })
      
      if (error) throw error
      
      // Mostrar confirmación
      setFeedbackText("")
      setShowSuccess(true)
      
      // Cerrar automáticamente después de 3 segundos
      setTimeout(() => {
        setShowSuccess(false)
        setOpen(false)
      }, 3000)
      
    } catch (err) {
      console.error("Error al enviar feedback:", err)
      alert("No se pudo enviar tu feedback. Por favor, intenta de nuevo.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 p-0 z-40"
      >
        <MessageSquarePlus className="h-6 w-6" />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar feedback</DialogTitle>
            <DialogDescription>
              Ayúdanos a mejorar UNetwork con tus comentarios o sugerencias.
            </DialogDescription>
          </DialogHeader>
          
          {showSuccess ? (
            <div className="py-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">¡Gracias por tu feedback!</h3>
              <p className="text-sm text-gray-600">Tu opinión es muy importante para nosotros.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="font-medium">Tipo de feedback</Label>
                  <RadioGroup value={feedbackType} onValueChange={setFeedbackType}>
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="suggestion" id="suggestion" />
                      <Label htmlFor="suggestion" className="flex items-center gap-2 cursor-pointer">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <span>Sugerencia</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="bug" id="bug" />
                      <Label htmlFor="bug" className="flex items-center gap-2 cursor-pointer">
                        <Bug className="h-4 w-4 text-red-500" />
                        <span>Reportar error</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="question" id="question" />
                      <Label htmlFor="question" className="flex items-center gap-2 cursor-pointer">
                        <HelpCircle className="h-4 w-4 text-blue-500" />
                        <span>Pregunta</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="feedback" className="font-medium">Tu mensaje</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Describe tu sugerencia, error o pregunta..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>
              </div>
              
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSending || !feedbackText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Enviando...
                    </>
                  ) : "Enviar feedback"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}