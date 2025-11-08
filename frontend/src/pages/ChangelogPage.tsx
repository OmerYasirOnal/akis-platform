import PagePlaceholder from './PagePlaceholder';

const ChangelogPage = () => (
  <PagePlaceholder
    title="Changelog"
    description="Release notes and iteration summaries. TODO: integrate with docs automation for Scribe-based release notes."
    items={[
      'Reverse chronological release entries',
      'Highlights, bug fixes, and upcoming changes',
      'RSS / email subscription CTA',
    ]}
  />
);

export default ChangelogPage;

