import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, ReferenceDot } from 'recharts';
import { useMarket } from '../context/MarketContext';
import type { DashboardRange, PortfolioHistoryPoint } from '../types';

const RANGE_OPTIONS: Array<{ value: DashboardRange; label: string; periodLabel: string }> = [
  { value: '24h', label: '24', periodLabel: 'Today' },
  { value: '1w', label: '1we', periodLabel: '1 Week' },
  { value: '1m', label: '1mo', periodLabel: '1 Month' },
  { value: '3m', label: '3mo', periodLabel: '3 Months' },
  { value: '6m', label: '6mo', periodLabel: '6 Months' },
  { value: '1y', label: '1yr', periodLabel: '1 Year' },
];

interface ChartPoint {
  time: string;
  value: number;
  rawValue: number;
  buyingPower: number;
  timestamp: number;
}

const roundMoney = (value: number): number => Number(value.toFixed(2));

const toChartPoint = (
  point: PortfolioHistoryPoint,
  index: number,
  buyingPowerFallback: number,
): ChartPoint => {
  const buyingPower = Number(point.buyingPower ?? buyingPowerFallback);
  const totalValue = Number(point.value);
  const explicitHoldingsValue = Number(point.holdingsValue);
  const holdingsValue = Number.isFinite(explicitHoldingsValue)
    ? Math.max(0, explicitHoldingsValue)
    : Math.max(0, totalValue - buyingPower);

  return {
    time: point.time,
    value: roundMoney(holdingsValue),
    rawValue: roundMoney(holdingsValue),
    buyingPower,
    timestamp: Number(point.timestamp ?? index),
  };
};

const buildHistory = (
  points: PortfolioHistoryPoint[],
  currentHoldingValue: number,
  buyingPower: number,
): ChartPoint[] => {
  if (points.length === 0) {
    return [{
      time: 'Now',
      value: roundMoney(currentHoldingValue),
      rawValue: roundMoney(currentHoldingValue),
      buyingPower: roundMoney(buyingPower),
      timestamp: Date.now(),
    }];
  }

  const mapped = points.map((point, index) => toChartPoint(point, index, buyingPower));

  const lastIndex = mapped.length - 1;
  const last = mapped[lastIndex];
  mapped[lastIndex] = {
    ...last,
    value: roundMoney(currentHoldingValue),
    rawValue: roundMoney(currentHoldingValue),
    buyingPower: roundMoney(buyingPower),
    timestamp: Date.now(),
  };

  return mapped;
};

