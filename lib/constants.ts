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
 * Tipos de material
 */
export const CATEGORIAS_MATERIAL = ["Certamen", "Control", "Guía", "Apunte", "Resumen", "Laboratorio", "Formulario", "Otro"] as const


/**
 * Años académicos disponibles
 */
export const AÑOS = ["1", "2", "3", "4", "5", "6", "7"] as const

/**
 * Pasos del flujo de onboarding
 */
export const ONBOARDING_STEPS = [
  { id: "auth", name: "Cuenta" },
  { id: "profile", name: "Perfil" },
  { id: "subjects", name: "Ramos" },
] as const


// Tipos derivados de las constantes
export type Carrera = typeof CARRERAS[number]
export type Año = typeof AÑOS[number]
export type OnboardingStepId = typeof ONBOARDING_STEPS[number]["id"]
