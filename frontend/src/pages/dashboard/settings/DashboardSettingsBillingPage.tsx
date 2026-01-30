import { useEffect, useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { billingApi, type PlanInfo, type UsageInfo, type AvailablePlan } from '../../../services/api/billing';

const TIER_COLORS: Record<string, string> = {
  free: 'text-ak-text-secondary',
  pro: 'text-blue-400',
  pro_plus: 'text-purple-400',
  team: 'text-amber-400',
  enterprise: 'text-emerald-400',
};

function UsageBar({ label, used, limit, percent }: { label: string; used: number; limit: number; percent: number }) {
  const barColor = percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-ak-primary';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ak-text-secondary">{label}</span>
        <span className="font-mono text-ak-text-primary">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ak-surface-2">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  onSelect,
}: {
  plan: AvailablePlan;
  isCurrent: boolean;
  onSelect: (plan: AvailablePlan) => void;
}) {
  const price = plan.priceMonthly === 0 ? 'Free' : `$${(plan.priceMonthly / 100).toFixed(0)}/mo`;
  return (
    <Card className={`bg-ak-surface p-5 space-y-3 ${isCurrent ? 'ring-2 ring-ak-primary' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${TIER_COLORS[plan.tier] ?? 'text-ak-text-primary'}`}>{plan.name}</h3>
        {isCurrent && <span className="rounded-full bg-ak-primary/20 px-2 py-0.5 text-xs font-medium text-ak-primary">Current</span>}
      </div>
      <p className="text-xs text-ak-text-secondary">{plan.description}</p>
      <p className="text-2xl font-bold text-ak-text-primary">{price}</p>
      <ul className="space-y-1 text-xs text-ak-text-secondary">
        <li>{plan.jobsPerDay} jobs/day</li>
        <li>{(plan.maxTokenBudget / 1000).toFixed(0)}K tokens/month</li>
        <li>{plan.maxAgents} agents</li>
        <li>Depth: {plan.depthModesAllowed.join(', ')}</li>
        {plan.passesAllowed > 1 && <li>Multi-pass ({plan.passesAllowed} passes)</li>}
        {plan.priorityQueue && <li>Priority queue</li>}
        <li>{plan.backgroundJobHistoryDays}d job history</li>
      </ul>
      {!isCurrent && plan.tier !== 'enterprise' && plan.priceMonthly > 0 && (
        <Button onClick={() => onSelect(plan)} className="w-full justify-center">
          Upgrade to {plan.name}
        </Button>
      )}
      {plan.tier === 'enterprise' && !isCurrent && (
        <Button variant="outline" className="w-full justify-center" disabled>
          Contact Sales
        </Button>
      )}
    </Card>
  );
}

const DashboardSettingsBillingPage = () => {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [allPlans, setAllPlans] = useState<AvailablePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [currentData, plansData] = await Promise.all([
          billingApi.getCurrentPlan(),
          billingApi.getAvailablePlans(),
        ]);
        if (!active) return;
        setPlan(currentData.plan);
        setUsage(currentData.usage);
        setAllPlans(plansData.plans);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load billing data');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const handleUpgrade = async (selectedPlan: AvailablePlan) => {
    if (!selectedPlan.stripePriceMonthly) {
      setError('This plan is not available for self-service upgrade.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const result = await billingApi.createCheckout(selectedPlan.id, selectedPlan.stripePriceMonthly);
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const result = await billingApi.createPortalSession();
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-ak-text-primary">Billing</h1>
        </header>
        <Card className="bg-ak-surface p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded bg-ak-surface-2" />
            <div className="h-2 w-full rounded bg-ak-surface-2" />
            <div className="h-2 w-2/3 rounded bg-ak-surface-2" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-ak-text-primary">Billing</h1>
        <p className="text-sm text-ak-text-secondary">
          Manage your plan, view usage, and update payment details.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Current Plan + Usage */}
      {plan && usage && (
        <Card className="bg-ak-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ak-text-secondary">Current Plan</p>
              <p className={`text-xl font-bold ${TIER_COLORS[plan.tier] ?? 'text-ak-text-primary'}`}>{plan.name}</p>
            </div>
            {plan.tier !== 'free' && (
              <Button variant="outline" onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UsageBar label="Jobs today" used={usage.jobsUsedToday} limit={usage.jobsLimit} percent={usage.percentJobsUsed} />
            <UsageBar label="Tokens this month" used={usage.tokensUsedThisMonth} limit={usage.tokensLimit} percent={usage.percentTokensUsed} />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-ak-surface-2 p-3">
              <p className="text-xs text-ak-text-secondary">Max Agents</p>
              <p className="text-lg font-bold text-ak-text-primary">{plan.maxAgents}</p>
            </div>
            <div className="rounded-lg bg-ak-surface-2 p-3">
              <p className="text-xs text-ak-text-secondary">Depth Modes</p>
              <p className="text-sm font-medium text-ak-text-primary">{plan.depthModesAllowed.join(', ')}</p>
            </div>
            <div className="rounded-lg bg-ak-surface-2 p-3">
              <p className="text-xs text-ak-text-secondary">Passes</p>
              <p className="text-lg font-bold text-ak-text-primary">{plan.passesAllowed}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Available Plans */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-ak-text-primary">Available Plans</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {allPlans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              isCurrent={p.id === plan?.planId}
              onSelect={handleUpgrade}
            />
          ))}
        </div>
      </div>

      {checkoutLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="bg-ak-surface p-6 text-center">
            <p className="text-ak-text-primary">Redirecting to checkout...</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardSettingsBillingPage;
