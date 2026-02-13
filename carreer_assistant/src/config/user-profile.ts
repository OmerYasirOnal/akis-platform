export type RoleLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'staff';
export type WorkModel = 'remote' | 'hybrid' | 'onsite';

export interface UserProfile {
  name: string;
  targetRoles: RoleLevel[];
  workModels: WorkModel[];
  preferredLocations: string[];
  salaryFloorTRY: number;
  languages: string[];
  techStack: string[];
  bonusKeywords: string[];
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Ömer Yasir Önal',
  targetRoles: ['intern', 'junior'],
  workModels: ['remote', 'hybrid'],
  preferredLocations: ['istanbul', 'turkey', 'remote'],
  salaryFloorTRY: 50000,
  languages: ['tr', 'en'],
  techStack: [
    'typescript', 'javascript', 'nodejs', 'node.js',
    'react', 'reactjs', 'fastify', 'drizzle',
    'postgresql', 'postgres', 'vite', 'tailwind', 'tailwindcss',
  ],
  bonusKeywords: [
    'ai', 'agents', 'automation', 'llm', 'workflow',
    'test automation', 'mcp', 'copilot',
  ],
};

export function loadUserProfile(): UserProfile {
  const env = process.env;

  return {
    name: env.USER_NAME ?? DEFAULT_USER_PROFILE.name,
    targetRoles: (env.USER_ROLE?.split(',') as RoleLevel[]) ?? DEFAULT_USER_PROFILE.targetRoles,
    workModels: (env.USER_WORK_MODEL?.split(',') as WorkModel[]) ?? DEFAULT_USER_PROFILE.workModels,
    preferredLocations: DEFAULT_USER_PROFILE.preferredLocations,
    salaryFloorTRY: env.USER_SALARY_FLOOR_TRY
      ? parseInt(env.USER_SALARY_FLOOR_TRY, 10)
      : DEFAULT_USER_PROFILE.salaryFloorTRY,
    languages: env.USER_LANGUAGES?.split(',') ?? DEFAULT_USER_PROFILE.languages,
    techStack: env.USER_TECH_STACK?.split(',') ?? DEFAULT_USER_PROFILE.techStack,
    bonusKeywords: DEFAULT_USER_PROFILE.bonusKeywords,
  };
}
