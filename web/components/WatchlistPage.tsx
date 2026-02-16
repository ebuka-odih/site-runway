import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Loader2, Plus, Search, X } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import type { SelectableAsset, WatchlistItem } from '../types';

interface WatchlistPageProps {
  onBack: () => void;
  onAssetClick: (asset: SelectableAsset) => void;
}

function isStockType(type: string | undefined): boolean {
  const normalized = (type ?? '').toLowerCase();
  return normalized === 'stock' || normalized === 'share' || normalized === 'etf';
}

const WatchlistPage: React.FC<WatchlistPageProps> = ({ onBack, onAssetClick }) => {
  const {
    watchlist,
    marketAssets,
    prices,
    refreshMarketAssets,
    addToWatchlist,
    removeFromWatchlist,
  } = useMarket();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'stock' | 'crypto' | 'all'>('stock');
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAssetId, setPendingAssetId] = useState<string | null>(null);
  const [pendingWatchlistItemId, setPendingWatchlistItemId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingAssets(true);
    setError(null);

    void refreshMarketAssets()
      .catch((exception) => {
        const message = exception instanceof Error ? exception.message : 'Unable to load assets right now.';
        setError(message);
      })
      .finally(() => {
        setIsLoadingAssets(false);
      });
  }, [refreshMarketAssets]);

  const watchlistByAssetId = useMemo(() => {
    const map = new Map<string, WatchlistItem>();
    watchlist.forEach((item) => {
      map.set(item.assetId, item);
    });
    return map;
  }, [watchlist]);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...marketAssets]
      .filter((asset) => {
        if (activeFilter === 'stock') {
          return isStockType(asset.type);
        }

        if (activeFilter === 'crypto') {
          return (asset.type ?? '').toLowerCase() === 'crypto';
        }

        return true;
      })
      .filter((asset) => {
        if (!normalizedQuery) {
          return true;
        }

        return asset.symbol.toLowerCase().includes(normalizedQuery)
          || asset.name.toLowerCase().includes(normalizedQuery);
      })
      .sort((left, right) => left.symbol.localeCompare(right.symbol));
  }, [activeFilter, marketAssets, query]);

  const sortedWatchlist = useMemo(
    () => [...watchlist].sort((left, right) => left.symbol.localeCompare(right.symbol)),
    [watchlist],
  );

  const handleAdd = async (asset: SelectableAsset) => {
    if (!asset.id || watchlistByAssetId.has(asset.id)) {
      return;
    }

    setError(null);
    setPendingAssetId(asset.id);

    try {
      await addToWatchlist(asset.id);
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to add this asset to your watchlist.';
      setError(message);
    } finally {
      setPendingAssetId(null);
    }
  };

  const handleRemove = async (item: WatchlistItem) => {
    setError(null);
    setPendingWatchlistItemId(item.id);

    try {
      await removeFromWatchlist(item.id);
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Unable to remove this asset from your watchlist.';
      setError(message);
    } finally {
      setPendingWatchlistItemId(null);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Watchlist Hub</p>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Track and add market assets</h2>
          <p className="text-sm text-zinc-500 font-medium">Use the list below to add stocks or crypto to your watchlist.</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <section className="bg-[#121212] border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white tracking-tight">Your Watchlist</h3>
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500">{sortedWatchlist.length} assets</span>
        </div>

        {sortedWatchlist.length === 0 && (
          <p className="text-sm text-zinc-500 py-2">No watchlist assets yet. Add symbols from the market list below.</p>
        )}

        {sortedWatchlist.map((item) => {
          const liveData = prices[item.symbol];
          const displayPrice = liveData?.price ?? item.price;
          const displayChange = liveData?.changePercent ?? item.changePercent;
          const isUp = displayChange >= 0;

          return (
            <div
              key={item.id}
              onClick={() => onAssetClick(item)}
              className="bg-[#0c0c0c] border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-white/10 transition-colors"
            >
              <div>
                <p className="text-sm font-black text-white">{item.symbol}</p>
                <p className="text-xs text-zinc-500 font-bold">{item.name}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-black text-white tabular-nums">
                    ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-xs font-bold ${isUp ? 'text-emerald-500' : 'text-orange-400'}`}>
                    {isUp ? '+' : ''}
                    {displayChange.toFixed(2)}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleRemove(item);
                  }}
                  disabled={pendingWatchlistItemId === item.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-full border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-60"
                >
                  {pendingWatchlistItemId === item.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="bg-[#121212] border border-white/5 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-black text-white tracking-tight">Add to Watchlist</h3>
          <div className="flex items-center gap-2">
            {(['stock', 'crypto', 'all'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
                  activeFilter === filter
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by symbol or name"
            className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 pl-10 pr-3 text-sm font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
        </div>

        {isLoadingAssets && (
          <div className="py-8 flex items-center justify-center text-zinc-500 text-sm font-bold">
            <Loader2 size={18} className="animate-spin mr-2" />
            Loading market assets...
          </div>
        )}

        {!isLoadingAssets && filteredAssets.length === 0 && (
          <p className="text-sm text-zinc-500 py-2">No assets match your current filter.</p>
        )}

        {!isLoadingAssets && filteredAssets.map((asset) => {
          const liveData = prices[asset.symbol];
          const displayPrice = liveData?.price ?? asset.price;
          const displayChange = liveData?.changePercent ?? asset.changePercent;
          const isUp = displayChange >= 0;
          const existingItem = asset.id ? watchlistByAssetId.get(asset.id) : undefined;
          const isPending = asset.id ? pendingAssetId === asset.id : false;

          return (
            <div
              key={asset.id ?? asset.symbol}
              onClick={() => onAssetClick(asset)}
              className="bg-[#0c0c0c] border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-white/10 transition-colors"
            >
              <div>
                <p className="text-sm font-black text-white">{asset.symbol}</p>
                <p className="text-xs text-zinc-500 font-bold">{asset.name}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-black text-white tabular-nums">
                    ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-xs font-bold ${isUp ? 'text-emerald-500' : 'text-orange-400'}`}>
                    {isUp ? '+' : ''}
                    {displayChange.toFixed(2)}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!existingItem) {
                      void handleAdd(asset);
                    }
                  }}
                  disabled={Boolean(existingItem) || isPending || !asset.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-full border transition-colors ${
                    existingItem
                      ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                      : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10'
                  } disabled:opacity-80`}
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : existingItem ? <Check size={14} /> : <Plus size={14} />}
                  {existingItem ? 'Added' : 'Add'}
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default WatchlistPage;
