import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Speaker, UserPlus, Wallet, BarChart3, Shield, Zap, Headphones, BookOpen, TrendingUp } from 'lucide-react';
import { resolveBrandName } from '../../../lib/branding';

const TradingViewWidget = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Check if script already exists to avoid duplicates
    if (container.current.querySelector('script')) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "colorTheme": "dark",
      "dateRange": "12M",
      "showChart": true,
      "locale": "en",
      "width": "100%",
      "height": "100%",
      "largeChartUrl": "",
      "isTransparent": true,
      "showSymbolLogo": true,
      "showFloatingTooltip": false,
      "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
      "plotLineColorFalling": "rgba(41, 98, 255, 1)",
      "gridLineColor": "rgba(240, 243, 250, 0)",
      "scaleFontColor": "rgba(106, 109, 120, 1)",
      "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
      "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
      "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
      "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
      "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
      "tabs": [
        {
          "title": "Most traded coins",
          "symbols": [
            { "s": "BINANCE:BTCUSDT" },
            { "s": "BINANCE:ETHUSDT" },
            { "s": "BINANCE:SOLUSDT" },
            { "s": "BINANCE:XRPUSDT" },
            { "s": "BINANCE:ADAUSDT" },
            { "s": "BINANCE:DOTUSDT" }
          ]
        }
      ]
    });
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
};

interface HomeProps {
  brandName?: string;
}