const PortfolioCard: React.FC = () => {
  const { dashboard, refreshDashboard } = useMarket();
  const [activeRange, setActiveRange] = useState<DashboardRange>('24h');
  const [microPhase, setMicroPhase] = useState(0);

  const portfolio = dashboard?.portfolio;
  const buyingPower = portfolio?.buyingPower ?? 0;

  const derivedCurrentHoldingValue = useMemo(() => {
    const holdingsFromSummary = Number(portfolio?.holdingsValue);
    if (Number.isFinite(holdingsFromSummary) && holdingsFromSummary > 0) {
      return holdingsFromSummary;
    }

    const holdingsValue = (dashboard?.positions ?? []).reduce((total, position) => {
      return total + (position.quantity * position.price);
    }, 0);

    if (holdingsValue > 0) {
      return holdingsValue;
    }

    const holdingsFromPortfolio = (portfolio?.value ?? 0) - buyingPower;
    if (holdingsFromPortfolio > 0) {
      return holdingsFromPortfolio;
    }

    return 0;
  }, [buyingPower, dashboard?.positions, portfolio?.holdingsValue, portfolio?.value]);

  const history = useMemo<ChartPoint[]>(() => {
    const points = dashboard?.portfolio.history ?? [];
    return buildHistory(points, derivedCurrentHoldingValue, buyingPower);
  }, [buyingPower, dashboard?.portfolio.history, derivedCurrentHoldingValue]);

  const chartEndValue = history[history.length - 1]?.value ?? derivedCurrentHoldingValue;
  const dailyFromPositions = useMemo(() => {
    const positionItems = dashboard?.positions ?? [];
    const hasExplicitValues = positionItems.some((position) => Number.isFinite(Number(position.dayChangeValue)));

    if (!hasExplicitValues) {
      return null;
    }

    const dayChange = positionItems.reduce((total, position) => total + (position.dayChangeValue ?? 0), 0);
    const previousCloseHoldings = derivedCurrentHoldingValue - dayChange;
    const dayChangePercent = previousCloseHoldings > 0
      ? (dayChange / previousCloseHoldings) * 100
      : 0;

    return {
      dayChange,
      dayChangePercent,
    };
  }, [dashboard?.positions, derivedCurrentHoldingValue]);
  const dailyChange = dailyFromPositions?.dayChange ?? 0;
  const dailyChangePercent = dailyFromPositions?.dayChangePercent ?? 0;
  const isPositive = dailyChange >= 0;
  const isFlatHistory = useMemo(() => {
    if (history.length < 3) {
      return true;
    }

    const values = history.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const average = values.reduce((total, value) => total + value, 0) / values.length;
    const minVisibleSpan = Math.max(Math.abs(average) * 0.001, 1.5);

    return span < minVisibleSpan;
  }, [history]);
  const isRecentFlat = useMemo(() => {
    if (history.length < 4) {
      return true;
    }

    const recentPoints = history.slice(-12);
    const values = recentPoints.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const average = values.reduce((total, value) => total + value, 0) / values.length;
    const minVisibleSpan = Math.max(Math.abs(average) * 0.00045, 0.55);

    return span < minVisibleSpan;
  }, [history]);
  const shouldAnimateLive = isFlatHistory || isRecentFlat;
  const investingDisplayValue = Number.isFinite(Number(portfolio?.investingTotal))
    ? Number(portfolio?.investingTotal)
    : (chartEndValue + Number(portfolio?.totalProfit ?? 0) + Number(portfolio?.assetProfit ?? portfolio?.tradeProfit ?? 0));

  useEffect(() => {
    void refreshDashboard(activeRange).catch(() => {
      // Keep the last chart state if refresh fails.
    });

    const intervalId = window.setInterval(() => {
      void refreshDashboard(activeRange).catch(() => {
        // Keep the last chart state if refresh fails.
      });
    }, 20_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeRange, refreshDashboard]);

  useEffect(() => {
    if (!shouldAnimateLive) {
      setMicroPhase(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setMicroPhase((previous) => previous + 0.45);
    }, 1300);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [shouldAnimateLive]);

  const renderedHistory = useMemo<ChartPoint[]>(() => {
    if (!shouldAnimateLive || history.length < 3) {
      return history;
    }

    const lastIndex = history.length - 1;
    const baseline = chartEndValue;
    const amplitude = Math.min(2.25, Math.max(Math.abs(baseline) * 0.00018, 0.2));

    return history.map((point, index) => {
      if (index === 0 || index === lastIndex) {
        return point;
      }

      const progress = index / lastIndex;
      const tailEnvelope = isRecentFlat
        ? Math.pow(progress, 1.6)
        : Math.sin((Math.PI * index) / lastIndex);
      const oscillation = Math.sin((index * 0.72) + microPhase) * amplitude * tailEnvelope;

      return {
        ...point,
        value: roundMoney(point.rawValue + oscillation),
      };
    });
  }, [chartEndValue, history, isRecentFlat, microPhase, shouldAnimateLive]);

  const yDomain = useMemo(() => {
    const values = renderedHistory.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const relativePadding = Math.max(Math.abs(max) * 0.0005, 1);
    const padding = span > 0 ? Math.max(span * 0.15, relativePadding) : relativePadding;

    return [min - padding, max + padding];
  }, [renderedHistory]);

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <p className="text-xs font-bold text-green-500 tracking-widest uppercase mb-1">Investing</p>
        <h2 className="text-4xl font-extrabold tracking-tight mb-2 tabular-nums">
          ${investingDisplayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <div className="flex items-center gap-2">
          <div className={`flex items-center font-bold text-sm ${isPositive ? 'text-green-500' : 'text-orange-500'}`}>
            {isPositive ? <ArrowUpRight size={16} className="mr-0.5" /> : <ArrowDownRight size={16} className="mr-0.5" />}
            <span className="tabular-nums">
              ${Math.abs(dailyChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              ({isPositive ? '+' : ''}{dailyChangePercent.toFixed(2)}%)
            </span>
            <span className="relative ml-2 inline-flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${isPositive ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-orange-500'}`} />
            </span>
          </div>
          <span className="text-zinc-500 text-sm font-medium">Today</span>
        </div>
      </div>

      <div className="h-64 w-full relative group">
        <div className="absolute top-0 right-0 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full z-10 border border-white/5">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">LIVE</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={renderedHistory}>
            <YAxis hide domain={yDomain} />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#22c55e' }}
              cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '3 3' }}
              labelStyle={{ color: '#a1a1aa', fontSize: '11px' }}
              formatter={(_value: number, _name: string, entry: any) => {
                const raw = Number(entry?.payload?.rawValue);
                const safeValue = Number.isFinite(raw) ? raw : Number(_value);

                return [`$${safeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Holdings'];
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#22c55e' : '#f97316'}
              strokeWidth={8}
              opacity={0.1}
              dot={false}
              isAnimationActive
              animationDuration={1100}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#22c55e' : '#f97316'}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                fill: isPositive ? '#22c55e' : '#f97316',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={1300}
              animationEasing="ease-out"
            />
            <ReferenceDot
              x={renderedHistory[renderedHistory.length - 1].time}
              y={renderedHistory[renderedHistory.length - 1].value}
              r={4}
              fill={isPositive ? '#22c55e' : '#f97316'}
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
