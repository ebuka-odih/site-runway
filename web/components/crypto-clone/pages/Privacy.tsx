import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Database, Eye, LockKeyhole } from 'lucide-react';
import { resolveBrandName } from '../../../lib/branding';

type PolicySection = {
  title: string;
  body: string[];
  bullets?: string[];
};

const dataInventory = [
  {
    category: 'Account and Identity Data',
    examples: 'Name, email, verification records, account status markers',
    purpose: 'Account creation, compliance checks, fraud prevention, support verification',
    retention: 'Retained while account is active and for legal retention periods after closure',
  },
  {
    category: 'Transaction and Trade Data',
    examples: 'Orders, fills, position changes, funding requests, wallet movements',
    purpose: 'Trade execution, account statements, dispute handling, auditability',
    retention: 'Maintained for reporting, reconciliation, and legal obligations',
  },
  {
    category: 'Technical and Device Data',
    examples: 'IP address, browser type, session logs, interaction telemetry',
    purpose: 'Security monitoring, platform reliability, product improvement analytics',
    retention: 'Short-lived operational logs with longer retention for security events',
  },
  {
    category: 'Support and Communication Data',
    examples: 'Tickets, chat transcripts, email interactions, investigation notes',
    purpose: 'Issue resolution, service quality review, incident traceability',
    retention: 'Stored as needed for support history and regulatory evidence',
  },
];

const sections: PolicySection[] = [
  {
    title: '1. Scope and Commitment',
    body: [
      'This Privacy Policy explains how {{brand}} collects, uses, stores, and discloses personal information when you use our websites, applications, and related services.',
      'Our commitment is to process data responsibly, keep controls visible, and limit access to legitimate business and compliance purposes only.',
    ],
  },
  {
    title: '2. Information We Collect',
    body: [
      'We collect information you provide directly, information generated through your use of the platform, and technical data needed to secure sessions and prevent abuse.',
      'Some fields are mandatory for account operation, while optional fields help personalize product experience and support quality.',
    ],
    bullets: [
      'Identity and contact details during registration and verification',
      'Funding and trading records created through account activity',
      'Device and network metadata for fraud and abuse detection',
      'Support communications and diagnostic logs for troubleshooting',
    ],
  },
  {
    title: '3. How We Use Information',
    body: [
      'We use collected data to operate the platform, process orders and account actions, prevent unauthorized access, and meet legal obligations.',
      'We also use aggregated or de-identified analytics to improve usability, reliability, and performance without exposing personal identity where possible.',
    ],
    bullets: [
      'Account authentication and lifecycle management',
      'Risk detection, anomaly monitoring, and incident response',
      'Customer support, notifications, and service communications',
      'Compliance reporting and recordkeeping requirements',
    ],
  },
  {
    title: '4. Legal Bases and Consent',
    body: [
      'Depending on jurisdiction, we process data under one or more legal bases: contract performance, legal obligation, legitimate interests, and consent where required.',
      'When consent is relied on, you may withdraw it at any time, but withdrawal does not affect earlier processing performed lawfully.',
    ],
  },
  {
    title: '5. Data Sharing and Third Parties',
    body: [
      'We may share data with service providers, analytics vendors, banking or payment partners, and regulatory bodies when necessary to provide services or comply with law.',
      'Third parties are contractually expected to process data for approved purposes and maintain appropriate security safeguards.',
    ],
    bullets: [
      'Infrastructure and cloud hosting providers',
      'Identity verification, fraud, and sanctions screening providers',
      'Payment, settlement, and transaction partners',
      'Professional advisers and lawful authority requests',
    ],
  },
  {
    title: '6. Security and Retention',
    body: [
      'We apply layered controls including encryption in transit, access controls, monitoring, and change-management procedures to protect data integrity and confidentiality.',
      'Retention periods vary by data type, service need, and legal obligations. Data is deleted or anonymized when no longer required, subject to applicable law.',
    ],
  },
  {
    title: '7. Your Rights and Choices',
    body: [
      'Subject to local law, you may request access, correction, deletion, portability, or restriction of certain processing activities.',
      'You can also manage communications preferences in account settings and contact support for rights requests or unresolved concerns.',
    ],
    bullets: [
      'Access and correction of personal data',
      'Deletion requests where no overriding legal basis applies',
      'Objection to specific types of processing',
      'Appeal pathways through supervisory authorities where available',
    ],
  },
  {
    title: '8. Cross-Border Processing and Updates',
    body: [
      'Data may be processed in multiple jurisdictions where our providers or operations are located. We use contractual and technical safeguards for cross-border transfers.',
      'We may update this policy over time. Material changes are posted here with a revised date and, where required, user-facing notice.',
    ],
  },
  {
    title: '9. Contact',
    body: [
      'For privacy-related questions, rights requests, or complaints, contact our support team through official channels in the platform footer and help surfaces.',
    ],
  },
];

