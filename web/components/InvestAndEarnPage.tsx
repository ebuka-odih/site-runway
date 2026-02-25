import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Coins, Landmark, Loader2, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import type { SelectableAsset } from '../types';

interface InvestAndEarnPageProps {
  mode: 'default' | 'crypto';
  onAssetClick: (asset: SelectableAsset) => void;
}

const STOCK_TYPES = new Set(['stock', 'etf', 'share']);

const InvestAndEarnPage: React.FC<InvestAndEarnPageProps> = ({ mode, onAssetClick }) => {
  const navigate = useNavigate();
  const { marketType } = useParams<{ marketType?: string }>();
  const { marketAssets, prices, refreshMarketAssets } = useMarket();
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const basePath = mode === 'crypto' ? '/crypto/dashboard/copy' : '/dashboard/copy';

  const normalizedType = (marketType ?? '').toLowerCase();
  const activeType: 'crypto' | 'stocks' | null = normalizedType === 'crypto'
    ? 'crypto'
    : normalizedType === 'stocks'
      ? 'stocks'
      : null;

  useEffect(() => {
    if (!marketType) {
      return;
    }

    if (activeType === null) {
      navigate(basePath, { replace: true });
    }
  }, [activeType, basePath, marketType, navigate]);

  useEffect(() => {
    if (!activeType) {
      return;
    }

    let isActive = true;
    setIsLoadingAssets(true);

    void refreshMarketAssets(activeType === 'crypto' ? { type: 'crypto' } : undefined)
      .catch(() => {
        if (isActive) {
          setError('Unable to load market assets right now.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingAssets(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [activeType, refreshMarketAssets]);

  const filteredAssets = useMemo(() => {
    if (!activeType) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    return [...marketAssets]
      .filter((asset) => {
        const type = (asset.type ?? '').toLowerCase();
        const isTypeMatch = activeType === 'crypto'
          ? type === 'crypto'
          : STOCK_TYPES.has(type);

        if (!isTypeMatch) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return asset.symbol.toLowerCase().includes(normalizedQuery)
          || asset.name.toLowerCase().includes(normalizedQuery);
      })
      .sort((left, right) => left.symbol.localeCompare(right.symbol));
  }, [activeType, marketAssets, query]);

  if (!activeType) {
    return (
      <div className="px-4 py-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Invest & Earn</p>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Choose what to buy</h2>
          <p className="text-sm text-zinc-500 font-medium">Pick a market and start building your investing balance.</p>
        </header>

        <button
          type="button"
          onClick={() => navigate(`${basePath}/crypto`)}
          className="w-full rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-5 text-left transition hover:border-emerald-400/45 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Buy Crypto</p>
              <h3 className="mt-2 text-2xl font-black text-white">Digital asset list</h3>
              <p className="mt-1 text-sm text-zinc-400">Browse crypto tokens and place market buy orders.</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
              <Coins size={22} />
            </div>
          </div>
          <p className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-emerald-300">
            Open Crypto List <ChevronRight size={14} />
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate(`${basePath}/stocks`)}
          className="w-full rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/12 via-blue-500/6 to-transparent p-5 text-left transition hover:border-cyan-400/45 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-cyan-200 uppercase tracking-widest">Buy Stocks</p>
              <h3 className="mt-2 text-2xl font-black text-white">Equity market list</h3>
              <p className="mt-1 text-sm text-zinc-400">Browse stocks and ETFs, then place market buy orders.</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-200">
              <Landmark size={22} />
            </div>
          </div>
          <p className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-cyan-200">
            Open Stock List <ChevronRight size={14} />
          </p>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        type="button"
        onClick={() => navigate(basePath)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-xs font-black uppercase tracking-wider text-zinc-300 transition hover:border-white/20 hover:text-white"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <header>
        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Invest & Earn</p>
        <h2 className="text-2xl font-black text-white tracking-tight">
          {activeType === 'crypto' ? 'Buy Crypto' : 'Buy Stocks'}
        </h2>
        <p className="text-sm text-zinc-500 font-medium">
          Tap any asset to open the same trade flow used in Market.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${activeType === 'crypto' ? 'tokens' : 'stocks'}...`}
          className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] py-2.5 pl-10 pr-3 text-sm font-bold text-white placeholder:text-zinc-700 focus:border-emerald-500/40 focus:outline-none transition-colors"
        />
      </div>

      {isLoadingAssets && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-emerald-400" size={22} />
        </div>
      )}

      {!isLoadingAssets && filteredAssets.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f] p-6 text-sm font-medium text-zinc-500">
          No assets found for this filter.
        </div>
      )}

      {!isLoadingAssets && filteredAssets.length > 0 && (
        <div className="space-y-3 pb-24">
          {filteredAssets.map((asset) => {
            const key = asset.id ?? asset.symbol;
            const livePrice = prices[asset.symbol]?.price ?? asset.price;
            const change = prices[asset.symbol]?.changePercent ?? asset.changePercent;
            const isPositive = change >= 0;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onAssetClick(asset)}
                className="w-full rounded-2xl border border-white/5 bg-[#121212] p-4 text-left transition hover:border-white/10 hover:bg-[#151515] active:scale-[0.995]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black text-white">{asset.symbol}</p>
                    <p className="text-xs font-bold text-zinc-500">{asset.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-extrabold text-white">
                      ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                    </p>
                    <p className={`text-xs font-black ${isPositive ? 'text-emerald-500' : 'text-orange-500'}`}>
                      {isPositive ? '+' : ''}
                      {change.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  Open trade
                  <ChevronRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvestAndEarnPage;
