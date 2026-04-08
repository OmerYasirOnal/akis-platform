import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { LOGO_MARK_SVG } from '../theme/brand';

const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Başlangıç',
    content: `## Başlangıç

### Hesap Oluşturma
1. Ana sayfada **"Başla"** butonuna tıklayın
2. E-posta adresinizi girin veya GitHub/Google ile giriş yapın
3. E-posta doğrulamasını tamamlayın

### AI Sağlayıcı Ayarlama
1. Giriş yaptıktan sonra **Ayarlar** sayfasına gidin
2. Kullanmak istediğiniz AI sağlayıcının yanındaki **"+ Ekle"** butonuna tıklayın
3. API key'inizi girin ve kaydedin
4. Varsayılan sağlayıcınızı seçin

### GitHub Bağlama
Proto agent'ın kod üretip push edebilmesi için GitHub bağlantısı gereklidir:
- GitHub OAuth ile giriş yaptıysanız otomatik bağlanır
- Alternatif: Ayarlar > GitHub bölümünden Personal Access Token ekleyin`,
  },
  {
    id: 'pipeline',
    title: 'Pipeline Akışı',
    content: `## Pipeline Akışı

AKIS'in 3 aşamalı pipeline'ı fikrinizi çalışan koda dönüştürür:

### 1. Scribe — Spec Oluşturma
- Yeni sohbet başlatın ve projenizi anlatın
- Scribe agent sorular sorarak fikrinizi netleştirir
- Yapılandırılmış bir spec (özellik dokümanı) üretir
- Spec'i inceleyip **onaylayın** veya düzenleyip tekrar gönderin

### 2. Proto — Kod Üretimi
- Onaylanan spec'e göre MVP scaffold oluşturur
- Dosyaları GitHub'a push eder (branch: \`proto/scaffold-{timestamp}\`)
- Desteklenen stack'ler: React+Vite, Next.js, Node.js+Express, Python+FastAPI

### 3. Trace — Test Üretimi
- Proto'nun ürettiği kodu GitHub'dan okur
- O koda özel Playwright e2e testleri yazar
- Testleri aynı branch'e commit eder

### Durum Makinesi
\`\`\`
scribe_clarifying → scribe_generating → awaiting_approval
→ proto_building → trace_testing → completed
\`\`\``,
  },
  {
    id: 'providers',
    title: 'AI Sağlayıcılar',
    content: `## AI Sağlayıcılar

AKIS üç farklı AI sağlayıcıyı destekler:

### Anthropic (Claude)
- **Varsayılan model:** claude-sonnet-4-6
- **API Key alma:** [console.anthropic.com](https://console.anthropic.com/)
- Key formatı: \`sk-ant-...\`

### OpenAI
- **Varsayılan model:** gpt-4o
- **API Key alma:** [platform.openai.com](https://platform.openai.com/)
- Key formatı: \`sk-...\`

### OpenRouter
- **Varsayılan model:** anthropic/claude-sonnet-4
- **API Key alma:** [openrouter.ai](https://openrouter.ai/)
- Key formatı: \`sk-or-...\`
- Birden fazla modele tek key ile erişim
- Ücretsiz modeller mevcut (ör: google/gemini-2.0-flash-exp:free)`,
  },
  {
    id: 'settings',
    title: 'Ayarlar',
    content: `## Ayarlar

### API Key Yönetimi
- Her sağlayıcı için ayrı key ekleyebilirsiniz
- Key'ler AES-256-GCM ile şifrelenerek saklanır
- Varsayılan sağlayıcınızı seçebilirsiniz
- Key'leri istediğiniz zaman güncelleyebilir veya silebilirsiniz

### GitHub Bağlantısı
- OAuth ile giriş yaptıysanız otomatik bağlıdır
- Bağlantı durumunu Ayarlar sayfasında görebilirsiniz`,
  },
  {
    id: 'faq',
    title: 'SSS',
    content: `## Sıkça Sorulan Sorular

### Pipeline ne kadar sürer?
Tipik bir pipeline 2-5 dakika sürer. Karmaşık projeler daha uzun sürebilir.

### Hangi dilleri destekliyor?
Spec yazımı Türkçe veya İngilizce olabilir. Kod üretimi projenin stack'ine göre yapılır.

### Ücretsiz kullanabilir miyim?
Evet! OpenRouter üzerinden ücretsiz modeller kullanabilirsiniz. Ayarlar'dan OpenRouter key'inizi ekleyip ücretsiz bir model seçmeniz yeterli.

### Spec'i düzenleyebilir miyim?
Evet, Scribe spec ürettikten sonra "Reddet" ile düzenleme yapabilir ve tekrar gönderebilirsiniz.

### Mevcut repoma push edebilir mi?
Evet, Proto agent mevcut bir repoya yeni branch açarak push edebilir.`,
  },
];

function renderMarkdown(md: string) {
  return md.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} className="mt-5 mb-2 text-base font-semibold text-white">{line.slice(4)}</h3>;
    if (line.startsWith('## ')) return <h2 key={i} className="mt-6 mb-3 text-xl font-bold text-white">{line.slice(3)}</h2>;
    if (line.startsWith('```')) return <div key={i} className="my-1" />;
    if (line.startsWith('- ')) return <li key={i} className="ml-4 text-sm text-gray-300 leading-relaxed list-disc">{line.slice(2)}</li>;
    if (/^\d+\. /.test(line)) return <li key={i} className="ml-4 text-sm text-gray-300 leading-relaxed list-decimal">{line.replace(/^\d+\. /, '')}</li>;
    if (line.trim() === '') return <div key={i} className="h-2" />;
    if (line.startsWith('`') && line.endsWith('`')) return <code key={i} className="block rounded bg-gray-800 px-3 py-1.5 text-xs font-mono text-[#07D1AF]">{line.slice(1, -1)}</code>;
    return <p key={i} className="text-sm text-gray-300 leading-relaxed">{line}</p>;
  });
}

export default function DocsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('getting-started');

  return (
    <div className="min-h-screen bg-[#0A1215] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-gray-800 px-6 py-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition">
          <img src={LOGO_MARK_SVG} alt="AKIS" className="h-7 w-7" />
          <span className="text-base font-extrabold tracking-tight text-[#07D1AF]">AKIS</span>
          <span className="text-xs text-gray-500 ml-1">Docs</span>
        </button>
        <button
          onClick={() => navigate('/login')}
          className="rounded-lg bg-[#07D1AF]/10 px-4 py-1.5 text-xs font-medium text-[#07D1AF] hover:bg-[#07D1AF]/20 transition"
        >
          Giriş Yap
        </button>
      </nav>

      <div className="mx-auto max-w-5xl flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0 border-r border-gray-800 py-6 pr-4 pl-4">
          <nav className="sticky top-6 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  activeSection === s.id
                    ? 'bg-[#07D1AF]/10 text-[#07D1AF] font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50',
                )}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 px-6 py-8 min-w-0">
          {/* Mobile section select */}
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="mb-6 block w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white md:hidden"
          >
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>

          <div className="prose prose-invert max-w-none">
            {renderMarkdown(SECTIONS.find((s) => s.id === activeSection)?.content ?? '')}
          </div>
        </main>
      </div>
    </div>
  );
}
