# Unetwork 🎓
 
> Plataforma colaborativa para democratizar el acceso a material de estudio en Ingeniería (UDD).

![Status](https://img.shields.io/badge/Status-Beta-blue)
![Tech](https://img.shields.io/badge/Stack-Next.js_|_Supabase_|_Gemini_AI-black)

## 🚀 Sobre el Proyecto

Unetwork nace de una necesidad real: la fragmentación del material de estudio (certámenes, guías, resúmenes) en grupos de WhatsApp y Drives desactualizados.

Esta plataforma centraliza el conocimiento, permitiendo a los alumnos subir y buscar archivos históricos con un sistema de búsqueda instantáneo y validación comunitaria.

## 🛠 Tech Stack

El proyecto utiliza una arquitectura **Serverless** moderna:

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS.
- **Backend / Database:** Supabase (PostgreSQL).
- **Auth:** Supabase Auth (con validación de correos institucionales + sistema de Roles).
- **Seguridad:** Row Level Security (RLS) policies estrictas para protección de datos.
- **Storage:** Buckets privados/públicos para gestión de PDFs.
- **AI Integration:** Google Gemini 1.5 Flash para análisis de PDFs (OCR semántico) y auto-completado de metadata.

## ✨ Features Clave

- **🤖 Subida Inteligente:** Los usuarios suben un PDF y **Gemini AI** analiza el contenido para detectar automáticamente el Ramo, el Profesor, el Año y el Tipo de documento (Certamen, Guía, etc.).
- **🛡️ Sistema Anti-Duplicados:** Hashing de archivos (MD5) en el cliente para evitar resubidas de material idéntico.
- **🔒 Seguridad Granular:**
  - `Students`: Pueden leer todo y subir contenido propio.
  - `Guests`: (Externos) Acceso solo lectura.
  - `Admins`: Moderación y gestión total.
- **⚡ Performance:** Optimización de carga y manejo de archivos pesados mediante URLs firmadas y streaming.

## 🏗️ Arquitectura de Subida (AI Pipeline)

Para evitar límites de serverless (Vercel 4.5MB limit), implementé un patrón de **Upload by Reference**:
1. Cliente sube archivo directo a Supabase Storage.
2. Cliente envía la URL pública a la API Route de Next.js.
3. Servidor descarga temporalmente a `/tmp`.
4. Google Gemini analiza el archivo y devuelve JSON.
5. Servidor limpia residuos y responde al cliente.

---
Hecho con ☕ y código por **Ignacio Godoy**.
