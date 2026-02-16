import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import WatchlistPage from './components/WatchlistPage';
import LandingPage from './components/LandingPage';
import { MarketProvider, useMarket } from './context/MarketContext';
import type { SelectableAsset } from './types';

const DASHBOARD_MAX_WIDTH_CLASS = 'max-w-[768px]';
const DASHBOARD_LAST_ROUTE_KEY = 'runwayalgo.dashboard.last-route';

const TAB_TO_ROUTE: Record<string, string> = {
  Home: '/dashboard/home',
  Trade: '/dashboard/trade',
  Copy: '/dashboard/copy',
  Wallet: '/dashboard/wallet',
  Profile: '/dashboard/profile',
};

const HomeDashboard: React.FC<{ onAssetClick: (asset: SelectableAsset) => void; onOpenWatchlist: () => void }> = ({ onAssetClick, onOpenWatchlist }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
    <PortfolioCard />
    <div className="h-2 bg-black/40 border-y border-white/5 my-2" />
    <AssetList onAssetClick={onAssetClick} onOpenWatchlist={onOpenWatchlist} />
    <div className="h-2 bg-black/40 border-y border-white/5 my-2" />
    <Analytics />
    <Heatmap />
  </div>
);

const resolveActiveTab = (pathname: string): string => {
  if (pathname.startsWith('/dashboard/trade')) return 'Trade';
  if (pathname.startsWith('/dashboard/copy')) return 'Copy';
  if (pathname.startsWith('/dashboard/wallet')) return 'Wallet';
  if (pathname.startsWith('/dashboard/profile')) return 'Profile';
  return 'Home';
};

const isDashboardRoute = (pathname: string): boolean => pathname.startsWith('/dashboard/');

const AppContent: React.FC = () => {
  const { isAuthenticated, isBootstrapping, login, authError } = useMarket();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = useMemo(() => resolveActiveTab(location.pathname), [location.pathname]);
  const [isTradingDeskOpen, setIsTradingDeskOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SelectableAsset | null>(null);

  const handleAssetSelect = (asset: SelectableAsset) => {
    setSelectedAsset(asset);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const currentPath = location.pathname;

    if (currentPath === '/' || currentPath === '/dashboard') {
      const savedRoute = localStorage.getItem(DASHBOARD_LAST_ROUTE_KEY);
      const fallbackRoute = TAB_TO_ROUTE.Home;
      const nextRoute = savedRoute && isDashboardRoute(savedRoute) && savedRoute !== '/dashboard/more'
        ? savedRoute
        : fallbackRoute;

      if (currentPath !== nextRoute) {
        navigate(nextRoute, { replace: true });
      }

      return;
    }

    if (isDashboardRoute(currentPath)) {
      localStorage.setItem(DASHBOARD_LAST_ROUTE_KEY, currentPath);
      return;
    }

    navigate(TAB_TO_ROUTE.Home, { replace: true });
  }, [isAuthenticated, location.pathname, navigate]);

  useEffect(() => {
    if (isBootstrapping || isAuthenticated) {
      return;
    }

    if (isDashboardRoute(location.pathname)) {
      navigate('/', { replace: true });
    }
  }, [isBootstrapping, isAuthenticated, location.pathname, navigate]);

  useEffect(() => {
    if (activeTab !== 'Trade' && isTradingDeskOpen) {
      setIsTradingDeskOpen(false);
    }
  }, [activeTab, isTradingDeskOpen]);

  const handleTabChange = (tab: string) => {
    const nextRoute = TAB_TO_ROUTE[tab] ?? TAB_TO_ROUTE.Home;
    setSelectedAsset(null);
    navigate(nextRoute);
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
          onTabChange={handleTabChange}
        />
      </div>
    );
  }

  return (
    <div className={`w-full ${DASHBOARD_MAX_WIDTH_CLASS} mx-auto min-h-screen pb-24 relative overflow-x-hidden bg-[#050505]`}>
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-full ${DASHBOARD_MAX_WIDTH_CLASS} h-[40vh] bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none -z-10`} />
      <div className="fixed bottom-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-0 w-64 h-64 bg-emerald-500/5 blur-[120px] pointer-events-none -z-10" />

      {activeTab !== 'Profile' && <Header />}

      <main>
        <Routes>
          <Route path="/" element={<div />} />
          <Route path="/dashboard" element={<div />} />
          <Route path="/dashboard/home" element={<HomeDashboard onAssetClick={handleAssetSelect} onOpenWatchlist={() => navigate('/dashboard/watchlist')} />} />
          <Route path="/dashboard/watchlist" element={<WatchlistPage onBack={() => navigate('/dashboard/home')} onAssetClick={handleAssetSelect} />} />
          <Route
            path="/dashboard/trade"
            element={(
              <TradePage
                onOpenTradingDesk={() => setIsTradingDeskOpen(true)}
                onAssetClick={handleAssetSelect}
              />
            )}
          />
          <Route path="/dashboard/copy" element={<CopyTrading />} />
          <Route path="/dashboard/wallet" element={<WalletPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
        </Routes>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

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
  <BrowserRouter>
    <MarketProvider>
      <AppContent />
    </MarketProvider>
  </BrowserRouter>
);

export default App;
