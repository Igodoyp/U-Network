import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenAI } from "@google/genai"
import crypto from "crypto"
import { CATEGORIAS_MATERIAL } from "@/lib/constants"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const categoriasMaterialPrompt = CATEGORIAS_MATERIAL.map((categoria) => `"${categoria}"`).join(", ")

export async function POST(request) {
  try {
    const { filePath, userId } = await request.json()

    console.log(`\n🚀 [${new Date().toISOString()}] ANÁLISIS INICIADO`)
    console.log("📋 Parámetros:", { filePath, userId })

    if (!filePath || !userId) {
      console.error("❌ Faltan parámetros")
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      )
    }

    // 1. Descargar archivo desde Supabase Storage
    console.log("1️⃣ Descargando archivo de Storage...")
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("materiales")
      .download(filePath)

    if (downloadError) {
      console.error("❌ Error descargando archivo:", downloadError.message)
      return NextResponse.json(
        { error: "Error al descargar el archivo" },
        { status: 500 }
      )
    }
    console.log("✅ Archivo descargado")

    // 2. Convertir Blob a Buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log(`✅ Buffer creado: ${(buffer.length / 1024).toFixed(2)}KB`)

    // 2.5. Calcular hash del archivo PRIMERO (antes de Gemini)
    const hash = crypto.createHash("md5").update(buffer).digest("hex")
    console.log(`✅ Hash calculado: ${hash}`)

    // 2.6. Verificar si el archivo ya existe (por hash)
    console.log("🔍 Verificando si el archivo ya existe...")
    console.log(`   Hash a comparar: '${hash}' (longitud: ${hash.length}, tipo: ${typeof hash})`)
    
    // Intentar query directa sin filtros primero
    console.log("   Intentando query...")
    let existingFiles = null
    let queryError = null
    
    try {
      const result = await supabase
        .from("material")
        .select("id, titulo, file_hash")
        .eq("file_hash", hash)
        .limit(1)
      
      existingFiles = result.data
      queryError = result.error
      
      console.log(`   ✅ Query completada`)
      console.log(`   Resultados: ${existingFiles?.length || 0} archivo(s)`)
      
      if (existingFiles && existingFiles.length > 0) {
        console.log(`   📋 Registros encontrados:`)
        existingFiles.forEach((file, idx) => {
          console.log(`      [${idx}] id=${file.id}, titulo="${file.titulo}", file_hash="${file.file_hash}" (longitud: ${file.file_hash?.length || 'null'})`)
        })
      }
    } catch (err) {
      console.error("   ❌ Excepción en query:", err.message)
      queryError = err
    }

    // Si no encontró, intentar búsqueda con LIKE (por si el hash está truncado)
    if (!existingFiles || existingFiles.length === 0) {
      console.log("   ⚠️ No encontró con búsqueda exacta, intentando con LIKE...")
      try {
        const result = await supabase
          .from("material")
          .select("id, titulo, file_hash")
          .ilike("file_hash", `${hash.substring(0, 16)}%`)
          .limit(1)
        
        if (result.data && result.data.length > 0) {
          existingFiles = result.data
          console.log(`   ✅ Encontrado con LIKE! Hash parcial coincide`)
          console.log(`      file_hash en BD: "${existingFiles[0].file_hash}" (longitud: ${existingFiles[0].file_hash?.length || 'null'})`)
        }
      } catch (err) {
        console.error("   ⚠️ Error en búsqueda LIKE:", err.message)
      }
    }

    if (queryError) {
      console.error("❌ Error verificando duplicados:", queryError)
      await supabase.storage.from("materiales").remove([filePath])
      return NextResponse.json(
        { error: "Error al verificar duplicados" },
        { status: 500 }
      )
    }

    if (existingFiles && existingFiles.length > 0) {
      console.warn(`⚠️ DUPLICADO DETECTADO: Hash ${hash} ya existe como "${existingFiles[0].titulo}"`)
      // Eliminar el archivo que se acaba de subir ya que es duplicado
      await supabase.storage.from("materiales").remove([filePath])
      return NextResponse.json(
        {
          success: false,
          isDuplicate: true,
          error: `Este archivo ya existe como "${existingFiles[0].titulo}"`,
          existingMaterial: {
            id: existingFiles[0].id,
            titulo: existingFiles[0].titulo
          }
        },
        { status: 409 }
      )
    }

    console.log("✅ Archivo es único, procediendo con análisis...")

    // 3. Obtener mime type del archivo
    const fileExtension = filePath.split(".").pop().toLowerCase()
    const mimeTypes = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
    }
    const mimeType = mimeTypes[fileExtension] || "application/pdf"

    // 4. Convertir a base64 para enviar inline
    console.log("2️⃣ Preparando contenido multimodal...")
    console.log(`📄 Mime type detectado: ${mimeType}`)
    const base64Data = buffer.toString('base64')
    console.log(`✅ Base64 codificado: ${base64Data.length} caracteres`)
    // 5. Analizar con Gemini usando input multimodal
    const prompt = `
Eres un experto moderador y clasificador de material académico para la facultad de Ingeniería de la UDD. 
Tu tarea es analizar este documento/imagen. Primero, debes determinar si es material académico válido y seguro. Luego, extrae su información.

REGLAS DE MODERACIÓN:
- Marca como INVÁLIDO (es_valido: false) cualquier contenido que sea: NSFW, ilegal, memes, fotos personales, capturas de pantalla de redes sociales, spam, o contenido que no tenga absolutamente ninguna relación con el estudio universitario.
- Marca como VÁLIDO (es_valido: true) cualquier apunte, certamen, guía, libro o material de estudio legítimo.

EXTRAE LA SIGUIENTE INFORMACIÓN EN FORMATO JSON ESTRICTO:

{
  "es_valido": booleano (true si es material académico, false si es inapropiado/spam),
  "motivo_rechazo": "string" (Si es_valido es false, explica brevemente por qué. Si es true, pon null),
  "titulo": "string" (Un nombre claro, Ej: "Certamen 1 Cálculo III 2023". Si es inválido, pon null),
  "categoria": "string" (Elige UNO: ${categoriasMaterialPrompt}. Si es inválido, pon null),
  "ramo": "string" (El nombre exacto de la asignatura inferido del texto. Si es inválido, pon null),
  "semestre": "string" (Formato "AÑO-SEMESTRE" donde SEMESTRE es 1 o 2. Ej: "2023-1". Usa 2 para "Bimestre IV/2do semestre". Usa 1 para "1er semestre/Bimestre I-II". Si solo hay año, pon el año. Si no hay nada, pon null),
  "descripcion": "string" (Resumen muy breve de los temas tratados, máx 15 palabras. Si es inválido, pon null),
  "profesor": "string" (Nombre y apellido del profesor si aparece explícitamente, si no, null),
  "solucion": booleano (true si el archivo contiene respuestas o pauta explícita, false si son solo preguntas o apuntes),
  "dificultad": "string" (Elige UNO: "Fácil", "Media", "Difícil" basándote en la complejidad matemática/teórica del texto. Si es un apunte básico es Fácil, si es un certamen avanzado es Difícil)
}

IMPORTANTE: Devuelve ÚNICA Y EXCLUSIVAMENTE un objeto JSON válido. No uses bloques de código Markdown. No agregues texto antes ni después.
    `

    let result
    try {
      // Construir contents con estructura correcta para el nuevo SDK
      console.log("3️⃣ Enviando a Gemini 2.0 Flash...")
      const userParts = [
        { text: prompt },
        { inlineData: { data: base64Data, mimeType } }
      ]

      const contents = [
        {
          role: "user",
          parts: userParts,
        },
      ]

      console.log(
        `  → Estructura de contenido: ${JSON.stringify(
          contents.map((c, i) => ({ index: i, role: c.role, parts: c.parts.length }))
        )}`
      )

      // Log size estimate for debugging quota issues
      const estimatedPayloadSize = base64Data.length
      console.log(`  → Tamaño estimado del payload (bytes): ${Math.round(estimatedPayloadSize)}`)

      result = await client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
        },
      })
      console.log("✅ Respuesta recibida de Gemini")
    } catch (genError) {
      console.error("❌ Error generando contenido:", genError.message)
      console.error("  Details:", genError)
      await supabase.storage.from("materiales").remove([filePath])
      const statusCode = genError?.status || genError?.error?.code || 500
      return NextResponse.json(
        {
          error:
            statusCode === 429
              ? "Gemini agotó su cuota o está temporalmente saturado"
              : "Error al analizar el documento con IA",
        },
        { status: statusCode }
      )
    }

    // 7. Acceder a la respuesta de forma segura
    console.log("4️⃣ Procesando respuesta de Gemini...")
    let responseText = ""
    
    // El nuevo SDK puede devolver respuesta en diferentes formatos
    if (result.text) {
      responseText = result.text
      console.log("  → Accedido por: result.text")
    } else if (result.output && result.output.text) {
      responseText = result.output.text
      console.log("  → Accedido por: result.output.text")
    } else if (result.outputs && Array.isArray(result.outputs)) {
      // Si es array de outputs
      const textOutput = result.outputs.find(o => o.text)
      responseText = textOutput?.text || ""
      console.log("  → Accedido por: result.outputs[].text")
    } else if (typeof result === "string") {
      responseText = result
      console.log("  → Accedido como string directo")
    } else {
      console.error("❌ Formato inesperado de respuesta:", JSON.stringify(result, null, 2))
      throw new Error("No se pudo extraer texto de la respuesta")
    }

    console.log(`✅ Response text obtenido: ${responseText.length} caracteres`)
    console.log(`📝 Primeros 200 chars: ${responseText.substring(0, 200)}`)

    if (!responseText) {
      console.error("❌ Respuesta vacía de Gemini")
      await supabase.storage.from("materiales").remove([filePath])
      return NextResponse.json(
        { error: "Respuesta vacía del análisis IA" },
        { status: 500 }
      )
    }

    let metadata

    try {
      // Limpiar markdown code blocks si existen
      const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
      console.log("5️⃣ Parseando JSON...")
      console.log("  Limpiando y parseando:", cleanedText.substring(0, 100))
      
      let parsed = JSON.parse(cleanedText)
      console.log("✅ JSON parseado! Estructura:", Object.keys(parsed).join(", "))
      
      // Si el JSON viene dentro de un array o tiene estructura rara, extraerlo
      // Ejemplo: {0: {...datos reales...}, file_hash, file_size, file_type}
      if (parsed["0"] && typeof parsed["0"] === "object") {
        console.log("⚠️ Detectada estructura envuelta, extrayendo datos reales...")
        metadata = parsed["0"]
        console.log("✅ Datos extraídos correctamente:", Object.keys(metadata).join(", "))
      } else if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
        console.log("⚠️ Detectado array, extrayendo primer elemento...")
        metadata = parsed[0]
        console.log("✅ Datos extraídos correctamente:", Object.keys(metadata).join(", "))
      } else {
        metadata = parsed
        console.log("✅ Estructura directa utilizada")
      }
      
      console.log("📊 Metadatos finales:", metadata)
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError.message)
      console.error("  Texto que se intentó parsear:")
      console.error(responseText)
      await supabase.storage.from("materiales").remove([filePath])
      return NextResponse.json(
        { error: "Error al procesar la respuesta de IA" },
        { status: 500 }
      )
    }

    // 8. Bloquear material rechazado por moderación IA
    const esValido = metadata?.es_valido
    const materialRechazado = esValido === false || esValido === "false"

    if (materialRechazado) {
      const motivoRechazo =
        typeof metadata?.motivo_rechazo === "string" && metadata.motivo_rechazo.trim().length > 0
          ? metadata.motivo_rechazo.trim()
          : "El contenido no cumple las normas de material académico permitido."

      console.warn("⛔ Material rechazado por IA:", motivoRechazo)
      await supabase.storage.from("materiales").remove([filePath])

      return NextResponse.json(
        {
          success: false,
          isValid: false,
          motivo_rechazo: motivoRechazo,
          error: "Material rechazado por moderación",
        },
        { status: 422 }
      )
    }

    // 9. Retornar metadata con info adicional
    console.log("6️⃣ Preparando respuesta final...")
    const finalResponse = {
      success: true,
      metadata: {
        ...metadata,
        file_hash: hash,
        file_size: buffer.length,
        file_type: mimeType,
      },
    }
    console.log("✅ ANÁLISIS COMPLETADO EXITOSAMENTE!")
    console.log(`📦 Respuesta: ${JSON.stringify(finalResponse.metadata, null, 2)}`)
    console.log(`---\n`)

    return NextResponse.json(finalResponse)
  } catch (error) {
    console.error("❌ ERROR INESPERADO:", error.message)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
