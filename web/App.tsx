import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
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
import CryptoLandingPage from './components/crypto/CryptoLandingPage';
import CryptoHomeDashboard from './components/crypto/CryptoHomeDashboard';
import AboutUsPage from './components/landing/AboutUsPage';
import PrivacyPolicyPage from './components/landing/PrivacyPolicyPage';
import RiskDisclosurePage from './components/landing/RiskDisclosurePage';
import TermsOfServicePage from './components/landing/TermsOfServicePage';
import { MarketProvider, useMarket } from './context/MarketContext';
import type { SelectableAsset } from './types';

const DASHBOARD_MAX_WIDTH_CLASS = 'max-w-[768px]';

const DASHBOARD_LAST_ROUTE_KEYS = {
  default: 'runwayalgo.dashboard.last-route',
  crypto: 'runwayalgo.crypto.dashboard.last-route',
} as const;

const TAB_TO_ROUTE = {
  default: {
    Home: '/dashboard/home',
    Trade: '/dashboard/trade',
    Copy: '/dashboard/copy',
    Wallet: '/dashboard/wallet',
    Profile: '/dashboard/profile',
  },
  crypto: {
    Home: '/crypto/dashboard/home',
    Trade: '/crypto/dashboard/trade',
    Copy: '/crypto/dashboard/copy',
    Wallet: '/crypto/dashboard/wallet',
    Profile: '/crypto/dashboard/profile',
  },
} as const;

type DashboardMode = keyof typeof TAB_TO_ROUTE;
type DashboardTab = keyof typeof TAB_TO_ROUTE.default;

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
  if (pathname.startsWith('/dashboard/trade') || pathname.startsWith('/crypto/dashboard/trade')) return 'Trade';
  if (pathname.startsWith('/dashboard/copy') || pathname.startsWith('/crypto/dashboard/copy')) return 'Copy';
  if (pathname.startsWith('/dashboard/wallet') || pathname.startsWith('/crypto/dashboard/wallet')) return 'Wallet';
  if (pathname.startsWith('/dashboard/profile') || pathname.startsWith('/crypto/dashboard/profile')) return 'Profile';
  return 'Home';
};

const isDefaultDashboardRoute = (pathname: string): boolean => pathname.startsWith('/dashboard/');
const isCryptoDashboardRoute = (pathname: string): boolean => pathname.startsWith('/crypto/dashboard/');

