import PagePlaceholder from './PagePlaceholder';

const IntegrationsPage = () => (
  <PagePlaceholder
    title="Integrations"
    description="Catalog of supported and upcoming integrations. TODO: add live cards for GitHub, Jira, Confluence, plus coming-soon announcements."
    items={[
      'Integration cards with status badges',
      'Setup guide links and permissions matrix',
      'Integration request form CTA',
    ]}
  />
);

export default IntegrationsPage;

