# UNetwork

Plataforma colaborativa para compartir y descubrir material de estudio de Ingeniería en la Universidad del Desarrollo (UDD).

![Status](https://img.shields.io/badge/Status-Beta-blue)
![Stack](https://img.shields.io/badge/Stack-Next.js_|_Supabase_|_Gemini-black)

## Qué problema resuelve

UNetwork centraliza certámenes, controles, guías, apuntes, resúmenes y otros recursos que normalmente quedan dispersos en grupos de WhatsApp o Drives. Los estudiantes pueden subir material, buscarlo por texto y filtros, valorar su utilidad y encontrar a otros estudiantes de la misma carrera.

## Stack

- **Frontend:** Next.js 16.1.6 con App Router, React 18, TypeScript y Tailwind CSS.
- **Autenticación:** Supabase Auth mediante OAuth de Azure con cuenta institucional UDD.
- **Base de datos:** Supabase PostgreSQL.
- **Archivos:** Supabase Storage, principalmente en los buckets `materiales` y `avatars`.
- **IA:** Google Gemini 2.0 Flash para clasificar y extraer metadata de los archivos.
- **UI:** Componentes propios, Radix UI, Lucide React y `react-dropzone`.

La aplicación utiliza una arquitectura serverless: las páginas y componentes se ejecutan en Next.js y las operaciones de datos se realizan directamente contra Supabase, salvo procesos que requieren secretos del servidor.

## Funcionalidades principales

### Autenticación y onboarding

1. El usuario inicia sesión con su cuenta UDD mediante Azure.
2. Supabase devuelve la sesión en `/auth/callback`.
3. La aplicación consulta la tabla `usuarios`.
4. Si el perfil está completo, el usuario entra a `/dashboard`.
5. Si es un usuario nuevo, completa nombre, carrera, año y ramos actuales.

El perfil global se gestiona desde `context/UserContext.js`, que mantiene sincronizada la sesión de Supabase con los datos del usuario en la base de datos.

### Dashboard y recomendaciones

El dashboard muestra materiales públicos y ofrece dos vistas:

- **Recomendados:** prioriza materiales de los ramos seleccionados por el usuario y, si no encuentra resultados, utiliza materiales de su carrera.
- **Más recientes:** ordena los últimos materiales publicados.

### Búsqueda

La ruta `/search` combina:

- Búsqueda de texto mediante el RPC `buscar_materiales`.
- Fallback a una consulta directa sobre `material` si el RPC no está disponible.
- Filtros por carrera, ramo, categoría, año, solución disponible y ordenamiento.

La lógica de búsqueda se encapsula en `hooks/useBuscador.ts`.

### Subida inteligente de material

La subida se realiza en dos fases para evitar enviar archivos grandes a una API serverless:

1. El navegador sube el archivo directamente al bucket `materiales`.
2. El cliente llama a `/api/analyze-material` enviando la ruta del archivo.
3. El servidor descarga el archivo usando la service role key.
4. Se calcula un hash MD5 y se verifica si ya existe en `material.file_hash`.
5. Gemini analiza el archivo y devuelve JSON con título, categoría, ramo, semestre, profesor, descripción, solución y dificultad.
6. El cliente muestra esos datos en el formulario para que el usuario los revise.
7. Al confirmar, se crea el registro en `material` y, si corresponde, la relación en `material_profesor`.

Gemini también determina si el archivo es material académico válido. Los duplicados responden con HTTP 409 y los archivos rechazados por moderación con HTTP 422. Los archivos abandonados antes de guardar sus metadatos se eliminan del Storage cuando es posible.

### Documentos y reputación

`/document/[id]` muestra un material individual y permite consultar su archivo, autor y metadata. También registra:

- Vistas únicas por usuario en `vistas`.
- Descargas en `descargas`.
- Valoraciones positivas o negativas en `valoraciones`.
- Reportes de contenido.

Los materiales que no tienen estado `public` o están marcados como ocultos solo son visibles para administradores.

### Comunidad

La ruta `/conectar` permite buscar estudiantes por nombre o carrera y consultar sus ramos. Los perfiles públicos están disponibles en `/profile/[id]`.

### Administración

El área `/admin` está protegida por `app/admin/layout.js`. Solo usuarios cuyo campo `rol` sea `admin` pueden acceder. Incluye vistas para:

- Métricas generales.
- Usuarios.
- Materiales.
- Ramos.
- Reportes.
- Feedback.
- Configuración.

## Rutas principales

| Ruta | Propósito |
| --- | --- |
| `/` | Login y onboarding |
| `/auth/callback` | Procesamiento del retorno de Azure |
| `/dashboard` | Feed recomendado o reciente |
| `/search` | Búsqueda y filtros |
| `/upload` | Subida y análisis de material |
| `/document/[id]` | Detalle, preview y acciones de un material |
| `/profile` | Perfil propio y materiales publicados |
| `/profile/[id]` | Perfil de otro estudiante |
| `/settings` | Datos personales, avatar y eliminación de cuenta |
| `/conectar` | Directorio de estudiantes |
| `/notifications` | Vista de notificaciones actualmente local/mock |
| `/admin/*` | Herramientas de administración |
| `/api/analyze-material` | Análisis de archivos con Gemini |
| `/api/delete-account` | Eliminación autenticada de una cuenta |
| `/api/invitado` | Acceso mediante cuenta de invitado configurada en el servidor |

## Modelo de datos principal

Las tablas más importantes son:

- `usuarios`: perfil, carrera, año y rol.
- `carrera`: carreras disponibles.
- `ramos`: asignaturas asociadas a una carrera.
- `usuarios_ramos`: ramos elegidos por cada usuario.
- `material`: metadata, estado, autor y estadísticas del archivo.
- `profesor`: profesores disponibles.
- `material_profesor`: relación entre materiales y profesores.
- `vistas`, `descargas`, `valoraciones` y `favoritos`: actividad del usuario.
- `reportes`: denuncias y moderación de materiales.

## Configuración local

Requisitos:

- Node.js compatible con Next.js 16.
- pnpm.
- Proyecto de Supabase configurado.
- Proveedor Azure configurado en Supabase Auth.
- API key de Google Gemini.

Crea un archivo `.env.local` con las variables necesarias:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
GUEST_LINK_SECRET=...
GUEST_EMAIL=...
GUEST_PASSWORD=...
```

La service role key y la API key de Gemini solo deben estar disponibles en el servidor. No deben exponerse como variables `NEXT_PUBLIC_*`.

## Comandos

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
```

La aplicación de desarrollo estará disponible normalmente en `http://localhost:3000`.

## Estado actual

El proyecto está en beta. La pantalla de notificaciones todavía utiliza datos estáticos y existen algunas rutas de compatibilidad, como el registro tradicional y el acceso de invitado. El flujo principal de usuarios es Azure OAuth, onboarding, dashboard, búsqueda y subida asistida por IA.

Hecho con código por **Ignacio Godoy**.
