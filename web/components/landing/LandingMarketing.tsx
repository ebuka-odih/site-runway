import React from 'react';
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  Star,
  BarChart3,
  Users,
  Smartphone,
  DollarSign,
  Bitcoin,
  Activity,
  Quote,
  PlayCircle,
  Wallet,
  Award,
  User,
} from 'lucide-react';
import type { AuthView } from './types';

interface LandingMarketingProps {
  onOpenAuth: (view?: AuthView) => void;
}

const LandingMarketing: React.FC<LandingMarketingProps> = ({ onOpenAuth }) => (
  <>
    {/* Navigation */}
    <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto relative z-40">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <TrendingUp className="text-black" size={24} strokeWidth={3} />
        </div>
        <span className="text-xl font-black tracking-tighter uppercase italic">RunwayAlgo</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-400 uppercase tracking-widest">
        <a href="#" className="hover:text-emerald-500 transition-colors">Markets</a>
        <a href="#" className="hover:text-emerald-500 transition-colors">CopyTrade</a>
        <a href="#" className="hover:text-emerald-500 transition-colors">Safety</a>
      </div>
      <button
        onClick={() => onOpenAuth('login')}
        className="bg-white text-black px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all hover:scale-105 active:scale-95"
      >
        Login
      </button>
    </nav>

    {/* Hero Section */}
    <section className="relative pt-20 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
      {/* Floating Assets */}
      <div className="absolute top-2 left-10 animate-float opacity-75 hidden lg:block">
        <div className="min-w-[104px] rounded-2xl bg-zinc-900/90 border border-white/10 px-4 py-3 flex items-center justify-center shadow-2xl">
          <span className="text-red-400 font-black tracking-widest text-sm">TSLA</span>
        </div>
      </div>
      <div className="absolute top-14 right-16 animate-float-delayed opacity-75 hidden lg:block">
        <div className="min-w-[112px] rounded-2xl bg-zinc-900/90 border border-white/10 px-4 py-3 flex items-center justify-center gap-2 shadow-2xl">
          <span className="inline-grid grid-cols-2 gap-[2px]">
            <span className="w-2 h-2 bg-[#f25022] rounded-[2px]" />
            <span className="w-2 h-2 bg-[#7fba00] rounded-[2px]" />
            <span className="w-2 h-2 bg-[#00a4ef] rounded-[2px]" />
            <span className="w-2 h-2 bg-[#ffb900] rounded-[2px]" />
          </span>
          <span className="text-blue-300 font-black tracking-widest text-sm">MSFT</span>
        </div>
      </div>
      <div className="absolute top-44 left-24 animate-float-slow opacity-75 hidden lg:block">
        <div className="min-w-[104px] rounded-2xl bg-zinc-900/90 border border-white/10 px-4 py-3 flex items-center justify-center shadow-2xl">
          <span className="text-zinc-100 font-black tracking-widest text-sm">AAPL</span>
        </div>
      </div>
      <div className="absolute top-28 right-44 animate-float opacity-45 hidden lg:block">
        <div className="w-12 h-12 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-center shadow-2xl">
          <Bitcoin className="text-orange-500" size={22} />
        </div>
      </div>
      <div className="absolute bottom-16 left-16 animate-float-delayed opacity-45 hidden lg:block">
        <div className="w-12 h-12 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-center shadow-2xl">
          <span className="text-blue-400 font-black text-lg">Ξ</span>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Trading is active</span>
      </div>

      <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent animate-in fade-in zoom-in-95 duration-1000 leading-[1.1]">
        Trade the Future <br className="hidden md:block" /> with Intelligence.
      </h1>

      <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        The ultimate high-fidelity dashboard for digital assets, stocks, and automated copying. Seamless performance for professional traders.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
        <button
          onClick={() => onOpenAuth('login')}
          className="group bg-emerald-500 text-black px-10 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center gap-2 hover:translate-x-1"
        >
          Access Terminal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <button className="bg-zinc-900 border border-white/5 text-white px-10 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all">
          View Markets
        </button>
      </div>

      {/* Dashboard Preview */}
      <div className="mt-24 w-full max-w-5xl relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[32px] blur opacity-20 animate-pulse-soft" />
        <div className="relative aspect-[16/9] bg-[#0a0a0a] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full p-4 border-b border-white/5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
          </div>
          {/* Abstract UI simulation */}
          <div className="p-8 pt-16 flex flex-col gap-6">
            <div className="h-8 w-1/3 bg-white/5 rounded-lg animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
              <div className="h-32 bg-white/5 rounded-2xl animate-pulse" style={{ animationDelay: '200ms' }} />
              <div className="h-32 bg-white/5 rounded-2xl animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
            <div className="h-48 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-end p-4 overflow-hidden">
              <div className="flex items-end gap-1 w-full h-full">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="flex-1 bg-emerald-500/40 rounded-t-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Global Impact Stats */}
    <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5 bg-white/[0.01]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
        {[
          { label: 'Trading Volume', value: '$14.2B+', color: 'text-white' },
          { label: 'Active Users', value: '850K+', color: 'text-emerald-500' },
          { label: 'Countries', value: '140+', color: 'text-white' },
          { label: 'Uptime', value: '99.99%', color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="space-y-2">
            <h3 className={`text-4xl md:text-5xl font-black tracking-tighter ${stat.color}`}>{stat.value}</h3>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Marquee Section */}
    <div className="bg-zinc-900/30 border-y border-white/5 py-10 overflow-hidden whitespace-nowrap">
      <div className="flex animate-marquee-slower items-center gap-12 text-2xl font-black text-zinc-700 uppercase italic opacity-50">
        {[...Array(10)].map((_, i) => (
          <React.Fragment key={i}>
            <span>BTC +4.5%</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>AAPL +1.2%</span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>NVDA +8.9%</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </React.Fragment>
        ))}
      </div>
    </div>

    {/* Features Grid */}
    <section className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">Core Ecosystem</p>
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 uppercase italic">Engineered for Victory</h2>
        <p className="text-zinc-500 max-w-xl mx-auto font-medium">Powering global markets with unparalleled speed, security, and algorithmic precision.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: Zap,
            title: 'Lightning Execution',
            desc: 'Trade at the speed of thought. Low-latency engine ensures your orders are filled instantly.',
            color: 'bg-emerald-500',
          },
          {
            icon: Users,
            title: 'RunwayAlgo CopyTrading',
            desc: "Follow the world's most profitable traders and mirror their moves automatically in real-time.",
            color: 'bg-blue-500',
          },
          {
            icon: Shield,
            title: 'Military Grade',
            desc: 'Advanced encryption and multi-sig cold storage keep your assets safe from every angle.',
            color: 'bg-purple-500',
          },
          {
            icon: BarChart3,
            title: 'Real-time Analytics',
            desc: 'Deep data visualization and performance metrics integrated directly into your portfolio.',
            color: 'bg-orange-500',
          },
          {
            icon: Smartphone,
            title: 'Mobile First',
            desc: 'A responsive experience designed to stay with you, whether you are on a desktop or a phone.',
            color: 'bg-pink-500',
          },
          {
            icon: Globe,
            title: 'Global Assets',
            desc: 'Access thousands of markets across 40+ countries. Stocks, ETFs, Crypto, and more.',
            color: 'bg-indigo-500',
          },
        ].map((feat, i) => (
          <div key={i} className="group p-10 rounded-[40px] bg-[#121212] border border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-2">
            <div className={`w-14 h-14 rounded-2xl ${feat.color} flex items-center justify-center text-black mb-10 shadow-xl group-hover:scale-110 transition-transform`}>
              <feat.icon size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight italic">{feat.title}</h3>
            <p className="text-zinc-500 leading-relaxed font-medium">{feat.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Workflow: How It Works */}
    <section className="py-32 px-6 max-w-7xl mx-auto relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[160px] pointer-events-none" />
      <div className="text-center mb-24">
        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">The Process</p>
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 uppercase italic">Three Steps to Wealth</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-16 relative">
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent -translate-y-1/2 -z-10" />

        {[
          { icon: User, title: 'Secure Identity', desc: 'Create your account and complete our high-speed verification in under 60 seconds.' },
          { icon: Wallet, title: 'Connect Capital', desc: 'Securely link your bank or crypto wallet with end-to-end 256-bit encryption.' },
          { icon: PlayCircle, title: 'Execute Alpha', desc: 'Deploy algorithmic bots or mirror professional traders with one-tap execution.' },
        ].map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-8 relative group-hover:border-emerald-500/50 transition-colors">
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black text-sm">0{i + 1}</div>
              <step.icon size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tight">{step.title}</h3>
            <p className="text-zinc-500 leading-relaxed font-medium px-4">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Community Testimonials */}
    <section className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
          <div className="max-w-xl">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">Testimonials</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic">Trusted by Giants</h2>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 px-6 py-4 rounded-3xl">
            <Award className="text-emerald-500" size={20} />
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Voted Best Terminal 2024</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: 'Alex Rivera',
              role: 'Hedge Fund Manager',
              quote: 'RunwayAlgo is the first platform that actually matches the speed of institutional terminals. The execution is flawless.',
              gain: '+142%',
            },
            {
              name: 'Sarah Chen',
              role: 'Day Trader',
              quote: 'The copytrading feature changed my life. I finally have a portfolio that grows while I sleep. 10/10.',
              gain: '+89%',
            },
            {
              name: 'Marcus Thorne',
              role: 'Retail Investor',
              quote: 'Clean UI, better data, and zero slippage. I moved my entire 7-figure portfolio here last month.',
              gain: '+324%',
            },
          ].map((testimonial, i) => (
            <div key={i} className="bg-[#0a0a0a] p-10 rounded-[40px] border border-white/5 relative group hover:border-emerald-500/20 transition-all">
              <Quote className="text-emerald-500/20 absolute top-8 right-8" size={48} />
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, j) => <Star key={j} size={14} className="fill-emerald-500 text-emerald-500" />)}
              </div>
              <p className="text-zinc-300 text-lg font-medium leading-relaxed italic mb-10">"{testimonial.quote}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-black uppercase tracking-tight italic">{testimonial.name}</h4>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">{testimonial.role}</p>
                </div>
                <div className="bg-emerald-500/10 px-4 py-2 rounded-2xl">
                  <span className="text-emerald-500 font-black text-sm">{testimonial.gain}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA Section */}
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto rounded-[48px] bg-gradient-to-br from-emerald-500 to-emerald-700 p-12 md:p-24 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter mb-6 uppercase italic">Join RunwayAlgo.</h2>
            <p className="text-black/70 text-lg font-bold">Start your journey today with $0 fees and instant global access.</p>
          </div>
          <button
            onClick={() => onOpenAuth('login')}
            className="bg-black text-white px-12 py-6 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-zinc-900 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            Get Started Now <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="py-20 px-6 border-t border-white/5 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <TrendingUp className="text-black" size={18} strokeWidth={3} />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase italic">RunwayAlgo</span>
          </div>
          <p className="text-zinc-500 font-medium max-w-sm mb-8">
            Empowering professional and amateur traders with the most intuitive, high-performance financial tools available.
          </p>
          <div className="flex gap-4">
            {[Globe, Activity, DollarSign].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Products</h4>
          <ul className="space-y-4 text-zinc-500 text-sm font-bold">
            <li><a href="#" className="hover:text-emerald-500 transition-colors">Trading Desk</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition-colors">Copy Trading</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition-colors">Security Node</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Company</h4>
          <ul className="space-y-4 text-zinc-500 text-sm font-bold">
            <li><a href="#" className="hover:text-emerald-500 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition-colors">Risk Disclosure</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition-colors">Support Hub</a></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-white/5 gap-6">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">© 2026 RUNWAYALGO. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-8 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  </>
);

export default LandingMarketing;
