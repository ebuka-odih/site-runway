import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, ReferenceDot } from 'recharts';

interface TradingViewAssetChartProps {
  symbol: string;
  assetType?: string;
  timeframe: string;
  livePrice: number;
  isPositive: boolean;
}

const STOCK_EXCHANGE_BY_SYMBOL: Record<string, string> = {
  AAPL: 'NASDAQ',
  MSFT: 'NASDAQ',
  NVDA: 'NASDAQ',
  TSLA: 'NASDAQ',
  AMD: 'NASDAQ',
  AMZN: 'NASDAQ',
  META: 'NASDAQ',
  GOOGL: 'NASDAQ',
  NFLX: 'NASDAQ',
  SPY: 'AMEX',
  QQQ: 'NASDAQ',
  DIA: 'AMEX',
  IWM: 'AMEX',
  VTI: 'AMEX',
};

const INTERVAL_BY_TIMEFRAME: Record<string, string> = {
  '1D': '5',
  '1W': '30',
  '1M': '60',
  '3M': '240',
  '1Y': 'D',
  All: 'W',
};

const TradingViewAssetChart: React.FC<TradingViewAssetChartProps> = ({
  symbol,
  assetType,
  timeframe,
  livePrice,
  isPositive,
}) => {
  const [chartMode, setChartMode] = useState<'loading' | 'widget' | 'fallback'>('loading');

  const tradingViewSymbol = useMemo(() => resolveTradingViewSymbol(symbol, assetType), [assetType, symbol]);
  const interval = INTERVAL_BY_TIMEFRAME[timeframe] ?? 'D';

  const widgetSrc = useMemo(() => {
    const params = new URLSearchParams({
      symbol: tradingViewSymbol,
      interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      hide_top_toolbar: '1',
      hide_side_toolbar: '1',
      withdateranges: '0',
      saveimage: '0',
      details: '0',
      hotlist: '0',
      calendar: '0',
      symboledit: '0',
      toolbarbg: '#050505',
      hideideas: '1',
    });

    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [interval, tradingViewSymbol]);

  const fallbackData = useMemo(() => {
    return Array.from({ length: 40 }, (_, index) => ({
      time: index.toString(),
      value: livePrice * (1 + (Math.sin(index / 3) * 0.02) - (index * 0.00045)),
    }));
  }, [livePrice]);

  const yDomain = useMemo(() => {
    const values = fallbackData.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.2 || 1;

    return [min - padding, max + padding];
  }, [fallbackData]);

  useEffect(() => {
    setChartMode('loading');

    const fallbackTimer = window.setTimeout(() => {
      setChartMode((previous) => (previous === 'loading' ? 'fallback' : previous));
    }, 5500);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [widgetSrc]);

  return (
    <div className="relative h-full w-full rounded-2xl border border-white/5 bg-[#070707] overflow-hidden">
      {chartMode !== 'fallback' && (
        <iframe
          key={widgetSrc}
          title={`${symbol} TradingView chart`}
          src={widgetSrc}
          className="h-full w-full border-0"
          loading="eager"
          allow="fullscreen"
          onLoad={() => setChartMode('widget')}
          onError={() => setChartMode('fallback')}
        />
      )}

      {chartMode === 'fallback' && (
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fallbackData}>
              <YAxis hide domain={yDomain} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? '#22c55e' : '#f97316'}
                strokeWidth={3}
                dot={false}
              />
              <ReferenceDot
                x={fallbackData[fallbackData.length - 1].time}
                y={fallbackData[fallbackData.length - 1].value}
                r={4}
                fill={isPositive ? '#22c55e' : '#f97316'}
                className="animate-pulse"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartMode === 'loading' && (
        <div className="absolute inset-0 bg-[#070707] animate-pulse" />
      )}
    </div>
  );
};

function resolveTradingViewSymbol(symbol: string, assetType?: string): string {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const normalizedType = (assetType ?? '').trim().toLowerCase();

  if (normalizedType === 'crypto') {
    return `BINANCE:${normalizedSymbol}USDT`;
  }

  if (normalizedType === 'etf') {
    if (normalizedSymbol === 'QQQ') {
      return 'NASDAQ:QQQ';
    }

    return `AMEX:${normalizedSymbol}`;
  }

  const exchange = STOCK_EXCHANGE_BY_SYMBOL[normalizedSymbol] ?? 'NASDAQ';

  return `${exchange}:${normalizedSymbol}`;
}

export default TradingViewAssetChart;
