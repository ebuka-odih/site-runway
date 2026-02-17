import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ChevronRight, LayoutGrid, FileText } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import TradeModal from './TradeModal';
import TradingViewAssetChart from './TradingViewAssetChart';
import type { MarketAssetDetail, SelectableAsset } from '../types';

interface AssetDetailProps {
  asset: SelectableAsset;
  onBack: () => void;
}

const AssetDetail: React.FC<AssetDetailProps> = ({ asset, onBack }) => {
  const { prices, fetchAssetDetail, buyingPower } = useMarket();
  const [timeframe, setTimeframe] = useState('1D');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [detail, setDetail] = useState<MarketAssetDetail | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!asset.id) {
        setDetail(null);
        return;
      }

      try {
        const result = await fetchAssetDetail(asset.id);
        if (active) {
          setDetail(result);
        }
      } catch {
        if (active) {
          setDetail(null);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [asset.id, fetchAssetDetail]);

  const liveData = prices[asset.symbol] || { price: asset.price, changePercent: asset.changePercent, lastAction: 'none' as const };
  const isPositive = liveData.changePercent >= 0;

  return (
    <div className="animate-in slide-in-from-right duration-500 min-h-screen bg-[#050505] pb-32">
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-md z-40">
        <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-zinc-800 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-1.5 bg-zinc-900/50 px-2 py-1 rounded-full border border-white/5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Live Market</span>
        </div>
      </header>

      <div className="px-4 py-4 space-y-1">
        <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase">{asset.symbol}</p>
        <h2 className="text-4xl font-extrabold text-white">{asset.name}</h2>
        <div className="flex items-end gap-3 mt-2">
          <h3 className="text-3xl font-bold tabular-nums">${liveData.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <div className={`flex items-center font-bold text-sm pb-1.5 ${isPositive ? 'text-green-500' : 'text-[#f97316]'}`}>
            {isPositive ? <ArrowUp size={14} className="mr-0.5" /> : <ArrowDown size={14} className="mr-0.5" />}
            <span>
              {isPositive ? '+' : ''}
              {liveData.changePercent.toFixed(2)}%
            </span>
            <span className="text-zinc-500 ml-2 font-medium">Today</span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pt-1">24 Hour Market</p>
      </div>

      <div className="h-64 w-full mt-4 mb-8 px-4">
        <TradingViewAssetChart
          symbol={asset.symbol}
          assetType={asset.type}
          timeframe={timeframe}
        />
      </div>

      <div className="flex justify-between px-4 mb-10 overflow-x-auto scrollbar-hide">
        {['1D', '1W', '1M', '3M', '1Y', 'All'].map((value) => (
          <button
            key={value}
            onClick={() => setTimeframe(value)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${timeframe === value ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="px-4 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-extrabold text-lg">Quick Trade</h4>
          <span className="text-xs font-bold text-zinc-500 uppercase">Individual</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setTradeType('buy');
              setIsTradeModalOpen(true);
            }}
            className="flex-[2.5] bg-[#050505] border-2 border-emerald-500/60 hover:border-emerald-500 text-emerald-400 font-extrabold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span className="text-xl">+</span> Buy
          </button>
          <button
            onClick={() => {
              setTradeType('sell');
              setIsTradeModalOpen(true);
            }}
            className="flex-1 bg-zinc-900/30 border border-white/10 text-zinc-300 font-extrabold py-3.5 rounded-full hover:bg-zinc-800 transition-all text-sm"
          >
            Sell
          </button>
        </div>
      </div>

      <div className="px-4 space-y-2 mb-10">
        {(detail?.relatedAssets ?? []).map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4 border-b border-white/5 group cursor-pointer">
            <div>
              <p className="font-extrabold text-white">{item.symbol}</p>
              <p className="text-xs text-zinc-500 font-bold">{item.name}</p>
            </div>
            <ChevronRight className="text-zinc-600 group-hover:text-white transition-colors" size={20} />
          </div>
        ))}
      </div>

      <div className="px-4 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-extrabold text-lg">About {asset.name}</h4>
          <span className="text-xs font-bold text-zinc-500 uppercase">Info</span>
        </div>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6 font-medium">
          {asset.name} is actively trading in the market. Monitor key stats, set price alerts, and execute trades.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Market Cap</p>
            <p className="text-xl font-extrabold">
              ${((detail?.marketCap ?? 0) / 1_000_000_000).toFixed(2)}B
            </p>
          </div>
          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Volume (24h)</p>
            <p className="text-xl font-extrabold">
              ${((detail?.volume24h ?? 0) / 1_000_000_000).toFixed(2)}B
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="text-emerald-500" size={20} />
            <h4 className="font-extrabold text-lg">Market News</h4>
          </div>
          <span className="text-xs font-bold text-zinc-500 uppercase">Latest</span>
        </div>
        <div className="border-2 border-dashed border-white/5 rounded-2xl py-12 flex flex-col items-center justify-center text-center px-6">
          <LayoutGrid className="text-zinc-700 mb-4" size={32} />
          <p className="text-sm text-zinc-500 font-medium">No specific news for {asset.symbol} at the moment. Check back later for market updates.</p>
        </div>
      </div>

      <div className="px-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Activity</p>
          <span className="text-[10px] font-bold text-zinc-500">{detail?.recentTrades.length ?? 0} shown</span>
        </div>
        <h4 className="text-xl font-extrabold mb-4">Recent Trades</h4>
        {detail?.recentTrades.length ? (
          <div className="space-y-3">
            {detail.recentTrades.map((trade) => (
              <div key={trade.id} className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-white uppercase">{trade.side} {asset.symbol}</p>
                  <p className="text-[10px] text-zinc-500 font-bold">{trade.trader}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">{trade.quantity.toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-500">${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-white/5 rounded-2xl py-12 flex flex-col items-center justify-center text-center px-10">
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">No trades yet for this asset. Your activity will appear here once you place an order.</p>
          </div>
        )}
      </div>

      {isTradeModalOpen && (
        <TradeModal
          asset={asset}
          type={tradeType}
          onClose={() => setIsTradeModalOpen(false)}
          buyingPower={buyingPower}
        />
      )}
    </div>
  );
};

export default AssetDetail;
