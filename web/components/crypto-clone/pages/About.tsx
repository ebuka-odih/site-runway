import { Link } from 'react-router-dom';
import { ArrowRight, Globe2, Radar, Server, ShieldCheck, Users, WalletCards, Zap } from 'lucide-react';
import { resolveBrandName } from '../../../lib/branding';

const pillars = [
  {
    title: 'Execution Infrastructure',
    body: 'Routing logic is tuned for consistency under load, with clear order state transitions and real-time feedback loops.',
    Icon: Zap,
  },
  {
    title: 'Security and Control',
    body: 'Access protections, session safeguards, and layered controls are built into account and transaction flows.',
    Icon: ShieldCheck,
  },
  {
    title: 'Global Market Access',
    body: 'One interface supports users tracking cross-market opportunities without jumping between disconnected tools.',
    Icon: Globe2,
  },
];

const operatingModel = [
  {
    title: 'Discover',
    detail: 'Users identify setups through consolidated market intelligence and watchlist-first workflows.',
    Icon: Radar,
  },
  {
    title: 'Decide',
    detail: 'Risk and sizing signals are displayed before execution so decisions are intentional and traceable.',
    Icon: WalletCards,
  },
  {
    title: 'Deploy',
    detail: 'Orders are routed quickly, with transparent status updates and position telemetry.',
    Icon: Server,
  },
];

const principles = [
  'Clarity over clutter: all critical data should be visible before a trade is submitted.',
  'Speed with guardrails: fast interaction should never remove risk context.',
  'Cross-device continuity: core workflows must remain reliable on desktop and mobile.',
  'Operational transparency: users should understand what the system is doing at each step.',
];

interface AboutProps {
  brandName?: string;
}

export default function About({ brandName }: AboutProps) {
  const resolvedBrandName = resolveBrandName(brandName);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-12">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 md:p-10">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div className="space-y-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#34D399]">About {resolvedBrandName}</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">About {resolvedBrandName}: Institutional-Style Trading UX for Real-World Execution</h1>
            <p className="text-slate-300 leading-relaxed">
              {resolvedBrandName} was built to give active traders and serious learners access to a high-performance interface
              without terminal complexity. We focus on execution quality, readable risk context, and predictable workflows
              that scale from first trade to advanced strategy deployment.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-200">
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5">Low-latency execution mindset</span>
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5">Security-aware account flows</span>
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5">Cross-market decision tooling</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#0B1A17] p-4">
            <svg viewBox="0 0 320 220" className="w-full h-auto" role="img" aria-label="Execution and risk architecture diagram">
              <rect x="8" y="8" width="304" height="204" rx="18" fill="#07110F" stroke="#134E4A" />
              <rect x="34" y="42" width="78" height="34" rx="8" fill="#0F2E28" stroke="#2DD4BF" />
              <rect x="124" y="94" width="78" height="34" rx="8" fill="#0F2E28" stroke="#2DD4BF" />
              <rect x="214" y="146" width="78" height="34" rx="8" fill="#0F2E28" stroke="#2DD4BF" />
              <path d="M112 59 L124 111" stroke="#34D399" strokeWidth="2" />
              <path d="M202 111 L214 163" stroke="#34D399" strokeWidth="2" />
              <circle cx="32" cy="179" r="6" fill="#34D399" />
              <circle cx="168" cy="24" r="6" fill="#34D399" />
              <circle cx="290" cy="58" r="6" fill="#34D399" />
              <text x="45" y="64" fill="#A7F3D0" fontSize="10">Signal</text>
              <text x="138" y="116" fill="#A7F3D0" fontSize="10">Execution</text>
              <text x="228" y="168" fill="#A7F3D0" fontSize="10">Risk</text>
            </svg>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {pillars.map(({ title, body, Icon }) => (
          <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <Icon className="w-5 h-5 text-[#34D399] mb-3" />
            <h2 className="text-lg font-bold mb-2">{title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0A0F1A] p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-4">How the Platform Operates</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {operatingModel.map(({ title, detail, Icon }, index) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5 text-[#34D399]" />
                <span className="text-xs font-bold text-slate-500">0{index + 1}</span>
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-4">Operating Principles</h2>
        <ul className="space-y-3 text-slate-300 text-sm">
          {principles.map((principle) => (
            <li key={principle} className="flex items-start gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              <span>{principle}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold mb-2">Need policy or risk details?</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Review our disclosure pages for full legal and operational information before funding or trading.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/risk" className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition-colors">
              Risk Disclosure <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/privacy" className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition-colors">
              Privacy Policy <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/terms" className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition-colors">
              Terms of Service <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#34D399] mb-2">Coverage</h3>
          <p className="text-sm text-slate-300">24/7 platform availability target with continuous market monitoring workflows.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#34D399] mb-2">Support</h3>
          <p className="text-sm text-slate-300">Guided onboarding and escalation paths for account verification and security questions.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#34D399] mb-2">Audience</h3>
          <p className="text-sm text-slate-300">Built for retail and advanced users who value disciplined execution and transparent controls.</p>
        </article>
      </section>

      <section className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
        <Users className="w-4 h-4" />
        {resolvedBrandName} teams focus on product reliability, account safety, and clear user workflows.
      </section>
    </div>
  );
}
