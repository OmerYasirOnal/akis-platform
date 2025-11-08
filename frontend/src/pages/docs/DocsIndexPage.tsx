import PagePlaceholder from '../PagePlaceholder';
import Card from '../../components/common/Card';

const DocsIndexPage = () => (
  <PagePlaceholder
    title="AKIS Documentation"
    description="Top-level navigation for docs content. TODO: add getting started checklist, quick links, and release highlights."
  >
    <div className="grid gap-6 md:grid-cols-2">
      {[
        { title: 'Getting Started', path: '/docs/getting-started' },
        { title: 'Agents', path: '/docs/agents' },
        { title: 'Configuration', path: '/docs/configuration' },
        { title: 'Integrations', path: '/docs/integrations' },
        { title: 'API Reference', path: '/docs/api-reference' },
        { title: 'Architecture', path: '/docs/architecture' },
        { title: 'Troubleshooting', path: '/docs/troubleshooting' },
      ].map((doc) => (
        <Card key={doc.title} className="bg-ak-surface">
          <h2 className="text-lg font-semibold text-ak-text-primary">
            {doc.title}
          </h2>
          <p className="mt-2 text-sm text-ak-text-secondary">
            TODO: summary and CTA to {doc.path}
          </p>
        </Card>
      ))}
    </div>
  </PagePlaceholder>
);

export default DocsIndexPage;