interface PrivacyProps {
  brandName?: string;
}

const withBrandName = (text: string, brandName: string): string => text.replaceAll('{{brand}}', brandName);

export default function Privacy({ brandName }: PrivacyProps) {
  const resolvedBrandName = resolveBrandName(brandName);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-10">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 md:p-10">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#34D399]">Privacy Policy</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Privacy Policy and Comprehensive Data Handling Standards</h1>
            <p className="text-slate-300 leading-relaxed">
              Last updated: February 24, 2026. This policy describes what data we collect, why we collect it,
              how we protect it, and what rights you may exercise in relation to your personal information.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Purpose-limited processing</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Layered safeguards</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">User rights pathways</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#0B1A17] p-4">
            <svg viewBox="0 0 320 220" className="w-full h-auto" role="img" aria-label="Privacy and security illustration">
              <rect x="8" y="8" width="304" height="204" rx="18" fill="#07110F" stroke="#134E4A" />
              <rect x="112" y="88" width="96" height="72" rx="10" fill="#0F2E28" stroke="#2DD4BF" />
              <path d="M130 88 V72 C130 52, 146 36, 160 36 C174 36, 190 52, 190 72 V88" stroke="#34D399" strokeWidth="5" fill="none" />
              <circle cx="160" cy="120" r="10" fill="#34D399" />
              <line x1="160" y1="130" x2="160" y2="145" stroke="#34D399" strokeWidth="4" />
              <circle cx="66" cy="170" r="6" fill="#34D399" />
              <circle cx="254" cy="54" r="6" fill="#34D399" />
              <path d="M66 170 C108 130, 122 152, 160 122" stroke="#22C55E" strokeWidth="2" fill="none" />
              <path d="M160 122 C204 94, 214 90, 254 54" stroke="#22C55E" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <Database className="w-5 h-5 text-[#34D399] mb-2" />
          <h2 className="font-semibold mb-1">Data Minimization</h2>
          <p className="text-xs text-slate-300">Only data needed for service operations, legal obligations, and security objectives is processed.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <LockKeyhole className="w-5 h-5 text-[#34D399] mb-2" />
          <h2 className="font-semibold mb-1">Security Controls</h2>
          <p className="text-xs text-slate-300">Role-based access, encryption, and monitoring workflows protect confidentiality and integrity.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <Clock3 className="w-5 h-5 text-[#34D399] mb-2" />
          <h2 className="font-semibold mb-1">Retention Rules</h2>
          <p className="text-xs text-slate-300">Retention windows vary by data type, with deletion or anonymization when obligations end.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <Eye className="w-5 h-5 text-[#34D399] mb-2" />
          <h2 className="font-semibold mb-1">Transparency</h2>
          <p className="text-xs text-slate-300">Users receive policy updates and can request access, corrections, and other privacy actions.</p>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0A0F1A] p-6 md:p-8 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">Data Categories and Handling Summary</h2>
        <table className="w-full text-left min-w-[820px]">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-400">
              <th className="py-3 pr-3">Category</th>
              <th className="py-3 pr-3">Examples</th>
              <th className="py-3 pr-3">Purpose</th>
              <th className="py-3">Retention</th>
            </tr>
          </thead>
          <tbody>
            {dataInventory.map((row) => (
              <tr key={row.category} className="border-b border-white/5 align-top text-sm">
                <td className="py-4 pr-3 text-white font-semibold">{row.category}</td>
                <td className="py-4 pr-3 text-slate-300">{row.examples}</td>
                <td className="py-4 pr-3 text-slate-300">{row.purpose}</td>
                <td className="py-4 text-slate-300">{row.retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <h2 className="text-xl font-bold mb-1">Related Legal Documents</h2>
            <p className="text-sm text-slate-300">Review our terms and risk disclosures alongside this privacy policy.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/terms" className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition-colors">
              Terms of Service <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/risk" className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition-colors">
              Risk Disclosure <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
