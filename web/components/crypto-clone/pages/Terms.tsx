import { Link } from 'react-router-dom';
import { ArrowRight, Scale, Shield, Wallet } from 'lucide-react';
import { resolveBrandName } from '../../../lib/branding';

type TermsSection = {
  title: string;
  body: string[];
  bullets?: string[];
};

const sections: TermsSection[] = [
  {
    title: '1. Acceptance and Scope',
    body: [
      'These Terms of Service govern your access to and use of {{brand}} websites, applications, and associated services.',
      'By creating an account, accessing content, or placing orders, you agree to be bound by these terms and related policies.',
    ],
  },
  {
    title: '2. Eligibility and Account Registration',
    body: [
      'You must be at least 18 years old and have legal capacity to enter into binding agreements in your jurisdiction.',
      'You are responsible for the accuracy of account information and for maintaining access to the email and devices tied to your account.',
    ],
    bullets: [
      'Accounts must not be created for unlawful or unauthorized purposes',
      'Identity verification may be required before funding or trading',
      'Shared or pooled account access without approval is prohibited',
    ],
  },
  {
    title: '3. Security Responsibilities',
    body: [
      'You must maintain strong credentials, enable available account protections, and promptly report suspected unauthorized access.',
      '{{brand}} may suspend access temporarily when suspicious activity or credential compromise is detected.',
    ],
  },
  {
    title: '4. Service Availability and Changes',
    body: [
      'Services may change over time, including supported assets, order types, and operational windows, based on legal, technical, or market constraints.',
      'We aim for high availability but do not guarantee uninterrupted access. Maintenance windows and emergency controls may impact service.',
    ],
  },
  {
    title: '5. Orders, Execution, and Settlement',
    body: [
      'Order placement does not guarantee immediate execution. Fills depend on market conditions, liquidity, and system status at the time of matching.',
      'Executed transactions are generally final except where correction is required due to clear system malfunction or legal obligation.',
    ],
    bullets: [
      'Quoted values may move before execution confirmation',
      'Partial fills can occur based on available liquidity',
      'Rejected orders can result from risk checks or insufficient balance',
    ],
  },
  {
    title: '6. Fees, Taxes, and Pricing',
    body: [
      'Applicable fees, spreads, and charges may vary by product and region and are presented within relevant product surfaces where possible.',
      'You are responsible for determining and paying any taxes arising from account activity, trading gains, or withdrawals.',
    ],
  },
  {
    title: '7. Prohibited Conduct',
    body: [
      'You may not use the platform to conduct unlawful activity, evade controls, manipulate markets, or disrupt service operations.',
    ],
    bullets: [
      'No credential theft, account takeover attempts, or circumvention of controls',
      'No automated abuse, scraping beyond permitted use, or denial-of-service behavior',
      'No use of the service to facilitate fraud, laundering, or sanctions violations',
    ],
  },
  {
    title: '8. Intellectual Property and License',
    body: [
      'All platform software, content, branding, and interface elements remain the property of {{brand}} or its licensors.',
      'You are granted a limited, revocable, non-transferable license to use the service for lawful personal or authorized business purposes.',
    ],
  },
  {
    title: '9. Suspension and Termination',
    body: [
      'Accounts may be suspended or terminated for breaches of these terms, legal obligations, security threats, or prolonged inactivity where allowed.',
      'Termination does not eliminate obligations related to unresolved disputes, regulatory matters, or recordkeeping requirements.',
    ],
  },
  {
    title: '10. Disclaimers and Limitation of Liability',
    body: [
      'Services are provided on an “as available” basis. Market data delays, errors, outages, or connectivity issues may occur and can affect outcomes.',
      'To the maximum extent permitted by law, {{brand}} is not liable for indirect, incidental, or consequential losses arising from platform use.',
    ],
  },
  {
    title: '11. Indemnification',
    body: [
      'You agree to indemnify and hold harmless {{brand}} and its affiliates from claims, losses, and expenses resulting from your breach of these terms or misuse of the service.',
    ],
  },
  {
    title: '12. Governing Law and Dispute Process',
    body: [
      'These terms are governed by applicable law as determined by your service region and related account agreements.',
      'Disputes should be raised through support first. Where required, formal dispute resolution follows applicable contractual and statutory mechanisms.',
    ],
  },
  {
    title: '13. Updates to These Terms',
    body: [
      'We may revise these terms periodically. Material updates are reflected with a new effective date and communicated where required by law.',
      'Continued use after updates become effective constitutes acceptance of revised terms.',
    ],
  },
];

interface TermsProps {
  brandName?: string;
}

const withBrandName = (text: string, brandName: string): string => text.replaceAll('{{brand}}', brandName);

export default function Terms({ brandName }: TermsProps) {
  const resolvedBrandName = resolveBrandName(brandName);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-10">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 md:p-10">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#34D399]">Terms of Service</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Terms of Service and Comprehensive Conditions for Platform Use</h1>
            <p className="text-slate-300 leading-relaxed">
              Last updated: February 24, 2026. These terms define account obligations, trading conditions, service limits,
              and legal boundaries that apply when using {resolvedBrandName} products and interfaces.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#0B1A17] p-4">
            <svg viewBox="0 0 320 220" className="w-full h-auto" role="img" aria-label="Legal framework illustration">
              <rect x="8" y="8" width="304" height="204" rx="18" fill="#07110F" stroke="#134E4A" />
              <rect x="54" y="44" width="212" height="132" rx="12" fill="#0F2E28" stroke="#2DD4BF" />
              <line x1="80" y1="78" x2="240" y2="78" stroke="#34D399" strokeWidth="4" />
              <line x1="80" y1="104" x2="216" y2="104" stroke="#34D399" strokeWidth="4" />
              <line x1="80" y1="130" x2="230" y2="130" stroke="#34D399" strokeWidth="4" />
              <line x1="80" y1="156" x2="188" y2="156" stroke="#34D399" strokeWidth="4" />
              <circle cx="42" cy="182" r="6" fill="#34D399" />
              <circle cx="280" cy="34" r="6" fill="#34D399" />
              <path d="M42 182 C120 120, 168 122, 280 34" stroke="#22C55E" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <Scale className="w-5 h-5 text-[#34D399] mb-2" />
          <h2 className="font-semibold mb-1">Contractual Clarity</h2>
          <p className="text-sm text-slate-300">Terms are structured so core obligations and limits are visible before account actions.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <Shield className="w-5 h-5 text-[#34D399] mb-2" />
          <h2 className="font-semibold mb-1">Security Obligations</h2>
          <p className="text-sm text-slate-300">Users must maintain account security and report suspicious behavior promptly.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <Wallet className="w-5 h-5 text-[#34D399] mb-2" />
          <h2 className="font-semibold mb-1">Trading Context</h2>
          <p className="text-sm text-slate-300">Execution, fees, taxes, and market conditions directly affect outcomes and responsibilities.</p>
        </article>
      </section>

      <section className="space-y-4">
        {sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-7">
            <h2 className="text-xl font-bold mb-3">{section.title}</h2>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{withBrandName(paragraph, resolvedBrandName)}</p>
              ))}
            </div>
            {section.bullets && (
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Read Alongside</h2>
            <p className="text-sm text-slate-300">Risk and privacy disclosures provide additional context for platform use.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/risk" className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition-colors">
              Risk Disclosure <ArrowRight className="w-4 h-4" />
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
