# AKIS DevAgents Platform

**AKIS DevAgents** is an intelligent documentation automation platform powered by AI agents. It integrates with GitHub via GitHub App to automatically analyze repositories, detect documentation gaps, and generate high-quality documentation artifacts.

[![Documentation Quality](https://img.shields.io/badge/docs-quality%20gate-brightgreen)](.github/workflows/docs-quality.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 🤖 **AI-Powered Documentation Agent (Scribe)** - Automatically analyzes repos and generates documentation
- 📊 **DAS (Documentation Assessment Score)** - Quantifies documentation quality
- 🔐 **GitHub App Integration** - Secure OAuth-based authentication
- 🎯 **Automated PR Creation** - Creates draft PRs with documentation improvements
- 🧠 **Multi-Model AI Support** - Integrates with OpenRouter for flexible model selection
- ✅ **Documentation Quality Gate** - CI/CD enforcement of documentation standards

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **AI**: OpenRouter API (multi-model)
- **Authentication**: GitHub App (OAuth)
- **Validation**: Zod schemas

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- GitHub App credentials ([Setup Guide](docs/GITHUB_APP_SETUP.md))

### Quick Setup

1. **Clone the repository**
```bash
git clone https://github.com/OmerYasirOnal/devagents.git
cd devagents
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:
```env
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY=your_base64_encoded_private_key
GITHUB_APP_INSTALLATION_ID=your_installation_id
OPENROUTER_API_KEY=your_openrouter_key
```

See [Environment Setup Guide](docs/ENV_SETUP.md) for detailed configuration.

4. **Run development server**
```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Quick Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run doc:check    # Validate documentation quality
npm test             # Run tests
```

## Documentation

- 📖 [Getting Started Guide](docs/GETTING_STARTED.md) - Detailed setup instructions
- 🏗️ [Architecture Overview](docs/ARCHITECTURE.md) - System design and structure
- 🔌 [API Reference](docs/API.md) - REST API endpoints
- 🤝 [Contributing Guide](CONTRIBUTING.md) - How to contribute
- 📋 [Documentation Agent Guide](DOCUMENTATION_AGENT_GUIDE.md) - Agent usage

## How It Works

1. **Connect GitHub** - Authenticate via GitHub App
2. **Select Repository** - Choose a repo to analyze
3. **Run Scribe Agent** - AI analyzes documentation coverage
4. **Review & Approve** - Agent creates draft PR with improvements
5. **Merge** - Documentation updated automatically

## Project Structure

```
devagents/
├── src/
│   ├── app/              # Next.js App Router (pages & API routes)
│   ├── components/       # React components
│   ├── lib/
│   │   ├── agents/       # AI agent implementations
│   │   ├── auth/         # Authentication & token management
│   │   ├── github/       # GitHub API client
│   │   └── contracts/    # API schemas & types
│   └── modules/          # Feature modules
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── .github/              # GitHub workflows & templates
└── public/               # Static assets
```

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Documentation quality checks
npm run doc:check
```

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/OmerYasirOnal/devagents)

1. Click the button above
2. Configure environment variables
3. Deploy

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for other platforms.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 **Email**: support@akis-platform.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/OmerYasirOnal/devagents/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/OmerYasirOnal/devagents/discussions)

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [OpenRouter](https://openrouter.ai)
- GitHub integration via [GitHub Apps](https://docs.github.com/apps)

---

**Made with ❤️ by the AKIS Team**
