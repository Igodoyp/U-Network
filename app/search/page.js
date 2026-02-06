"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, ThumbsUp, FileText, BookOpen, User, Calendar, Tag, X, ChevronDown } from "lucide-react"
import { Header } from "@/components/header"
import { useSearchParams, useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/lib/supabaseClient"
import { useUserContext } from "@/context/UserContext" // Añadir esta importación
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Tipos de material constantes (coinciden con las opciones de subida)
const tiposMaterial = ["Certamen", "Examen", "Control", "Apuntes", "Trabajo", "Tarea", "Proyecto", "Presentación"]

function MaterialCard({ material }) {
  const router = useRouter()

  return (
    <Card
      className="w-full hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm"
      onClick={() => router.push(`/document/${material.id}`)}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{material.title}</h3>
                {material.hasSolution && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">
                    Con solución
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-purple-500" />
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {material.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                <ThumbsUp className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-700">{material.rating}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <BookOpen className="w-3 h-3" />
              <span className="truncate">
                {material.subject} - {material.career}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <User className="w-3 h-3" />
              <span className="truncate">{material.professor}</span>
            </div>
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

export default function SearchPage() {
  const { userData } = useUserContext(); // Obtener los datos del usuario
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Estados para la búsqueda y paginación
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "")
  const [showFilters, setShowFilters] = useState(false)
  
  // Inicializar selectedCarreras con la carrera del usuario si está disponible
  const [selectedCarreras, setSelectedCarreras] = useState(() => {
    if (userData?.carrera) {
      return [userData.carrera];
    }
    return [];
  })
  const [selectedRamoIds, setSelectedRamoIds] = useState([]); // Array de IDs de ramos seleccionados
  const [selectedRamoNombre, setSelectedRamoNombre] = useState(""); // Nombre para mostrar
  const [selectedTipos, setSelectedTipos] = useState([])
  const [orderBy, setOrderBy] = useState("mejor-valorados")
  const [dateRange, setDateRange] = useState([2020, 2025])
  const [openRamo, setOpenRamo] = useState(false)
  const [openCarrera, setOpenCarrera] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)
  
  // Estados para los datos desde Supabase
  const [materials, setMaterials] = useState([])
  const [filteredMaterials, setFilteredMaterials] = useState([])
  const [totalResults, setTotalResults] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [carreras, setCarreras] = useState([])
  const [ramos, setRamos] = useState([])
  const [ramosDisponibles, setRamosDisponibles] = useState([])

  // Nuevos estados al inicio del componente SearchPage
  const [selectedProfesores, setSelectedProfesores] = useState([]);
  const [openProfesor, setOpenProfesor] = useState(false);
  const [profesores, setProfesores] = useState([]);
  const [profesoresDisponibles, setProfesoresDisponibles] = useState([]);

  // Estado para el modal de selección de carrera
  const [showCarreraModal, setShowCarreraModal] = useState(false);
  const [carreraSearch, setCarreraSearch] = useState("");

  // Estado para el modal de selección de ramo
  const [showRamoModal, setShowRamoModal] = useState(false);
  const [ramoSearch, setRamoSearch] = useState("");

  // Estado para el modal de selección de profesor
  const [showProfesorModal, setShowProfesorModal] = useState(false);
  const [profesorSearch, setProfesorSearch] = useState("");

  // Cargar los datos iniciales de carreras y ramos
  useEffect(() => {
    const loadFilterOptions = async () => {
      // Eliminar esta consulta que causa el error 404
      /*
      const { data: carrerasData, error: carrerasError } = await supabase
        .from("carreras")
        .select("nombre")
        .order("nombre")
      
      if (!carrerasError && carrerasData) {
        setCarreras(carrerasData.map(c => c.nombre));
      } else {
        console.error("Error al cargar carreras:", carrerasError);
        // Usar las carreras de respaldo si hay error
      }
      */
      
      // En su lugar, usar directamente el array de carreras
      setCarreras([
        "Ingeniería Plan Común",
        "Ingeniería Civil Industrial",
        "Ingeniería Civil en BioMedicina",
        "Ingeniería Civil en Informática e Innovación Tecnológica",
        "Ingeniería Civil en Informática e Inteligencia Artificial",
        "Ingeniería Civil en Minería",
        "Ingeniería Civil en Obras Civiles",
        "Geología",
      ]);
      
      // Cargar todos los ramos disponibles
      const { data: ramosData, error: ramosError } = await supabase
        .from("ramos")
        .select("id, nombre, carrera")
        .order("nombre");
      
      if (!ramosError && ramosData) {
        setRamos(ramosData);
        // Inicialmente mostramos todos los ramos
        setRamosDisponibles(ramosData);
      } else {
        console.error("Error al cargar ramos:", ramosError);
      }

      // Cargar todos los profesores disponibles
      const { data: profesoresData, error: profesoresError } = await supabase
        .from("profesores")
        .select("id, nombre")
        .order("nombre");
      
      if (!profesoresError && profesoresData) {
        setProfesores(profesoresData);
        // Inicialmente mostramos todos los profesores
        setProfesoresDisponibles(profesoresData);
      } else {
        console.error("Error al cargar profesores:", profesoresError);
      }
    };
    
    loadFilterOptions();
  }, []);

  // Actualizar los ramos disponibles cuando cambien las carreras seleccionadas
  useEffect(() => {
    if (selectedCarreras.length > 0) {
      // Filtrar ramos por las carreras seleccionadas
      const ramosFiltrados = ramos.filter(ramo => selectedCarreras.includes(ramo.carrera));
      setRamosDisponibles(ramosFiltrados);
    } else {
      // Si no hay carreras seleccionadas, mostrar todos los ramos
      setRamosDisponibles(ramos);
    }
  }, [selectedCarreras, ramos]); // Quitar selectedRamoIds de las dependencias

  // Verificar si el ramo seleccionado sigue disponible
  useEffect(() => {
    if (selectedRamoIds.length > 0 && ramosDisponibles.length > 0) {
      // Si el ramo seleccionado ya no está disponible, resetear
      const ramoSigueDisponible = ramosDisponibles.some(r => selectedRamoIds.includes(r.id));
      if (!ramoSigueDisponible) {
        setSelectedRamoIds([]);
        setSelectedRamoNombre("");
      }
    }
  }, [ramosDisponibles, selectedRamoIds]);

  // Cargar materiales desde Supabase
  useEffect(() => {
    const fetchMaterials = async () => {
      setIsLoading(true);
      
      try {
        // Construir la consulta base
        let query = supabase
          .from("materiales_metadata")
          .select(`
            id,
            titulo,
            categoria,
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
            created_at,
            val_positivas,
            val_negativas,
            descargas,
            file_url,
            solucion,
            status
          `)
          .eq("status", "public");
        
        // Aplicar filtro de búsqueda
        if (searchQuery) {
          query = query.or(`titulo.ilike.%${searchQuery}%,descripcion.ilike.%${searchQuery}%`);
        }
        
        // Aplicar filtro de carreras
        if (selectedCarreras.length > 0) {
          query = query.in("carrera", selectedCarreras);
        }
        
        // Aplicar filtro de ramo por ID (ahora usando múltiples IDs)
        if (selectedRamoIds.length > 0) {
          query = query.in("ramo_id", selectedRamoIds);
        }
        
        // Aplicar filtro de tipo de material
        if (selectedTipos.length > 0) {
          query = query.in("categoria", selectedTipos);
        }
        
        // Aplicar filtro de profesores
        if (selectedProfesores.length > 0) {
          const profesorIds = selectedProfesores.map(p => p.id);
          query = query.in("profesor_id", profesorIds);
        }
        
        // Aplicar ordenamiento
        switch (orderBy) {
          case "mejor-valorados":
            query = query.order("val_positivas", { ascending: false });
            break;
          case "mas-recientes":
            query = query.order("created_at", { ascending: false });
            break;
          case "mas-descargas":
            query = query.order("descargas", { ascending: false });
            break;
        }
        
        // Obtener los datos
        const { data, error } = await query;
        
        if (error) {
          console.error("Error al obtener materiales:", error);
          return;
        }
        
        // Transformar los datos para la UI
        const processedMaterials = data.map(item => ({
          id: item.id,
          title: item.titulo,
          type: item.categoria,
          subject: item.ramos ? item.ramos.nombre : "No especificado",
          ramo_id: item.ramo_id,
          career: item.carrera,
          professor: item.profesores ? item.profesores.nombre : "No especificado",
          semester: item.semestre || "No especificado",
          date: new Date(item.created_at).toLocaleDateString("es-CL"),
          rating: item.val_positivas + item.val_negativas > 0
            ? Math.round((item.val_positivas / (item.val_positivas + item.val_negativas)) * 100)
            : 0,
          downloads: item.descargas || 0,
          fileUrl: item.file_url,
          hasSolution: item.solucion || false // Añadir hasSolution
        }));
        
        setMaterials(processedMaterials);
        applyLocalFilters(processedMaterials);
      } catch (err) {
        console.error("Error en la búsqueda:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMaterials();
  }, [searchQuery, selectedCarreras, selectedRamoIds, selectedTipos, selectedProfesores, orderBy]);

  // Aplicar filtros locales (aquellos que no pudimos aplicar en la consulta directamente)
  const applyLocalFilters = (data) => {
    // Filtrar por rango de fecha (extrayendo el año del semestre)
    const filtered = data.filter(material => {
      // Si no tiene semestre definido, lo incluimos por defecto
      if (!material.semester) return true;
      
      // Extraer el año del formato "YYYY-N"
      const semesterParts = material.semester.split('-');
      if (semesterParts.length < 2) return true; // Si no sigue el formato esperado
      
      const semesterYear = parseInt(semesterParts[0], 10);
      if (isNaN(semesterYear)) return true; // Si no es un número válido
      
      return semesterYear >= dateRange[0] && semesterYear <= dateRange[1];
    });
    
    setFilteredMaterials(filtered);
    setTotalResults(filtered.length);
  };

  // Aplicar filtros cuando cambien los filtros locales
  useEffect(() => {
    applyLocalFilters(materials);
  }, [dateRange, materials]);

  const handleCarreraSelect = (carrera) => {
    if (!selectedCarreras.includes(carrera)) {
      setSelectedCarreras([...selectedCarreras, carrera]);
    }
    setOpenCarrera(false);
  };

  const removeCarrera = (carrera) => {
    setSelectedCarreras(selectedCarreras.filter((c) => c !== carrera));
  };

  const handleRamoSelect = (ramoId, ramoNombre) => {
    // Verificar si estamos seleccionando un ramo con nombre idéntico a otro ya seleccionado
    if (selectedRamoNombre === ramoNombre) {
      // Si el ramo ya está seleccionado, lo quitamos
      if (selectedRamoIds.includes(ramoId)) {
        setSelectedRamoIds(selectedRamoIds.filter(id => id !== ramoId));
        
        // Si quitamos el último ID con ese nombre, limpiamos el nombre también
        if (selectedRamoIds.length === 1) {
          setSelectedRamoNombre("");
        }
      } else {
        // Si no está seleccionado, lo agregamos a la lista de IDs
        setSelectedRamoIds([...selectedRamoIds, ramoId]);
      }
    } else {
      // Si es un ramo nuevo, reemplazamos los anteriores
      setSelectedRamoIds([ramoId]);
      setSelectedRamoNombre(ramoNombre);
    }
    
    setOpenRamo(false);
  };

  const handleTipoChange = (tipo, checked) => {
    if (checked) {
      setSelectedTipos([...selectedTipos, tipo]);
    } else {
      setSelectedTipos(selectedTipos.filter((t) => t !== tipo));
    }
  };

  const handleProfesorSelect = (profesor) => {
    if (!selectedProfesores.some(p => p.id === profesor.id)) {
      setSelectedProfesores([...selectedProfesores, profesor]);
    }
    setOpenProfesor(false);
  };

  const removeProfesor = (profesorId) => {
    setSelectedProfesores(selectedProfesores.filter(p => p.id !== profesorId));
  };

  const clearAllFilters = () => {
    setSelectedCarreras([]);
    setSelectedRamoIds([]);
    setSelectedRamoNombre("");
    setSelectedProfesores([]);
    setSelectedTipos([]);
    setDateRange([2020, 2025]);
    setOrderBy("mejor-valorados");
    setCurrentPage(1);
  };

  const removeFilter = (filterType, value) => {
    switch (filterType) {
      case "carrera":
        if (value) removeCarrera(value);
        break;
      case "ramo":
        setSelectedRamoIds([]);
        setSelectedRamoNombre("");
        break;
      case "tipo":
        if (value) setSelectedTipos(selectedTipos.filter((t) => t !== value));
        break;
      case "date":
        setDateRange([2020, 2025]);
        break;
      case "profesor":
        if (value) setSelectedProfesores(selectedProfesores.filter(p => p.id !== value));
        break;
    }
  };

  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = filteredMaterials.slice(startIndex, endIndex);

  const loadMoreResults = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    setShowFilters(false); // Close mobile filters
  };

  // Verificar si hay filtros activos
  const hasActiveFilters =
    selectedCarreras.length > 0 ||
    selectedRamoIds.length > 0 ||
    selectedTipos.length > 0 ||
    dateRange[0] !== 2020 ||
    dateRange[1] !== 2025 ||
    orderBy !== "mejor-valorados" ||
    selectedProfesores.length > 0;

  // Botón de filtro con animación suave
  const FilterButton = () => (
    <Button
      onClick={() => setShowFilters(true)}
      className="fixed z-40 bottom-20 right-4 h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center md:hidden"
      aria-label="Filtros"
    >
      <Filter className="h-5 w-5 text-white" />
    </Button>
  );

  // Panel de filtros mejorado para móvil
  const MobileFilterPanel = () => (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-full sm:w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        showFilters ? "translate-x-0" : "-translate-x-full"
      } lg:relative lg:translate-x-0 lg:block overflow-auto`}
    >
      <div className="sticky top-0 bg-white z-10 px-4 py-3 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="lg:hidden">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-4 space-y-6 pb-20 h-[calc(100%-108px)] overflow-auto">
        {/* CONTENIDO DE FILTROS PARA MÓVIL - SIN CAMBIOS */}
        {/* ... */}
      </div>

      {/* Botones de acción fijos en la parte inferior */}
      <div className="absolute bottom-0 left-0 w-full sm:w-80 border-t bg-white p-3 flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => setShowFilters(false)}
        >
          Cancelar
        </Button>
        <Button 
          className="flex-1 bg-blue-600"
          onClick={() => {
            applyFilters();
            setShowFilters(false);
          }}
        >
          Ver {totalResults} resultados
        </Button>
      </div>
    </div>
  );

  // Efecto para actualizar la carrera seleccionada cuando cambian los datos del usuario
  useEffect(() => {
    if (userData?.carrera && !selectedCarreras.includes(userData.carrera)) {
      setSelectedCarreras([userData.carrera]);
    }
  }, [userData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="flex flex-col lg:flex-row"> {/* Cambiar a flex-col por defecto */}
        {/* Sidebar de filtros para desktop (visible solo en desktop) */}
        <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 sm:p-6 space-y-6 bg-white border-r">
            {/* Contenido de filtros para desktop */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Filtrar</h2>
              </div>

              {/* Ordenar por */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Ordenar por</Label>
                <Select value={orderBy} onValueChange={setOrderBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mejor-valorados">Mejor valorados</SelectItem>
                    <SelectItem value="mas-recientes">Más recientes</SelectItem>
                    <SelectItem value="mas-descargas">Más descargas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Carrera */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Carrera</Label>
                <Popover open={openCarrera} onOpenChange={setOpenCarrera}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCarrera}
                      className="w-full justify-between bg-transparent"
                    >
                      {selectedCarreras.length > 0 ? `${selectedCarreras.length} carrera(s)` : "Seleccionar carreras..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-72 p-0" 
                    align="start"
                    sideOffset={4}
                    style={{ zIndex: 9999 }}
                  >
                    <Command>
                      <CommandInput placeholder="Buscar carrera..." />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No se encontró la carrera.</CommandEmpty>
                        <CommandGroup>
                          {carreras.map((carrera) => (
                            <CommandItem key={carrera} onSelect={() => handleCarreraSelect(carrera)}>
                              {carrera}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedCarreras.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCarreras.map((carrera) => (
                      <Badge key={carrera} variant="secondary" className="flex items-center gap-1">
                        {carrera}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeCarrera(carrera)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Ramo - Ahora usando ramo_id */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Ramo</Label>
                <Popover open={openRamo} onOpenChange={selectedCarreras.length > 0 ? setOpenRamo : undefined}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openRamo}
                      className="w-full justify-between bg-transparent"
                      disabled={selectedCarreras.length === 0}
                    >
                      {selectedRamoNombre || (selectedCarreras.length === 0 
                        ? "Selecciona primero una carrera" 
                        : "Seleccionar ramo...")}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar ramo..." />
                      <CommandList>
                        <CommandEmpty>No se encontró el ramo.</CommandEmpty>
                        <CommandGroup>
                          {ramosDisponibles.map((ramo) => (
                            <CommandItem
                              key={ramo.id}
                              onSelect={() => handleRamoSelect(ramo.id, ramo.nombre)}
                            >
                              <div className="flex flex-col">
                                <span>{ramo.nombre}</span>
                                <span className="text-xs text-gray-500">{ramo.carrera}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Profesor - Movido aquí entre Ramo y Tipo de material */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Profesor</Label>
                <Popover open={openProfesor} onOpenChange={setOpenProfesor}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openProfesor}
                      className="w-full justify-between bg-transparent"
                    >
                      {selectedProfesores.length > 0 ? `${selectedProfesores.length} profesor(es)` : "Seleccionar profesores..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar profesor..." />
                      <CommandList>
                        <CommandEmpty>No se encontró el profesor.</CommandEmpty>
                        <CommandGroup>
                          {profesoresDisponibles.map((profesor) => (
                            <CommandItem key={profesor.id} onSelect={() => handleProfesorSelect(profesor)}>
                              {profesor.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedProfesores.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProfesores.map((profesor) => (
                      <Badge key={profesor.id} variant="secondary" className="flex items-center gap-1">
                        {profesor.nombre}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeProfesor(profesor.id)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Tipo de material */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de material</Label>
                <div className="space-y-2">
                  {tiposMaterial.map((tipo) => (
                    <div key={tipo} className="flex items-center space-x-2">
                      <Checkbox
                        id={tipo}
                        checked={selectedTipos.includes(tipo)}
                        onCheckedChange={(checked) => handleTipoChange(tipo, checked)}
                      />
                      <Label htmlFor={tipo} className="text-sm">
                        {tipo}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fecha - Ahora muestra "Año" para ser coherente con formato semestre */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Año ({dateRange[0]} - {dateRange[1]})
                </Label>
                <div className="px-3">
                  <Slider
                    value={dateRange}
                    onValueChange={setDateRange}
                    max={2025}
                    min={2020}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2020</span>
                    <span>2025</span>
                  </div>
                </div>
              </div>

              {/* Botón aplicar filtros */}
              <Button
                onClick={applyFilters}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold"
              >
                Mostrar {totalResults} resultado{totalResults !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1">
          {/* Barra de búsqueda */}
          <div className="bg-white shadow-sm border-b sticky top-16 z-30">
            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar material..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 py-2 border-gray-200 focus:border-blue-500 rounded-lg"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 lg:hidden"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros activos */}
          {hasActiveFilters && (
            <div className="bg-gray-50 border-b">
              <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Filtros activos:</span>

                  {/* Carreras seleccionadas */}
                  {selectedCarreras.map((carrera) => (
                    <Badge key={carrera} variant="secondary" className="flex items-center gap-1">
                      {carrera}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => removeFilter("carrera", carrera)}
                      />
                    </Badge>
                  ))}

                  {/* Ramo seleccionado */}
                  {selectedRamoNombre && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Ramo: {selectedRamoNombre} {selectedRamoIds.length > 1 && `(${selectedRamoIds.length})`}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-red-600" 
                        onClick={() => removeFilter("ramo")} 
                      />
                    </Badge>
                  )}

                  {/* Tipos seleccionados */}
                  {selectedTipos.map((tipo) => (
                    <Badge key={tipo} variant="secondary" className="flex items-center gap-1">
                      {tipo}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => removeFilter("tipo", tipo)}
                      />
                    </Badge>
                  ))}

                  {/* Rango de fechas */}
                  {(dateRange[0] !== 2020 || dateRange[1] !== 2025) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Año: {dateRange[0]}-{dateRange[1]}
                      <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => removeFilter("date")} />
                    </Badge>
                  )}

                  {/* Ordenamiento */}
                  {orderBy !== "mejor-valorados" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {orderBy === "mas-recientes" ? "Más recientes" : "Más descargas"}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => setOrderBy("mejor-valorados")}
                      />
                    </Badge>
                  )}

                  {/* Profesores seleccionados */}
                  {selectedProfesores.map((profesor) => (
                    <Badge key={profesor.id} variant="secondary" className="flex items-center gap-1">
                      {profesor.nombre}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => removeFilter("profesor", profesor.id)}
                      />
                    </Badge>
                  ))}

                  {/* Limpiar todos los filtros */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    Limpiar todos
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Resultados */}
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {isLoading ? (
                  "Buscando materiales..."
                ) : (
                  `Mostrando ${startIndex + 1}-${Math.min(endIndex, totalResults)} de ${totalResults} resultados
                  ${searchQuery ? ` para "${searchQuery}"` : ""}`
                )}
              </p>
            </div>

            {/* Estado de carga */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600">Cargando resultados...</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 sm:space-y-4">
                  {currentResults.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </div>

                {/* Paginación */}
                {currentPage < totalPages && (
                  <div className="text-center py-8">
                    <Button onClick={loadMoreResults} variant="outline" className="bg-transparent">
                      Cargar más resultados ({totalResults - endIndex} restantes)
                    </Button>
                  </div>
                )}

                {totalResults === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
                    <p className="text-gray-600">Intenta ajustar tus filtros o términos de búsqueda</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Panel de filtros móvil - AÑADIDOS LOS FILTROS QUE FALTABAN */}
        <div
          className={`fixed top-16 bottom-0 left-0 z-40 w-full sm:w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            showFilters ? "translate-x-0" : "-translate-x-full"
          } lg:hidden`}
        >
          <div className="sticky top-0 bg-white z-10 px-4 py-3 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold">Filtros</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="lg:hidden">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 space-y-6 pb-20 h-[calc(100%-108px)] overflow-auto">
            {/* CONTENIDO DE FILTROS PARA MÓVIL - AÑADIDO */}
            {/* Ordenar por */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Ordenar por</Label>
              <Select value={orderBy} onValueChange={setOrderBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mejor-valorados">Mejor valorados</SelectItem>
                  <SelectItem value="mas-recientes">Más recientes</SelectItem>
                  <SelectItem value="mas-descargas">Más descargas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Carrera - CORREGIDO */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Carrera</Label>
              <Button
                variant="outline"
                className="w-full justify-between bg-transparent"
                onClick={() => setShowCarreraModal(true)}
              >
                {selectedCarreras.length > 0 ? `${selectedCarreras.length} carrera(s)` : "Seleccionar carreras..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              
              {selectedCarreras.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCarreras.map((carrera) => (
                    <Badge key={carrera} variant="secondary" className="flex items-center gap-1">
                      {carrera}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeCarrera(carrera)} />
                    </Badge>
                  ))}
                </div>
              )}
              
              <Dialog open={showCarreraModal} onOpenChange={setShowCarreraModal}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Seleccionar Carreras</DialogTitle>
                    <DialogDescription>
                      Elige una o más carreras de la lista.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[300px] overflow-auto">
                    <Input
                      placeholder="Buscar carrera..."
                      className="mb-2"
                      value={carreraSearch}
                      onChange={(e) => setCarreraSearch(e.target.value)}
                    />
                    <div className="space-y-2">
                      {carreras
                        .filter(c => c.toLowerCase().includes(carreraSearch.toLowerCase()))
                        .map((carrera) => (
                          <div key={carrera} className="flex items-center gap-2">
                            <Checkbox
                              id={`carrera-${carrera}`}
                              checked={selectedCarreras.includes(carrera)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  if (!selectedCarreras.includes(carrera)) {
                                    setSelectedCarreras([...selectedCarreras, carrera]);
                                  }
                                } else {
                                  removeCarrera(carrera);
                                }
                              }}
                            />
                            <Label htmlFor={`carrera-${carrera}`}>{carrera}</Label>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowCarreraModal(false)}>Aplicar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Ramo - TAMBIÉN CORREGIDO */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Ramo</Label>
              <Button
                variant="outline"
                className="w-full justify-between bg-transparent"
                onClick={() => setShowRamoModal(true)}
                disabled={selectedCarreras.length === 0}
              >
                {selectedRamoNombre || (selectedCarreras.length === 0 
                  ? "Selecciona primero una carrera" 
                  : "Seleccionar ramo...")}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              
              <Dialog open={showRamoModal} onOpenChange={setShowRamoModal}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Seleccionar Ramo</DialogTitle>
                    <DialogDescription>
                      Elige un ramo para filtrar los materiales.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[300px] overflow-auto">
                    <Input
                      placeholder="Buscar ramo..."
                      className="mb-2"
                      value={ramoSearch}
                      onChange={(e) => setRamoSearch(e.target.value)}
                    />
                    <div className="space-y-2">
                      {ramosDisponibles
                        .filter(ramo => ramo.nombre.toLowerCase().includes(ramoSearch.toLowerCase()))
                        .map((ramo) => (
                          <div key={ramo.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`ramo-${ramo.id}`}
                              checked={selectedRamoIds.includes(ramo.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRamoIds([ramo.id]);
                                  setSelectedRamoNombre(ramo.nombre);
                                } else {
                                  setSelectedRamoIds([]);
                                  setSelectedRamoNombre("");
                                }
                              }}
                            />
                            <Label htmlFor={`ramo-${ramo.id}`} className="flex flex-col">
                              <span>{ramo.nombre}</span>
                              <span className="text-xs text-gray-500">{ramo.carrera}</span>
                            </Label>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowRamoModal(false)}>Aplicar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Profesor - CORREGIDO */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Profesor</Label>
              <Button
                variant="outline"
                className="w-full justify-between bg-transparent"
                onClick={() => setShowProfesorModal(true)}
              >
                {selectedProfesores.length > 0 ? `${selectedProfesores.length} profesor(es)` : "Seleccionar profesores..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              
              {selectedProfesores.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedProfesores.map((profesor) => (
                    <Badge key={profesor.id} variant="secondary" className="flex items-center gap-1">
                      {profesor.nombre}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeProfesor(profesor.id)} />
                    </Badge>
                  ))}
                </div>
              )}
              
              <Dialog open={showProfesorModal} onOpenChange={setShowProfesorModal}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Seleccionar Profesores</DialogTitle>
                    <DialogDescription>
                      Elige uno o más profesores de la lista.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[300px] overflow-auto">
                    <Input
                      placeholder="Buscar profesor..."
                      className="mb-2"
                      value={profesorSearch}
                      onChange={(e) => setProfesorSearch(e.target.value)}
                    />
                    <div className="space-y-2">
                      {profesoresDisponibles
                        .filter(prof => prof.nombre.toLowerCase().includes(profesorSearch.toLowerCase()))
                        .map((profesor) => (
                          <div key={profesor.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`profesor-${profesor.id}`}
                              checked={selectedProfesores.some(p => p.id === profesor.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  if (!selectedProfesores.some(p => p.id === profesor.id)) {
                                    setSelectedProfesores([...selectedProfesores, profesor]);
                                  }
                                } else {
                                  removeProfesor(profesor.id);
                                }
                              }}
                            />
                            <Label htmlFor={`profesor-${profesor.id}`}>{profesor.nombre}</Label>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowProfesorModal(false)}>Aplicar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Tipo de material */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de material</Label>
              <div className="space-y-2">
                {tiposMaterial.map((tipo) => (
                  <div key={tipo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mobile-${tipo}`}
                      checked={selectedTipos.includes(tipo)}
                      onCheckedChange={(checked) => handleTipoChange(tipo, checked)}
                    />
                    <Label htmlFor={`mobile-${tipo}`} className="text-sm">
                      {tipo}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Año */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Año ({dateRange[0]} - {dateRange[1]})
              </Label>
              <div className="px-3">
                <Slider
                  value={dateRange}
                  onValueChange={setDateRange}
                  max={2025}
                  min={2020}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2020</span>
                  <span>2025</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción fijos en la parte inferior */}
          <div className="absolute bottom-0 left-0 w-full sm:w-80 border-t bg-white p-3 flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowFilters(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-blue-600"
              onClick={() => {
                applyFilters();
                setShowFilters(false);
              }}
            >
              Ver {totalResults} resultados
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
