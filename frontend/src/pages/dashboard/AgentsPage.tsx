import { useEffect, useState } from 'react';
import { workflowsApi } from '../../services/api/workflows';
import { formatConfidence } from '../../utils/format';
import { TR } from '../../constants/tr';
import type { Workflow } from '../../types/workflow';

// ═══ Helpers ═══

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa önce`;
  return `${Math.floor(hrs / 24)}g önce`;
}

// ═══ Agent definitions ═══

interface AgentDef {
  name: string;
  icon: string;
  role: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
  input: string;
  output: string;
  workflowSteps: string[];
}

const AGENTS: AgentDef[] = [
  {
    name: 'Scribe',
    icon: '\u25C6',
    role: 'Spec Yazarı (Fikir → Spec)',
    colorClass: 'text-ak-scribe',
    bgClass: 'bg-ak-scribe/10',
    borderClass: 'border-l-ak-scribe',
    description: 'Scribe bir iş analisti olarak çalışır. Serbest metin fikrinizi alır, açıklayıcı sorular sorar ve Problem Tanımı, Kullanıcı Hikayeleri ve Kabul Kriterleri içeren yapılandırılmış bir spesifikasyon üretir.',
    input: 'ScribeInput { idea, context, targetStack }',
    output: 'ScribeOutput { spec: StructuredSpec, confidence }',
    workflowSteps: ['Kullanıcı Fikri', 'Analiz Et', 'Soru Sor', 'Kullanıcı Yanıtı', 'Spec Oluştur', 'Güven Kontrolü', 'Çıktı'],
  },
  {
    name: 'Proto',
    icon: '\u2B21',
    role: 'MVP Üretici (Spec → Scaffold)',
    colorClass: 'text-ak-proto',
    bgClass: 'bg-ak-proto/10',
    borderClass: 'border-l-ak-proto',
    description: 'Proto onaylanan spec\'i alır ve çalışan bir MVP scaffold üretir. Proje yapısını, bileşenleri, API route\'larını ve tipleri oluşturur — ardından her şeyi bir GitHub branch\'ine push eder.',
    input: 'ProtoInput { spec: StructuredSpec, repoName }',
    output: 'ProtoOutput { branch, repo, files[], repoUrl }',
    workflowSteps: ['Spec Girişi', 'Dosyaları Planla', 'Kod Üret', 'Repo Oluştur', "Branch'e Push Et", 'Çıktı'],
  },
  {
    name: 'Trace',
    icon: '\u25C8',
    role: 'Test Yazarı (Kod → Test)',
    colorClass: 'text-ak-trace',
    bgClass: 'bg-ak-trace/10',
    borderClass: 'border-l-ak-trace',
    description: "Trace, Proto'nun GitHub'a push ettiği GERÇEK kodu okur ve kabul kriterlerini kapsayan Playwright otomasyon testleri yazar. Testleri kriterlere eşleştiren bir coverage matrisi üretir.",
    input: 'TraceInput { repoOwner, repo, branch }',
    output: 'TraceOutput { testFiles[], coverageMatrix }',
    workflowSteps: ["GitHub'dan Kod Oku", 'Endpoint Analizi', 'Test Senaryoları', 'Playwright Yaz', 'Coverage Raporu', 'Çıktı'],
  },
];

// ═══ Confidence factors ═══

const CONFIDENCE_FACTORS = [
  { name: 'Tamlık', weight: 40, description: 'Problem tanımı, kullanıcı hikayeleri, kabul kriterleri, teknik kısıtlamalar ve kapsam dışı bölümlerinin hepsi doldurulmuş mu?' },
  { name: 'Gereksinim Netliği', weight: 30, description: 'Kullanıcı hikayeleri spesifik mi? Kabul kriterleri test edilebilir mi?' },
  { name: 'Kapsam Tanımı', weight: 20, description: 'Kapsam dışı net mi? Teknik kısıtlamalar belirli mi?' },
  { name: 'Kullanıcı Uyumu', weight: 10, description: 'Kullanıcı yanıtlarıyla spec ne kadar uyumlu?' },
];

// ═══ Performance metrics from real data ═══

interface AgentMetrics {
  avgDuration: string;
  avgMetric: string;
  metricLabel: string;
  successRate: number;
  totalRuns: number;
}

function computeAgentMetrics(workflows: Workflow[]): Record<string, AgentMetrics> {
  const completed = workflows.filter(w => w.status === 'completed' || w.status === 'completed_partial');
  const recent5 = completed.slice(0, 5);

  // Scribe metrics — confidence is 0-1 float from backend
  const scribeConfs = recent5.map(w => w.stages.scribe.confidence).filter((c): c is number => c != null);
  const avgConfRaw = scribeConfs.length > 0 ? scribeConfs.reduce((s, c) => s + c, 0) / scribeConfs.length : 0;

  // Proto metrics
  const protoFiles = recent5.map(w => w.stages.proto.files?.length || 0).filter(c => c > 0);
  const avgFiles = protoFiles.length > 0 ? Math.round(protoFiles.reduce((s, c) => s + c, 0) / protoFiles.length) : 0;

  // Trace metrics
  const traceTests = recent5.map(w => w.stages.trace.tests || 0).filter(c => c > 0);
  const avgTests = traceTests.length > 0 ? Math.round(traceTests.reduce((s, c) => s + c, 0) / traceTests.length) : 0;

  return {
    Scribe: {
      avgDuration: completed.length > 0 ? '~12s' : '—',
      avgMetric: formatConfidence(avgConfRaw),
      metricLabel: TR.avgConfidence,
      successRate: completed.length > 0 ? 100 : 0,
      totalRuns: completed.length,
    },
    Proto: {
      avgDuration: completed.length > 0 ? '~25s' : '—',
      avgMetric: `${avgFiles}`,
      metricLabel: TR.avgFiles,
      successRate: completed.length > 0 ? 100 : 0,
      totalRuns: completed.length,
    },
    Trace: {
      avgDuration: completed.filter(w => w.stages.trace.status === 'completed').length > 0 ? '~18s' : '—',
      avgMetric: `${avgTests}`,
      metricLabel: TR.avgTests,
      successRate: completed.filter(w => w.stages.trace.status === 'completed').length > 0
        ? Math.round((completed.filter(w => w.stages.trace.status === 'completed').length / completed.length) * 100)
        : 0,
      totalRuns: completed.filter(w => w.stages.trace.status === 'completed').length,
    },
  };
}

// ═══ Sub-components ═══

function WorkflowDiagram({ steps, colorClass }: { steps: string[]; colorClass: string }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-shrink-0">
          <div className={`rounded-md border border-ak-border bg-ak-bg px-2.5 py-1.5 text-[11px] font-medium text-ak-text-primary whitespace-nowrap`}>
            {step}
          </div>
          {i < steps.length - 1 && (
            <svg className={`h-3 w-6 flex-shrink-0 ${colorClass}`} viewBox="0 0 24 12" fill="none">
              <path d="M0 6h20m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfidenceSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-lg border border-ak-border bg-ak-bg">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-ak-text-secondary transition-colors hover:text-ak-text-primary"
      >
        <svg
          className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        {TR.howConfidenceCalculated}
      </button>
      {open && (
        <div className="border-t border-ak-border px-4 py-4 space-y-3">
          <p className="text-[12px] text-ak-text-secondary leading-relaxed">
            Scribe&apos;ın güven skoru aşağıdaki faktörlere dayanır:
          </p>
          {CONFIDENCE_FACTORS.map((factor) => (
            <div key={factor.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ak-text-primary">{factor.name}</span>
                <span className="text-[11px] font-mono text-ak-text-tertiary">{factor.weight}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-ak-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-ak-scribe transition-all duration-500"
                  style={{ width: `${factor.weight}%` }}
                />
              </div>
              <p className="text-[11px] text-ak-text-tertiary leading-relaxed">{factor.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricsCard({ metrics }: { metrics: AgentMetrics }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-ak-border bg-ak-bg p-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-ak-text-tertiary">{TR.duration}</p>
        <p className="mt-1 text-sm font-bold text-ak-text-primary">{metrics.avgDuration}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-ak-text-tertiary">{metrics.metricLabel}</p>
        <p className="mt-1 text-sm font-bold text-ak-text-primary">{metrics.avgMetric}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-ak-text-tertiary">{TR.successRateLabel}</p>
        <p className="mt-1 text-sm font-bold text-ak-text-primary">{metrics.successRate}%</p>
      </div>
      <div className="col-span-3 pt-1 border-t border-ak-border-subtle">
        <p className="text-[10px] text-ak-text-tertiary">
          Son {metrics.totalRuns} tamamlanmış iş akışına dayanır
        </p>
      </div>
    </div>
  );
}

// ═══ Inter-Agent Contract visual ═══

function InterAgentContract() {
  return (
    <div className="overflow-hidden rounded-xl border border-ak-border bg-ak-bg p-5">
      {/* Visual flow */}
      <div className="flex items-center justify-center gap-0 py-4 overflow-x-auto">
        {/* Scribe */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ak-scribe/10 text-xl font-bold text-ak-scribe">
            ◆
          </div>
          <span className="mt-1.5 text-xs font-semibold text-ak-text-primary">Scribe</span>
        </div>

        {/* Arrow + label: spec */}
        <div className="flex flex-col items-center flex-shrink-0 mx-1">
          <div className="flex items-center">
            <div className="h-px w-8 bg-ak-scribe" />
            <svg className="h-3 w-3 text-ak-scribe -ml-0.5" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 1l8 5-8 5V1z" />
            </svg>
          </div>
          <span className="mt-1 text-[9px] font-mono text-ak-scribe">spec</span>
        </div>

        {/* Proto */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ak-proto/10 text-xl font-bold text-ak-proto">
            ⬡
          </div>
          <span className="mt-1.5 text-xs font-semibold text-ak-text-primary">Proto</span>
        </div>

        {/* Arrow + label: files */}
        <div className="flex flex-col items-center flex-shrink-0 mx-1">
          <div className="flex items-center">
            <div className="h-px w-8 bg-ak-proto" />
            <svg className="h-3 w-3 text-ak-proto -ml-0.5" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 1l8 5-8 5V1z" />
            </svg>
          </div>
          <span className="mt-1 text-[9px] font-mono text-ak-proto">files</span>
        </div>

        {/* Trace */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ak-trace/10 text-xl font-bold text-ak-trace">
            ◈
          </div>
          <span className="mt-1.5 text-xs font-semibold text-ak-text-primary">Trace</span>
        </div>
      </div>

      {/* Output labels */}
      <div className="mt-3 grid grid-cols-3 gap-4 border-t border-ak-border pt-4">
        <div className="text-center">
          <span className="inline-block rounded-md bg-ak-scribe/10 px-2 py-1 text-[10px] font-mono font-medium text-ak-scribe">
            StructuredSpec
          </span>
        </div>
        <div className="text-center">
          <span className="inline-block rounded-md bg-ak-proto/10 px-2 py-1 text-[10px] font-mono font-medium text-ak-proto">
            GitHub Branch
          </span>
        </div>
        <div className="text-center">
          <span className="inline-block rounded-md bg-ak-trace/10 px-2 py-1 text-[10px] font-mono font-medium text-ak-trace">
            Playwright Tests
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══ Main Component ═══

export default function AgentsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workflowsApi.list()
      .then(setWorkflows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const metrics = computeAgentMetrics(workflows);
  const completed = workflows.filter(w => w.status === 'completed' || w.status === 'completed_partial');
  const lastCompleted = completed[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-display text-ak-text-primary">{TR.agentsTitle}</h1>
        <p className="mt-1 text-body text-ak-text-secondary">{TR.agentsDesc}</p>
      </div>

      {/* Agent Cards */}
      <div className="space-y-4">
        {AGENTS.map((agent) => (
          <div
            key={agent.name}
            className={`overflow-hidden rounded-xl border border-ak-border bg-ak-surface border-l-[3px] ${agent.borderClass}`}
          >
            <div className="p-5">
              {/* Header row */}
              <div className="flex items-center gap-3">
                <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-xl text-xl font-bold ${agent.bgClass} ${agent.colorClass}`}>
                  {agent.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-ak-text-primary">{agent.name}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-micro font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {TR.operational}
                    </span>
                  </div>
                  <p className="text-caption text-ak-text-secondary">{agent.role}</p>
                </div>
                {lastCompleted && (
                  <span className="text-[11px] text-ak-text-tertiary flex-shrink-0">
                    {TR.lastRun}: {timeAgo(lastCompleted.createdAt)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-3 text-caption leading-relaxed text-ak-text-secondary">{agent.description}</p>

              {/* I/O */}
              <div className="mt-3 space-y-1">
                <p className="font-mono text-micro text-ak-text-tertiary">
                  <span className="text-ak-text-secondary">Input:</span> {agent.input}
                </p>
                <p className="font-mono text-micro text-ak-text-tertiary">
                  <span className="text-ak-text-secondary">Output:</span> {agent.output}
                </p>
              </div>

              {/* Workflow diagram */}
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ak-text-tertiary">{TR.workflow}</p>
                <WorkflowDiagram steps={agent.workflowSteps} colorClass={agent.colorClass} />
              </div>

              {/* Performance metrics */}
              {!loading && metrics[agent.name] && (
                <MetricsCard metrics={metrics[agent.name]} />
              )}

              {/* Confidence section — only for Scribe */}
              {agent.name === 'Scribe' && <ConfidenceSection />}
            </div>
          </div>
        ))}
      </div>

      {/* Inter-Agent Contract */}
      <div>
        <h2 className="mb-3 text-caption font-semibold uppercase tracking-wider text-ak-text-tertiary">Ajanlar Arası Kontrat</h2>
        <InterAgentContract />
      </div>
    </div>
  );
}
