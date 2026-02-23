import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050B14] text-white font-sans selection:bg-[#064E3B]/30">
      {/* Top Warning Bar */}
      <div className="bg-[#F1F5F9] text-[#1E293B] py-2 px-4 text-center text-[10px] md:text-xs font-medium">
        Don't invest unless you're prepared to lose all the money you invest. This is a high-risk investment, and you should not expect to be protected if something goes wrong <Link to="/risk" className="underline text-[#065F46] hover:text-[#064E3B]">Take 2 mins to learn more.</Link>
      </div>

      <header className="sticky top-0 z-50 bg-[#050B14]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setIsMenuOpen(false)}>
              <div className="w-8 h-8 bg-[#059669] rounded flex items-center justify-center text-white font-bold text-lg shadow-[0_0_10px_rgba(5,150,105,0.3)]">
                E
              </div>
              <div className="font-bold tracking-tight text-xl">ENV</div>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
              <Link to="/" className="hover:text-[#059669] transition-colors">Buy Crypto</Link>
              <Link to="/" className="hover:text-[#059669] transition-colors">Markets</Link>
              <Link to="/" className="hover:text-[#059669] transition-colors">Trade</Link>
              <Link to="/" className="hover:text-[#059669] transition-colors">Derivatives</Link>
              <Link to="/about" className="hover:text-[#059669] transition-colors">About</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="px-4 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Log In
              </Link>
              <Link to="/signup" className="px-5 py-2 rounded bg-[#059669] text-white text-sm font-bold hover:bg-[#047857] transition-all">
                Sign Up
              </Link>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 text-slate-300 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden absolute top-full left-0 right-0 h-[calc(100vh-64px)] bg-[#050B14] border-t border-white/5 z-40 overflow-y-auto pb-20"
            >
              <nav className="flex flex-col p-6 gap-3">
                {[
                  { name: 'Buy Crypto', path: '/' },
                  { name: 'Markets', path: '/' },
                  { name: 'Trade', path: '/' },
                  { name: 'Derivatives', path: '/' },
                  { name: 'About Us', path: '/about' },
                ].map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link 
                      to={item.path}
                      className="flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98] group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-lg font-semibold text-slate-200 group-hover:text-white">{item.name}</span>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#059669]/20 transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#059669]" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 gap-4 mt-8"
                >
                  <Link
                    to="/signup"
                    className="w-full py-5 rounded-2xl bg-[#059669] text-white font-bold text-lg shadow-lg shadow-[#059669]/20 active:scale-[0.98] transition-transform text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className="w-full py-5 rounded-2xl border border-slate-700 text-slate-300 font-bold text-lg active:scale-[0.98] transition-transform text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log In
                  </Link>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-12 pt-8 border-t border-white/5 space-y-4"
                >
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Support & Legal</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/risk" className="text-sm text-slate-400 hover:text-white" onClick={() => setIsMenuOpen(false)}>Risk Disclosure</Link>
                    <Link to="/privacy" className="text-sm text-slate-400 hover:text-white" onClick={() => setIsMenuOpen(false)}>Privacy Policy</Link>
                    <Link to="/terms" className="text-sm text-slate-400 hover:text-white" onClick={() => setIsMenuOpen(false)}>Terms of Service</Link>
                  </div>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <Outlet />
      </main>

      {/* Floating Help Button */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-[#059669] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform z-50">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      <footer className="bg-[#0A0F1A] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div>
            © 2026 ENV Crypto. All rights reserved.
          </div>
          <div className="flex items-center gap-8">
            <Link to="/risk" className="hover:text-[#059669] transition-colors">Risk Disclosure</Link>
            <Link to="/privacy" className="hover:text-[#059669] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#059669] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
