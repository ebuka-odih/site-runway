import { useEffect, type ComponentType } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CandlestickChart,
  Coins,
  Compass,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';

type ProductSection = {
  id: string;
  title: string;
  summary: string;
  whatItSolves: string;
  workflow: string[];
  capabilities: string[];
  bestFor: string;
  Icon: ComponentType<{ className?: string }>;
};

const sections: ProductSection[] = [
  {
    id: 'buy-crypto',
    title: 'Buy Crypto',
    summary:
      'Fund quickly and purchase major assets with clear pricing, account-tier controls, and immediate execution feedback.',
    whatItSolves:
      'Makes onboarding and first purchase simple without hiding fees, transfer statuses, or settlement timing.',
    workflow: [
      'Choose funding rail and payment method based on your region.',
      'Preview conversion price, quoted spread, and final receivable amount.',
      'Confirm purchase and receive instant order confirmation in-app.',
    ],
    capabilities: [
      'Payment method support for card and wallet transfers',
      'Verification-based limits with transparent increase path',
      'Trade confirmation receipts and account history exports',
    ],
    bestFor: 'New accounts and fast top-ups before active trading sessions.',
    Icon: Coins,
  },
  {
    id: 'markets',
    title: 'Markets',
    summary:
      'Monitor cross-asset activity from one place using live movers, volume shifts, and market-structure context.',
    whatItSolves:
      'Reduces noise by surfacing market breadth and directional signals before you commit capital.',
    workflow: [
      'Scan top movers, losers, and volume spikes.',
      'Add symbols to watchlists for repeated review.',
      'Move directly from discovery to execution when setup criteria match.',
    ],
    capabilities: [
      'Consolidated overview across spot and derivative products',
      'Watchlist-first layout for recurring decision workflows',
      'High-signal summary cards for trend, momentum, and volatility',
    ],
    bestFor: 'Pre-trade research and market open preparation.',
    Icon: BarChart3,
  },
  {
    id: 'trade',
    title: 'Trade',
    summary:
      'Use low-latency order entry with straightforward controls for market, limit, and protective trade actions.',
    whatItSolves:
      'Improves execution discipline by making order intent, size, and risk parameters visible before submit.',
    workflow: [
      'Select symbol and side, then define size and order type.',
      'Review exposure preview and estimated impact.',
      'Submit, track fill status, and monitor open position in real time.',
    ],
    capabilities: [
      'Order ticket designed for mobile and desktop speed',
      'Live position state with status notifications',
      'Session-safe controls to reduce accidental submissions',
    ],
    bestFor: 'Active traders who need responsive execution and clear position state.',
    Icon: CandlestickChart,
  },
  {
    id: 'derivatives',
    title: 'Derivatives',
    summary:
      'Trade leveraged instruments with visibility into margin use, liquidation thresholds, and exposure drift.',
    whatItSolves:
      'Turns complex leverage risk into readable guardrails so exposure can be managed before and after entry.',
    workflow: [
      'Set leverage and review maintenance margin requirements.',
      'Open position with clear liquidation and risk markers.',
      'Adjust or close using size controls and risk-driven alerts.',
    ],
    capabilities: [
      'Margin and leverage breakdowns before confirmation',
      'Exposure indicators with liquidation awareness',
      'Risk reminders for volatile market windows',
    ],
    bestFor: 'Advanced users managing directional or hedged leverage positions.',
    Icon: ShieldCheck,
  },
];

const guardrails = [
  {
    title: 'Risk-Signaling UI',
    body: 'Critical actions include visible warning states for leverage, concentration, and liquidity sensitivity.',
    Icon: Sparkles,
  },
  {
    title: 'Workflow Continuity',
    body: 'Discovery, watchlist, and execution screens are connected to reduce context switching under pressure.',
    Icon: Workflow,
  },
  {
    title: 'Cross-Page Routing',
    body: 'Header, footer, and legal links all resolve to dedicated destinations with no dead-end routes.',
    Icon: Compass,
  },
];

export default function Products() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const sectionId = location.hash.slice(1);
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-14">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 md:p-10">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div className="space-y-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#34D399]">Product Atlas</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Platform Navigation and Product Coverage</h1>
            <p className="text-slate-300 leading-relaxed max-w-3xl">
              This page maps every major menu destination to detailed functionality so users understand where to start,
              what each area handles, and how to move from discovery to execution safely.
            </p>
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  to={`/products#${section.id}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                >
                  {section.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#0B1A17] p-4">
            <svg viewBox="0 0 360 220" className="w-full h-auto" role="img" aria-label="Product flow">
              <defs>
                <linearGradient id="flowStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <rect x="8" y="8" width="344" height="204" rx="18" fill="#07110F" stroke="#134E4A" />
              <path d="M45 160 C90 105, 120 115, 165 90 S250 35, 318 48" stroke="url(#flowStroke)" strokeWidth="3" fill="none" />
              <circle cx="45" cy="160" r="8" fill="#34D399" />
              <circle cx="165" cy="90" r="8" fill="#34D399" />
              <circle cx="318" cy="48" r="8" fill="#34D399" />
              <text x="30" y="188" fill="#A7F3D0" fontSize="11">Buy</text>
              <text x="150" y="118" fill="#A7F3D0" fontSize="11">Trade</text>
              <text x="285" y="76" fill="#A7F3D0" fontSize="11">Derivatives</text>
            </svg>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        {sections.map(({ id, title, summary, whatItSolves, workflow, capabilities, bestFor, Icon }) => (
          <section
            id={id}
            key={id}
            className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 scroll-mt-28"
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#059669]/20 flex items-center justify-center text-[#34D399] shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <p className="text-slate-300 leading-relaxed">{summary}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#34D399] mb-2">What It Solves</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{whatItSolves}</p>
                </article>
                <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#34D399] mb-2">Best For</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{bestFor}</p>
                </article>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#34D399] mb-3">Typical Workflow</h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {workflow.map((step) => (
                      <li key={step} className="flex items-start gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#34D399] mb-3">Core Capabilities</h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {capabilities.map((capability) => (
                      <li key={capability} className="flex items-start gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                        <span>{capability}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#0A0F1A] p-6 md:p-8">
        <h3 className="text-xl font-bold mb-4">Operational Guardrails</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {guardrails.map(({ title, body, Icon }) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <Icon className="w-5 h-5 text-[#34D399] mb-3" />
              <h4 className="font-semibold text-white mb-2">{title}</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0A0F1A] p-6 md:p-8">
        <h3 className="text-xl font-bold mb-3">Privacy and Legal Links</h3>
        <p className="text-slate-400 text-sm mb-6">
          Every legal destination below is active and mapped to a dedicated policy page.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/risk" className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold transition-colors">
            Risk Disclosure <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/privacy" className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold transition-colors">
            Privacy Policy <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/terms" className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold transition-colors">
            Terms of Service <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
