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
    // Intentar obtener el usuario asociado al token
    let user = null
    try {
      const { data, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (authError) {
        console.error('Error obteniendo usuario desde token:', authError)
      } else if (data && data.user) {
        user = data.user
      }
    } catch (e) {
      console.error('Excepción al llamar supabaseAdmin.auth.getUser:', e)
    }

    if (!user) {
      return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Borrar datos dependientes en la base de datos para evitar errores por FK
    try {
      const userId = user.id
      const dependents = [
        { table: 'vistas', col: 'usuario_id' },
        { table: 'valoraciones', col: 'usuario_id' },
        { table: 'favoritos', col: 'usuario_id' },
        { table: 'usuarios_ramos', col: 'usuario_id' },
        { table: 'material', col: 'autor_id' },
        { table: 'usuarios', col: 'id' },
      ]

      for (const dep of dependents) {
        try {
          const { error: delErr } = await supabaseAdmin.from(dep.table).delete().eq(dep.col, userId)
          if (delErr) console.warn(`No se pudo borrar dependientes en ${dep.table}:`, delErr)
          else console.log(`Borrados registros en ${dep.table} para usuario ${userId}`)
        } catch (e) {
          console.error(`Excepción borrando ${dep.table}:`, e)
        }
      }
    } catch (e) {
      console.error('Error borrando dependientes antes de eliminar usuario:', e)
    }

    // Eliminar el usuario de auth primero (el cascade en la DB se encargará de lo demás)
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (error) {
        console.error('Error al eliminar usuario (detalle):', error)
        return new Response(JSON.stringify({ error: `Error al eliminar: ${error.message}`, details: error }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } catch (e) {
      console.error('Excepción al eliminar usuario:', e)
      return new Response(JSON.stringify({ error: `Error al eliminar usuario: ${e?.message || e}` , details: e}), {
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