import React from 'react';
import { useMarket } from '../context/MarketContext';
import type { MarketMover } from '../types';

const MAX_HEATMAP_ITEMS = 6;

function buildHeatmapItems(input: Array<{ symbol: string; change: number }>): MarketMover[] {
  const bySymbol = new Map<string, number>();

  input.forEach((item) => {
    const symbol = String(item.symbol ?? '').trim().toUpperCase();
    const change = Number.isFinite(item.change) ? Number(item.change) : 0;

    if (!symbol) {
      return;
    }

    bySymbol.set(symbol, change);
  });

  return [...bySymbol.entries()]
    .map(([symbol, change]) => ({ symbol, change }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, MAX_HEATMAP_ITEMS);
}

function resolveTileTone(change: number): string {
  const magnitude = Math.abs(change);

  if (change > 0.01) {
    if (magnitude >= 5) {
      return 'bg-emerald-500/35 border-emerald-300/70 text-emerald-50 shadow-[0_0_24px_rgba(16,185,129,0.28)]';
    }

    if (magnitude >= 2) {
      return 'bg-emerald-500/22 border-emerald-400/60 text-emerald-100';
    }

    return 'bg-emerald-500/15 border-emerald-500/45 text-emerald-200';
  }

  if (change < -0.01) {
    if (magnitude >= 5) {
      return 'bg-orange-500/35 border-orange-300/70 text-orange-50 shadow-[0_0_24px_rgba(249,115,22,0.28)]';
    }

    if (magnitude >= 2) {
      return 'bg-orange-500/22 border-orange-400/60 text-orange-100';
    }

    return 'bg-orange-500/15 border-orange-500/45 text-orange-200';
  }

  return 'bg-zinc-700/60 border-zinc-500/55 text-zinc-100';
}

const Heatmap: React.FC = () => {
  const { dashboard, watchlist } = useMarket();
  const positionHeatmap = buildHeatmapItems(
    (dashboard?.positions ?? []).map((position) => ({
      symbol: position.symbol,
      change: position.dayChangePercent ?? position.changePercent,
    })),
  );
  const watchlistHeatmap = buildHeatmapItems(
    watchlist.map((item) => ({
      symbol: item.symbol,
      change: item.changePercent,
    })),
  );
  const heatmap = positionHeatmap.length > 0 ? positionHeatmap : watchlistHeatmap;
  const isPositionHeatmap = positionHeatmap.length > 0;

  return (
    <div className="px-4 py-6 space-y-4">
      <h3 className="font-bold text-xl">Performance Heatmap</h3>
      <p className="text-zinc-400 text-xs font-medium -mt-3">
        {isPositionHeatmap
          ? 'Daily change across your top positions.'
          : 'No open positions yet. Showing daily change across watched assets.'}
      </p>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-900/30 p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {heatmap.map((item) => (
          <div
            key={item.symbol}
            className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 ${resolveTileTone(item.change)}`}
          >
            <span className="text-[10px] font-black tracking-tight">{item.symbol}</span>
            <span className="text-sm font-black leading-none mt-1">
              {item.change >= 0 ? '+' : ''}
              {item.change.toFixed(2)}%
            </span>
          </div>
        ))}
        {heatmap.length === 0 && (
          <p className="text-zinc-400 text-sm col-span-2 sm:col-span-3">
            Add assets to your watchlist or open a position to see performance data.
          </p>
        )}
        </div>
      </div>

      <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2">
        <p className="text-[11px] text-amber-100/95 leading-relaxed font-medium">
          Warning: Trading financial assets carries risk, and you can lose capital.
          Invest only what you can afford to lose.
        </p>
      </div>
    </div>
  );
};

export default Heatmap;
