# AKIS Platform

**Yapay Zekâ Ajanı İş Akışı Motoru** (AI Agent Workflow Engine)

AKIS Platform, yazılım geliştirme süreçlerindeki tekrarlayan görevleri otomatikleştiren bir otonom ajan platformudur.

## Özellikler

- **AKIS Scribe**: Teknik dokümantasyon güncelleme
- **AKIS Trace**: Test otomasyonu üretimi
- **AKIS Proto**: MVP prototipleme

## Teknoloji Stack

- **Backend**: Fastify + TypeScript (Node ≥ 20)
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React (Vite) + Tailwind CSS
- **Integrations**: MCP (Model Context Protocol) adapters

## Geliştirme

### Backend

```bash
cd backend
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run development server
pnpm dev

# The server will start on http://localhost:3000
# Health check: http://localhost:3000/health
```

### Komutlar

- `pnpm dev` - Development server (watch mode)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript type checking
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

### Frontend

Frontend scaffolding (coming soon)

## Dokümantasyon

Detaylı dokümantasyon için [docs/](docs/) klasörüne bakın.

## Lisans

MIT License - Bkz. [LICENSE](LICENSE) dosyası.

