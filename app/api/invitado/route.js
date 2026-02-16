import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request) {
	const requestUrl = new URL(request.url)
	const debug = requestUrl.searchParams.get("debug") === "1"
	const mode = requestUrl.searchParams.get("mode")
	const secret = requestUrl.searchParams.get("code")
	const expectedSecret = process.env.GUEST_LINK_SECRET || "demo"

	if (secret !== expectedSecret) {
		if (debug || mode === "session") {
			return NextResponse.json(
				{ error: "InvalidSecret" },
				{ status: 401 }
			)
		}
		return NextResponse.redirect(`${requestUrl.origin}/login`)
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	const guestEmail = process.env.GUEST_EMAIL
	const guestPassword = process.env.GUEST_PASSWORD

	if (!supabaseUrl || !supabaseAnonKey || !guestEmail || !guestPassword) {
		console.error("Configuracion de invitado incompleta")
		if (debug || mode === "session") {
			return NextResponse.json(
				{ error: "ConfigInvitado" },
				{ status: 500 }
			)
		}
		return NextResponse.redirect(
			`${requestUrl.origin}/login?error=ConfigInvitado`
		)
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey)

	const { data, error } = await supabase.auth.signInWithPassword({
		email: guestEmail,
		password: guestPassword,
	})

	if (error) {
		console.error("Error Login Invitado:", {
			message: error.message,
			status: error.status,
			name: error.name,
		})
		if (debug || mode === "session") {
			return NextResponse.json(
				{
					error: "ErrorInvitado",
					details: {
						message: error.message,
						status: error.status,
						name: error.name,
					},
				},
				{ status: 401 }
			)
		}
		return NextResponse.redirect(
			`${requestUrl.origin}/login?error=ErrorInvitado`
		)
	}

	if (mode === "session") {
		return NextResponse.json({ session: data?.session, user: data?.user })
	}

	return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