export default function Home({ brandName }: HomeProps) {
  const resolvedBrandName = resolveBrandName(brandName);

  return (
    <div className="bg-[#050B14]">
      {/* Hero Section */}
      <section className="relative min-h-[500px] flex items-center overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#059669]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#059669]/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 py-12 md:py-20">
          <div className="space-y-8 md:space-y-10">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-tight">
              Next Level<br />
              <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex items-center gap-2"><TrendingUp className="w-6 h-6 md:w-12 md:h-12 text-[#059669]" /> Trading</span>
                <span className="hidden sm:inline text-slate-600 font-light">|</span>
                <span className="flex items-center gap-2"><Wallet className="w-6 h-6 md:w-12 md:h-12 text-[#059669]" /> Earning</span>
                <span className="hidden sm:inline text-slate-600 font-light">|</span>
                <span className="flex items-center gap-2"><BookOpen className="w-6 h-6 md:w-12 md:h-12 text-[#059669]" /> Learning</span>
              </span>
            </h1>
            
            <div className="space-y-6">
              <Link
                to="/signup"
                className="inline-block w-full sm:w-auto px-10 py-4 rounded-full bg-[#059669] text-white font-bold text-lg hover:bg-[#047857] transition-all shadow-[0_4px_20px_rgba(5,150,105,0.2)] text-center"
              >
                Sign Up Now
              </Link>
              
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-slate-400">
                <span>Or Use</span>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 hover:text-white transition-colors">
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale" alt="" /> Google
                  </button>
                  <button className="flex items-center gap-2 hover:text-white transition-colors">
                    <img src="https://www.apple.com/favicon.ico" className="w-4 h-4 grayscale" alt="" /> Apple
                  </button>
                  <button className="flex items-center gap-2 hover:text-white transition-colors">
                    <img src="https://telegram.org/favicon.ico" className="w-4 h-4 grayscale" alt="" /> Telegram
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-y border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold mb-1">$50B+</div>
            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase">24h Trading Volume</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold mb-1">10M+</div>
            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase">Registered Users</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold mb-1">200+</div>
            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase">Countries Supported</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold mb-1">0.1%</div>
            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase">Lowest Trading Fees</div>
          </div>
        </div>
      </section>

      {/* Announcement Bar */}
      <div className="bg-[#F1F5F9] text-[#1E293B] py-3 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 text-xs md:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <Speaker className="w-4 h-4" />
            <span>Direct GBP Deposits!</span>
          </div>
          <div className="text-center">
            {resolvedBrandName} Officially Launches Globally!
          </div>
          <div className="flex items-center gap-2 group cursor-pointer">
            <span className="truncate max-w-[200px] md:max-w-none">{resolvedBrandName}: FAQs, Access, and What's Available at Launch</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Catch Your Next Trading Opportunity */}
      <section className="bg-white text-[#1A1A1A] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-12">Catch Your Next Trading Opportunity</h2>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Trading Table (Left 2/3) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
              <TradingViewWidget />
            </div>

            {/* Side Sections (Right 1/3) */}
            <div className="space-y-8">
              {/* Top Gainers */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold mb-6">Top Gainers</h3>
                <div className="space-y-6">
                  {[
                    { pair: 'HOME/USDT', price: '0.03003', change: '+3.55%' },
                    { pair: 'ENS/USDC', price: '6.7', change: '+1.35%' },
                    { pair: 'TRX/USDC', price: '0.2889', change: '+1.01%' },
                  ].map((coin, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100" />
                        <span className="font-bold text-sm">{coin.pair}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{coin.price} USD</div>
                        <div className="text-xs text-[#00B574] font-bold">{coin.change} 24h</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Listings */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold mb-6">New Listings</h3>
                <div className="space-y-6">
                  {[
                    { pair: 'APE/USDT', price: '0.1071', change: '-4.72%' },
                    { pair: 'ETC/USDT', price: '8.7', change: '-6.75%' },
                    { pair: 'ETH/USDT', price: '1,949.76', change: '-2.18%' },
                  ].map((coin, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100" />
                        <span className="font-bold text-sm">{coin.pair}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{coin.price} USD</div>
                        <div className="text-xs text-[#F23645] font-bold">{coin.change} 24h</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-500 font-medium">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">!</div>
            Prices are displayed in USD. Performance and returns may increase or decrease as a result of fluctuations in the USD to GBP exchange rates.
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-white text-[#1A1A1A] py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-bold">Why Choose {resolvedBrandName}?</h2>
            <p className="text-slate-500">
              We provide the most reliable and secure platform for your digital asset trading needs, 
              backed by industry-leading technology and support.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Institutional-Grade Security',
                desc: 'Your assets are protected by multi-signature cold storage and advanced encryption protocols. We prioritize your security above all else.',
                icon: (
                  <svg className="w-8 h-8 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              },
              {
                title: 'Ultra-Low Latency',
                desc: 'Execute trades in milliseconds with our high-performance matching engine. Never miss a market move with our sub-90ms order routing.',
                icon: (
                  <svg className="w-8 h-8 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                title: '24/7 Expert Support',
                desc: 'Our dedicated support team is available around the clock to assist you with any questions or issues you may encounter.',
                icon: (
                  <svg className="w-8 h-8 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )
              }
            ].map((feature, i) => (
              <div key={i} className="space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="bg-[#F1F5F9] py-24 text-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-16">Get started in just a few clicks</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Create Account',
                desc: 'Please provide your email address to receive a 6-digit verification code. Enter the code on the verification page to verify your identity and complete the onboarding requirements.',
                btn: 'Sign Up Now',
                icon: <UserPlus className="w-10 h-10 text-[#059669]" />
              },
              {
                step: '2',
                title: 'Make Deposit',
                desc: `Fund your account on the ${resolvedBrandName} platform.`,
                btn: 'Deposit Now',
                icon: <Wallet className="w-10 h-10 text-[#059669]" />
              },
              {
                step: '3',
                title: 'Start Trading',
                desc: 'Kick off your journey with your favorite Spot pairs!',
                btn: 'Trade Now',
                icon: <BarChart3 className="w-10 h-10 text-[#059669]" />
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 flex flex-col items-center text-center shadow-sm relative pt-12">
                <div className="absolute top-4 left-4 w-8 h-8 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-400">
                  {item.step}
                </div>
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">
                  {item.desc}
                </p>
                {item.btn === 'Sign Up Now' ? (
                  <Link
                    to="/signup"
                    className="block w-full py-3 rounded-lg bg-[#059669] text-white font-bold hover:bg-[#047857] transition-colors"
                  >
                    {item.btn}
                  </Link>
                ) : (
                  <button className="w-full py-3 rounded-lg bg-[#059669] text-white font-bold hover:bg-[#047857] transition-colors">
                    {item.btn}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#F1F5F9] pb-24 text-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl font-bold">Embark on Your Crypto Journey Today!</h2>
          <Link
            to="/signup"
            className="inline-flex px-10 py-4 rounded-full bg-[#059669] text-white font-bold text-lg hover:bg-[#047857] transition-all items-center gap-2 mx-auto"
          >
            Sign Up Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
