import React from 'react';
import { useMarket } from '../context/MarketContext';

const Heatmap: React.FC = () => {
  const { dashboard, watchlist } = useMarket();
  const heatmap = dashboard?.heatmap ?? [];

  return (
    <div className="px-4 py-6 space-y-6">
      <h3 className="font-bold text-xl">Performance Heatmap</h3>
      <div className="grid grid-cols-4 gap-2">
        {heatmap.map((item) => (
          <div
            key={item.symbol}
            className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 transition-transform hover:scale-105 cursor-pointer ${
              item.change >= 0
                ? 'bg-green-500/10 border-green-500/40 text-green-500'
                : 'bg-orange-500/10 border-orange-500/40 text-orange-500'
            }`}
          >
            <span className="text-[10px] font-extrabold tracking-tight">{item.symbol}</span>
            <span className="text-xs font-bold leading-none mt-1">
              {item.change >= 0 ? '+' : ''}
              {item.change.toFixed(2)}%
            </span>
          </div>
        ))}
        {heatmap.length === 0 && (
          <p className="text-zinc-500 text-sm col-span-4">No heatmap data available yet.</p>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="font-bold text-xl">Community Insights</h3>
        <p className="text-zinc-500 text-xs font-medium -mt-4">Most tracked assets by users</p>
        <div className="grid grid-cols-2 gap-3">
          {watchlist.slice(0, 4).map((coin) => (
            <div key={coin.symbol} className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
              <h4 className="font-bold text-sm">{coin.symbol}</h4>
              <p className="text-[10px] text-zinc-500 font-bold mb-2">{coin.name}</p>
              <p className="text-green-500 text-[10px] font-bold">Tracked</p>
            </div>
          ))}
          {watchlist.length === 0 && (
            <p className="text-zinc-500 text-sm col-span-2">No watchlist activity yet.</p>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-orange-500/20 rounded-xl p-4 flex gap-3 items-start">
        <div className="w-6 h-6 rounded-full bg-orange-500/20 flex-shrink-0 flex items-center justify-center">
          <span className="text-orange-500 font-bold text-xs">i</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
          Trading financial instruments involves risk of loss and is not suitable for all investors.
          <a href="#" className="text-green-500 ml-1 hover:underline">Read full risk disclosure</a>
        </p>
      </div>
    </div>
  );
};

export default Heatmap;
