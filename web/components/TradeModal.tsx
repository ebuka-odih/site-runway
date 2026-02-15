import React, { useMemo, useState } from 'react';
import { X, ChevronDown, Info, Delete, AlertCircle, Check, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import type { OrderItem, SelectableAsset } from '../types';

interface TradeModalProps {
  asset: SelectableAsset;
  type: 'buy' | 'sell';
  onClose: () => void;
  buyingPower: number;
}

const TradeModal: React.FC<TradeModalProps> = ({ asset: initialAsset, type: initialType, onClose, buyingPower }) => {
  const { prices, marketAssets, positions, placeOrder } = useMarket();
  const [currentAsset, setCurrentAsset] = useState(initialAsset);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>(initialType);
  const [status, setStatus] = useState<'input' | 'review' | 'processing' | 'success'>('input');
  const [amount, setAmount] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [executedOrder, setExecutedOrder] = useState<OrderItem | null>(null);

  const livePrice = prices[currentAsset.symbol]?.price || currentAsset.price;
  const activeColorClass = tradeType === 'buy' ? 'bg-[#10b981]' : 'bg-red-500';
  const activeTextClass = tradeType === 'buy' ? 'text-emerald-500' : 'text-red-500';
  const activeBgLightClass = tradeType === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10';

  const estimatedTotal = parseFloat(amount || '0') * livePrice;

  const dropdownAssets = useMemo(() => {
    const enrichedAssets = marketAssets.map((asset) => ({
      ...asset,
      typeLabel: (asset.type ?? 'stock').toUpperCase(),
      group: (asset.type ?? '').toLowerCase() === 'crypto' ? 'CRYPTOCURRENCIES' : 'QUICK PICKS',
    }));

    return enrichedAssets.filter((asset) =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      || asset.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [marketAssets, searchQuery]);

  const positionForCurrentAsset = positions.find((position) => position.symbol === currentAsset.symbol);
  const ownedShares = positionForCurrentAsset?.quantity ?? currentAsset.shares ?? 0;

  const handleKeyPress = (key: string) => {
    setError(null);

    if (key === 'backspace') {
      setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }

    if (key === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => `${prev}.`);
      }
      return;
    }

    setAmount((prev) => (prev === '0' ? key : `${prev}${key}`));
  };

  const handleReview = () => {
    const quantity = parseFloat(amount);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    if (tradeType === 'buy' && estimatedTotal > buyingPower) {
      setError('Insufficient buying power.');
      return;
    }

    if (tradeType === 'sell' && quantity > ownedShares) {
      setError(`You only own ${ownedShares.toFixed(4)} shares.`);
      return;
    }

    setStatus('review');
  };

  const handleFinalAction = async () => {
    const quantity = parseFloat(amount);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity.');
      setStatus('input');
      return;
    }

    const resolvedAsset = currentAsset.id
      ? currentAsset
      : marketAssets.find((asset) => asset.symbol === currentAsset.symbol) ?? null;

    if (!resolvedAsset?.id) {
      setError('Unable to resolve this asset for order execution.');
      setStatus('input');
      return;
    }

    setStatus('processing');

    try {
      const order = await placeOrder({
        assetId: resolvedAsset.id,
        side: tradeType,
        quantity,
        orderType: 'market',
      });

      setExecutedOrder(order);
      setStatus('success');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Order failed to execute.';
      setError(message);
      setStatus('input');
    }
  };

  const isReviewDisabled = amount === '0' || parseFloat(amount) <= 0;

  if (status === 'processing') {
    return (
      <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
        <div className="bg-[#121212] w-full max-w-md rounded-[32px] p-12 border border-white/5 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <Loader2 className="text-emerald-500 animate-spin" size={48} strokeWidth={2.5} />
            <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Executing Order</h3>
          <p className="text-zinc-500 text-sm font-medium">Securing best market price for {currentAsset.symbol}...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
        <div className="bg-[#121212] w-full max-w-md rounded-[32px] p-6 border border-white/5 animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />

          <div className="flex flex-col items-center text-center mt-6 mb-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative">
              <Check size={32} className="text-emerald-500" strokeWidth={3} />
              <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Order Confirmed</h3>
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">Order ID: {executedOrder?.id ?? 'N/A'}</p>
          </div>

          <div className="bg-white/[0.02] rounded-3xl p-5 space-y-4 mb-8 border border-white/5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Action</span>
              <span className={`font-black uppercase tracking-widest text-xs ${activeTextClass}`}>
                {tradeType === 'buy' ? 'Purchased' : 'Sold'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Quantity</span>
              <span className="font-black text-white">{amount} {currentAsset.symbol}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Average Price</span>
              <span className="font-black text-white">${(executedOrder?.averageFillPrice ?? livePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-zinc-300 font-bold text-sm">Total {tradeType === 'buy' ? 'Cost' : 'Credit'}</span>
              <span className="text-xl font-black text-white">${(executedOrder?.totalValue ?? estimatedTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full py-4 rounded-full font-black text-base bg-white text-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
            >
              Done
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-zinc-500 font-black text-[11px] uppercase tracking-widest hover:text-white transition-colors"
            >
              Back to Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'review') {
    return (
      <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
        <div className="bg-[#121212] w-full max-w-md rounded-[32px] p-6 border border-white/5 animate-in slide-in-from-bottom-4 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setStatus('input')} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Review Order</h3>
            <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="text-center mb-10">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-2">Total Quantity</p>
            <h4 className="text-4xl font-black mb-1 tracking-tight">{amount} units</h4>
            <p className="text-zinc-400 font-bold text-sm">{currentAsset.name}</p>
          </div>

          <div className="bg-white/[0.02] rounded-3xl p-5 space-y-4 mb-10 border border-white/5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Asset Symbol</span>
              <span className="font-black text-white">{currentAsset.symbol}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-bold">Market Price</span>
              <span className="font-black text-white">${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</span>
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-zinc-300 font-bold text-sm">Estimated Total</span>
              <span className={`text-xl font-black ${activeTextClass}`}>${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleFinalAction}
              className={`w-full py-4 rounded-full font-black text-base ${activeColorClass} text-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all`}
            >
              Confirm {tradeType === 'buy' ? 'Purchase' : 'Sale'}
            </button>
            <button
              onClick={() => setStatus('input')}
              className="w-full py-3 text-zinc-500 font-black text-[11px] uppercase tracking-widest hover:text-zinc-300 transition-colors"
            >
              Edit Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in">
      <div className="bg-[#0a0a0a] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] border-t border-x sm:border border-white/5 animate-in slide-in-from-bottom-8 max-h-[90vh] overflow-hidden flex flex-col">
        {isDropdownOpen && (
          <div className="absolute inset-0 z-[150] bg-[#0a0a0a] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-t-[32px] sm:rounded-[32px] overflow-hidden">
            <div className="p-4 flex items-center gap-4 border-b border-white/5 bg-[#0a0a0a]">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search symbols..."
                  className="w-full bg-[#111111] border border-emerald-500/40 rounded-full py-2.5 pl-10 pr-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-zinc-700"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8 no-scrollbar">
              {['QUICK PICKS', 'CRYPTOCURRENCIES'].map((groupName) => {
                const groupAssets = dropdownAssets.filter((asset) => asset.group === groupName);
                if (groupAssets.length === 0) return null;

                return (
                  <div key={groupName} className="mt-4">
                    <h4 className="px-2 py-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">{groupName}</h4>
                    <div className="space-y-0.5">
                      {groupAssets.map((asset) => {
                        const isSelected = currentAsset.symbol === asset.symbol;

                        return (
                          <button
                            key={asset.id ?? asset.symbol}
                            onClick={() => {
                              setCurrentAsset({
                                id: asset.id,
                                symbol: asset.symbol,
                                name: asset.name,
                                price: prices[asset.symbol]?.price || asset.price,
                                changePercent: prices[asset.symbol]?.changePercent || asset.changePercent,
                                type: asset.type,
                                shares: positions.find((position) => position.symbol === asset.symbol)?.quantity,
                              });
                              setAmount('0');
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isSelected ? 'bg-emerald-500/10' : 'hover:bg-white/5'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-4 flex items-center justify-center">
                                {isSelected && <Check size={16} className="text-emerald-500" />}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className={`text-sm font-black ${isSelected ? 'text-emerald-500' : 'text-white'}`}>
                                  {asset.symbol} <span className="text-[10px] text-zinc-600 font-bold ml-1">{asset.name}</span>
                                </span>
                              </div>
                            </div>
                            <div className="bg-white/5 px-1.5 py-0.5 rounded text-[8px] font-black text-zinc-500 uppercase">
                              {asset.typeLabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-5 pb-0">
          {error && (
            <div className="bg-red-600/90 rounded-xl p-3 flex gap-2 mb-4 shadow-lg">
              <AlertCircle className="text-white flex-shrink-0" size={16} />
              <p className="font-bold text-[11px] text-white leading-tight">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-white/60"><X size={14} /></button>
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <button onClick={onClose} className="text-zinc-600 p-2"><X size={20} /></button>
            <div className="flex bg-[#141414] p-0.5 rounded-full w-40">
              <button
                onClick={() => {
                  setTradeType('buy');
                  setError(null);
                }}
                className={`flex-1 py-1 rounded-full text-[9px] font-black transition-all ${tradeType === 'buy' ? 'bg-[#10b981] text-black' : 'text-zinc-500'}`}
              >
                BUY
              </button>
              <button
                onClick={() => {
                  setTradeType('sell');
                  setError(null);
                }}
                className={`flex-1 py-1 rounded-full text-[9px] font-black transition-all ${tradeType === 'sell' ? 'bg-red-500 text-white' : 'text-zinc-500'}`}
              >
                SELL
              </button>
            </div>
            <button
              onClick={() => setIsDropdownOpen(true)}
              className={`${activeTextClass} text-[9px] font-black flex items-center gap-1.5 ${activeBgLightClass} px-3 py-1.5 rounded-full border border-white/5 uppercase tracking-tighter transition-all hover:bg-white/5`}
            >
              Assets <ChevronDown size={10} />
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-2xl font-black mb-0.5 tracking-tight">{tradeType === 'buy' ? 'Buy' : 'Sell'} {currentAsset.symbol}</h3>
            <p className="text-zinc-600 text-[10px] font-bold tracking-widest uppercase">
              {tradeType === 'buy'
                ? `$${buyingPower.toLocaleString()} available`
                : `${ownedShares.toFixed(4)} shares owned`}
            </p>
          </div>
        </div>

        <div className="px-6 flex flex-col gap-4">
          <div className="flex justify-between items-end py-3 border-b border-white/5">
            <span className="font-black text-sm text-zinc-500 uppercase tracking-widest pb-1">Shares</span>
            <div className="flex items-center">
              <span className={`text-4xl font-black tabular-nums tracking-tighter leading-none ${amount === '0' ? 'text-zinc-900' : activeTextClass}`}>
                {amount}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-zinc-500">
            <div className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-[0.15em]">
              Market Price <Info size={12} />
            </div>
            <span className="font-bold text-base text-white tabular-nums">${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="font-bold text-zinc-500 text-[10px] uppercase tracking-[0.15em]">Estimated Total</span>
            <span className="text-2xl font-black text-white tracking-tighter tabular-nums">
              ${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="p-5 pt-0 mt-auto bg-[#0a0a0a]">
          <button
            onClick={handleReview}
            disabled={isReviewDisabled}
            className={`w-full ${activeColorClass} text-black font-black py-3.5 rounded-full text-base mb-4 transition-all uppercase tracking-widest shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:grayscale-[0.5] disabled:cursor-not-allowed`}
          >
            Review Order
          </button>

          <div className="grid grid-cols-3 gap-y-1 gap-x-8 px-4 mb-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="text-2xl font-black py-2.5 hover:bg-zinc-900 rounded-xl text-white active:scale-90"
              >
                {key}
              </button>
            ))}
            <button
              onClick={() => handleKeyPress('backspace')}
              className="flex items-center justify-center py-2.5 hover:bg-zinc-900 rounded-xl text-zinc-600 active:scale-90"
            >
              <Delete size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeModal;
