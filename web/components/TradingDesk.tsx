import React, { useMemo, useState } from 'react';
import { Search, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import type { SelectableAsset } from '../types';

const TradingDesk: React.FC<{ onClose: () => void; onSelectAsset: (asset: SelectableAsset) => void }> = ({ onClose, onSelectAsset }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { marketAssets, prices } = useMarket();

  const filteredAssets = useMemo(() => {
    return marketAssets.filter((asset) => {
      const normalizedType = (asset.type ?? '').toLowerCase();
      const mappedType = normalizedType === 'crypto' ? 'Crypto' : 'Stock';
      const matchesFilter = activeFilter === 'All' || mappedType === activeFilter;
      const matchesSearch =
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, marketAssets, searchQuery]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
      <div className="px-4 py-6 border-b border-white/5 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Assets Overview</p>
        <h2 className="text-2xl font-bold text-white mb-2">Trade Markets</h2>
        <p className="text-sm text-zinc-500 font-medium">Browse and trade live stocks and crypto</p>
      </div>

      <div className="px-4 py-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by symbol or name (e.g., AAPL)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500/50 focus:bg-[#1a1a1a] transition-all"
          />
        </div>
      </div>

      <div className="px-4 flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
        {['All', 'Stock', 'Crypto'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all border ${
              activeFilter === filter
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:text-zinc-300'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 divide-y divide-white/5">
        {filteredAssets.map((asset) => {
          const live = prices[asset.symbol];
          const price = live?.price ?? asset.price;
          const changePercent = live?.changePercent ?? asset.changePercent;
          const isPositive = changePercent >= 0;

          return (
            <div
              key={asset.id ?? asset.symbol}
              onClick={() => onSelectAsset({ ...asset, price, changePercent })}
              className="flex items-center justify-between py-5 group cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-lg tracking-tight group-hover:text-emerald-400 transition-colors">
                  {asset.symbol}
                </span>
                <span className="text-xs text-zinc-500 font-bold">{asset.name}</span>
              </div>

              <div className="flex items-center gap-6">
                <span className="font-extrabold text-white text-lg">
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <div className={`flex items-center gap-1 font-bold text-sm w-20 justify-end ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  <span>
                    {isPositive ? '+' : ''}
                    {changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredAssets.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-zinc-500 font-bold">No assets found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingDesk;
