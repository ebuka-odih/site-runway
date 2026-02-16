import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, ReferenceDot } from 'recharts';
import { useMarket } from '../context/MarketContext';
import type { DashboardRange } from '../types';

const RANGE_OPTIONS: Array<{ value: DashboardRange; label: string; periodLabel: string }> = [
  { value: '24h', label: '24', periodLabel: 'Today' },
  { value: '1w', label: '1we', periodLabel: '1 Week' },
  { value: '1m', label: '1mo', periodLabel: '1 Month' },
  { value: '3m', label: '3mo', periodLabel: '3 Months' },
  { value: '6m', label: '6mo', periodLabel: '6 Months' },
  { value: '1y', label: '1yr', periodLabel: '1 Year' },
];

const RANGE_SETTINGS: Record<DashboardRange, {
  points: number;
  intervalMs: number;
  driftScale: number;
  noiseScale: number;
  liveJitter: number;
  liveSpeed: number;
}> = {
  '24h': { points: 96, intervalMs: 15 * 60 * 1000, driftScale: 1.0, noiseScale: 1.0, liveJitter: 0.0015, liveSpeed: 0.62 },
  '1w': { points: 84, intervalMs: 2 * 60 * 60 * 1000, driftScale: 1.4, noiseScale: 1.2, liveJitter: 0.0011, liveSpeed: 0.5 },
  '1m': { points: 120, intervalMs: 6 * 60 * 60 * 1000, driftScale: 1.9, noiseScale: 1.35, liveJitter: 0.0008, liveSpeed: 0.42 },
  '3m': { points: 132, intervalMs: 16 * 60 * 60 * 1000, driftScale: 2.4, noiseScale: 1.5, liveJitter: 0.0006, liveSpeed: 0.33 },
  '6m': { points: 156, intervalMs: 32 * 60 * 60 * 1000, driftScale: 2.9, noiseScale: 1.7, liveJitter: 0.00045, liveSpeed: 0.28 },
  '1y': { points: 208, intervalMs: 42 * 60 * 60 * 1000, driftScale: 3.3, noiseScale: 1.85, liveJitter: 0.0003, liveSpeed: 0.2 },
};

interface ChartPoint {
  time: string;
  value: number;
  buyingPower: number;
  timestamp: number;
}

interface SimOrder {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  totalValue: number;
  timestamp: number;
}

