import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import type { SelectableAsset } from '../types';

interface TradePageProps {
  onOpenTradingDesk: () => void;
  onAssetClick: (asset: SelectableAsset) => void;
}

const TradePage: React.FC<TradePageProps> = ({ onOpenTradingDesk, onAssetClick }) => {
  const [activeTab, setActiveTab] = useState('Stocks');
  const { marketAssets, prices, orders, user } = useMarket();

  const stockTypes = new Set(['stock', 'etf', 'share']);

  const currentAssets = useMemo(() => {
    if (activeTab === 'Stocks') {
      return marketAssets.filter((asset) => stockTypes.has((asset.type ?? '').toLowerCase()));
    }

    if (activeTab === 'Crypto') {
      return marketAssets.filter((asset) => (asset.type ?? '').toLowerCase() === 'crypto');
    }

    return [];
  }, [activeTab, marketAssets]);

  const renderAssetRow = (asset: SelectableAsset) => {
    const liveData = prices[asset.symbol];
    const displayPrice = liveData ? liveData.price : asset.price;
    const displayChange = liveData ? liveData.changePercent : asset.changePercent;
    const isUp = displayChange >= 0;

    const flashClass = liveData?.lastAction === 'up' ? 'bg-green-500/5' : liveData?.lastAction === 'down' ? 'bg-red-500/5' : '';

    return (
      <div
        key={asset.id ?? asset.symbol}
        onClick={() => onAssetClick(asset)}
        className={`bg-[#141414]/60 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-900/40 hover:border-white/10 transition-all cursor-pointer active:scale-[0.98] ${flashClass}`}
      >
        <div>
          <h4 className="font-extrabold text-white tracking-tight text-base">{asset.symbol}</h4>
          <p className="text-xs text-zinc-500 font-bold">{asset.name}</p>
        </div>
        <div className="text-right">
          <p className={`font-extrabold text-white transition-colors duration-300 ${liveData?.lastAction === 'up' ? 'text-green-400' : liveData?.lastAction === 'down' ? 'text-red-400' : ''}`}>
            ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-xs font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {isUp ? '+' : ''}
            {displayChange.toFixed(2)}%
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <header>
        <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Trading Hub</p>
        <h2 className="text-2xl font-bold text-white mb-2">Ready to trade, {user?.name ?? 'Trader'}?</h2>
        <p className="text-sm text-zinc-500 font-medium">Launch live trading or explore curated market ideas.</p>
      </header>

      <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[60px] pointer-events-none" />
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Live Trading</p>
        <h3 className="text-xl font-bold text-white mb-2">Trade crypto & stocks</h3>
        <p className="text-sm text-zinc-500 mb-6 max-w-[240px]">Use the advanced trading workstation for real-time execution.</p>

        <button
          onClick={onOpenTradingDesk}
          className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
        >
          Open Trading Desk <ArrowRight size={20} />
        </button>
      </div>

      <div className="flex gap-4 border-b border-white/5 pb-2 overflow-x-auto scrollbar-hide">
        {['Stocks', 'Crypto', 'History'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3 pb-20">
        {activeTab !== 'History' && currentAssets.map(renderAssetRow)}

        {activeTab === 'History' && (
          <div className="space-y-3">
            {orders.slice(0, 8).map((order) => (
              <div key={order.id} className="bg-[#141414]/60 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-white">{order.side.toUpperCase()} {order.asset.symbol}</p>
                  <p className="text-xs text-zinc-500 font-bold">{new Date(order.placedAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{order.quantity.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">${order.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-10">
                <p className="text-zinc-500 text-sm font-medium">No recent trading history.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradePage;
