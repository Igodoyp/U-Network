"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, Search, Upload, User, Users } from "lucide-react" // Reemplazamos Settings por Users
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()

  // Reemplazamos "Config" por "Conectar"
  const navItems = [
    { icon: Home, label: "Inicio", path: "/dashboard", id: "home" },
    { icon: Search, label: "Buscar", path: "/search", id: "search" },
    { icon: Upload, label: "Subir", path: "/upload", id: "upload" },
    { icon: Users, label: "Conectar", path: "/conectar", id: "conectar" }, // Nuevo ítem de Conectar
    { icon: User, label: "Perfil", path: "/profile", id: "profile" }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path || 
                          (item.hash && pathname === item.path.split('#')[0])
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center h-full w-full rounded-none",
                isActive ? "text-blue-600" : "text-gray-500"
              )}
              onClick={() => router.push(item.hash ? `${item.path}${item.hash}` : item.path)}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}