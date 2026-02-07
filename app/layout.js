import "./globals.css"
import { UserProvider } from "@/context/UserContext"
import { FeedbackButton } from "@/components/feedback-button"
import { ConditionalHeader } from "@/components/conditional-header"
import { Footer } from "@/components/footer"
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        {/* Agregar Inter font desde Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans">
        <UserProvider>
          <ConditionalHeader />
          <main className="pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <FeedbackButton />
        </UserProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: "UNetWork - Plataforma Universitaria",
  description: "Tu plataforma de material universitario",
}