import { Link } from 'react-router-dom';

// Icons
const PlayIcon = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  thumbnail?: string;
}

interface LearningPath {
  title: string;
  description: string;
  tutorials: string[];
  duration: string;
}

const tutorials: Tutorial[] = [
  {
    id: 'intro-to-akis',
    title: 'Introduction to AKIS Platform',
    description: 'Learn the basics of AKIS, its architecture, and how AI agents can transform your development workflow.',
    duration: '15 min',
    level: 'Beginner',
    category: 'Getting Started',
  },
  {
    id: 'first-scribe-job',
    title: 'Running Your First Scribe Job',
    description: 'Step-by-step guide to connecting your GitHub repository and generating documentation with Scribe.',
    duration: '20 min',
    level: 'Beginner',
    category: 'Getting Started',
  },
  {
    id: 'configuring-ai-models',
    title: 'Configuring AI Models',
    description: 'How to set up OpenAI and OpenRouter API keys, choose the right model, and optimize for your use case.',
    duration: '12 min',
    level: 'Beginner',
    category: 'Configuration',
  },
  {
    id: 'github-integration-deep-dive',
    title: 'GitHub Integration Deep Dive',
    description: 'Advanced GitHub integration features including branch selection, commit filtering, and PR automation.',
    duration: '25 min',
    level: 'Intermediate',
    category: 'Integrations',
  },
  {
    id: 'understanding-mcp',
    title: 'Understanding MCP Protocol',
    description: 'Learn how Model Context Protocol enables secure integrations without exposing credentials.',
    duration: '18 min',
    level: 'Intermediate',
    category: 'Architecture',
  },
  {
    id: 'custom-scribe-templates',
    title: 'Custom Scribe Output Templates',
    description: 'Create custom templates for changelogs, release notes, and documentation styles.',
    duration: '30 min',
    level: 'Intermediate',
    category: 'Customization',
  },
  {
    id: 'job-orchestration',
    title: 'Job Orchestration & Workflows',
    description: 'Build complex workflows combining multiple agent runs with conditional logic and dependencies.',
    duration: '35 min',
    level: 'Advanced',
    category: 'Workflows',
  },
  {
    id: 'self-hosting-guide',
    title: 'Self-Hosting AKIS on OCI',
    description: 'Complete guide to deploying AKIS on Oracle Cloud Infrastructure free tier.',
    duration: '45 min',
    level: 'Advanced',
    category: 'DevOps',
  },
];

const learningPaths: LearningPath[] = [
  {
    title: 'New to AKIS',
    description: 'Start here if you\'re completely new to AKIS. Learn the fundamentals and run your first job.',
    tutorials: ['intro-to-akis', 'first-scribe-job', 'configuring-ai-models'],
    duration: '45 min',
  },
  {
    title: 'Integration Master',
    description: 'Deep dive into integrations with GitHub, Jira, and other development tools.',
    tutorials: ['github-integration-deep-dive', 'understanding-mcp'],
    duration: '43 min',
  },
  {
    title: 'Power User',
    description: 'Advanced features for developers who want to maximize AKIS capabilities.',
    tutorials: ['custom-scribe-templates', 'job-orchestration', 'self-hosting-guide'],
    duration: '1h 50min',
  },
];

const levelColors = {
  Beginner: 'bg-green-500/10 text-green-400',
  Intermediate: 'bg-yellow-500/10 text-yellow-400',
  Advanced: 'bg-red-500/10 text-red-400',
};

export default function LearnLandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-16 text-center sm:px-6 lg:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-ak-text-primary sm:text-5xl">
          Learn AKIS
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ak-text-secondary">
          Interactive tutorials and guides to help you master AI-assisted development with AKIS.
        </p>
      </section>

      {/* Learning Paths */}
      <section className="border-y border-ak-border bg-ak-surface px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-ak-text-primary">
            Learning Paths
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {learningPaths.map((path) => (
              <div
                key={path.title}
                className="rounded-2xl border border-ak-border bg-ak-surface-2 p-6 transition-all duration-base hover:-translate-y-1 hover:shadow-ak-lg"
              >
                <h3 className="text-xl font-bold text-ak-text-primary">{path.title}</h3>
                <p className="mt-2 text-sm text-ak-text-secondary">{path.description}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-ak-text-secondary">
                  <ClockIcon />
                  <span>{path.duration}</span>
                  <span className="mx-2">·</span>
                  <span>{path.tutorials.length} tutorials</span>
                </div>
                <Link
                  to={`/learn/path/${path.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="mt-4 inline-block text-sm font-medium text-ak-primary hover:underline"
                >
                  Start Learning →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Tutorials */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold text-ak-text-primary">All Tutorials</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial) => (
            <Link
              key={tutorial.id}
              to={`/learn/${tutorial.id}`}
              className="group relative overflow-hidden rounded-2xl border border-ak-border bg-ak-surface transition-all duration-base hover:-translate-y-1 hover:shadow-ak-lg"
            >
              {/* Thumbnail placeholder */}
              <div className="relative h-40 bg-gradient-to-br from-ak-primary/20 to-ak-surface-2">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-ak-bg/50 p-4 transition-transform group-hover:scale-110">
                    <PlayIcon />
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {/* Level badge */}
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    levelColors[tutorial.level]
                  }`}
                >
                  {tutorial.level}
                </span>
                
                {/* Title */}
                <h3 className="mt-3 text-lg font-bold text-ak-text-primary group-hover:text-ak-primary transition-colors">
                  {tutorial.title}
                </h3>
                
                {/* Description */}
                <p className="mt-2 text-sm text-ak-text-secondary line-clamp-2">
                  {tutorial.description}
                </p>
                
                {/* Meta */}
                <div className="mt-4 flex items-center gap-2 text-xs text-ak-text-secondary">
                  <ClockIcon />
                  <span>{tutorial.duration}</span>
                  <span className="mx-2">·</span>
                  <span>{tutorial.category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Community Section */}
      <section className="border-t border-ak-border bg-ak-surface px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-ak-text-primary">
            Learn Together
          </h2>
          <p className="mt-4 text-ak-text-secondary">
            Join our community to ask questions, share your projects, and learn from other developers.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://github.com/akis-platform/akis/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-ak-border bg-ak-surface-2 px-6 py-3 font-semibold text-ak-text-primary transition-colors hover:bg-ak-surface"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub Discussions
            </a>
            <a
              href="https://discord.gg/akis"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#4752C4]"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
              </svg>
              Join Discord
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
