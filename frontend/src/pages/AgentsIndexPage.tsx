import PagePlaceholder from './PagePlaceholder';
import Card from '../components/common/Card';

const AgentsIndexPage = () => (
  <PagePlaceholder
    title="AKIS Agents"
    description="Landing page for individual agent deep-dives. TODO: include navigation cards for Scribe, Trace, and Proto with summary copy."
  >
    <div className="grid gap-6 md:grid-cols-3">
      {[
        {
          name: 'Scribe',
          path: '/agents/scribe',
          blurb: 'Automates documentation from Git workflows.',
        },
        {
          name: 'Trace',
          path: '/agents/trace',
          blurb: 'Generates and audits test plans from Jira tickets.',
        },
        {
          name: 'Proto',
          path: '/agents/proto',
          blurb: 'Turns specs into working MVP scaffolds rapidly.',
        },
      ].map((agent) => (
        <Card key={agent.name} className="bg-ak-surface">
          <h2 className="text-xl font-semibold text-ak-text-primary">
            {agent.name}
          </h2>
          <p className="mt-3 text-sm text-ak-text-secondary">
            {agent.blurb}
          </p>
          <p className="mt-5 text-sm text-ak-primary">
            TODO: link to {agent.path}
          </p>
        </Card>
      ))}
    </div>
  </PagePlaceholder>
);

export default AgentsIndexPage;

