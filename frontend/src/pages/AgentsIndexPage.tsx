import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { agentsApi, type AgentDefinition } from '../services/api/agents';
import { useI18n } from '../i18n/useI18n';
import { useAuth } from '../state/auth/AuthContext';

const agentsEnabled =
  String(import.meta.env.VITE_AGENTS_ENABLED ?? '').toLowerCase() === 'true';

const AgentsIndexPage = () => {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<AgentDefinition[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadAgents = async () => {
      try {
        const response = await agentsApi.listAgents();
        if (!cancelled) {
          setAgents(response);
        }
      } catch (error) {
        console.error('Failed to load agents index', error);
      }
    };

    void loadAgents();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="space-y-3 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/70">
          {t('agents.index.subtitle')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('agents.index.title')}
        </h1>
        <p className="text-sm text-ak-text-secondary sm:max-w-2xl">
          {t('agents.index.description')}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="flex h-full flex-col justify-between bg-ak-surface">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
                  {t('agents.index.agentLabel')}
                </p>
                <h2 className="text-xl font-semibold text-ak-text-primary">{agent.name}</h2>
              </div>
              <p className="text-sm text-ak-text-secondary">{agent.description}</p>
              <ul className="space-y-2 text-sm text-ak-text-secondary/90">
                {agent.capabilities.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-ak-primary">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button as={Link} to={`/agents/${agent.id}`} variant="ghost">
                {t('agents.index.viewDetails')}
              </Button>
              {agentsEnabled ? (
                <Button as={Link} to={`/agents/${agent.id}/run`}>
                  {t('agents.index.runCta')}
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {t('agents.index.runComingSoon')}
                </Button>
              )}
              {agentsEnabled && !isAuthenticated ? (
                <p className="text-xs text-ak-text-secondary/70">
                  {t('agents.index.requireLogin')}
                </p>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AgentsIndexPage;

