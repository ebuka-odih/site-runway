import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Trophy,
  Users,
  History,
  TrendingUp,
  Shield,
  Star,
  Copy,
  Settings,
  X,
  UserCheck,
  LayoutGrid,
  Target,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import type { CopyRelationshipItem, CopyTradeHistoryItem, TraderItem } from '../types';

type FilterType = 'Top Return' | 'Most Copied' | 'Low Risk' | 'Rising Stars';

const FILTER_TO_API: Record<FilterType, string> = {
  'Top Return': 'top_return',
  'Most Copied': 'most_copied',
  'Low Risk': 'low_risk',
  'Rising Stars': 'rising_stars',
};

const CopyTrading: React.FC = () => {
  const {
    fetchCopyDiscover,
    fetchCopyFollowing,
    fetchCopyHistory,
    followTrader,
    updateCopyRelationship,
    closeCopyRelationship,
  } = useMarket();

  const [activeTab, setActiveTab] = useState<'Discover' | 'Following' | 'History'>('Discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Top Return');
  const [selectedTrader, setSelectedTrader] = useState<TraderItem | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<CopyRelationshipItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [allocation, setAllocation] = useState('100');
  const [copyRatio, setCopyRatio] = useState(2);
  const [modalStatus, setModalStatus] = useState<'input' | 'processing' | 'success'>('input');

  const [traders, setTraders] = useState<TraderItem[]>([]);
  const [following, setFollowing] = useState<CopyRelationshipItem[]>([]);
  const [history, setHistory] = useState<CopyTradeHistoryItem[]>([]);
  const [summary, setSummary] = useState({ followingCount: 0, totalAllocated: 0, totalPnl: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFollowing = async () => {
    const response = await fetchCopyFollowing();
    setFollowing(response.items);
    setSummary(response.summary);
    return response.items;
  };

  const loadDiscover = async () => {
    const items = await fetchCopyDiscover({
      filter: FILTER_TO_API[activeFilter],
      search: searchQuery || undefined,
    });
    setTraders(items);
  };

  const loadHistory = async () => {
    const items = await fetchCopyHistory();
    setHistory(items);
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await loadFollowing();
        if (!active) return;

        if (activeTab === 'Discover') {
          await loadDiscover();
        }

        if (activeTab === 'History') {
          await loadHistory();
        }
      } catch (exception) {
        if (!active) return;
        const message = exception instanceof Error ? exception.message : 'Failed to load copy-trading data.';
        setError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [activeTab, activeFilter, searchQuery]);

  const followingTraderMap = useMemo(() => {
    return new Map(following.map((item) => [item.traderId, item]));
  }, [following]);

  const handleCopyClick = (trader: TraderItem) => {
    setSelectedTrader(trader);
    setSelectedRelationship(followingTraderMap.get(trader.id) ?? null);
    setIsEditing(false);
    setAllocation('100');
    setCopyRatio(2);
    setModalStatus('input');
  };

  const handleManageClick = (relationship: CopyRelationshipItem) => {
    const trader = traders.find((item) => item.id === relationship.traderId) ?? {
      id: relationship.traderId,
      name: relationship.traderName,
      username: relationship.traderName,
      strategy: relationship.strategy,
      avatarColor: 'emerald',
      copyFee: relationship.copyFee,
      return: 0,
      winRate: 0,
      copiers: 0,
      riskScore: 0,
      isVerified: false,
      isFollowing: true,
      allocation: relationship.allocation,
      pnl: relationship.pnl,
      trades: relationship.trades,
    };

    setSelectedTrader(trader);
    setSelectedRelationship(relationship);
    setIsEditing(true);
    setAllocation(relationship.allocation.toString());
    setCopyRatio(relationship.copyRatio);
    setModalStatus('input');
  };

  const handleStartCopying = async () => {
    if (!selectedTrader) {
      return;
    }

    setModalStatus('processing');

    try {
      const amount = parseFloat(allocation);

      if (isEditing && selectedRelationship) {
        await updateCopyRelationship(selectedRelationship.id, {
          allocationAmount: amount,
          copyRatio,
          status: 'active',
        });
      } else {
        await followTrader({
          traderId: selectedTrader.id,
          allocationAmount: amount,
          copyRatio,
        });
      }

      await Promise.all([loadFollowing(), loadDiscover()]);
      setModalStatus('success');
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Failed to save copy settings.';
      setError(message);
      setModalStatus('input');
    }
  };

  const handleStopFollowing = async (relationship: CopyRelationshipItem) => {
    try {
      await closeCopyRelationship(relationship.id);
      await Promise.all([loadFollowing(), loadDiscover()]);
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'Failed to close copy relationship.';
      setError(message);
    }
  };

  const handleFinish = () => {
    setSelectedTrader(null);
    setSelectedRelationship(null);
    setActiveTab('Following');
  };

  return (
    <div className="px-4 py-6 pb-32 w-full min-h-screen">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Copy Trading</h2>
        <p className="text-sm text-zinc-500 font-medium">Follow top traders and mirror their moves</p>
      </header>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="bg-[#0c120e] border border-[#1a2d21] rounded-2xl p-5 mb-6 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="text-center flex-1">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Following</p>
          <p className="text-2xl font-black text-white">{summary.followingCount}</p>
        </div>
        <div className="w-[1px] h-8 bg-white/5" />
        <div className="text-center flex-1">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Allocated</p>
          <p className="text-2xl font-black text-white">${summary.totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="w-[1px] h-8 bg-white/5" />
        <div className="text-center flex-1">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total P&L</p>
          <p className="text-2xl font-black text-emerald-500">${summary.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-[#1a1a1e] p-1 rounded-xl flex gap-1 mb-6">
        <button
          onClick={() => setActiveTab('Discover')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-black transition-all ${activeTab === 'Discover' ? 'bg-[#0a0a0a] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}
        >
          <Trophy size={14} /> Discover
        </button>
        <button
          onClick={() => setActiveTab('Following')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-black transition-all ${activeTab === 'Following' ? 'bg-[#0a0a0a] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}
        >
          <Users size={14} /> Following
        </button>
        <button
          onClick={() => setActiveTab('History')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-black transition-all ${activeTab === 'History' ? 'bg-[#0a0a0a] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}
        >
          <History size={14} /> History
        </button>
      </div>

      {activeTab === 'Discover' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search traders..."
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-white/10 transition-all placeholder:text-zinc-700"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: TrendingUp, label: 'Top Return' as const },
              { icon: Copy, label: 'Most Copied' as const },
              { icon: Shield, label: 'Low Risk' as const },
              { icon: Star, label: 'Rising Stars' as const },
            ].map((category) => {
              const isActive = activeFilter === category.label;

              return (
                <button
                  key={category.label}
                  onClick={() => setActiveFilter(category.label)}
                  className={`border rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition-all duration-300 active:scale-95 group relative ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/60 ring-2 ring-emerald-500/20'
                      : 'bg-[#121212] border-white/5 hover:bg-white/[0.02]'
                  }`}
                >
                  <category.icon className={`${isActive ? 'text-emerald-400 scale-110' : 'text-zinc-400'} transition-transform`} size={20} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {isLoading && (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="text-emerald-500 animate-spin" size={24} />
              </div>
            )}

            {!isLoading && traders.map((trader) => (
              <div key={trader.id} className="bg-[#121212] border border-white/5 rounded-[24px] p-5 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 text-emerald-500 text-xl font-black">
                      {trader.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-white">{trader.name}</h4>
                        {trader.isVerified && (
                          <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                            <UserCheck size={10} className="text-emerald-500" />
                            <span className="text-[8px] font-black text-zinc-500 uppercase">Verified</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">{trader.strategy}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Copy Fee</p>
                      <p className="text-sm font-black text-white">${trader.copyFee.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => handleCopyClick(trader)}
                      className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                        trader.isFollowing
                          ? 'border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          : 'bg-[#10b981] text-black hover:bg-[#059669]'
                      }`}
                    >
                      {trader.isFollowing ? 'Manage' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">Return</p>
                    <p className="text-emerald-500 font-black">+{trader.return.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">Win Rate</p>
                    <p className="text-white font-black">{trader.winRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">Copiers</p>
                    <p className="text-white font-black">{trader.copiers.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Following' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {following.map((relationship) => (
            <div key={relationship.id} className="bg-[#121212] border border-white/5 rounded-[24px] p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 text-emerald-500 text-lg font-black">
                    {relationship.traderName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">{relationship.traderName}</h4>
                      <span className="bg-emerald-500/20 text-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{relationship.status}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Allocated</p>
                      <p className="text-[10px] font-black text-white">${relationship.allocation.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Copy Fee</p>
                      <p className="text-[10px] font-black text-white">${relationship.copyFee.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManageClick(relationship)}
                    className="p-2 text-zinc-600 hover:text-white transition-colors"
                  >
                    <Settings size={20} />
                  </button>
                  <button
                    onClick={() => void handleStopFollowing(relationship)}
                    className="p-2 text-red-500/50 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">Allocated</p>
                  <p className="text-white font-black">${relationship.allocation.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">P&L</p>
                  <p className="text-emerald-500 font-black">${relationship.pnl.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">Trades</p>
                  <p className="text-white font-black">{relationship.trades}</p>
                </div>
              </div>
            </div>
          ))}

          {following.length === 0 && (
            <div className="bg-[#121212] border border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
              <Users size={48} className="text-zinc-800 mb-4" />
              <h4 className="text-lg font-black text-white mb-2">No active copies</h4>
              <p className="text-sm text-zinc-600 font-medium">Browse our top traders in Discover to start mirroring their moves.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'History' && (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="bg-[#121212] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-white uppercase">{item.side} {item.symbol ?? 'ASSET'}</p>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{item.traderName || 'Leader Trader'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">{item.quantity.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-zinc-500">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <div className="bg-[#121212] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
              <LayoutGrid size={48} className="text-zinc-800 mb-6" />
              <h4 className="text-xl font-black text-white mb-3">No copy trades yet</h4>
              <p className="text-sm text-zinc-600 font-medium leading-relaxed max-w-[240px]">
                Your copied trades will appear here once you start following traders
              </p>
            </div>
          )}
        </div>
      )}

      {selectedTrader && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#121212] w-full max-w-md rounded-[32px] p-6 border border-white/5 animate-in slide-in-from-bottom-8 shadow-2xl relative overflow-hidden">
            {modalStatus === 'input' && (
              <div className="animate-in fade-in zoom-in-95">
                <button
                  onClick={() => setSelectedTrader(null)}
                  className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="text-center mt-4 mb-8">
                  <h3 className="text-xl font-black text-white mb-1">
                    {isEditing ? 'Manage Copy Settings' : `Copy ${selectedTrader.name}`}
                  </h3>
                  <p className="text-zinc-500 text-xs font-bold leading-relaxed px-4">
                    {isEditing
                      ? `Adjust your allocation and copy ratio for ${selectedTrader.name}.`
                      : 'Configure your copy trading settings'}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-black text-white uppercase tracking-widest block">Copy Fee ($)</label>
                      <span className="text-emerald-500 font-black text-sm">
                        ${selectedTrader.copyFee.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">
                      Charged upfront when you start copying.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-black text-white uppercase tracking-widest block">Allocation Amount ($)</label>
                      <span className="text-emerald-500 font-black text-sm">${allocation}</span>
                    </div>
                    <input
                      type="number"
                      value={allocation}
                      readOnly
                      aria-readonly="true"
                      className="w-full bg-[#0a0a0a]/80 border border-white/10 rounded-2xl py-4 px-4 text-xl font-black text-white cursor-not-allowed focus:outline-none transition-all placeholder:text-zinc-800"
                      placeholder="100"
                    />
                    {!isEditing && <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Min: $100</p>}
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-black text-white uppercase tracking-widest">Copy Ratio</label>
                      <span className="text-base font-black text-emerald-500">{copyRatio}x</span>
                    </div>
                    <div className="relative pt-2">
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.5"
                        value={copyRatio}
                        onChange={(event) => setCopyRatio(parseFloat(event.target.value))}
                        className="w-full h-2 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    <div className="bg-[#1a1a1e]/50 border border-white/5 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Target className="text-emerald-500" size={20} />
                      </div>
                      <p className="text-sm font-bold text-zinc-300 leading-relaxed py-1">
                        Trades will be copied automatically in real-time.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <button
                      onClick={() => void handleStartCopying()}
                      className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-black font-black rounded-full uppercase tracking-widest text-sm transition-all shadow-xl active:scale-[0.98]"
                    >
                      {isEditing ? 'Save Changes' : 'Start Copying'}
                    </button>
                    <button
                      onClick={() => setSelectedTrader(null)}
                      className="w-full py-4 border border-zinc-800 hover:border-zinc-700 text-zinc-400 font-black rounded-full uppercase tracking-widest text-sm transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modalStatus === 'processing' && (
              <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                <div className="relative mb-8">
                  <Loader2 size={48} className="text-emerald-500 animate-spin" strokeWidth={3} />
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Setting up Copy</h3>
                <p className="text-zinc-500 text-sm font-bold">Synchronizing account with leader moves...</p>
              </div>
            )}

            {modalStatus === 'success' && (
              <div className="animate-in zoom-in-95 duration-500 text-center pb-4">
                <div className="flex flex-col items-center mb-8 mt-6">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative">
                    <Check size={40} className="text-emerald-500" strokeWidth={3} />
                    <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20" />
                    <Sparkles className="absolute -top-1 -right-1 text-yellow-400 animate-bounce" size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">You're All Set!</h3>
                  <p className="text-zinc-500 text-sm font-bold max-w-[280px]">
                    Successfully linked to <span className="text-white">{selectedTrader.name}</span>.
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4 mb-10 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Allocation</span>
                    <span className="font-black text-white text-lg">${allocation}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Copy Fee</span>
                    <span className="font-black text-emerald-500 text-lg">${selectedTrader.copyFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Copy Ratio</span>
                    <span className="font-black text-emerald-500 text-lg">{copyRatio}x</span>
                  </div>
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full py-4 bg-white text-black font-black rounded-full uppercase tracking-widest text-sm transition-all shadow-xl active:scale-[0.98]"
                >
                  View My Following
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CopyTrading;
