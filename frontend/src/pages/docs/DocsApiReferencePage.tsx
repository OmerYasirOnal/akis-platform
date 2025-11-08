import PagePlaceholder from '../PagePlaceholder';

const DocsApiReferencePage = () => (
  <PagePlaceholder
    title="Docs — API Reference"
    description="REST endpoints, schemas, and CLI command catalog. TODO: embed OpenAPI snippets and usage samples."
    items={[
      'Authentication and rate limiting notes',
      'Jobs API endpoints with response payloads',
      'Webhook and CLI references',
    ]}
  />
);

export default DocsApiReferencePage;

