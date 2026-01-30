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

export const billingApi = {
  async getCurrentPlan(): Promise<{ plan: PlanInfo; usage: UsageInfo }> {
    const res = await fetch(`${apiBaseURL}/api/billing/plan`, withCredentials);
    if (!res.ok) throw new Error(`Failed to fetch plan: ${res.status}`);
    return res.json();
  },

  async getAvailablePlans(): Promise<{ plans: AvailablePlan[] }> {
    const res = await fetch(`${apiBaseURL}/api/billing/plans`, withCredentials);
    if (!res.ok) throw new Error(`Failed to fetch plans: ${res.status}`);
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
