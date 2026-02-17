import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, TrendingUp } from 'lucide-react';

interface LandingLegalSection {
  heading: string;
  paragraphs: string[];
}

interface LandingLegalPageProps {
  eyebrow: string;
  title: string;
  summary: string;
  lastUpdated: string;
  sections: LandingLegalSection[];
}

const legalLinks = [
  { label: 'About Us', to: '/about-us' },
  { label: 'Risk Disclosure', to: '/risk-disclosure' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms of Service', to: '/terms-of-service' },
];

const LandingLegalPage: React.FC<LandingLegalPageProps> = ({ eyebrow, title, summary, lastUpdated, sections }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10 md:py-16">
        <div className="flex items-center justify-between gap-4 mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors"
          >
            <TrendingUp size={14} />
            Open RunwayAlgo
          </Link>
        </div>

        <header className="mb-10">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.28em] mb-4">{eyebrow}</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic mb-4">{title}</h1>
          <p className="text-zinc-400 font-medium leading-relaxed max-w-3xl">{summary}</p>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-5">Last updated: {lastUpdated}</p>
        </header>

        <div className="grid gap-5">
          {sections.map((section) => (
            <section key={section.heading} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.18em] mb-4">{section.heading}</h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.heading}-${index}`} className="text-sm text-zinc-400 leading-relaxed font-medium">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="inline-flex items-center gap-2 text-zinc-500 text-[11px] font-bold uppercase tracking-widest">
            <FileText size={14} />
            Legal & Compliance
          </div>
          <div className="flex flex-wrap gap-5 text-[11px] font-black uppercase tracking-widest text-zinc-500">
            {legalLinks.map((item) => (
              <Link key={item.to} to={item.to} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingLegalPage;
