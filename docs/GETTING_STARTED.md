# Getting Started

## Prerequisites
- Node.js LTS (>= 18)
- npm or yarn
- GitHub App credentials (for GitHub integration)

## Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/OmerYasirOnal/devagents.git
   cd devagents
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` from example and fill required values:
   ```bash
   cp .env.local.example .env.local
   ```

4. Configure GitHub App:
   - Follow instructions in `docs/GITHUB_APP_SETUP.md`
   - Set `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, and `GITHUB_APP_INSTALLATION_ID`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

See `docs/ENV_SETUP.md` for detailed environment configuration.

Required variables:
- `GITHUB_APP_ID` - Your GitHub App ID
- `GITHUB_PRIVATE_KEY` - GitHub App private key (base64 encoded)
- `GITHUB_APP_INSTALLATION_ID` - Installation ID for your GitHub App
- `OPENROUTER_API_KEY` - API key for OpenRouter (AI models)

## Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:md` - Lint markdown files
- `npm run check:links` - Check for broken links
- `npm run doc:proof` - Validate documentation coverage
- `npm run doc:check` - Run all documentation checks
- `npm run validate:env` - Validate environment variables

## Next Steps

- Read `docs/ARCHITECTURE.md` to understand the system structure
- Check `docs/API.md` for API endpoint documentation
- See `DOCUMENTATION_AGENT_GUIDE.md` for agent usage

