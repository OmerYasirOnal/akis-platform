import type { Env } from './env.js';

export type EnvChecklistItem = {
  key: string;
  label: string;
  status: 'ok' | 'missing';
  hint?: string;
};

export type EnvFeatureFlags = {
  aiEnabled: boolean;
  githubOAuthEnabled: boolean;
  githubAppEnabled: boolean;
};

export type EnvStatus = {
  checklist: EnvChecklistItem[];
  flags: EnvFeatureFlags;
};

export function buildEnvStatus(env: Env): EnvStatus {
  const checklist: EnvChecklistItem[] = [];

  const githubOAuthOk =
    Boolean(env.GITHUB_OAUTH_CLIENT_ID) &&
    Boolean(env.GITHUB_OAUTH_CLIENT_SECRET) &&
    Boolean(env.GITHUB_OAUTH_CALLBACK_URL);

  const githubAppOk = Boolean(env.GITHUB_APP_ID) && Boolean(env.GITHUB_APP_PRIVATE_KEY);

  const aiOk = Boolean(env.OPENROUTER_API_KEY);

  checklist.push({
    key: 'github-oauth',
    label: 'GitHub OAuth (user login)',
    status: githubOAuthOk ? 'ok' : 'missing',
    hint: githubOAuthOk
      ? undefined
      : 'Set GITHUB_OAUTH_CLIENT_ID / SECRET / CALLBACK_URL to enable GitHub SSO.',
  });

  checklist.push({
    key: 'github-app',
    label: 'GitHub App (installation tokens)',
    status: githubAppOk ? 'ok' : 'missing',
    hint: githubAppOk
      ? undefined
      : 'Set GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY to enable repository access.',
  });

  checklist.push({
    key: 'openrouter',
    label: 'OpenRouter API access',
    status: aiOk ? 'ok' : 'missing',
    hint: aiOk
      ? undefined
      : 'Set OPENROUTER_API_KEY to enable AI completions (mock mode otherwise).',
  });

  const refererOk = Boolean(env.OPENROUTER_APP_REFERER);
  const titleOk = Boolean(env.OPENROUTER_APP_TITLE);

  checklist.push({
    key: 'openrouter-referer',
    label: 'OpenRouter attribution referer/title',
    status: refererOk && titleOk ? 'ok' : 'missing',
    hint: 'Set OPENROUTER_APP_REFERER ve OPENROUTER_APP_TITLE env değerlerini girerek doğru attribution sağlayın.',
  });

  checklist.push({
    key: 'jwt-secret',
    label: 'JWT secret strength',
    status: env.AUTH_JWT_SECRET && env.AUTH_JWT_SECRET.length >= 32 ? 'ok' : 'missing',
    hint: 'Use at least 32 characters for AUTH_JWT_SECRET to secure sessions.',
  });

  checklist.push({
    key: 'db-url',
    label: 'Database connection',
    status: env.DATABASE_URL ? 'ok' : 'missing',
    hint: 'Set DATABASE_URL=postgres://user:pass@host:5432/akis',
  });

  return {
    checklist,
    flags: {
      aiEnabled: aiOk,
      githubOAuthEnabled: githubOAuthOk,
      githubAppEnabled: githubAppOk,
    },
  };
}

