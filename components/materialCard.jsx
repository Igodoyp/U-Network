import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Tag, ThumbsUp, BookOpen, User, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";


const MaterialCard = ({ material, showRecommendedTag = false }) => {
    const router = useRouter()

    return (
        <Card
            className="glossy-material-card w-full cursor-pointer border-0"
            style={{
                background: "rgba(255, 255, 255, 0.28)",
                backdropFilter: "blur(16px) saturate(185%)",
                WebkitBackdropFilter: "blur(16px) saturate(185%)",
            }}
            onClick={() => router.push(`/document/${material.id}`)}
        >
            <CardContent className="glossy-material-card-content p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                    {/* Preview del documento */}
                    <div className="flex-shrink-0">
                        <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border">
                            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                        </div>
                    </div>

                    {/* Información del material */}
                    <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                        {/* Título y tipo */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                    {material.title}
                                </h3>
                                <div className="flex items-center gap-1">
                                    {material.isUserSubject && showRecommendedTag && (
                                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full whitespace-nowrap">
                                            Para tu ramo
                                        </span>
                                    )}
                                    {material.hasSolution && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">
                                          Con solución
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3 text-purple-500" />
                                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                    {material.type}
                                </span>
                            </div>
                        </div>

                        {/* Valoración */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                                <ThumbsUp className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-medium text-green-700">
                                    {material.rating}%
                                </span>
                            </div>
                        </div>

                        {/* Ramo y carrera */}
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                            <BookOpen className="w-3 h-3" />
                            <span className="truncate">
                                {material.subject} - {material.career}
                            </span>
                        </div>

                        {/* Profesor */}
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                            <User className="w-3 h-3" />
                            <span className="truncate">{material.professor}</span>
                        </div>

                        {/* Semestre */}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{material.semester}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default MaterialCard;