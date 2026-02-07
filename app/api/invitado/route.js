import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request) {
	const requestUrl = new URL(request.url)
	const secret = requestUrl.searchParams.get("code")
	const expectedSecret = process.env.GUEST_LINK_SECRET || "demo"

	if (secret !== expectedSecret) {
		return NextResponse.redirect(`${requestUrl.origin}/login`)
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	const guestEmail = process.env.GUEST_EMAIL
	const guestPassword = process.env.GUEST_PASSWORD

	if (!supabaseUrl || !supabaseAnonKey || !guestEmail || !guestPassword) {
		console.error("Configuracion de invitado incompleta")
		return NextResponse.redirect(
			`${requestUrl.origin}/login?error=ConfigInvitado`
		)
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey)

	const { error } = await supabase.auth.signInWithPassword({
		email: guestEmail,
		password: guestPassword,
	})

	if (error) {
		console.error("Error Login Invitado:", error.message)
		return NextResponse.redirect(
			`${requestUrl.origin}/login?error=ErrorInvitado`
		)
	}

	return NextResponse.redirect(`${requestUrl.origin}/`)
}
