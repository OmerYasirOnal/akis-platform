export interface EdgeCaseScenario {
  name: string;
  steps: string[];
}

export type EdgeCaseCategory =
  | 'auth'
  | 'session'
  | 'rbac'
  | 'timeout'
  | 'i18n'
  | 'accessibility';

export interface EdgeCaseCategoryCoverage {
  covered: boolean;
  hits: number;
  scenarios: string[];
}

export interface EdgeCaseCoverageSummary {
  categories: Record<EdgeCaseCategory, EdgeCaseCategoryCoverage>;
  coveredCategories: number;
  totalCategories: number;
  coverageRate: number;
  missingCategories: EdgeCaseCategory[];
  asvsCoverage: {
    v2Auth: boolean;
    v3Session: boolean;
    v4AccessControl: boolean;
  };
}

const CATEGORIES: EdgeCaseCategory[] = [
  'auth',
  'session',
  'rbac',
  'timeout',
  'i18n',
  'accessibility',
];

const CATEGORY_KEYWORDS: Record<EdgeCaseCategory, string[]> = {
  auth: ['auth', 'login', 'password', 'token', 'credential', 'oauth', 'mfa'],
  session: ['session', 'cookie', 'refresh token', 'expire', 'idle timeout'],
  rbac: ['rbac', 'role', 'permission', 'access control', 'unauthorized', 'forbidden'],
  timeout: ['timeout', 'retry', 'latency', 'network error', 'slow'],
  i18n: ['i18n', 'locale', 'translation', 'unicode', 'rtl', 'language'],
  accessibility: ['accessibility', 'a11y', 'aria', 'keyboard', 'screen reader', 'contrast'],
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

export function analyzeEdgeCaseCoverage(scenarios: EdgeCaseScenario[]): EdgeCaseCoverageSummary {
  const categories: Record<EdgeCaseCategory, EdgeCaseCategoryCoverage> = {
    auth: { covered: false, hits: 0, scenarios: [] },
    session: { covered: false, hits: 0, scenarios: [] },
    rbac: { covered: false, hits: 0, scenarios: [] },
    timeout: { covered: false, hits: 0, scenarios: [] },
    i18n: { covered: false, hits: 0, scenarios: [] },
    accessibility: { covered: false, hits: 0, scenarios: [] },
  };

  for (const scenario of scenarios) {
    const haystack = normalize(`${scenario.name} ${scenario.steps.join(' ')}`);
    for (const category of CATEGORIES) {
      const keywords = CATEGORY_KEYWORDS[category];
      const matched = keywords.some((keyword) => haystack.includes(keyword));
      if (!matched) continue;

      const bucket = categories[category];
      bucket.hits += 1;
      if (!bucket.scenarios.includes(scenario.name)) {
        bucket.scenarios.push(scenario.name);
      }
      bucket.covered = true;
    }
  }

  for (const category of CATEGORIES) {
    categories[category].scenarios.sort((a, b) => a.localeCompare(b, 'en'));
  }

  const coveredCategories = CATEGORIES.filter((category) => categories[category].covered).length;
  const totalCategories = CATEGORIES.length;
  const missingCategories = CATEGORIES.filter((category) => !categories[category].covered);

  return {
    categories,
    coveredCategories,
    totalCategories,
    coverageRate: coveredCategories / totalCategories,
    missingCategories,
    asvsCoverage: {
      v2Auth: categories.auth.covered,
      v3Session: categories.session.covered,
      v4AccessControl: categories.rbac.covered,
    },
  };
}
