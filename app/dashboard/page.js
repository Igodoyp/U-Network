"use client"

import { useState, useEffect } from "react"
import { GlassButton } from "@/components/ui/glass-button"
import { Input } from "@/components/ui/input"
import { Search, Upload, ThumbsUp, FileText, BookOpen, User, Calendar, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUserContext } from "@/context/UserContext"
import { supabase } from "@/lib/supabaseClient"
import MaterialCard from "@/components/materialCard"


export default function Dashboard() {
    const { userData, isLoading: userLoading } = useUserContext()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("recommended")
    const [searchQuery, setSearchQuery] = useState("")
    const [materials, setMaterials] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [userSubjects, setUserSubjects] = useState([])
    const [userSubjectIds, setUserSubjectIds] = useState([]);

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
                    query = query.limit(20);
                } else {
                    // Para recomendados, filtramos por los ramos del usuario si tiene ramos inscritos
                    if (userSubjectIds.length > 0) {
                        query = query.in("ramo_id", userSubjectIds);
                    }
                    // Ordenar por valoraciones positivas descendentes
                    query = query.order("val_positivas", { ascending: false });
                    query = query.limit(20);
                }
                
                let { data, error } = await query;
                
                // Fallback: si es "recomendados" y no hay resultados por ramos,
                // mostrar material de la misma carrera ordenado por mejor valorados
                if (activeTab === "recommended" && (!data || data.length === 0) && userData?.carrera) {
                    const fallback = await supabase
                        .from("materiales_metadata")
                        .select(`
                            id, titulo, ramo_id,
                            ramos:ramo_id (nombre, carrera, semestre),
                            profesor_id,
                            profesores:profesor_id (id, nombre),
                            carrera, semestre, autor_id, categoria,
                            file_url, descripcion, created_at,
                            val_positivas, val_negativas, descargas, solucion, status
                        `)
                        .eq("status", "public")
                        .eq("carrera", userData.carrera)
                        .order("val_positivas", { ascending: false })
                        .limit(20);
                    
                    if (!fallback.error && fallback.data) {
                        data = fallback.data;
                        error = null;
                    }
                }
                
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
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
            style={{
                backgroundImage: "url('https://i.pinimg.com/736x/c6/de/b1/c6deb1f7fe2c888f227a600e1e4e6a47.jpg')",
            }}
        >
            {/* Header con búsqueda y botón subir */}
            <div className="bg-white shadow-sm border-b sticky top-16 sm:top-28 z-10">
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
                        <GlassButton
                            onClick={() => router.push("/upload")}
                            className="font-semibold px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap text-sm text-white border-white/45 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 hover:from-fuchsia-400 hover:via-purple-500 hover:to-blue-400 shadow-[0_5px_14px_rgba(147,51,234,0.22)] hover:shadow-[0_8px_16px_rgba(147,51,234,0.28)] active:from-gray-300 active:via-gray-300 active:to-gray-300 active:text-gray-900 active:shadow-[0_2px_6px_rgba(89,74,56,0.10)]"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Subir material</span>
                            <span className="sm:hidden">Subir ✨</span>
                        </GlassButton>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Tabs del feed */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                        <GlassButton
                            variant="ghost"
                            onClick={() => setActiveTab("recommended")}
                            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === "recommended"
                                    ? "bg-white/80 text-blue-700 shadow-[0_1px_5px_rgba(89,74,56,0.08)] before:opacity-0 after:shadow-none active:bg-gray-200 active:shadow-none"
                                    : "bg-transparent shadow-none border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/40 before:opacity-0 after:shadow-none active:bg-gray-200 active:text-gray-800 active:shadow-none"
                            }`}
                        >
                            🌟 Recomendados
                        </GlassButton>
                        <GlassButton
                            variant="ghost"
                            onClick={() => setActiveTab("recent")}
                            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === "recent"
                                    ? "bg-white/80 text-blue-700 shadow-[0_1px_5px_rgba(89,74,56,0.08)] before:opacity-0 after:shadow-none active:bg-gray-200 active:shadow-none"
                                    : "bg-transparent shadow-none border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/40 before:opacity-0 after:shadow-none active:bg-gray-200 active:text-gray-800 active:shadow-none"
                            }`}
                        >
                            🕒 Más recientes
                        </GlassButton>
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
                                            <GlassButton 
                                                variant="outline" 
                                                size="sm" 
                                                className="bg-white/70 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                                onClick={() => router.push('/profile')}
                                            >
                                                Configurar ramos
                                            </GlassButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        
                        {materials.map((material) => 
                            <MaterialCard 
                                key={material.id} 
                                material={material} 
                                showRecommendedTag={activeTab === "recommended"}
                            />
                        )}
                    </div>
                ) : (
                    // Mensaje cuando no hay material disponible (igual que antes)
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-700 mb-2">No hay material disponible</h3>
                        <p className="text-gray-500 mb-6">¡Sé el primero en subir material para compartir!</p>
                        <GlassButton
                            onClick={() => router.push("/upload")}
                            className="text-gray-900"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Subir material
                        </GlassButton>
                    </div>
                )}

                {/* Mensaje de carga más contenido */}
                {materials.length > 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-900 text-sm">¡Eso es todo!</p>
                        <p className="text-gray- 600 text-xs mt-2">Vuelve pronto para más material... O súbelo tú mismo ;)</p>
                    </div>
                )}
            </div>
        </div>
    )
}
