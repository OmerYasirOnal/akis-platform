/**
 * Billing API client
 */
const apiBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

const withCredentials: RequestInit = { credentials: 'include' };

export interface PlanInfo {
  planId: string;
  tier: string;
  name: string;
  jobsPerDay: number;
  maxTokenBudget: number;
  maxAgents: number;
  depthModesAllowed: string[];
  maxOutputTokensPerJob: number;
  passesAllowed: number;
  priorityQueue: boolean;
  priceMonthly: number;
}

export interface UsageInfo {
  jobsUsedToday: number;
  tokensUsedThisMonth: number;
  jobsLimit: number;
  tokensLimit: number;
  percentJobsUsed: number;
  percentTokensUsed: number;
}

export interface AvailablePlan {
  id: string;
  tier: string;
  name: string;
  description: string | null;
  jobsPerDay: number;
  maxTokenBudget: number;
  maxAgents: number;
  depthModesAllowed: string[];
  maxOutputTokensPerJob: number;
  passesAllowed: number;
  priorityQueue: boolean;
  backgroundJobHistoryDays: number;
  priceMonthly: number;
  priceYearly: number;
  stripePriceMonthly: string | null;
  stripePriceYearly: string | null;
  sortOrder: number;
}

export interface BillingSettings {
  monthlyBudgetUsd: number | null;
  softThresholdPct: number;
  hardStopEnabled: boolean;
}

export interface BillingNotification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface UserOverride {
  userId: string;
  monthlyBudgetUsd: number | null;
  isUnlimited: boolean;
}

export const billingApi = {
  async getCurrentPlan(): Promise<{ plan: PlanInfo; usage: UsageInfo; unlimited: boolean; role: string }> {
    const res = await fetch(`${apiBaseURL}/api/billing/plan`, withCredentials);
    if (!res.ok) throw new Error(`Failed to fetch plan: ${res.status}`);
    return res.json();
  },

  async getAvailablePlans(): Promise<{ plans: AvailablePlan[] }> {
    const res = await fetch(`${apiBaseURL}/api/billing/plans`, withCredentials);
    if (!res.ok) throw new Error(`Failed to fetch plans: ${res.status}`);
    return res.json();
  },

  async getSettings(): Promise<BillingSettings> {
    const res = await fetch(`${apiBaseURL}/api/billing/settings`, withCredentials);
    if (!res.ok) throw new Error(`Failed to fetch settings: ${res.status}`);
    return res.json();
  },

  async updateSettings(settings: Partial<BillingSettings>): Promise<BillingSettings> {
    const res = await fetch(`${apiBaseURL}/api/billing/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      ...withCredentials,
    });
    if (!res.ok) throw new Error(`Failed to update settings: ${res.status}`);
    return res.json();
  },

  async getNotifications(): Promise<{ notifications: BillingNotification[] }> {
    const res = await fetch(`${apiBaseURL}/api/billing/notifications`, withCredentials);
    if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
    return res.json();
  },

  async setUserOverride(userId: string, override: { monthlyBudgetUsd?: number | null; isUnlimited?: boolean }): Promise<{ override: UserOverride }> {
    const res = await fetch(`${apiBaseURL}/api/billing/user-override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...override }),
      ...withCredentials,
    });
    if (!res.ok) throw new Error(`Failed to set override: ${res.status}`);
    return res.json();
  },

  async createCheckout(planId: string, priceId: string): Promise<{ sessionId: string; url: string }> {
    const res = await fetch(`${apiBaseURL}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, priceId }),
      ...withCredentials,
    });
    if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
    return res.json();
  },

  async createPortalSession(): Promise<{ url: string }> {
    const res = await fetch(`${apiBaseURL}/api/billing/portal`, {
      method: 'POST',
      ...withCredentials,
    });
    if (!res.ok) throw new Error(`Portal session failed: ${res.status}`);
    return res.json();
  },
};
