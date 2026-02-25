import React from 'react';
import PortfolioCard from '../PortfolioCard';
import AssetList from '../AssetList';
import Analytics from '../Analytics';
import Heatmap from '../Heatmap';
import type { SelectableAsset } from '../../types';

interface CryptoHomeDashboardProps {
  onAssetClick: (asset: SelectableAsset) => void;
  onOpenWatchlist: () => void;
}

const CryptoHomeDashboard: React.FC<CryptoHomeDashboardProps> = ({ onAssetClick, onOpenWatchlist }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
    <section className="mx-4 mt-3 rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-500/15 via-green-500/10 to-lime-500/5 p-3.5 sm:p-4 shadow-lg shadow-emerald-500/10">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Crypto Dashboard</p>
      <h2 className="mt-1.5 text-xl font-black text-white tracking-tight">Spot, Swing, and Follow Smart Money</h2>
      <p className="mt-1.5 text-[13px] leading-snug text-zinc-300">
        Monitor fast-moving crypto pairs, react to volatility, and manage wallet activity in one focused workspace.
      </p>
    </section>

    <PortfolioCard />
    <div className="h-2 bg-black/40 border-y border-white/5 my-2" />
    <AssetList onAssetClick={onAssetClick} onOpenWatchlist={onOpenWatchlist} />
    <div className="h-2 bg-black/40 border-y border-white/5 my-2" />
    <Analytics />
    <Heatmap />
  </div>
);

export default CryptoHomeDashboard;