const resolveDashboardMode = (pathname: string): DashboardMode => {
  if (pathname === '/crypto' || pathname === '/crypto/dashboard' || isCryptoDashboardRoute(pathname)) {
    return 'crypto';
  }

  if (pathname === '/dashboard' || isDefaultDashboardRoute(pathname)) {
    return 'default';
  }

  return 'crypto';
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isBootstrapping, login, authError, user } = useMarket();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = useMemo(() => resolveActiveTab(location.pathname), [location.pathname]);
  const activeDashboardMode = useMemo(() => resolveDashboardMode(location.pathname), [location.pathname]);
  const activeRouteMap = TAB_TO_ROUTE[activeDashboardMode];
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
      const savedRoute = localStorage.getItem(DASHBOARD_LAST_ROUTE_KEYS.crypto);
      const fallbackRoute = TAB_TO_ROUTE.crypto.Home;
      const nextRoute = savedRoute && isCryptoDashboardRoute(savedRoute)
        ? savedRoute
        : fallbackRoute;

      if (currentPath !== nextRoute) {
        navigate(nextRoute, { replace: true });
      }

      return;
    }

    if (currentPath === '/crypto' || currentPath === '/crypto/dashboard') {
      const savedRoute = localStorage.getItem(DASHBOARD_LAST_ROUTE_KEYS.crypto);
      const fallbackRoute = TAB_TO_ROUTE.crypto.Home;
      const nextRoute = savedRoute && isCryptoDashboardRoute(savedRoute)
        ? savedRoute
        : fallbackRoute;

      if (currentPath !== nextRoute) {
        navigate(nextRoute, { replace: true });
      }

      return;
    }

    if (isDefaultDashboardRoute(currentPath)) {
      localStorage.setItem(DASHBOARD_LAST_ROUTE_KEYS.default, currentPath);
      return;
    }

    if (isCryptoDashboardRoute(currentPath)) {
      localStorage.setItem(DASHBOARD_LAST_ROUTE_KEYS.crypto, currentPath);
      return;
    }

    navigate(TAB_TO_ROUTE.default.Home, { replace: true });
  }, [isAuthenticated, location.pathname, navigate]);

  useEffect(() => {
    if (isBootstrapping || isAuthenticated) {
      return;
    }

    if (isDefaultDashboardRoute(location.pathname) || location.pathname === '/dashboard') {
      navigate('/', { replace: true });
      return;
    }

    if (isCryptoDashboardRoute(location.pathname) || location.pathname === '/crypto/dashboard') {
      navigate('/crypto', { replace: true });
    }
  }, [isBootstrapping, isAuthenticated, location.pathname, navigate]);

  useEffect(() => {
    if (activeTab !== 'Trade' && isTradingDeskOpen) {
      setIsTradingDeskOpen(false);
    }
  }, [activeTab, isTradingDeskOpen]);

  const handleTabChange = (tab: string) => {
    const nextRoute = activeRouteMap[tab as DashboardTab] ?? activeRouteMap.Home;
    setSelectedAsset(null);
    navigate(nextRoute);
  };

  const kycStatus = String(user?.kycStatus ?? 'pending').toLowerCase();
  const requiresAdminVerification = isAuthenticated && kycStatus !== 'verified';
  const formattedKycStatus = kycStatus
    .split('_')
    .filter((token) => token.length > 0)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

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
      <Routes>
        <Route
          path="/"
          element={(
            <CryptoLandingPage
              onLogin={login}
              authError={authError}
            />
          )}
        />
        <Route
          path="/classic"
          element={(
            <LandingPage
              onLogin={login}
              authError={authError}
            />
          )}
        />
        <Route
          path="/crypto"
          element={(
            <CryptoLandingPage
              onLogin={login}
              authError={authError}
            />
          )}
        />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/risk-disclosure" element={<RiskDisclosurePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/crypto/*" element={<Navigate to="/crypto" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const verifyAccountRoute = `${activeRouteMap.Profile}?section=kyc`;
  const isCryptoMode = activeDashboardMode === 'crypto';

  if (selectedAsset) {
    return (
      <div className={`w-full ${DASHBOARD_MAX_WIDTH_CLASS} mx-auto min-h-screen relative bg-[#050505]`}>
        {requiresAdminVerification && (
          <div className="mx-4 mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 text-amber-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                  Account Verification Required
                </p>
                <p className="mt-1 text-sm font-medium text-amber-100">
                  Your admin verification is still {formattedKycStatus || 'Pending'}. Complete your KYC details and the second OTP verification step.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(verifyAccountRoute)}
                  className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-amber-200 transition hover:bg-amber-400/20"
                >
                  Verify Account
                </button>
              </div>
            </div>
          </div>
        )}

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
      <div
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-full ${DASHBOARD_MAX_WIDTH_CLASS} h-[40vh] pointer-events-none -z-10 ${
          isCryptoMode ? 'bg-gradient-to-b from-cyan-500/10 to-transparent' : 'bg-gradient-to-b from-emerald-500/5 to-transparent'
        }`}
      />
      <div className={`fixed bottom-0 right-0 w-64 h-64 blur-[120px] pointer-events-none -z-10 ${isCryptoMode ? 'bg-blue-500/10' : 'bg-emerald-500/5'}`} />
      <div className={`fixed top-1/2 left-0 w-64 h-64 blur-[120px] pointer-events-none -z-10 ${isCryptoMode ? 'bg-cyan-500/10' : 'bg-emerald-500/5'}`} />

      {activeTab !== 'Profile' && <Header profileRoute={activeRouteMap.Profile} brandName={isCryptoMode ? 'env' : 'RunwayAlgo'} />}

      {requiresAdminVerification && (
        <div className="mx-4 mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 text-amber-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                Account Verification Required
              </p>
              <p className="mt-1 text-sm font-medium text-amber-100">
                Your admin verification is still {formattedKycStatus || 'Pending'}. Complete your KYC details and the second OTP verification step.
              </p>
              <button
                type="button"
                onClick={() => navigate(verifyAccountRoute)}
                className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-amber-200 transition hover:bg-amber-400/20"
              >
                Verify Account
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        <Routes>
          <Route path="/" element={<div />} />
          <Route path="/dashboard" element={<div />} />
          <Route path="/crypto" element={<div />} />
          <Route path="/crypto/dashboard" element={<div />} />

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

          <Route path="/crypto/dashboard/home" element={<CryptoHomeDashboard onAssetClick={handleAssetSelect} onOpenWatchlist={() => navigate('/crypto/dashboard/watchlist')} />} />
          <Route path="/crypto/dashboard/watchlist" element={<WatchlistPage onBack={() => navigate('/crypto/dashboard/home')} onAssetClick={handleAssetSelect} />} />
          <Route
            path="/crypto/dashboard/trade"
            element={(
              <TradePage
                onOpenTradingDesk={() => setIsTradingDeskOpen(true)}
                onAssetClick={handleAssetSelect}
              />
            )}
          />
          <Route path="/crypto/dashboard/copy" element={<CopyTrading />} />
          <Route path="/crypto/dashboard/wallet" element={<WalletPage />} />
          <Route path="/crypto/dashboard/profile" element={<ProfilePage />} />

          <Route path="*" element={<Navigate to={activeRouteMap.Home} replace />} />
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
