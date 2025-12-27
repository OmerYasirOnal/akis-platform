# AKIS Platform
**Yapay Zekâ Ajanı İş Akışı Motoru** (AI Agent Workflow Engine)
AKIS Platform, yazılım geliştirme süreçlerindeki tekrarlayan görevleri otomatikleştiren bir otonom ajan platformudur.

## Title and Description
AKIS Platform, bir dizi otomasyon aracı sunan bir platformdur. 
AKIS Scribe, AKIS Trace ve AKIS Proto gibi özelliklere sahiptir.

## Installation
### Prerequisites
1. **Node.js** ≥ 20
2. **PostgreSQL** database
3. **Docker** (for MCP Gateway)
4. **GitHub Personal Access Token** (for MCP integration)
   - Get from: https://github.com/settings/tokens
   - Required scopes: `repo`, `read:org`

### Setup Commands
```bash
# MCP Gateway Setup
./scripts/mcp-doctor.sh

# Backend Setup
cd backend
pnpm install
cp.env.example.env
# Edit.env with your values
pnpm db:migrate
pnpm dev

# Frontend Setup
cd frontend
npm install
npm run dev
```

## Usage
### Quickstart
1. Run `./scripts/mcp-doctor.sh` for MCP Gateway setup
2. Start backend server with `pnpm dev`
3. Start frontend server with `npm run dev`

### API Endpoints
| Endpoint | Description |
| --- | --- |
| `/health` | Health check endpoint |
| `/api/agents/jobs` | Job listing endpoint |
| `/api/agents/jobs/:id` | Job details endpoint |

### Environment Variables
| Variable | Description | Default |
| --- | --- | --- |
| `FRONTEND_URL` | SPA root URL | `http://localhost:5173` |
| `BACKEND_URL` / `VITE_API_URL` | REST API base URL | `http://localhost:3000` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:5173` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |

## Features
- **AKIS Scribe**: Teknik dokümantasyon güncelleme
- **AKIS Trace**: Test otomasyonu üretimi
- **AKIS Proto**: MVP prototipleme

## Configuration
### MCP Gateway Configuration
- `GITHUB_TOKEN`: GitHub personal access token
- `MCP_GATEWAY_URL`: MCP Gateway URL

### Backend Configuration
- `DATABASE_URL`: PostgreSQL database URL
- `GITHUB_MCP_BASE_URL`: GitHub MCP base URL

## Contributing
TODO: Add contributing guidelines

## License
MIT License - See [LICENSE](LICENSE) file.