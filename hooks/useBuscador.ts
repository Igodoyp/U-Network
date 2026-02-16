"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export interface Material {
  id: string
  titulo: string
  categoria: string | null
  carrera: string | null
  semestre: string | null
  nombre_ramo: string | null
  nombre_profesor: string | null
  created_at: string
  score: number | null
  descargas: number | null
  [key: string]: unknown
}

export type BuscarMaterialesArgs = {
  busqueda: string
  limite?: number
  [key: string]: unknown
}

export type UseBuscadorOptions = {
  initialQuery?: string
  debounceMs?: number
  limit?: number
  rpcName?: string
  rpcArgs?: Omit<BuscarMaterialesArgs, "busqueda" | "limite">
}

export function useBuscador(options: UseBuscadorOptions = {}) {
  const {
    initialQuery = "",
    debounceMs = 500,
    limit = 20,
    rpcName = "buscar_materiales",
    rpcArgs = {},
  } = options

  const [query, setQuery] = useState(initialQuery)
  const [resultados, setResultados] = useState<Material[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const normalizedQuery = useMemo(() => query.trim(), [query])
  const rpcArgsKey = useMemo(() => JSON.stringify(rpcArgs ?? {}), [rpcArgs])

  useEffect(() => {
    if (!normalizedQuery) {
      setResultados([])
      setCargando(false)
      setError(null)
      return
    }

    // Mark as loading immediately so callers can avoid using stale results
    // while the debounce window is still pending.
    setCargando(true)

    const timer = setTimeout(async () => {
      setError(null)

      try {
        const args: BuscarMaterialesArgs = {
          ...rpcArgs,
          busqueda: normalizedQuery,
          limite: limit,
        }

        const { data, error: rpcError } = await supabase.rpc(rpcName, args)
        if (rpcError) throw rpcError

        setResultados((data ?? []) as Material[])
      } catch (err) {
        console.error("Error en búsqueda:", err)
        setError(err)
        setResultados([])
      } finally {
        setCargando(false)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [debounceMs, limit, normalizedQuery, rpcArgsKey, rpcName])

  return { query, setQuery, resultados, cargando, error }
}
