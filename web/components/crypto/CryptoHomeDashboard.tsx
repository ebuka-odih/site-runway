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
    <section className="mx-4 mt-4 rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/15 via-sky-500/10 to-blue-600/10 p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Crypto Dashboard</p>
      <h2 className="mt-2 text-2xl font-black text-white tracking-tight">Spot, Swing, and Follow Smart Money</h2>
      <p className="mt-2 text-sm text-zinc-200">
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
