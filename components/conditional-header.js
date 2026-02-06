"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"

export function ConditionalHeader() {
  const pathname = usePathname()
  const isHomePage = pathname === "/" || pathname === "/app"
  const isAuthPage = pathname?.startsWith("/auth")
  
  if (isHomePage || isAuthPage) {
    return null // No renderiza nada en la página principal o rutas de auth
  }
  
  return (
    <>
      <Header />
      <MobileNav />
    </>
  )
}