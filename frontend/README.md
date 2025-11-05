# AKIS Platform Frontend

Frontend SPA for AKIS Platform built with Vite + React + TypeScript + Tailwind CSS.

## Requirements

- Node.js >= 22.12.0 or >= 20.19.0 (required for Vite 7)
- Use `nvm use` at repo root to switch to correct Node version
- Tailwind CSS v4 (using `@tailwindcss/postcss` plugin)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
VITE_BACKEND_URL=http://localhost:3000
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type check with TypeScript
- `npm run test` - Run tests with Vitest
- `npm run generate:types` - Generate TypeScript types from OpenAPI schema (requires backend running)

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Layout.tsx     # Main layout with navigation
│   │   └── ui/            # UI primitives (Table, Badge, Pill, etc.)
│   ├── pages/             # Page components
│   │   ├── JobsListPage.tsx
│   │   ├── JobDetailPage.tsx
│   │   └── NewJobPage.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useJobs.ts
│   │   ├── useJob.ts
│   │   └── useCreateJob.ts
│   ├── services/          # API client
│   │   └── api/
│   │       ├── HttpClient.ts  # Lightweight fetch wrapper
│   │       ├── client.ts      # API methods
│   │       └── types.ts      # TypeScript types
│   └── App.tsx            # Root component with routing
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Features

- **Typed API Client**: Lightweight HttpClient using native fetch with retry/backoff
- **Routing**: React Router with routes for jobs list, detail, and creation
- **Observability**: Request-ID surfacing and unified error handling
- **Cursor Pagination**: Efficient pagination for jobs list
- **Auto-refresh**: Job detail page auto-refreshes until terminal state
- **Type Safety**: Full TypeScript strict mode compliance

## Testing

Run tests:
```bash
npm run test
```

Tests are located in:
- `src/services/api/__tests__/HttpClient.test.ts`
- `src/pages/__tests__/JobsListPage.test.tsx`

## Verification Steps

1. Start backend (port 3000):
```bash
cd backend && npm run dev
```

2. Start frontend (port 5173):
```bash
cd frontend && npm run dev
```

3. Test endpoints:
```bash
# List jobs
curl http://localhost:3000/api/agents/jobs

# Create scribe job
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -d '{"type":"scribe","payload":{"doc":"Test document"}}'

# Get job detail
curl http://localhost:3000/api/agents/jobs/{jobId}?include=plan,audit
```

4. UI Verification:
- Navigate to `http://localhost:5173`
- Should redirect to `/jobs`
- Click "New Job" to create a job
- View job detail with plan/audit toggles
- Test filters (type, state) and pagination
