```markdown
# AKIS Platform

**Yapay Zekâ Ajanı İş Akışı Motoru** (AI Agent Workflow Engine)

AKIS Platform, yazılım geliştirme süreçlerindeki tekrarlayan görevleri otomatikleştiren bir otonom ajan platformudur.

---

## 📍 Start Here

> **Hangi dökümana bakmalıyım?** Aşağıdaki kanonik zincir, tüm planlama ve uygulama dokümanlarını birbirine bağlar:

```
docs/PROJECT_TRACKING_BASELINE.md  (schedule anchor, spreadsheet source)
          ↓
docs/ROADMAP.md                    (phase overview)
          ↓
docs/NEXT.md                       (immediate actions + gating)
```

| Amaç | Doküman |
|------|---------|
| Sprint/phase/milestone takibi | [PROJECT_TRACKING_BASELINE.md](docs/PROJECT_TRACKING_BASELINE.md) |
| Faz görünümü & kabul kriterleri | [ROADMAP.md](docs/ROADMAP.md) |
| Anlık aksiyon listesi & gating | [NEXT.md](docs/NEXT.md) |
| Mimari ve teknoloji yığını | [CONTEXT_ARCHITECTURE.md](.cursor/context/CONTEXT_ARCHITECTURE.md) |
| Proje kapsamı & gereksinimler | [CONTEXT_SCOPE.md](.cursor/context/CONTEXT_SCOPE.md) |

---

## Özellikler

- **AKIS Scribe**: Teknik dokümantasyon güncelleme
- **AKIS Trace**: Test otomasyonu üretimi
- **AKIS Proto**: MVP prototipleme

## Teknoloji Stack

- **Backend**: Fastify + TypeScript (Node ≥ 20)
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React (Vite SPA, Next.js kullanılmıyor) + Tailwind CSS
- **Integrations**: MCP (Model Context Protocol) adapters

## Installation

### Prerequisites

- Node.js (≥ 20)
- PostgreSQL

### Setup Commands

1. Clone the repository:
   ```bash
   git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
   cd akis-platform-devolopment
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your database (details to follow in TODO).

---

## Usage

### Starting the Server

To start the server, run:
```bash
npm run start
```

### Accessing the API

The API is built with Fastify. For detailed API specifications, refer to the [Backend API Spec](backend/docs/API_SPEC.md).

---

## Canonical Docs

- [Cursor + Codex Strategy](CURSOR_CODEX_STRATEGY.md) – Cursor/Codex kullanım kuralları
- [CONTEXT_SCOPE (.cursor)](.cursor/context/CONTEXT_SCOPE.md) – problemin tanımı ve hedefler
- [CONTEXT_ARCHITECTURE (.cursor)](.cursor/context/CONTEXT_ARCHITECTURE.md) – mimari kararlar ve teknoloji yığını
- [UI_DESIGN_SYSTEM](docs/UI_DESIGN_SYSTEM.md) – tasarım token'ları ve komponent kuralları
- [WEB_INFORMATION_ARCHITECTURE](docs/WEB_INFORMATION_ARCHITECTURE.md) – site yapısı ve kullanıcı akışları
- [ROADMAP](docs/ROADMAP.md) – faz ve teslimat planı
- [constraints](docs/constraints.md) – OCI Free Tier ve platform kısıtları
- [Agent Workflows](backend/docs/AGENT_WORKFLOWS.md) – Plan→Execute→Reflect→Validate yaşam döngüsü

---

## Project Tracking & Execution

### Canonical Planning Sources

| Document | Purpose |
|----------|---------|
| [PROJECT_TRACKING_BASELINE.md](docs/PROJECT_TRACKING_BASELINE.md) | Sprint/phase/milestone schedule (from spreadsheet) |
| [NEXT.md](docs/NEXT.md) | Immediate actions + gating criteria |
| [ROADMAP.md](docs/ROADMAP.md) | Phase overview and delivery plan |

---

## Contributing

TODO: Add contributing guidelines.

## License

TODO: Add license information.
```