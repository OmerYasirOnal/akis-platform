import PagePlaceholder from './PagePlaceholder';

const SolutionsPage = () => (
  <PagePlaceholder
    title="Solutions"
    description="Landing surface for solution narratives segmented by roles and use cases."
    items={[
      'By-role navigation (engineering managers, QA, product)',
      'By-use-case navigation (docs automation, test automation, prototyping)',
      'Success metrics and customer stories',
    ]}
  />
);

export default SolutionsPage;

