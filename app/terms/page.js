export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Términos y Condiciones de Uso - UNetwork</h1>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">1. Aceptación y Naturaleza del Servicio</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Bienvenido a UNetwork. Esta es una plataforma colaborativa y sin fines de lucro, diseñada para facilitar
            el intercambio de material de estudio entre estudiantes. Actualmente, la plataforma se encuentra en fase
            Beta (v0.1), por lo que el servicio se entrega "tal cual", pudiendo estar sujeto a interrupciones, errores
            o pérdida de datos. Al acceder, registrarte o subir archivos, aceptas íntegramente estos Términos y
            Condiciones.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">2. Acceso y Privacidad (Walled Garden)</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            El acceso a UNetwork está restringido exclusivamente a estudiantes activos. Para garantizar un entorno
            seguro y cerrado, solo se permite el registro mediante correos institucionales válidos. Tu cuenta es
            personal e intransferible.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">
            3. Propiedad Intelectual y Responsabilidad del Contenido (Importante)
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            UNetwork actúa única y exclusivamente como un proveedor de servicios intermediario para alojar contenido
            generado por los usuarios (UGC).
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Al subir cualquier archivo (incluyendo apuntes, resúmenes, guías, pautas o evaluaciones pasadas), el
            usuario declara bajo su exclusiva y total responsabilidad que posee los derechos de autor, o bien, que
            cuenta con la autorización explícita para distribuir dicho material.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            UNetwork no revisa de manera previa el contenido subido. Cualquier infracción a las normativas de
            propiedad intelectual o reglamentos internos de la institución recae directa y exclusivamente sobre el
            usuario que originó la subida del archivo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">4. Política de Reporte y Retiro Inmediato (Takedown Policy)</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Respetamos profundamente el trabajo de los académicos y los reglamentos institucionales. Si un creador,
            profesor, coordinador o autoridad detecta que su material didáctico o de evaluación ha sido compartido sin
            su consentimiento, puede utilizar el botón "Reportar" visible en la plataforma o contactar a la
            administración. El sistema ocultará de manera automatizada e inmediata cualquier documento reportado por
            infracción de derechos, mientras se realiza la revisión correspondiente.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">5. Uso Ético y Honestidad Académica</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Los documentos, ejercicios y resoluciones alojados en UNetwork tienen un propósito estrictamente
            preparatorio y de estudio personal. Queda categóricamente prohibido utilizar la plataforma para facilitar
            el plagio, la copia en evaluaciones en curso, o cualquier acto que vulnere la probidad y la honestidad
            académica exigida por la institución.
          </p>
        </section>
      </div>
    </div>
  )
}
