import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            DevAgents
          </h1>
          
          <p className="text-2xl text-gray-300">
            AI-Powered Development Agent Platform
          </p>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            GitHub, Jira, Confluence entegrasyonları ile akıllı ajanlar oluşturun. 
            QA testleri, döküman analizi ve iş akışı otomasyonu tek platformda.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center pt-8">
            <Link
              href="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Giriş Yap
            </Link>
            
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              GitHub'da İncele
            </a>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Agents</h3>
              <p className="text-gray-400">
                OpenRouter ile ücretsiz AI modelleri kullanarak akıllı ajanlar
              </p>
            </div>

            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold mb-2">Entegrasyonlar</h3>
              <p className="text-gray-400">
                GitHub, Jira, Confluence ve daha fazlası
              </p>
            </div>

            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Hızlı & Modern</h3>
              <p className="text-gray-400">
                Next.js 15 ile yapılmış modern bir platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
