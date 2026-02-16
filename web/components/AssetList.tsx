import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import type { SelectableAsset } from '../types';

interface AssetListProps {
  onAssetClick?: (asset: SelectableAsset) => void;
  onOpenWatchlist?: () => void;
}

const AssetList: React.FC<AssetListProps> = ({ onAssetClick, onOpenWatchlist }) => {
  const { prices, positions, watchlist } = useMarket();

  const renderAssetRow = (asset: SelectableAsset, isHeld: boolean) => {
    const liveData = prices[asset.symbol] || { price: asset.price, lastAction: 'none' as const };
    const displayPrice = liveData.price;
    const displayMarketValue = asset.marketValue ?? ((asset.shares ?? 0) * displayPrice);
    const dayChangeValue = asset.dayChangeValue;
    const dayChangePercent = asset.dayChangePercent ?? asset.changePercent;
    const flashClass =
      liveData.lastAction === 'up'
        ? 'bg-green-500/10'
        : liveData.lastAction === 'down'
          ? 'bg-red-500/10'
          : '';

    return (
      <div
        key={`${asset.symbol}-${isHeld ? 'position' : 'watchlist'}`}
        onClick={() => onAssetClick?.(asset)}
        className={`flex items-center justify-between py-4 px-2 rounded-xl transition-all duration-500 cursor-pointer hover:bg-white/5 active:scale-[0.98] ${flashClass}`}
      >
        <div className="flex flex-col">
          <span className="font-extrabold text-white tracking-tight">{asset.symbol}</span>
          <span className="text-xs text-zinc-500 font-bold">
            {isHeld ? `${(asset.shares ?? 0).toFixed(2)} shares` : asset.name}
          </span>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className={`font-bold tabular-nums transition-colors duration-300 ${liveData.lastAction === 'up' ? 'text-green-400' : liveData.lastAction === 'down' ? 'text-red-400' : 'text-white'}`}>
            ${isHeld
              ? displayMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-xs font-bold flex items-center gap-1 ${dayChangePercent >= 0 ? 'text-green-500' : 'text-orange-500'}`}>
            {isHeld && (
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping ${dayChangePercent >= 0 ? 'bg-green-500' : 'bg-orange-500'}`} />
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dayChangePercent >= 0 ? 'bg-green-500' : 'bg-orange-500'}`} />
              </span>
            )}
            {isHeld && typeof dayChangeValue === 'number' ? (
              <>
                {dayChangeValue >= 0 ? '+' : ''}
                ${Math.abs(dayChangeValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {' '}
                ({dayChangePercent >= 0 ? '+' : ''}{dayChangePercent.toFixed(2)}%)
              </>
            ) : (
              <>
                {dayChangePercent >= 0 ? '+' : ''}
                {dayChangePercent.toFixed(2)}%
              </>
            )}
          </span>
        </div>
      </div>
    );
  };

  const mappedPositions: SelectableAsset[] = positions.map((position) => ({
    id: position.assetId,
    symbol: position.symbol,
    name: position.name,
    price: position.price,
    changePercent: position.changePercent,
    changeValue: position.changeValue,
    shares: position.quantity,
    type: position.type,
    marketValue: position.marketValue,
    dayChangeValue: position.dayChangeValue,
    dayChangePercent: position.dayChangePercent,
    openedAt: position.openedAt,
    updatedAt: position.updatedAt,
  }))
    .sort((a, b) => {
      const aTimestamp = new Date((a.updatedAt ?? a.openedAt ?? '') as string).getTime();
      const bTimestamp = new Date((b.updatedAt ?? b.openedAt ?? '') as string).getTime();

      if (Number.isFinite(aTimestamp) && Number.isFinite(bTimestamp) && aTimestamp !== bTimestamp) {
        return bTimestamp - aTimestamp;
      }

      return b.symbol.localeCompare(a.symbol);
    });

  return (
    <div className="px-4 py-2 space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-xl text-white">Your Assets</h3>
          <button className="text-green-500 p-1 hover:bg-green-500/10 rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
        <div className="space-y-1">
          {mappedPositions.map((asset) => renderAssetRow(asset, true))}
          {mappedPositions.length === 0 && (
            <p className="text-sm text-zinc-500 py-3">No active positions yet.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-xl text-white">Watchlist</h3>
          <button
            type="button"
            onClick={onOpenWatchlist}
            disabled={!onOpenWatchlist}
            aria-label="Open watchlist manager"
            className="text-green-500 p-1 hover:bg-green-500/10 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        <div className="space-y-1">
          {watchlist.map((asset) => renderAssetRow(asset, false))}
          {watchlist.length === 0 && (
            <p className="text-sm text-zinc-500 py-3">No watchlist assets yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default AssetList;
