import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Gauge, ShieldCheck, Triangle } from 'lucide-react';
import { resolveBrandName } from '../../../lib/branding';

type RiskSection = {
  title: string;
  detail: string;
  examples: string[];
  mitigations: string[];
};

const riskSections: RiskSection[] = [
  {
    title: 'Market Risk',
    detail:
      'Crypto and related assets can move significantly within short periods due to liquidity changes, macro events, or abrupt sentiment shifts.',
    examples: [
      'Sharp intraday price gaps during low-liquidity windows',
      'Spread expansion during high-volatility events',
      'Unexpected drawdowns around macro announcements',
    ],
    mitigations: [
      'Use position sizing relative to account value',
      'Define invalidation points before entry',
      'Avoid concentration in highly correlated exposures',
    ],
  },
  {
    title: 'Leverage and Liquidation Risk',
    detail:
      'Leverage amplifies both gains and losses. Insufficient margin can trigger forced reductions or liquidations at unfavorable prices.',
    examples: [
      'Rapid liquidation cascade when volatility spikes',
      'Funding-cost drift affecting long-held leveraged positions',
      'Underestimating maintenance margin in multi-position setups',
    ],
    mitigations: [
      'Use conservative leverage by default',
      'Monitor liquidation thresholds continuously',
      'Keep contingency capital for margin maintenance',
    ],
  },
  {
    title: 'Operational and Technology Risk',
    detail:
      'Execution outcomes may be affected by outages, degraded connectivity, third-party provider failures, or account access disruptions.',
    examples: [
      'Delayed order acknowledgements during traffic spikes',
      'Temporary service interruptions or maintenance windows',
      'Device compromise or credential theft scenarios',
    ],
    mitigations: [
      'Enable account protections and secure device hygiene',
      'Maintain fallback connection and response procedures',
      'Review open exposure before major market events',
    ],
  },
  {
    title: 'Regulatory and Jurisdictional Risk',
    detail:
      'Rules may change by jurisdiction, affecting product availability, account requirements, tax treatment, and access conditions.',
    examples: [
      'Asset restrictions introduced in specific regions',
      'Additional verification requirements for funding flows',
      'Tax reporting changes on digital asset transactions',
    ],
    mitigations: [
      'Monitor local legal and tax obligations',
      'Keep verification records up to date',
      'Consult qualified advisers for jurisdiction-specific guidance',
    ],
  },
];

const scenarioMatrix = [
  { scenario: 'High-volatility news release', probability: 'Medium', impact: 'High', response: 'Reduce leverage, widen risk buffer, avoid market orders in thin books' },
  { scenario: 'Exchange liquidity fragmentation', probability: 'Medium', impact: 'Medium', response: 'Use staged entries and monitor slippage metrics' },
  { scenario: 'Unexpected service degradation', probability: 'Low', impact: 'High', response: 'Apply predefined fallback risk plan and lower open exposure' },
  { scenario: 'Credential compromise attempt', probability: 'Medium', impact: 'High', response: 'Rotate credentials immediately and lock withdrawals until verified' },
];

interface RiskProps {
  brandName?: string;
}

export default function Risk({ brandName }: RiskProps) {
  const resolvedBrandName = resolveBrandName(brandName);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-10">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 md:p-10">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#34D399]">Risk Disclosure</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Risk Disclosure and Comprehensive Risk Framework for Trading Activity</h1>
            <p className="text-slate-300 leading-relaxed">
              Last updated: February 24, 2026. Trading digital assets and leveraged products involves substantial risk.
              This page outlines major risk categories, expected scenarios, and practical mitigation guidance for {resolvedBrandName} users.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Capital at risk</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Leverage amplifies loss</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Use controlled exposure</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#0B1A17] p-4">
            <svg viewBox="0 0 320 220" className="w-full h-auto" role="img" aria-label="Risk meter illustration">
              <rect x="8" y="8" width="304" height="204" rx="18" fill="#07110F" stroke="#134E4A" />
              <path d="M64 166 A96 96 0 0 1 256 166" stroke="#0F766E" strokeWidth="18" fill="none" />
              <path d="M64 166 A96 96 0 0 1 200 79" stroke="#22C55E" strokeWidth="18" fill="none" />
              <path d="M200 79 A96 96 0 0 1 244 111" stroke="#F59E0B" strokeWidth="18" fill="none" />
              <line x1="160" y1="166" x2="214" y2="112" stroke="#34D399" strokeWidth="5" />
              <circle cx="160" cy="166" r="9" fill="#34D399" />
              <text x="126" y="198" fill="#A7F3D0" fontSize="12">Risk Meter</text>
            </svg>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <AlertTriangle className="w-5 h-5 text-[#34D399] mb-2" />
          <h2 className="font-semibold mb-1">Principal Loss</h2>
          <p className="text-sm text-slate-300">You can lose part or all of your invested capital in adverse market conditions.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <Gauge className="w-5 h-5 text-[#34D399] mb-2" />
          <h2 className="font-semibold mb-1">Exposure Acceleration</h2>
          <p className="text-sm text-slate-300">Leverage can materially increase drawdowns over short time horizons.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <ShieldCheck className="w-5 h-5 text-[#34D399] mb-2" />
          <h2 className="font-semibold mb-1">Control Discipline</h2>
          <p className="text-sm text-slate-300">Predefined risk limits and account safeguards are essential for consistent behavior.</p>
        </article>
      </section>

      <section className="space-y-4">
        {riskSections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-7">
            <h2 className="text-xl font-bold mb-3">{section.title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{section.detail}</p>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <h3 className="text-xs uppercase tracking-[0.16em] font-bold text-[#34D399] mb-2">Example Scenarios</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {section.examples.map((example) => (
                    <li key={example} className="flex items-start gap-2">
                      <Triangle className="w-3.5 h-3.5 mt-[1px] text-[#10B981]" />
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.16em] font-bold text-[#34D399] mb-2">Mitigation Practices</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {section.mitigations.map((mitigation) => (
                    <li key={mitigation} className="flex items-start gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                      <span>{mitigation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0A0F1A] p-6 md:p-8 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">Scenario Matrix</h2>
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-400">
              <th className="py-3 pr-3">Scenario</th>
              <th className="py-3 pr-3">Probability</th>
              <th className="py-3 pr-3">Impact</th>
              <th className="py-3">Suggested Response</th>
            </tr>
          </thead>
          <tbody>
            {scenarioMatrix.map((row) => (
              <tr key={row.scenario} className="border-b border-white/5 text-sm align-top">
                <td className="py-4 pr-3 text-white font-semibold">{row.scenario}</td>
                <td className="py-4 pr-3 text-slate-300">{row.probability}</td>
                <td className="py-4 pr-3 text-slate-300">{row.impact}</td>
                <td className="py-4 text-slate-300">{row.response}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 md:p-8">
        <h2 className="text-xl font-bold mb-2">Important Notice</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          This disclosure is informational and does not constitute investment, legal, or tax advice.
          Evaluate suitability carefully and consult qualified advisers before using high-risk products.
        </p>
      </section>

      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Related Legal Pages</h2>
            <p className="text-sm text-slate-300">Review terms and privacy documents for complete policy context.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/terms" className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition-colors">
              Terms of Service <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/privacy" className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition-colors">
              Privacy Policy <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
