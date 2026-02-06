"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      try {
        // Obtener sesión actual
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Si hay sesión, obtener datos completos por ID
          const { data, error } = await supabase
            .from("usuarios")
            .select("id, nombre, correo, carrera, avatar, anio, university, fecha_registro, rol")
            .eq("id", session.user.id)
            .single()

          if (error) {
            // Si el error es porque no existe el usuario, es normal en nuevos usuarios de Azure
            // El error code PGRST116 significa "no rows found"
            if (error.code === 'PGRST116' || error.code === 'PGRST100') {
              // Usuario autenticado pero no existe en la tabla usuarios aún
              // Esto es normal para usuarios nuevos de Azure - el page.tsx lo manejará
              setUserData(null)
            } else {
              console.error("Error al obtener datos del usuario:", error)
              setUserData(null)
            }
          } else if (data) {
            setUserData(data)
          }
        } else {
          setUserData(null)
        }
      } catch (err) {
        console.error("Error inesperado:", err)
        setUserData(null)
      } finally {
        setIsLoading(false)
      }
    }

    // Escuchar cambios en autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserData()
      } else {
        setUserData(null) // Usuario desconectado
      }
    })

    fetchUserData()
    return () => subscription.unsubscribe()
  }, [])

  const clearUserData = () => {
    setUserData(null)
  }

  return (
    <UserContext.Provider value={{ userData, setUserData, clearUserData, isLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUserContext debe ser usado dentro de UserProvider")
  }
  return context
}