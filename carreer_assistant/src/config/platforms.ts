export type PlatformType = 'upwork' | 'freelancer' | 'fiverr' | 'bionluk' | 'linkedin';
export type AdapterMethod = 'api' | 'browser';

export interface PlatformConfig {
  platform: PlatformType;
  method: AdapterMethod;
  enabled: boolean;
  baseUrl: string;
  rateLimit: {
    requestsPerMinute: number;
    minDelayMs: number;
  };
  priority: number;
}

export const PLATFORM_CONFIGS: Record<PlatformType, PlatformConfig> = {
  upwork: {
    platform: 'upwork',
    method: 'api',
    enabled: true,
    baseUrl: 'https://www.upwork.com/api/graphql',
    rateLimit: {
      requestsPerMinute: 80,
      minDelayMs: 750,
    },
    priority: 0,
  },
  freelancer: {
    platform: 'freelancer',
    method: 'api',
    enabled: true,
    baseUrl: 'https://www.freelancer.com/api',
    rateLimit: {
      requestsPerMinute: 400,
      minDelayMs: 150,
    },
    priority: 0,
  },
  fiverr: {
    platform: 'fiverr',
    method: 'browser',
    enabled: true,
    baseUrl: 'https://www.fiverr.com',
    rateLimit: {
      requestsPerMinute: 10,
      minDelayMs: 3000,
    },
    priority: 1,
  },
  bionluk: {
    platform: 'bionluk',
    method: 'browser',
    enabled: true,
    baseUrl: 'https://bionluk.com',
    rateLimit: {
      requestsPerMinute: 10,
      minDelayMs: 3000,
    },
    priority: 1,
  },
  linkedin: {
    platform: 'linkedin',
    method: 'browser',
    enabled: false,
    baseUrl: 'https://www.linkedin.com',
    rateLimit: {
      requestsPerMinute: 5,
      minDelayMs: 5000,
    },
    priority: 2,
  },
};

export function getEnabledPlatforms(): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS)
    .filter((c) => c.enabled)
    .sort((a, b) => a.priority - b.priority);
}
