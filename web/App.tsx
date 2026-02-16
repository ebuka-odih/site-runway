import React, { useState } from 'react';
import Header from './components/Header';
import PortfolioCard from './components/PortfolioCard';
import Analytics from './components/Analytics';
import AssetList from './components/AssetList';
import Heatmap from './components/Heatmap';
import BottomNav from './components/BottomNav';
import TradePage from './components/TradePage';
import TradingDesk from './components/TradingDesk';
import AssetDetail from './components/AssetDetail';
import CopyTrading from './components/CopyTrading';
import WalletPage from './components/WalletPage';
import ProfilePage from './components/ProfilePage';
import LandingPage from './components/LandingPage';
import { MarketProvider, useMarket } from './context/MarketContext';
import type { SelectableAsset } from './types';

const DASHBOARD_MAX_WIDTH_CLASS = 'max-w-[768px]';

const AppContent: React.FC = () => {
  const { isAuthenticated, isBootstrapping, login, authError } = useMarket();
  const [activeTab, setActiveTab] = useState('Home');
  const [isTradingDeskOpen, setIsTradingDeskOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SelectableAsset | null>(null);

  const handleAssetSelect = (asset: SelectableAsset) => {
    setSelectedAsset(asset);
  };

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Connecting to backend...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LandingPage
        onLogin={login}
        authError={authError}
      />
    );
  }

  if (selectedAsset) {
    return (
      <div className={`w-full ${DASHBOARD_MAX_WIDTH_CLASS} mx-auto min-h-screen relative bg-[#050505]`}>
        <AssetDetail asset={selectedAsset} onBack={() => setSelectedAsset(null)} />
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedAsset(null);
            setActiveTab(tab);
          }}
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Trade':
        return (
          <TradePage
            onOpenTradingDesk={() => setIsTradingDeskOpen(true)}
            onAssetClick={handleAssetSelect}
          />
        );
      case 'Copy':
        return <CopyTrading />;
      case 'Wallet':
        return <WalletPage />;
      case 'Profile':
        return <ProfilePage />;
      case 'Home':
      default:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <PortfolioCard />
            <div className="h-2 bg-black/40 border-y border-white/5 my-2" />
            <AssetList onAssetClick={handleAssetSelect} />
            <div className="h-2 bg-black/40 border-y border-white/5 my-2" />
            <Analytics />
            <Heatmap />
          </div>
        );
    }
  };

  return (
    <div className={`w-full ${DASHBOARD_MAX_WIDTH_CLASS} mx-auto min-h-screen pb-24 relative overflow-x-hidden bg-[#050505]`}>
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-full ${DASHBOARD_MAX_WIDTH_CLASS} h-[40vh] bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none -z-10`} />
      <div className="fixed bottom-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-0 w-64 h-64 bg-emerald-500/5 blur-[120px] pointer-events-none -z-10" />

      {activeTab !== 'Profile' && <Header />}

      <main>
        {renderContent()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {isTradingDeskOpen && (
        <TradingDesk
          onClose={() => setIsTradingDeskOpen(false)}
          onSelectAsset={(asset) => {
            setIsTradingDeskOpen(false);
            handleAssetSelect(asset);
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <MarketProvider>
    <AppContent />
  </MarketProvider>
);

export default App;
