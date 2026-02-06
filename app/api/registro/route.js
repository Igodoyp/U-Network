import { supabase } from '@/lib/supabaseClient'

export async function POST(request) {
  const body = await request.json()
  const { nombre, correo, carrera, semestre } = body

  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nombre, correo, carrera, semestre }])

  if (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }

  return new Response(JSON.stringify({ message: 'Usuario registrado', data }), {
    status: 200,
  })
}
