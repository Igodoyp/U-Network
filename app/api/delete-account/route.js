import { createClient } from '@supabase/supabase-js'

/**
 * Endpoint para eliminar la cuenta de un usuario.
 * El cascade en Supabase se encarga de borrar datos relacionados automáticamente.
 */
export async function DELETE(request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!url || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Eliminar el usuario de auth primero (el cascade en la DB se encargará de lo demás)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (error) {
      return new Response(JSON.stringify({ error: `Error al eliminar: ${error.message}` }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  catch (err) {
    return new Response(JSON.stringify({ error: `Error del servidor: ${err?.message || 'desconocido'}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}