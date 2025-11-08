import PagePlaceholder from './PagePlaceholder';

const PlatformPage = () => (
  <PagePlaceholder
    title="AKIS Platform Overview"
    description="High-level positioning of AKIS Platform capabilities. TODO: add architecture diagram, value pillars, and CTA."
    items={[
      'Hero message with platform overview',
      'Capability grid (Scribe, Trace, Proto)',
      'Integration summary and roadmap',
      'Security and compliance assurances',
    ]}
  />
);

export default PlatformPage;

