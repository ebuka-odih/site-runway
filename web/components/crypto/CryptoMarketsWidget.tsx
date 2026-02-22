import React, { useEffect, useRef } from 'react';

const CryptoMarketsWidget: React.FC = () => {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!widgetRef.current) {
      return;
    }

    widgetRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      dateRange: '12M',
      showChart: true,
      locale: 'en',
      largeChartUrl: '',
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: '100%',
      height: 520,
      tabs: [
        {
          title: 'Majors',
          symbols: [
            { s: 'BINANCE:BTCUSDT', d: 'Bitcoin' },
            { s: 'BINANCE:ETHUSDT', d: 'Ethereum' },
            { s: 'BINANCE:SOLUSDT', d: 'Solana' },
            { s: 'BINANCE:XRPUSDT', d: 'XRP' },
            { s: 'BINANCE:BNBUSDT', d: 'BNB' },
          ],
        },
        {
          title: 'Momentum',
          symbols: [
            { s: 'BINANCE:AVAXUSDT', d: 'Avalanche' },
            { s: 'BINANCE:DOGEUSDT', d: 'Dogecoin' },
            { s: 'BINANCE:LINKUSDT', d: 'Chainlink' },
            { s: 'BINANCE:ADAUSDT', d: 'Cardano' },
            { s: 'BINANCE:DOTUSDT', d: 'Polkadot' },
          ],
        },
      ],
    });

    widgetRef.current.appendChild(script);
  }, []);

  return (
    <section className="mx-4 mt-4 rounded-3xl border border-cyan-400/25 bg-[#030714] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Live Crypto Markets</p>
      <div className="mt-3 tradingview-widget-container w-full" ref={widgetRef}>
        <div className="tradingview-widget-container__widget min-h-[520px]" />
        <div className="tradingview-widget-copyright mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" className="transition-colors hover:text-zinc-300">
            Market data by TradingView
          </a>
        </div>
      </div>
    </section>
  );
};

export default CryptoMarketsWidget;
