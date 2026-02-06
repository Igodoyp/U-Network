import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, ThumbsUp, BookOpen, User, Calendar, Tag } from "lucide-react"

export function MaterialCard({ material, onClick }) {
  return (
    <Card
      className="w-full hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-4">
          {/* Preview más pequeño en móvil */}
          <div className="flex-shrink-0">
            <div className="w-10 h-14 sm:w-16 sm:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border">
              <FileText className="w-5 h-5 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>

          {/* Información con menos padding y márgenes */}
          <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-2">
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate pr-2">
                {material.title}
              </h3>
              {material.hasSolution && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] sm:text-xs rounded-full whitespace-nowrap flex-shrink-0">
                  Solución
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <Badge variant="secondary" className="text-xs py-0 px-1.5 h-5">
                {material.type}
              </Badge>
              <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0 rounded-full h-5">
                <ThumbsUp className="w-3 h-3 text-green-600" />
                <span className="text-[10px] sm:text-xs font-medium text-green-700">{material.rating}%</span>
              </div>
            </div>
            
            {/* Información compacta */}
            <div className="flex flex-col sm:flex-row gap-0 sm:gap-2 text-[10px] sm:text-xs text-gray-600">
              <div className="flex items-center gap-1 truncate">
                <BookOpen className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{material.subject}</span>
              </div>
              
              <div className="flex items-center gap-1 truncate">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{material.professor}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}