import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import type { SelectableAsset } from '../types';

interface TradePageProps {
  onOpenTradingDesk: () => void;
  onAssetClick: (asset: SelectableAsset) => void;
}

function formatPriceFreshness(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return 'Price update time unavailable';
  }

  const parsed = new Date(timestamp).getTime();

  if (Number.isNaN(parsed)) {
    return 'Price update time unavailable';
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - parsed) / 1000));

  if (elapsedSeconds < 30) {
    return 'Updated just now';
  }

  if (elapsedSeconds < 3600) {
    return `Updated ${Math.floor(elapsedSeconds / 60)}m ago`;
  }

  if (elapsedSeconds < 86400) {
    return `Updated ${Math.floor(elapsedSeconds / 3600)}h ago`;
  }

  return `Updated ${new Date(parsed).toLocaleString()}`;
}

const TradePage: React.FC<TradePageProps> = ({ onOpenTradingDesk, onAssetClick }) => {
  const location = useLocation();
  const isMarketView = location.pathname.includes('/market');
  const [activeTab, setActiveTab] = useState('Crypto');
  const [query, setQuery] = useState('');
  const { marketAssets, prices, orders, user, refreshMarketAssets, refreshOrders } = useMarket();

  const stockTypes = new Set(['stock', 'etf', 'share']);

  useEffect(() => {
    void Promise.all([refreshMarketAssets(), refreshOrders()]).catch(() => {
      // Keep rendering existing state if refresh fails.
    });
  }, [refreshMarketAssets, refreshOrders]);

  useEffect(() => {
    const refreshPrices = () => {
      void refreshMarketAssets().catch(() => {
        // Keep last known market data if refresh fails.
      });
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshPrices();
      }
    }, 30_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshPrices();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshMarketAssets]);

  useEffect(() => {
    if (!isMarketView && query) {
      setQuery('');
    }
  }, [isMarketView, query]);

  const currentAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const sortedBySymbol = (assets: SelectableAsset[]) => (
      [...assets]
        .filter((asset) => {
          if (!normalizedQuery) {
            return true;
          }

          return asset.symbol.toLowerCase().includes(normalizedQuery)
            || asset.name.toLowerCase().includes(normalizedQuery);
        })
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
    );

    if (activeTab === 'Stocks') {
      return sortedBySymbol(
        marketAssets.filter((asset) => stockTypes.has((asset.type ?? '').toLowerCase())),
      );
    }

    if (activeTab === 'Crypto') {
      return sortedBySymbol(
        marketAssets.filter((asset) => (asset.type ?? '').toLowerCase() === 'crypto'),
      );
    }

    return [];
  }, [activeTab, marketAssets, query]);

  const recentOrders = useMemo(() => (
    [...orders]
      .sort((left, right) => new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime())
      .slice(0, 8)
  ), [orders]);

  const latestPriceUpdateAt = useMemo(() => {
    let latestTimestamp: number | null = null;
    let latestValue: string | null = null;

    currentAssets.forEach((asset) => {
      if (!asset.lastPriceUpdateAt) {
        return;
      }

      const parsed = new Date(asset.lastPriceUpdateAt).getTime();

      if (Number.isNaN(parsed)) {
        return;
      }

      if (latestTimestamp === null || parsed > latestTimestamp) {
        latestTimestamp = parsed;
        latestValue = asset.lastPriceUpdateAt;
      }
    });

    return latestValue;
  }, [currentAssets]);

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
        className={`bg-[#141414]/60 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 hover:bg-zinc-900/40 hover:border-white/10 transition-all cursor-pointer active:scale-[0.98] ${flashClass}`}
      >
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-white tracking-tight text-base">{asset.symbol}</h4>
          <p className="text-xs text-zinc-500 font-bold truncate">{asset.name}</p>
        </div>
        <div className="text-right min-w-[112px]">
          <p className={`font-extrabold text-white transition-colors duration-300 ${liveData?.lastAction === 'up' ? 'text-green-400' : liveData?.lastAction === 'down' ? 'text-red-400' : ''}`}>
            ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-xs font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            24h
            {' '}
            {isUp ? '+' : ''}
            {displayChange.toFixed(2)}%
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-5 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="space-y-2">
        <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
          {isMarketView ? 'Market' : 'Trading Hub'}
        </p>
        <h2 className="text-xl font-bold text-white">
          {isMarketView ? 'Crypto Market' : `Ready to trade, ${user?.name ?? 'Trader'}?`}
        </h2>
        <p className="text-xs text-zinc-500 font-medium">
          {isMarketView
            ? 'Focused crypto listing with quick filters and trading access.'
            : 'Launch live trading or explore curated market ideas.'}
        </p>
      </header>

      {isMarketView ? (
        <div className="bg-[#101010] border border-white/5 rounded-xl p-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={activeTab === 'Crypto' ? 'Search token symbol or name' : 'Search asset symbol or name'}
              className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>
          <button
            onClick={onOpenTradingDesk}
            className="bg-[#10b981] hover:bg-[#059669] text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
          >
            Open Desk <ArrowRight size={16} />
          </button>
        </div>
      ) : (
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
      )}

      <div className="space-y-2">
        <div className="flex gap-3 border-b border-white/5 pb-2 overflow-x-auto scrollbar-hide">
          {['Crypto', 'Stocks', 'History'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab !== 'History' && (
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <span>{formatPriceFreshness(latestPriceUpdateAt)}</span>
            <span>
              {currentAssets.length}
              {' '}
              {activeTab === 'Crypto' ? 'tokens' : 'assets'}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 pb-20">
        {activeTab !== 'History' && currentAssets.map(renderAssetRow)}
        {activeTab !== 'History' && currentAssets.length === 0 && (
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6 text-center">
            <p className="text-sm text-zinc-500 font-medium">
              {query.trim().length > 0 ? 'No assets match your search.' : 'No market assets available right now.'}
            </p>
          </div>
        )}

        {activeTab === 'History' && (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="bg-[#141414]/60 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        order.side === 'buy'
                          ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                          : 'bg-orange-500/15 border-orange-500/35 text-orange-300'
                      }`}
                    >
                      {order.side}
                    </span>
                    <p className="font-extrabold text-white">{order.asset.symbol}</p>
                  </div>
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
