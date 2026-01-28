import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            AI-CORE ERP
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            El ERP de Seguros Más Avanzado del Mundo
          </p>
          <p className="text-lg text-gray-500">
            con Inteligencia Artificial Integrada
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">🚀 20+ Expertos AI</h3>
            <p className="text-blue-100">
              Ventas, Legal, Contabilidad, Tax, Claims, HR y más
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">📞 Centralita Virtual</h3>
            <p className="text-purple-100">
              PBX completo con transcripción y análisis de sentimiento IA
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">🎮 Gamificación Soris</h3>
            <p className="text-green-100">
              Sistema de moneda virtual con descuentos automáticos
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">👤 Cliente 360°</h3>
            <p className="text-orange-100">
              Vista completa: perfil, patrimonio, relaciones y más
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">15+</div>
            <div className="text-sm text-gray-600">Módulos</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">200+</div>
            <div className="text-sm text-gray-600">Pantallas</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">20+</div>
            <div className="text-sm text-gray-600">Expertos AI</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600">100%</div>
            <div className="text-sm text-gray-600">Con IA</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-center"
          >
            Acceder al Dashboard
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors text-center"
          >
            Iniciar Sesión
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p className="mb-2">🤖 Powered by Claude Sonnet 4.5</p>
          <p>Sistema en desarrollo | 15 agentes trabajando en paralelo</p>
          <p className="mt-2 text-xs">~830,000 tokens procesados</p>
        </div>
      </div>
    </div>
  );
}
