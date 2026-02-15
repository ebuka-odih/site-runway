
import React from 'react';
import { Shield, ChevronRight } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-green-500" size={20} />
          <h3 className="font-bold text-lg">Portfolio Analytics</h3>
        </div>
        <button className="text-green-500 text-sm font-semibold flex items-center">
          View All <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-green-500/20 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Risk Level</p>
          <p className="text-green-500 font-bold mb-2">Conservative</p>
          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full w-1/3"></div>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Diversification</p>
          <p className="text-white font-bold mb-2">100/100</p>
          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full w-full"></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Allocation</p>
        <div className="h-2 w-full rounded-full flex overflow-hidden">
          <div className="h-full bg-orange-500 w-[68%]" />
          <div className="h-full bg-green-500 w-[32%]" />
        </div>
        <div className="flex justify-between text-[10px] font-bold">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-zinc-400">Crypto: 68%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-zinc-400">Stocks & ETFs: 32%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900/30 border border-white/5 p-3 rounded-lg text-center">
          <p className="text-lg font-bold">5</p>
          <p className="text-[10px] text-zinc-500 font-bold">Assets</p>
        </div>
        <div className="bg-zinc-900/30 border border-white/5 p-3 rounded-lg text-center">
          <p className="text-lg font-bold text-green-500">60%</p>
          <p className="text-[10px] text-zinc-500 font-bold">Win Rate</p>
        </div>
        <div className="bg-zinc-900/30 border border-white/5 p-3 rounded-lg text-center">
          <p className="text-lg font-bold">94%</p>
          <p className="text-[10px] text-zinc-500 font-bold">Cash</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Key Factors</p>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-green-500/20 border border-green-500/40 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-zinc-300">94.2% cash provides safety buffer</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-green-500/20 border border-green-500/40 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-zinc-300">5 assets spread risk</span>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
