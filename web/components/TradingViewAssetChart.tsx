import React, { useEffect, useMemo, useRef, useState } from 'react';

interface TradingViewAssetChartProps {
  symbol: string;
  assetType?: string;
  timeframe: string;
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

const TradingViewAssetChart: React.FC<TradingViewAssetChartProps> = ({ symbol, assetType, timeframe }) => {
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const tradingViewSymbol = useMemo(() => resolveTradingViewSymbol(symbol, assetType), [assetType, symbol]);
  const interval = INTERVAL_BY_TIMEFRAME[timeframe] ?? 'D';

  useEffect(() => {
    if (!widgetRef.current) {
      return;
    }

    setIsLoaded(false);
    widgetRef.current.innerHTML = '';
    const loadingTimeout = window.setTimeout(() => {
      setIsLoaded(true);
    }, 2500);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tradingViewSymbol,
      interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      allow_symbol_change: false,
      withdateranges: false,
      hide_top_toolbar: true,
      hide_side_toolbar: true,
      hide_legend: false,
      save_image: false,
      details: false,
      hotlist: false,
      calendar: false,
      studies: [
        'MASimple@tv-basicstudies',
        'RSI@tv-basicstudies',
      ],
      backgroundColor: '#050505',
      gridColor: 'rgba(255, 255, 255, 0.06)',
      watchlist: [],
    });

    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = () => {
      setIsLoaded(true);
    };

    widgetRef.current.appendChild(script);

    return () => {
      window.clearTimeout(loadingTimeout);
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    };
  }, [interval, tradingViewSymbol]);

  return (
    <div className="relative h-full w-full rounded-2xl border border-white/5 bg-[#070707] overflow-hidden">
      <div className="tradingview-widget-container h-full w-full" ref={widgetRef}>
        <div className="tradingview-widget-container__widget h-full w-full" />
      </div>

      {!isLoaded && (
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
