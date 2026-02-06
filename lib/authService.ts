import { supabase } from "@/lib/supabaseClient"

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Normaliza un correo electrónico a minúsculas y sin espacios
 */
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase()
}

/**
 * Obtiene la URL pública de un avatar desde Supabase Storage
 */
export const getPublicAvatarUrl = (fileName: string): string => {
  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
  return data.publicUrl
}

// ============================================================================
// AUTH OPERATIONS
// ============================================================================

export interface SignInOptions {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignInResult {
  data: any
  error: any
}

/**
 * Inicia sesión con email y contraseña
 */
export async function signIn({ email, password, rememberMe = false }: SignInOptions): Promise<SignInResult> {
  const normalizedEmail = normalizeEmail(email)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password
  })

  return { data, error }
}

export interface SignUpOptions {
  email: string
  password: string
  nombre: string
  carrera: string
  anio: string
  descripcion?: string
  abierto?: boolean
}

/**
 * Registra un nuevo usuario en Supabase Auth
 */
export async function signUp({ email, password, nombre, carrera, anio, descripcion, abierto }: SignUpOptions) {
  const normalizedEmail = normalizeEmail(email)
  
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        nombre,
        carrera,
        anio,
        descripcion,
        abierto,
      }
    }
  })

  return { data, error }
}

/**
 * Cierra la sesión del usuario actual
 */
export async function signOut() {
  return await supabase.auth.signOut()
}

/**
 * Reenvía el correo de confirmación de registro
 */
export async function resendConfirmation(email: string) {
  const normalizedEmail = normalizeEmail(email)
  
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail
  })

  return { error }
}

/**
 * Envía un correo para restablecer la contraseña
 */
export async function resetPassword(email: string, redirectTo: string) {
  const normalizedEmail = normalizeEmail(email)
  
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo
  })

  return { error }
}

/**
 * Inicia sesión con Azure OAuth (cuenta UDD)
 */
export async function signInWithUDD() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'email openid profile',
      queryParams: {
        prompt: 'select_account',
      },
    },
  })
  
  if (error) console.error("Error login:", error)
  return { data, error }
}

// ============================================================================
// USUARIOS TABLE OPERATIONS
// ============================================================================

export interface Usuario {
  id?: string
  correo: string
  nombre: string
  carrera: string
  anio: string
  descripcion?: string
  abierto?: boolean
  avatar?: string
  university?: string
  fecha_registro?: string
}

/**
 * Obtiene un usuario por su correo electrónico
 */
export async function getUsuarioByCorreo(email: string) {
  const normalizedEmail = normalizeEmail(email)
  
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("correo", normalizedEmail)
    .single()

  return { data, error }
}

/**
 * Obtiene un usuario por su ID
 */
export async function getUsuarioById(userId: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, correo, carrera, avatar, anio, university, fecha_registro")
    .eq("id", userId)
    .single()

  return { data, error }
}

/**
 * Inserta un nuevo usuario en la tabla usuarios
 */
export async function insertUsuario(usuario: Usuario) {
  const normalizedUsuario = {
    ...usuario,
    correo: normalizeEmail(usuario.correo)
  }
  
  const { data, error } = await supabase
    .from("usuarios")
    .insert([normalizedUsuario])
    .select("*")

  return { data, error }
}

/**
 * Inserta o actualiza un usuario en la tabla usuarios (upsert)
 * Útil para usuarios de Azure que pueden no existir aún en la DB
 */
export async function upsertUsuario(usuario: Usuario) {
  const normalizedUsuario = {
    ...usuario,
    correo: normalizeEmail(usuario.correo)
  }
  
  const { data, error } = await supabase
    .from("usuarios")
    .upsert([normalizedUsuario], { onConflict: 'id' })
    .select("*")

  return { data, error }
}

// ============================================================================
// RAMOS TABLE OPERATIONS
// ============================================================================

export interface Ramo {
  id: string
  nombre: string
  semestre: number | null
  trimestre: number | null
  carrera: string
  anio?: number
}

/**
 * Obtiene semestres únicos disponibles para una carrera
 */
export async function getSemestresPorCarrera(carrera: string) {
  const { data, error } = await supabase
    .from("ramos")
    .select("semestre")
    .eq("carrera", carrera)
    .order("semestre", { ascending: true })

  if (error) {
    return { data: [], error }
  }

  // Filtrar duplicados en el cliente
  const semestresUnicos = [...new Set(data.map(item => item.semestre))]
  
  return { data: semestresUnicos, error: null }
}

/**
 * Obtiene todos los ramos de una carrera, agrupados por año
 * Los ramos semestrales se agrupan por semestre (1-2 = año 1, 3-4 = año 2, etc.)
 * Los ramos trimestrales se agrupan por trimestre (1-3 = año 1, 4-6 = año 2, etc.)
 */
export async function getRamosPorCarrera(carrera: string): Promise<{ data: Record<number, Ramo[]>, error: any }> {
  try {
    const { data, error } = await supabase
      .from("ramos")
      .select("id, nombre, semestre, trimestre, carrera")
      .eq("carrera", carrera)

    if (error) {
      console.error("Error al obtener ramos por carrera:", error)
      return { data: {}, error }
    }

    // Agrupar ramos por año calculado a partir de semestre o trimestre
    const ramosAgrupados = data.reduce((acc: Record<number, Ramo[]>, ramo: Ramo) => {
      let anio: number
      
      // Calcular año basado en semestre o trimestre
      if (ramo.semestre) {
        // Para semestrales: 1-2 = año 1, 3-4 = año 2, etc.
        anio = Math.ceil(ramo.semestre / 2)
      } else if (ramo.trimestre) {
        // Para trimestrales: 1-3 = año 1, 4-6 = año 2, etc.
        anio = Math.ceil(ramo.trimestre / 3)
      } else {
        // Si no tiene ni semestre ni trimestre, agrupar en año 0
        anio = 0
      }
      
      if (!acc[anio]) acc[anio] = []
      acc[anio].push({ ...ramo, anio })
      return acc
    }, {})

    return { data: ramosAgrupados, error: null }
  } catch (err) {
    console.error("Error inesperado al obtener ramos:", err)
    return { data: {}, error: err }
  }
}

/**
 * Obtiene los IDs de ramos a partir de sus nombres
 */
export async function getRamosIdsByNombres(nombres: string[]) {
  const { data, error } = await supabase
    .from("ramos")
    .select("id, nombre")
    .in("nombre", nombres)

  return { data, error }
}

// ============================================================================
// USUARIOS_RAMOS TABLE OPERATIONS
// ============================================================================

export interface UsuarioRamo {
  usuario_id: string
  ramo_id: string
}

/**
 * Obtiene los ramos asignados a un usuario
 */
export async function getUsuariosRamosByUsuarioId(usuarioId: string) {
  const { data, error } = await supabase
    .from("usuarios_ramos")
    .select("ramo_id")
    .eq("usuario_id", usuarioId)

  return { data, error }
}

/**
 * Inserta múltiples relaciones usuario-ramo
 */
export async function insertUsuariosRamos(records: UsuarioRamo[]) {
  const { error } = await supabase
    .from("usuarios_ramos")
    .insert(records)

  return { error }
}

// ============================================================================
// USUARIOS_INTERESES TABLE OPERATIONS
// ============================================================================

export interface UsuarioInteres {
  usuario_id: string
  interes: string
}

/**
 * Inserta múltiples intereses para un usuario
 */
export async function insertUsuariosIntereses(records: UsuarioInteres[]) {
  const { error } = await supabase
    .from("usuarios_intereses")
    .insert(records)

  return { error }
}
