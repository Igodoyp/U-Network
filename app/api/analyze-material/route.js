import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenAI } from "@google/genai"
import crypto from "crypto"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

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
        .from("materiales_metadata")
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
          .from("materiales_metadata")
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
Eres un experto clasificando material universitario de la facultad de Ingeniería UDD.
Analiza este documento y extrae la siguiente información en formato JSON estricto:

- titulo: Un nombre claro (Ej: "Certamen 1 Cálculo III 2023").
- categoria: Elige UNO: "Certamen", "Control", "Guía", "Apunte", "Libro", "Resumen", "Laboratorio", "Otro".
- ramo: El nombre de la asignatura (Ej: "Cálculo Integral", "Física II").
- semestre: Formato "AÑO-SEMESTRE" donde SEMESTRE es 1 o 2 (Ej: "2023-1", "2023-2", "2024-1"). 
  * Si el documento dice "Bimestre IV" o "2do semestre", usa semestre 2.
  * Si dice "1er semestre", "Bimestre I-II" o similar, usa semestre 1.
  * Si no encuentras el semestre, pon solo el año.
  * Si no encuentras año ni semestre, pon null.
- descripcion: Resumen muy breve (máx 15 palabras).
- profesor: Nombre y apellido del profesor si aparece (o null).
- solucion: true si el archivo contiene respuestas/pauta, false si no.
- dificultad: Elige UNO: "Fácil", "Media", "Difícil" según el nivel de dificultad del material.

IMPORTANTE: Devuelve SOLO JSON válido, sin markdown.
    `

    let result
    try {
      // Construir contents con estructura correcta para el nuevo SDK
      console.log("3️⃣ Enviando a Gemini 2.0 Flash...")
      const contents = [
        { type: "text", text: prompt },
      ]

      // Agregar archivo como contenido multimodal inline
      if (mimeType.startsWith("image/")) {
        console.log("  → Detectado como imagen")
        contents.push({
          type: "image",
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        })
      } else {
        // Para PDFs y otros documentos
        console.log("  → Detectado como documento")
        contents.push({
          type: "file",
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        })
      }

      console.log(`  → Estructura de contenido: ${JSON.stringify(contents.map((c, i) => ({ index: i, type: c.type, hasData: !!c.inlineData?.data })))}`)

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
      return NextResponse.json(
        { error: "Error al analizar el documento con IA" },
        { status: 500 }
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

    // 8. Retornar metadata con info adicional
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
