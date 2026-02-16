import React, { useMemo } from 'react';
import { Shield } from 'lucide-react';
import { useMarket } from '../context/MarketContext';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const formatCurrency = (value: number): string => (
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
);

const normalize = (value: number): number => Number.isFinite(value) ? value : 0;

const Analytics: React.FC = () => {
  const { dashboard } = useMarket();

  const portfolio = dashboard?.portfolio;
  const analytics = dashboard?.analytics;

  const totalValue = normalize(portfolio?.value ?? 0);
  const buyingPower = normalize(portfolio?.buyingPower ?? 0);
  const holdingsValue = normalize(portfolio?.holdingsValue ?? (totalValue - buyingPower));
  const assetCount = Math.max(0, Math.trunc(normalize(analytics?.assetCount ?? 0)));
  const diversificationScore = clamp(normalize(analytics?.diversificationScore ?? 0), 0, 100);
  const riskLevel = (analytics?.riskLevel ?? 'Unrated').trim();

  const cashSharePercent = totalValue > 0 ? clamp((buyingPower / totalValue) * 100, 0, 100) : 0;

  const allocationSummary = useMemo(() => {
    const allocation = analytics?.allocation ?? {};
    const entries = Object.entries(allocation)
      .map(([key, rawValue]) => ({
        key: key.toLowerCase(),
        value: normalize(Number(rawValue)),
      }))
      .filter((entry) => entry.value > 0);

    const crypto = entries
      .filter((entry) => entry.key === 'crypto')
      .reduce((total, entry) => total + entry.value, 0);

    const stockEtf = entries
      .filter((entry) => ['stock', 'stocks', 'share', 'shares', 'etf', 'etfs'].includes(entry.key))
      .reduce((total, entry) => total + entry.value, 0);

    const other = entries
      .filter((entry) => !['crypto', 'stock', 'stocks', 'share', 'shares', 'etf', 'etfs'].includes(entry.key))
      .reduce((total, entry) => total + entry.value, 0);

    const total = crypto + stockEtf + other;

    if (total <= 0) {
      return {
        total: 0,
        crypto: 0,
        stockEtf: 0,
        other: 0,
      };
    }

    return {
      total,
      crypto: (crypto / total) * 100,
      stockEtf: (stockEtf / total) * 100,
      other: (other / total) * 100,
    };
  }, [analytics?.allocation]);

  const topExposure = useMemo(() => {
    const buckets = [
      { label: 'Crypto', value: allocationSummary.crypto },
      { label: 'Stocks & ETFs', value: allocationSummary.stockEtf },
      { label: 'Other', value: allocationSummary.other },
    ].filter((bucket) => bucket.value > 0);

    if (buckets.length === 0) {
      return null;
    }

    return buckets.sort((left, right) => right.value - left.value)[0];
  }, [allocationSummary.crypto, allocationSummary.other, allocationSummary.stockEtf]);

  const riskColorClass = useMemo(() => {
    const lowered = riskLevel.toLowerCase();

    if (lowered.includes('aggressive') || lowered.includes('high')) {
      return 'text-orange-400';
    }

    if (lowered.includes('moderate') || lowered.includes('balanced')) {
      return 'text-amber-400';
    }

    return 'text-emerald-500';
  }, [riskLevel]);

  const riskProgress = useMemo(() => {
    const lowered = riskLevel.toLowerCase();

    if (lowered.includes('aggressive') || lowered.includes('high')) {
      return 85;
    }

    if (lowered.includes('moderate') || lowered.includes('balanced')) {
      return 55;
    }

    if (lowered.includes('conservative') || lowered.includes('low')) {
      return 30;
    }

    return 50;
  }, [riskLevel]);

  const keyFactors = useMemo(() => {
    if (assetCount === 0) {
      return [
        'No active holdings yet. Portfolio analytics will expand once positions are opened.',
      ];
    }

    const factors: string[] = [];
    factors.push(`${assetCount} active holdings are currently tracked in this portfolio.`);
    factors.push(`Cash exposure is ${cashSharePercent.toFixed(1)}% (${formatCurrency(buyingPower)} buying power).`);

    if (topExposure) {
      factors.push(`${topExposure.label} is the largest allocation bucket at ${topExposure.value.toFixed(1)}%.`);
    }

    return factors;
  }, [assetCount, buyingPower, cashSharePercent, topExposure]);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="text-green-500" size={20} />
        <h3 className="font-bold text-lg">Portfolio Analytics</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-green-500/20 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Risk Level</p>
          <p className={`font-bold mb-2 ${riskColorClass}`}>{riskLevel}</p>
          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full transition-all" style={{ width: `${riskProgress}%` }} />
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Diversification</p>
          <p className="text-white font-bold mb-2">{diversificationScore.toFixed(0)}/100</p>
          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full transition-all" style={{ width: `${diversificationScore}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Allocation</p>
        {allocationSummary.total > 0 ? (
          <>
            <div className="h-2 w-full rounded-full flex overflow-hidden">
              <div className="h-full bg-orange-500" style={{ width: `${allocationSummary.crypto.toFixed(2)}%` }} />
              <div className="h-full bg-green-500" style={{ width: `${allocationSummary.stockEtf.toFixed(2)}%` }} />
              <div className="h-full bg-zinc-500" style={{ width: `${allocationSummary.other.toFixed(2)}%` }} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-zinc-400">Crypto: {allocationSummary.crypto.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-zinc-400">Stocks & ETFs: {allocationSummary.stockEtf.toFixed(1)}%</span>
              </div>
              {allocationSummary.other > 0.05 && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-zinc-500" />
                  <span className="text-zinc-400">Other: {allocationSummary.other.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500">No holdings allocation yet.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900/30 border border-white/5 p-3 rounded-lg text-center">
          <p className="text-lg font-bold">{assetCount}</p>
          <p className="text-[10px] text-zinc-500 font-bold">Assets</p>
        </div>
        <div className="bg-zinc-900/30 border border-white/5 p-3 rounded-lg text-center">
          <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(holdingsValue)}</p>
          <p className="text-[10px] text-zinc-500 font-bold">Holdings</p>
        </div>
        <div className="bg-zinc-900/30 border border-white/5 p-3 rounded-lg text-center">
          <p className="text-lg font-bold tabular-nums">{cashSharePercent.toFixed(1)}%</p>
          <p className="text-[10px] text-zinc-500 font-bold">Cash Share</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Key Factors</p>
        {keyFactors.map((factor) => (
          <div key={factor} className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-500/20 border border-green-500/40 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-zinc-300">{factor}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analytics;
