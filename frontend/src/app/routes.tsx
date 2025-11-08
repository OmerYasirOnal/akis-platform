import type { ReactNode } from 'react';
import { Route } from 'react-router-dom';
import AgentsIndexPage from '../pages/AgentsIndexPage';
import AgentScribePage from '../pages/agents/AgentScribePage';
import AgentTracePage from '../pages/agents/AgentTracePage';
import AgentProtoPage from '../pages/agents/AgentProtoPage';
import ScribeRunPage from '../pages/agents/ScribeRun';
import TraceRunPage from '../pages/agents/TraceRun';
import ProtoRunPage from '../pages/agents/ProtoRun';

const agentsEnabled =
  String(import.meta.env.VITE_AGENTS_ENABLED ?? '').toLowerCase() === 'true';

export const buildAgentRoutes = (): ReactNode[] => {
  const routes: ReactNode[] = [
    <Route index element={<AgentsIndexPage />} key="agents-index" />,
    <Route path="scribe" element={<AgentScribePage />} key="agents-scribe" />,
    <Route path="trace" element={<AgentTracePage />} key="agents-trace" />,
    <Route path="proto" element={<AgentProtoPage />} key="agents-proto" />,
  ];

  if (agentsEnabled) {
    routes.push(
      <Route path="scribe/run" element={<ScribeRunPage />} key="agents-scribe-run" />,
      <Route path="trace/run" element={<TraceRunPage />} key="agents-trace-run" />,
      <Route path="proto/run" element={<ProtoRunPage />} key="agents-proto-run" />
    );
  }

  return routes;
};

