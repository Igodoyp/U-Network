export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Hecho por un estudiante, para estudiantes</h1>
        </div>

        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            Recuerdo perfectamente cuando entré a la U y estaba dando mi primer ramo matemático (Álgebra). Quedando un par de días para el certamen, el profe tiró: “Supongo que ustedes ya consiguieron certámenes anteriores con sus compañeros más grandes”.
          </p>
          <p>
            Todos nos miramos pensando: "¿Con quién se supone que me consiga material si no conozco a nadie?".
          </p>
          <p>
            Desde entonces, fui guardando todas mis pruebas pensando en ser tutor algún día para compartirlas. Pero luego, surgió una idea mejor: escalar esa ayuda.
          </p>
          <p>
            Así nace Unetwork: una herramienta para democratizar el acceso al material de estudio y conectar a la comunidad, eliminando la barrera de "tener contactos" para poder estudiar bien.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">La Ingeniería detrás del Proyecto</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Lo que empezó como una idea simple, hoy es una plataforma moderna construida con el mismo estándar que usan las startups actuales. Quería que fuera rápida, útil y gratuita:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-700 leading-relaxed space-y-2">
            <li>Core: Desarrollada en Next.js 14 para una experiencia instantánea.</li>
            <li>Base de Datos: Supabase (PostgreSQL) para manejar la información de forma segura y escalable.</li>
            <li>Inteligencia Artificial: Integración con Gemini Flash 2.5 para leer, clasificar y etiquetar los documentos automáticamente.</li>
            <li>Infraestructura: Desplegada en el Edge Network de Vercel.</li>
          </ul>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">
          Este proyecto nació del vibe coding y de aprender sobre la marcha (literalmente aprendí a programar el año pasado para hacer esto). Quizás el código no sea perfecto todavía, pero es la demostración de que con curiosidad y tecnología, podemos resolver problemas reales.
        </p>
      </div>
    </div>
  )
}
