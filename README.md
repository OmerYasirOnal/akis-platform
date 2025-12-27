# AKIS Platform
**Yapay Zekâ Ajanı İş Akışı Motoru** (AI Agent Workflow Engine)
AKIS Platform, yazılım geliştirme süreçlerindeki tekrarlayan görevleri otomatikleştiren bir otonom ajan platformudur.

## Title and Description
AKIS Platform is an autonomous agent workflow engine designed to automate repetitive tasks in software development processes.

## Installation
To install the AKIS Platform, follow these steps:
1. Clone the repository: `git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git`
2. Install dependencies: `pnpm install`
3. Set up environment variables: create `.env` files from templates (e.g., `.env.mcp.local` and `backend/.env`)

## Usage
To use the AKIS Platform, follow these steps:
1. Start the MCP Gateway: `./scripts/mcp-up.sh`
2. Start the backend server: `pnpm dev`
3. Start the frontend server: `npm run dev`
4. Access the platform: `http://localhost:5173`

## Features
- **AKIS Scribe**: Teknik dokümantasyon güncelleme
- **AKIS Trace**: Test otomasyonu üretimi
- **AKIS Proto**: MVP prototipleme

## Configuration
The platform uses environment variables for configuration. The following variables are available:
| Key | Description | Default |
| --- | --- | --- |
| `FRONTEND_URL` | SPA kök URL'si; CORS ve yönlendirmeler için kullanılır | `http://localhost:5173` |
| `BACKEND_URL` / `VITE_API_URL` | REST API taban URL'si; frontend istekleri için önerilen `VITE_API_URL` | `http://localhost:3000` |
| `CORS_ORIGINS` | Virgülle ayrılmış izin verilen origin listesi (credentials=true) | `http://localhost:5173` |
| `NODE_ENV` | Çalışma modu (`development`, `production`, `test`) | `development` |
| `AUTH_COOKIE_NAME` | Oturum çerezi adı | `akis_sid` |
| `AUTH_COOKIE_MAXAGE` | Oturum çerezi max-age (saniye cinsinden) | `604800` (7 gün) |
| `AUTH_COOKIE_SAMESITE` | SameSite politikası (`Lax` önerildi) | `Lax` |
| `AUTH_COOKIE_SECURE` | HTTPS üzerinde secure bayrağı (prod ortamında zorunlu) | `false` (yalnızca lokal) |
| `AUTH_COOKIE_DOMAIN` | Opsiyonel domain sabitlemesi | — |

## Contributing
To contribute to the AKIS Platform, please follow these steps:
1. Fork the repository: `git fork https://github.com/OmerYasirOnal/akis-platform-devolopment.git`
2. Create a new branch: `git checkout -b feature/new-feature`
3. Make changes and commit: `git commit -m "New feature"`
4. Open a pull request: `git push origin feature/new-feature`

## License
The AKIS Platform is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Quickstart
To quickly start the AKIS Platform, follow these steps:
1. Install dependencies: `pnpm install`
2. Set up environment variables: create `.env` files from templates (e.g., `.env.mcp.local` and `backend/.env`)
3. Start the MCP Gateway: `./scripts/mcp-up.sh`
4. Start the backend server: `pnpm dev`
5. Start the frontend server: `npm run dev`
6. Access the platform: `http://localhost:5173`

## API Smoke Test
To test the backend API, follow these steps:
1. Start the backend server: `pnpm dev`
2. Run the smoke test: `./scripts/dev-smoke-jobs.sh`
The smoke test will test the following endpoints:
- `/health`
- `/api/agents/jobs`
- `/api/agents/jobs/:id`
- `/api/agents/jobs/:id?include=trace,artifacts`