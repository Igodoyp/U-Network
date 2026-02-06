// ============================================================================
// CONSTANTES COMPARTIDAS - UNetwork
// ============================================================================

/**
 * Lista de carreras disponibles en la plataforma
 */
export const CARRERAS = [
  "Ingeniería Plan Común",
  "Ingeniería Civil Industrial",
  "Ingeniería Civil en BioMedicina",
  "Ingeniería Civil en Informática e Innovación Tecnológica",
  "Ingeniería Civil en Informática e Inteligencia Artificial",
  "Ingeniería Civil en Minería",
  "Ingeniería Civil en Obras Civiles",
  "Geología",
] as const

/**
 * Años académicos disponibles
 */
export const AÑOS = ["1", "2", "3", "4", "5", "6"] as const

/**
 * Pasos del flujo de onboarding
 */
export const ONBOARDING_STEPS = [
  { id: "auth", name: "Cuenta" },
  { id: "profile", name: "Perfil" },
  { id: "interests", name: "Intereses" },
  { id: "subjects", name: "Ramos" },
  { id: "complete", name: "Completado" },
] as const

/**
 * Categorías de intereses para personalización
 */
export const INTEREST_CATEGORIES = [
  {
    name: "Áreas de Estudio",
    interests: ["Matemáticas", "Programación", "Física", "Química", "Economía", "Gestión"]
  },
  {
    name: "Tipo de Material",
    interests: ["Apuntes", "Resúmenes", "Ejercicios", "Pruebas antiguas", "Proyectos", "Guías"]
  },
  {
    name: "Objetivos",
    interests: ["Aprobar ramos", "Profundizar conocimientos", "Preparar certámenes", "Ayudar a compañeros", "Investigación", "Prácticas"]
  }
] as const

// Tipos derivados de las constantes
export type Carrera = typeof CARRERAS[number]
export type Año = typeof AÑOS[number]
export type OnboardingStepId = typeof ONBOARDING_STEPS[number]["id"]
