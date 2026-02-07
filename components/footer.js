import Link from "next/link"
import { Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20 md:pb-6">
        <p className="text-sm text-gray-600">
          Unetwork es una iniciativa estudiantil independiente. No tenemos afiliación oficial con la Universidad del Desarrollo (UDD).
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/terms" className="text-sm text-blue-600 hover:text-blue-700">
              Términos y condiciones
            </Link>
            <Link href="/about" className="text-sm text-blue-600 hover:text-blue-700">
              About us
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Desarrollado por Ignacio Godoy</span>
            <Link
              href="https://www.linkedin.com/in/ignacio-godoy-77732735a/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn de Ignacio Godoy"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-blue-600 hover:text-blue-700"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