interface AssetMeta {
  currentPrice: number;
  changePercent: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const hashSeed = (input: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
};

const formatTimestamp = (timestamp: number, range: DashboardRange): string => {
  const date = new Date(timestamp);

  if (range === '24h' || range === '1w') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (range === '1m' || range === '3m') {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
};

const parseOrderTimestamp = (value: string): number => {
  if (!value) {
    return Number.NaN;
  }

  const direct = Date.parse(value);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const withTimeSeparator = value.includes('T') ? value : value.replace(' ', 'T');
  const withTimezone = /[zZ]|[+\-]\d{2}:\d{2}$/.test(withTimeSeparator) ? withTimeSeparator : `${withTimeSeparator}Z`;
  const fallback = Date.parse(withTimezone);

  return Number.isFinite(fallback) ? fallback : Number.NaN;
};

const simulateAssetPrice = (
  meta: AssetMeta,
  progress: number,
  symbol: string,
  range: DashboardRange,
  livePhase: number,
): number => {
  const settings = RANGE_SETTINGS[range];
  const seed = hashSeed(`${symbol}-${range}`);
  const phase = (seed % 360) * (Math.PI / 180);
  const volatility = Math.max(Math.abs(meta.changePercent) / 100, 0.01);
  const drift = clamp((meta.changePercent / 100) * 0.5 * settings.driftScale, -0.75, 1.45);

  const startPrice = meta.currentPrice / Math.max(0.2, 1 + drift);
  const trend = startPrice + ((meta.currentPrice - startPrice) * progress);

  const waveOne = Math.sin((progress * Math.PI * 3.2) + phase) * 0.58;
  const waveTwo = Math.cos((progress * Math.PI * 9.6) + (phase / 2)) * 0.31;
  const waveThree = Math.sin((progress * Math.PI * 16.5) + (phase / 3)) * 0.11;
  const noiseMix = waveOne + waveTwo + waveThree;

  const shockCenter = 0.18 + ((seed % 47) / 100);
  const shockWidth = 0.045 + (((seed >> 5) % 13) / 220);
  const shockDirection = seed % 2 === 0 ? -1 : 1;
  const shockAmplitude = meta.currentPrice * volatility * settings.noiseScale * 0.18;
  const shock = shockDirection * shockAmplitude * Math.exp(-((progress - shockCenter) ** 2) / (2 * shockWidth ** 2));

  const taper = 0.3 + ((1 - progress) * 0.9);
  const noiseAmplitude = meta.currentPrice * volatility * settings.noiseScale * 0.095;
  const livePulse = Math.sin((progress * Math.PI * 2.4) + livePhase + (phase / 4)) * 0.22;
  const noisyValue = trend + (noiseMix * noiseAmplitude * taper) + shock + (livePulse * noiseAmplitude * settings.liveJitter * 42);

  // Force exact convergence to current price near the tail so current value stays accurate.
  const endBlend = progress ** 2.6;
  const finalPrice = (noisyValue * (1 - endBlend)) + (meta.currentPrice * endBlend);

  return Math.max(0.00000001, finalPrice);
};

const buildInteractiveHistory = (
  range: DashboardRange,
  currentValue: number,
  buyingPower: number,
  positions: Array<{ symbol: string; quantity: number; price: number; changePercent: number }>,
  orders: SimOrder[],
  assets: Array<{ symbol: string; price: number; changePercent: number }>,
  nowMs: number,
  liveTick: number,
): ChartPoint[] => {
  const settings = RANGE_SETTINGS[range];
  const now = nowMs;
  const startTimestamp = now - ((settings.points - 1) * settings.intervalMs);
  const sortedOrders = [...orders]
    .filter((order) => Number.isFinite(order.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);

  const ordersInRange = sortedOrders.filter((order) => order.timestamp >= startTimestamp && order.timestamp <= now);
  const symbolSet = new Set<string>();
  positions.forEach((position) => symbolSet.add(position.symbol));
  sortedOrders.forEach((order) => symbolSet.add(order.symbol));

  const assetMap = new Map<string, AssetMeta>();
  assets.forEach((asset) => {
    assetMap.set(asset.symbol, {
      currentPrice: Math.max(asset.price, 0.00000001),
      changePercent: asset.changePercent,
    });
  });

  positions.forEach((position) => {
    if (!assetMap.has(position.symbol)) {
      assetMap.set(position.symbol, {
        currentPrice: Math.max(position.price, 0.00000001),
        changePercent: position.changePercent,
      });
    }
  });

  sortedOrders.forEach((order) => {
    if (!assetMap.has(order.symbol)) {
      const fallbackPrice = order.quantity > 0 ? (order.totalValue / order.quantity) : 1;
      assetMap.set(order.symbol, {
        currentPrice: Math.max(fallbackPrice, 0.00000001),
        changePercent: 0,
      });
    }
  });

  const currentHoldings = new Map<string, number>();
  positions.forEach((position) => {
    currentHoldings.set(position.symbol, position.quantity);
  });

  const netRangeQuantity = new Map<string, number>();
  let netRangeCashOutflow = 0;
  ordersInRange.forEach((order) => {
    const delta = order.side === 'buy' ? order.quantity : -order.quantity;
    netRangeQuantity.set(order.symbol, (netRangeQuantity.get(order.symbol) ?? 0) + delta);
    netRangeCashOutflow += order.side === 'buy' ? order.totalValue : -order.totalValue;
  });

  const holdings = new Map<string, number>();
  symbolSet.forEach((symbol) => {
    const currentQuantity = currentHoldings.get(symbol) ?? 0;
    const quantityBeforeRange = currentQuantity - (netRangeQuantity.get(symbol) ?? 0);
    holdings.set(symbol, quantityBeforeRange);
  });

  let cash = buyingPower + netRangeCashOutflow;
  let orderCursor = 0;
  const history: ChartPoint[] = [];
  const hasExposure = positions.some((position) => position.quantity > 0) || sortedOrders.length > 0;
  const livePhase = ((now / 1000) * settings.liveSpeed) + (liveTick * 0.13);

  const eventImpacts: Array<{ index: number; magnitude: number; width: number }> = [];

  for (let index = 0; index < settings.points; index += 1) {
    const timestamp = startTimestamp + (index * settings.intervalMs);
    const progress = settings.points > 1 ? index / (settings.points - 1) : 1;

    while (orderCursor < ordersInRange.length && ordersInRange[orderCursor].timestamp <= timestamp) {
      const order = ordersInRange[orderCursor];
      const quantityDelta = order.side === 'buy' ? order.quantity : -order.quantity;
      holdings.set(order.symbol, (holdings.get(order.symbol) ?? 0) + quantityDelta);
      cash += order.side === 'buy' ? -order.totalValue : order.totalValue;

      const assetChangePercent = assetMap.get(order.symbol)?.changePercent ?? 0;
      const orderDirection = order.side === 'buy'
        ? (assetChangePercent >= 0 ? 1 : -1)
        : (assetChangePercent >= 0 ? -1 : 1);
      const impactMagnitude = Math.max(currentValue * 0.00012, Math.abs(order.totalValue) * 0.00055) * orderDirection;
      eventImpacts.push({
        index,
        magnitude: impactMagnitude,
        width: order.side === 'buy' ? 6 : 4,
      });
      orderCursor += 1;
    }

    const holdingsValue = [...holdings.entries()].reduce((total, [symbol, quantity]) => {
      if (quantity === 0) {
        return total;
      }

      const meta = assetMap.get(symbol);
      if (!meta) {
        return total;
      }

      return total + (Math.max(0, quantity) * simulateAssetPrice(meta, progress, symbol, range, livePhase));
    }, 0);

    let value = cash + holdingsValue;

    if (eventImpacts.length > 0) {
      const eventDrift = eventImpacts.reduce((total, event) => {
        const distance = index - event.index;

        if (distance < 0) {
          return total;
        }

        const gaussian = Math.exp(-(distance ** 2) / (2 * (event.width ** 2)));
        const persistence = Math.exp(-distance / (settings.points * 0.42));
        return total + (event.magnitude * gaussian * (0.5 + persistence));
      }, 0);

      value += eventDrift;
    }

    if (!hasExposure) {
      const seed = hashSeed(range);
      const phase = (seed % 360) * (Math.PI / 180);
      const baseline = Math.max(currentValue, buyingPower, 1);
      const softWave = Math.sin((progress * Math.PI * 4.5) + phase + (livePhase * 0.2)) * 0.0018;
      const fastWave = Math.cos((progress * Math.PI * 11.5) + (phase / 2) + (livePhase * 0.45)) * 0.00095;
      value = baseline * (1 + softWave + fastWave);
    }

    history.push({
      time: formatTimestamp(timestamp, range),
      value: Number(value.toFixed(2)),
      buyingPower: Number(cash.toFixed(2)),
      timestamp,
    });
  }

  if (history.length > 0) {
    const investedRatio = currentValue > 0
      ? clamp((currentValue - buyingPower) / currentValue, 0, 1)
      : 0;
    const anchorSeed = hashSeed(`${range}-anchor`);
    const anchorWave = (
      Math.sin((livePhase * 1.25) + ((anchorSeed % 11) / 3)) * 0.58
      + Math.cos((livePhase * 0.82) + ((anchorSeed % 7) / 4)) * 0.34
    );
    const anchorDriftScale = settings.liveJitter * (hasExposure ? (0.28 + (investedRatio * 1.5)) : 0.22);
    const targetEndValue = Math.max(0.01, currentValue * (1 + (anchorWave * anchorDriftScale)));
    const delta = Number((targetEndValue - history[history.length - 1].value).toFixed(2));
    for (let index = 0; index < history.length; index += 1) {
      history[index] = {
        ...history[index],
        value: Number((history[index].value + delta).toFixed(2)),
      };
    }
  }

  return history;
};

const PortfolioCard: React.FC = () => {
  const { dashboard, refreshDashboard, orders, marketAssets } = useMarket();
  const [activeRange, setActiveRange] = useState<DashboardRange>('24h');
  const [liveTick, setLiveTick] = useState(0);

  const portfolio = dashboard?.portfolio;
  const buyingPower = portfolio?.buyingPower ?? 0;
  const derivedCurrentValue = useMemo(() => {
    const priceMap = new Map<string, number>();
    marketAssets.forEach((asset) => {
      priceMap.set(asset.symbol, asset.price);
    });

    const holdingsValue = (dashboard?.positions ?? []).reduce((total, position) => {
      const effectivePrice = priceMap.get(position.symbol) ?? position.price;
      return total + (position.quantity * effectivePrice);
    }, 0);

    const computedValue = buyingPower + holdingsValue;
    if (computedValue > 0) {
      return computedValue;
    }

    return portfolio?.value ?? 0;
  }, [buyingPower, dashboard?.positions, marketAssets, portfolio?.value]);

  const backendHistory = useMemo<ChartPoint[]>(() => {
    const points = dashboard?.portfolio.history ?? [];

    if (points.length <= 1) {
      return [];
    }

    return points.map((point, index) => ({
      time: point.time,
      value: Number(point.value),
      buyingPower: Number(point.buyingPower ?? buyingPower),
      timestamp: Number(point.timestamp ?? index),
    }));
  }, [buyingPower, dashboard?.portfolio.history]);

  const history = useMemo(() => {
    if (backendHistory.length > 1) {
      return backendHistory;
    }

    const mappedOrders: SimOrder[] = orders
      .filter((order) => String(order.status).toLowerCase() === 'filled')
      .map((order) => ({
        symbol: order.asset.symbol,
        side: order.side,
        quantity: order.quantity,
        totalValue: order.totalValue,
        timestamp: parseOrderTimestamp(order.filledAt ?? order.placedAt),
      }))
      .filter((order) => Number.isFinite(order.timestamp));

    const mappedPositions = (dashboard?.positions ?? []).map((position) => ({
      symbol: position.symbol,
      quantity: position.quantity,
      price: position.price,
      changePercent: position.changePercent,
    }));

    const mappedAssets = marketAssets.map((asset) => ({
      symbol: asset.symbol,
      price: asset.price,
      changePercent: asset.changePercent,
    }));

    const generated = buildInteractiveHistory(
      activeRange,
      derivedCurrentValue,
      buyingPower,
      mappedPositions,
      mappedOrders,
      mappedAssets,
      Date.now(),
      liveTick,
    );

    if (generated.length > 1) {
      return generated;
    }

    return [{ time: '00:00', value: derivedCurrentValue, buyingPower, timestamp: Date.now() }];
  }, [activeRange, backendHistory, buyingPower, dashboard?.positions, derivedCurrentValue, liveTick, marketAssets, orders]);

  const chartStartValue = history[0]?.value ?? derivedCurrentValue;
  const chartEndValue = history[history.length - 1]?.value ?? derivedCurrentValue;
  const dailyChange = chartEndValue - chartStartValue;
  const dailyChangePercent = chartStartValue > 0 ? (dailyChange / chartStartValue) * 100 : 0;
  const isPositive = dailyChange >= 0;
  const activePeriodLabel = useMemo(
    () => RANGE_OPTIONS.find((option) => option.value === activeRange)?.periodLabel ?? 'Today',
    [activeRange],
  );

  useEffect(() => {
    void refreshDashboard(activeRange).catch(() => {
      // Keep the last chart state if refresh fails.
    });

    const intervalId = window.setInterval(() => {
      void refreshDashboard(activeRange).catch(() => {
        // Keep the last chart state if refresh fails.
      });
    }, 12000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeRange, refreshDashboard]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLiveTick((previous) => previous + 1);
    }, 2200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const yDomain = useMemo(() => {
    const values = history.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const relativePadding = Math.max(Math.abs(max) * 0.0005, 1);
    const padding = span > 0 ? Math.max(span * 0.18, relativePadding) : relativePadding;

    return [min - padding, max + padding];
  }, [history]);

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <p className="text-xs font-bold text-green-500 tracking-widest uppercase mb-1">Investing</p>
        <h2 className="text-4xl font-extrabold tracking-tight mb-2 tabular-nums">
          ${chartEndValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <div className="flex items-center gap-2">
          <div className={`flex items-center font-bold text-sm ${isPositive ? 'text-green-500' : 'text-orange-500'}`}>
            {isPositive ? <ArrowUpRight size={16} className="mr-0.5" /> : <ArrowDownRight size={16} className="mr-0.5" />}
            <span className="tabular-nums">
              ${Math.abs(dailyChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              ({isPositive ? '+' : ''}{dailyChangePercent.toFixed(2)}%)
            </span>
          </div>
          <span className="text-zinc-500 text-sm font-medium">{activePeriodLabel}</span>
        </div>
      </div>

      <div className="h-64 w-full relative group">
        <div className="absolute top-0 right-0 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full z-10 border border-white/5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">LIVE</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <YAxis hide domain={yDomain} />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#22c55e' }}
              cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '3 3' }}
              labelStyle={{ color: '#a1a1aa', fontSize: '11px' }}
              formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Portfolio']}
            />
            <Line
              type="natural"
              dataKey="value"
              stroke={isPositive ? '#22c55e' : '#f97316'}
              strokeWidth={9}
              opacity={0.12}
              dot={false}
              isAnimationActive
              animationDuration={850}
            />
            <Line
              type="natural"
              dataKey="value"
              stroke={isPositive ? '#22c55e' : '#f97316'}
              strokeWidth={3.25}
              dot={false}
              activeDot={{
                r: 6,
                fill: isPositive ? '#22c55e' : '#f97316',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={950}
              animationEasing="ease-out"
            />
            <ReferenceDot
              x={history[history.length - 1].time}
              y={history[history.length - 1].value}
              r={4}
              fill={isPositive ? '#22c55e' : '#f97316'}
              className="animate-pulse"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
        {RANGE_OPTIONS.map((option) => {
          const isActive = option.value === activeRange;

          return (
            <button
              key={option.value}
              onClick={() => setActiveRange(option.value)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                  : 'bg-zinc-900/70 text-zinc-500 border border-white/5 hover:text-zinc-300'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
        <span className="text-zinc-400 font-semibold">Buying power</span>
        <span className="text-xl font-bold tabular-nums">${buyingPower.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default PortfolioCard;
