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

// AKIS-focused blog content
const blogPosts: BlogPost[] = [
  {
    id: 'introducing-scribe-agent',
    title: 'Introducing Scribe: Your AI-Powered Documentation Assistant',
    excerpt:
      'Scribe transforms your Git activity into living documentation. See how teams are saving 10+ hours weekly on changelog, API docs, and release notes.',
    date: '2026-01-08',
    author: 'AKIS Team',
    category: 'Product',
    readTime: '5 min read',
  },
  {
    id: 'mcp-integration-philosophy',
    title: 'Why We Chose Model Context Protocol for Integrations',
    excerpt:
      'MCP enables zero-credential integrations. Learn how AKIS agents communicate with GitHub, Jira, and Confluence without storing your tokens.',
    date: '2026-01-05',
    author: 'AKIS Team',
    category: 'Engineering',
    readTime: '8 min read',
  },
  {
    id: 'secure-ai-key-management',
    title: 'Secure AI Key Management in Multi-Tenant Environments',
    excerpt:
      'Your API keys are encrypted at rest with AES-256-GCM. Discover our defense-in-depth approach to protecting sensitive credentials.',
    date: '2026-01-02',
    author: 'AKIS Team',
    category: 'Security',
    readTime: '6 min read',
  },
  {
    id: 'roadmap-2026',
    title: 'AKIS Roadmap 2026: Trace, Proto, and Beyond',
    excerpt:
      'Trace generates test plans from Jira specs. Proto scaffolds MVPs in minutes. Here is what we are shipping next and why it matters for your team.',
    date: '2025-12-28',
    author: 'AKIS Team',
    category: 'Roadmap',
    readTime: '4 min read',
  },
  {
    id: 'getting-started-with-akis',
    title: 'Getting Started with AKIS: A Complete Guide',
    excerpt:
      'From signup to your first automated PR in under 10 minutes. Follow this hands-on walkthrough to connect GitHub and run Scribe.',
    date: '2025-12-20',
    author: 'AKIS Team',
    category: 'Tutorial',
    readTime: '10 min read',
  },
  {
    id: 'oci-free-tier-deployment',
    title: 'Running AKIS on OCI Free Tier: A Cost-Effective Setup',
    excerpt:
      'Self-host AKIS for $0/month. We share our ARM64 optimizations, Docker Compose config, and production-ready deployment scripts.',
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
            <button className="rounded-xl bg-ak-primary px-6 py-3 font-semibold text-[#111418] transition-colors hover:brightness-110 active:brightness-95">
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
