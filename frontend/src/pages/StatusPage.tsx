import PagePlaceholder from './PagePlaceholder';

const StatusPage = () => (
  <PagePlaceholder
    title="System Status"
    description="Public status portal placeholder. TODO: embed status.akis.dev or third-party status widget."
    items={[
      'Current uptime indicators',
      'Incident history log',
      'Subscribe to notifications CTA',
    ]}
  />
);

export default StatusPage;

