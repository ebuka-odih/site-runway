import React, { useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, ReferenceDot } from 'recharts';
import { useMarket } from '../context/MarketContext';

const PortfolioCard: React.FC = () => {
  const { dashboard, refreshDashboard } = useMarket();

  const portfolio = dashboard?.portfolio;
  const history = useMemo(() => {
    if (!portfolio?.history?.length) {
      return [{ time: '00:00', value: 0 }];
    }

    return portfolio.history;
  }, [portfolio]);

  const currentValue = portfolio?.value ?? 0;
  const buyingPower = portfolio?.buyingPower ?? 0;
  const dailyChange = portfolio?.dailyChange ?? 0;
  const dailyChangePercent = portfolio?.dailyChangePercent ?? 0;
  const isPositive = dailyChange >= 0;

  useEffect(() => {
    void refreshDashboard().catch(() => {
      // Keep the last chart state if refresh fails.
    });

    const intervalId = window.setInterval(() => {
      void refreshDashboard().catch(() => {
        // Keep the last chart state if refresh fails.
      });
    }, 12000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshDashboard]);

  const yDomain = useMemo(() => {
    const values = history.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.2 || 100;
    return [min - padding, max + padding];
  }, [history]);

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <p className="text-xs font-bold text-green-500 tracking-widest uppercase mb-1">Investing</p>
        <h2 className="text-4xl font-extrabold tracking-tight mb-2 tabular-nums">
          ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <div className="flex items-center gap-2">
          <div className={`flex items-center font-bold text-sm ${isPositive ? 'text-green-500' : 'text-orange-500'}`}>
            {isPositive ? <ArrowUpRight size={16} className="mr-0.5" /> : <ArrowDownRight size={16} className="mr-0.5" />}
            <span className="tabular-nums">
              ${Math.abs(dailyChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              ({isPositive ? '+' : ''}{dailyChangePercent.toFixed(2)}%)
            </span>
          </div>
          <span className="text-zinc-500 text-sm font-medium">Today</span>
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
              cursor={{ stroke: '#27272a', strokeWidth: 1 }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#22c55e' : '#f97316'}
              strokeWidth={3}
              dot={false}
              isAnimationActive
              animationDuration={450}
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

      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
        <span className="text-zinc-400 font-semibold">Buying power</span>
        <span className="text-xl font-bold tabular-nums">${buyingPower.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default PortfolioCard;
