import { Link } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
}

// Placeholder blog posts - AKIS-focused content
const blogPosts: BlogPost[] = [
  {
    id: 'introducing-scribe-agent',
    title: 'Introducing Scribe: Your AI-Powered Documentation Assistant',
    excerpt:
      'Learn how Scribe automatically generates comprehensive documentation, changelog entries, and release notes from your Git commits and code changes.',
    date: '2026-01-08',
    author: 'AKIS Team',
    category: 'Product',
    readTime: '5 min read',
  },
  {
    id: 'mcp-integration-philosophy',
    title: 'Why We Chose Model Context Protocol for Integrations',
    excerpt:
      'A deep dive into our decision to use MCP for external service integrations, and how it enables secure, flexible automation without exposing credentials.',
    date: '2026-01-05',
    author: 'AKIS Team',
    category: 'Engineering',
    readTime: '8 min read',
  },
  {
    id: 'secure-ai-key-management',
    title: 'Secure AI Key Management in Multi-Tenant Environments',
    excerpt:
      'How AKIS encrypts and manages user API keys for OpenAI and other providers while maintaining security and compliance.',
    date: '2026-01-02',
    author: 'AKIS Team',
    category: 'Security',
    readTime: '6 min read',
  },
  {
    id: 'roadmap-2026',
    title: 'AKIS Roadmap 2026: Trace, Proto, and Beyond',
    excerpt:
      'A preview of upcoming agents including Trace for debugging assistance and Proto for rapid prototyping, plus our vision for AI-assisted development.',
    date: '2025-12-28',
    author: 'AKIS Team',
    category: 'Roadmap',
    readTime: '4 min read',
  },
  {
    id: 'getting-started-with-akis',
    title: 'Getting Started with AKIS: A Complete Guide',
    excerpt:
      'Step-by-step tutorial on setting up AKIS, connecting your GitHub repositories, and running your first Scribe job.',
    date: '2025-12-20',
    author: 'AKIS Team',
    category: 'Tutorial',
    readTime: '10 min read',
  },
  {
    id: 'oci-free-tier-deployment',
    title: 'Running AKIS on OCI Free Tier: A Cost-Effective Setup',
    excerpt:
      'How we optimized AKIS to run efficiently on Oracle Cloud Infrastructure\'s free tier, and how you can self-host it too.',
    date: '2025-12-15',
    author: 'AKIS Team',
    category: 'DevOps',
    readTime: '7 min read',
  },
];

const categoryColors: Record<string, string> = {
  Product: 'bg-ak-primary/10 text-ak-primary',
  Engineering: 'bg-blue-500/10 text-blue-400',
  Security: 'bg-red-500/10 text-red-400',
  Roadmap: 'bg-purple-500/10 text-purple-400',
  Tutorial: 'bg-green-500/10 text-green-400',
  DevOps: 'bg-yellow-500/10 text-yellow-400',
};

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-16 text-center sm:px-6 lg:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-ak-text-primary sm:text-5xl">
          AKIS Blog
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ak-text-secondary">
          Insights, tutorials, and updates from the AKIS team.
          Learn about AI-assisted development, best practices, and our journey.
        </p>
      </section>

      {/* Blog Posts Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-ak-border bg-ak-surface transition-all duration-base hover:-translate-y-1 hover:shadow-ak-lg"
            >
              {/* Placeholder image area */}
              <div className="h-48 bg-gradient-to-br from-ak-surface-2 to-ak-surface" />
              
              <div className="flex flex-1 flex-col p-6">
                {/* Category badge */}
                <span
                  className={`mb-3 inline-block w-fit rounded-full px-3 py-1 text-xs font-medium ${
                    categoryColors[post.category] || 'bg-ak-surface-2 text-ak-text-secondary'
                  }`}
                >
                  {post.category}
                </span>
                
                {/* Title */}
                <h2 className="text-xl font-bold text-ak-text-primary group-hover:text-ak-primary transition-colors">
                  <Link to={`/blog/${post.id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                
                {/* Excerpt */}
                <p className="mt-3 flex-1 text-ak-text-secondary line-clamp-3">
                  {post.excerpt}
                </p>
                
                {/* Meta */}
                <div className="mt-4 flex items-center justify-between text-sm text-ak-text-secondary">
                  <span>{post.author}</span>
                  <span>{post.date} · {post.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="border-t border-ak-border bg-ak-surface px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold text-ak-text-primary">
            Stay Updated
          </h2>
          <p className="mt-4 text-ak-text-secondary">
            Subscribe to our newsletter for the latest updates on AKIS features,
            tutorials, and AI development best practices.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 text-ak-text-primary placeholder:text-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20"
            />
            <button className="rounded-xl bg-ak-primary px-6 py-3 font-semibold text-ak-bg transition-colors hover:bg-ak-primary/90">
              Subscribe
            </button>
          </div>
          <p className="mt-4 text-xs text-ak-text-secondary">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
