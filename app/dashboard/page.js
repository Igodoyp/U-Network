"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Upload, ThumbsUp, FileText, BookOpen, User, Calendar, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUserContext } from "@/context/UserContext"
import { supabase } from "@/lib/supabaseClient"

function MaterialCard({ material, showRecommendedTag = false }) {
    const router = useRouter()

    return (
        <Card
            className="w-full hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm"
            onClick={() => router.push(`/document/${material.id}`)}
        >
            <CardContent className="p-3 sm:p-4">
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

export default function Dashboard() {
    const { userData, isLoading: userLoading } = useUserContext()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("recommended")
    const [searchQuery, setSearchQuery] = useState("")
    const [materials, setMaterials] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [userSubjects, setUserSubjects] = useState([])
    const [userSubjectIds, setUserSubjectIds] = useState([]); // Nueva variable para los IDs de los ramos

    // Recarga SOLO si viene de la ruta de registro
    useEffect(() => {
        if (window.location.hash === "#reload") {
            window.location.hash = ""
            window.location.reload()
        }
    }, [])

    // Cargar los ramos del usuario para las recomendaciones
    useEffect(() => {
        const fetchUserSubjects = async () => {
            if (!userData?.id) return;
            
            try {
                const { data, error } = await supabase
                    .from("usuarios_ramos")
                    .select(`
                        ramo_id,
                        ramos(id, nombre)
                    `)
                    .eq("usuario_id", userData.id);
                    
                if (error) {
                    console.error("Error al obtener ramos del usuario:", error);
                    return;
                }
                
                // Guardar tanto los IDs como los nombres
                const subjectIds = data.map(item => item.ramo_id);
                const subjectNames = data.map(item => item.ramos?.nombre || "");
                
                setUserSubjects(subjectNames); // Para mantener compatibilidad
                setUserSubjectIds(subjectIds); // Nueva variable para IDs
            } catch (err) {
                console.error("Error al cargar ramos del usuario:", err);
            }
        };
        
        fetchUserSubjects();
    }, [userData]);

    // Cargar materiales desde Supabase
    useEffect(() => {
        const fetchMaterials = async () => {
            setIsLoading(true);
            
            try {
                // Consulta base para todos los materiales
                let query = supabase
                    .from("materiales_metadata")
                    .select(`
                        id,
                        titulo,
                        ramo_id,
                        ramos:ramo_id (
                          nombre,
                          carrera,
                          semestre
                        ),
                        profesor_id,
                        profesores:profesor_id (
                          id, 
                          nombre
                        ),
                        carrera,
                        semestre,
                        autor_id,
                        categoria,
                        file_url,
                        descripcion,
                        created_at,
                        val_positivas,
                        val_negativas,
                        descargas,
                        solucion,
                        status
                    `)
                    .eq("status", "public")
                
                // Lógica diferente según la pestaña activa
                if (activeTab === "recent") {
                    // Para recientes, ordenamos por fecha descendente
                    query = query.order("created_at", { ascending: false });
                } else {
                    // Para recomendados, filtramos por los ramos del usuario si tiene ramos inscritos
                    if (userSubjects.length > 0) {
                        query = query.in("ramo_id", userSubjectIds);
                    }
                    // Ordenar por valoraciones positivas descendentes
                    query = query.order("val_positivas", { ascending: false });
                }
                
                // Limitar a 20 registros para no sobrecargar
                query = query.limit(20);
                
                const { data, error } = await query;
                
                if (error) {
                    console.error("Error al obtener materiales:", error);
                    return;
                }
                
                // Transformar los datos
                const processedMaterials = data.map(item => ({
                    id: item.id,
                    title: item.titulo,
                    type: item.categoria,
                    // Obtener el nombre del ramo desde la relación
                    subject: item.ramos ? item.ramos.nombre : "No especificado",
                    ramo_id: item.ramo_id,
                    career: item.carrera,
                    // Obtener el nombre del profesor desde la relación
                    professor: item.profesores ? item.profesores.nombre : "No especificado",
                    semester: item.semestre || "No especificado",
                    date: new Date(item.created_at).toLocaleDateString("es-CL"),
                    rating: item.val_positivas + item.val_negativas > 0
                        ? Math.round((item.val_positivas / (item.val_positivas + item.val_negativas)) * 100)
                        : 0,
                    downloads: item.descargas || 0,
                    fileUrl: item.file_url,
                    hasSolution: item.solucion || false, // Añadir campo hasSolution
                    // Verificar si el ramo pertenece a los ramos del usuario
                    isUserSubject: userSubjects.includes(item.ramos ? item.ramos.nombre : "")
                }));
                
                // Para recomendados, asegurarnos de que estén ordenados primero por rating
                if (activeTab === "recommended") {
                    processedMaterials.sort((a, b) => b.rating - a.rating);
                    
                    // Si no hay materiales para los ramos del usuario, mostrar mensaje informativo
                    if (userSubjects.length > 0 && !processedMaterials.some(m => m.isUserSubject)) {
                    }
                }
                
                setMaterials(processedMaterials);
            } catch (err) {
                console.error("Error al cargar materiales:", err);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchMaterials();
    }, [activeTab, userSubjects]);

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
    }

    // Si no hay usuario y ya terminó la carga del contexto, redirigir al inicio
    useEffect(() => {
        if (!userLoading && !userData) {
            router.push("/")
        }
    }, [userLoading, userData, router])

    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">{userLoading ? "Cargando usuario..." : "Redirigiendo..."}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            {/* Header con búsqueda y botón subir */}
            <div className="bg-white shadow-sm border-b sticky top-16 z-10">
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4">
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                        {/* Barra de búsqueda */}
                        <form onSubmit={handleSearch} className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Buscar material..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border-gray-200 focus:border-blue-500 rounded-lg"
                                />
                            </div>
                        </form>

                        {/* Botón subir material */}
                        <Button
                            onClick={() => router.push("/upload")}
                            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap text-sm"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Subir material</span>
                            <span className="sm:hidden">Subir</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Tabs del feed */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setActiveTab("recommended")}
                            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === "recommended"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            🌟 Recomendados
                        </button>
                        <button
                            onClick={() => setActiveTab("recent")}
                            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === "recent"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            🕒 Más recientes
                        </button>
                    </div>
                </div>

                {/* Feed de publicaciones */}
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-600">Cargando material...</p>
                    </div>
                ) : materials.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                        {activeTab === "recommended" && userSubjects.length > 0 && !materials.some(m => m.isUserSubject) ? (
                            // Mostrar mensaje si no hay materiales para los ramos inscritos
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <p className="text-blue-700 mb-2">No hay materiales disponibles para tus ramos inscritos</p>
                                <p className="text-sm text-blue-600">Mostrando otros materiales populares</p>
                            </div>
                        ) : null}
                        
                        {activeTab === "recommended" && userSubjects.length === 0 ? (
                            // Sugerir al usuario que agregue ramos para recibir recomendaciones
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <BookOpen className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">¡Personaliza tus recomendaciones!</h3>
                                        <p className="mt-1 text-sm text-yellow-700">
                                            Añade tus ramos actuales en tu perfil para ver material específico para tus clases.
                                        </p>
                                        <div className="mt-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                                onClick={() => router.push('/profile')}
                                            >
                                                Configurar ramos
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        
                        {materials.map((material) => (
                            <MaterialCard 
                                key={material.id} 
                                material={material} 
                                showRecommendedTag={activeTab === "recommended"}
                            />
                        ))}
                    </div>
                ) : (
                    // Mensaje cuando no hay material disponible (igual que antes)
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-700 mb-2">No hay material disponible</h3>
                        <p className="text-gray-500 mb-6">¡Sé el primero en subir material para compartir!</p>
                        <Button
                            onClick={() => router.push("/upload")}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Subir material
                        </Button>
                    </div>
                )}

                {/* Mensaje de carga más contenido */}
                {materials.length > 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">¡Has visto todo por ahora! 🎉</p>
                        <p className="text-gray-400 text-xs mt-1">Vuelve pronto para más material</p>
                    </div>
                )}
            </div>
        </div>
    )
}
