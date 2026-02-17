import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import {
  API_BASE_URL,
  apiAddToWatchlist,
  apiCloseCopyRelationship,
  apiCopyDiscover,
  apiCopyFollowing,
  apiCopyHistory,
  apiRemoveFromWatchlist,
  apiCreateDeposit,
  apiCreateWithdrawal,
  apiDashboard,
  apiFollowTrader,
  apiLogin,
  apiLogout,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiMarketAssetDetail,
  apiMarketAssets,
  apiMe,
  apiNotifications,
  apiOrders,
  apiPlaceOrder,
  apiProfile,
  apiSubmitDepositProof,
  apiUpdateCopyRelationship,
  apiUpdateProfile,
  apiWalletSummary,
  apiWalletTransactions,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from '../lib/api';
import type {
  AuthUser,
  CopyFollowingSummary,
  CopyRelationshipItem,
  CopyTradeHistoryItem,
  DashboardRange,
  DashboardData,
  DepositRequestItem,
  MarketAssetDetail,
  OrderItem,
  PriceState,
  ProfileData,
  SelectableAsset,
  TraderItem,
  UserNotificationItem,
  WalletSummaryData,
  WalletTransactionItem,
} from '../types';

interface MarketContextType {
  prices: PriceState;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  authError: string | null;
  dashboard: DashboardData | null;
  marketAssets: SelectableAsset[];
  orders: OrderItem[];
  notifications: UserNotificationItem[];
  unreadNotificationCount: number;
  portfolioValue: number;
  buyingPower: number;
  positions: DashboardData['positions'];
  watchlist: DashboardData['watchlist'];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshCoreData: () => Promise<void>;
  refreshDashboard: (range?: DashboardRange) => Promise<void>;
  refreshMarketAssets: (params?: { type?: string; search?: string }) => Promise<SelectableAsset[]>;
  refreshOrders: () => Promise<OrderItem[]>;
  refreshNotifications: (params?: { limit?: number; unreadOnly?: boolean }) => Promise<UserNotificationItem[]>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  fetchAssetDetail: (assetId: string) => Promise<MarketAssetDetail>;
  placeOrder: (input: {
    assetId: string;
    side: 'buy' | 'sell';
    quantity: number;
    orderType?: 'market' | 'limit';
    requestedPrice?: number;
  }) => Promise<OrderItem>;
  fetchWalletSummary: () => Promise<WalletSummaryData>;
  fetchWalletTransactions: (params?: { type?: string; status?: string }) => Promise<WalletTransactionItem[]>;
  createDeposit: (input: { amount: number; currency: string; network?: string; assetId?: string }) => Promise<DepositRequestItem>;
  createWithdrawal: (input: { amount: number; currency: string; network?: string; destination: string; assetId?: string }) => Promise<WalletTransactionItem>;
  submitDepositProof: (
    depositRequestId: string,
    input: { transactionHash: string; proofFile: File },
  ) => Promise<DepositRequestItem>;
  fetchCopyDiscover: (params?: { filter?: string; search?: string }) => Promise<TraderItem[]>;
  fetchCopyFollowing: () => Promise<{ summary: CopyFollowingSummary; items: CopyRelationshipItem[] }>;
  fetchCopyHistory: () => Promise<CopyTradeHistoryItem[]>;
  followTrader: (input: { traderId: string; allocationAmount: number; copyRatio: number }) => Promise<CopyRelationshipItem>;
  updateCopyRelationship: (
    id: string,
    input: { allocationAmount?: number; copyRatio?: number; status?: 'active' | 'paused' | 'closed' },
  ) => Promise<CopyRelationshipItem>;
  closeCopyRelationship: (id: string) => Promise<void>;
  addToWatchlist: (assetId: string) => Promise<void>;
  removeFromWatchlist: (watchlistItemId: string) => Promise<void>;
  fetchProfile: () => Promise<ProfileData>;
  updateProfile: (input: {
    name?: string;
    phone?: string | null;
    timezone?: string | null;
    notificationEmailAlerts?: boolean;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<ProfileData>;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

function buildPriceState(previous: PriceState, assets: SelectableAsset[]): PriceState {
  const now = Date.now();

  return assets.reduce<PriceState>((acc, asset) => {
    const existing = previous[asset.symbol];
    let lastAction: 'up' | 'down' | 'none' = 'none';

    if (existing) {
      if (asset.price > existing.price) {
        lastAction = 'up';
      } else if (asset.price < existing.price) {
        lastAction = 'down';
      }
    }

    acc[asset.symbol] = {
      price: asset.price,
      changePercent: asset.changePercent,
      lastAction,
      timestamp: now,
    };

    return acc;
  }, {});
}

function mergeAssetsBySymbol(input: SelectableAsset[]): SelectableAsset[] {
  const map = new Map<string, SelectableAsset>();

  input.forEach((asset) => {
    if (!asset.symbol) {
      return;
    }

    map.set(asset.symbol, asset);
  });

  return [...map.values()];
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();

  return normalized === 'localhost'
    || normalized === '127.0.0.1'
    || normalized === '::1'
    || normalized.endsWith('.localhost');
}

function normalizeHost(input: string): string {
  return input
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .trim();
}

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prices, setPrices] = useState<PriceState>({});
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [marketAssets, setMarketAssets] = useState<SelectableAsset[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const activeDashboardRangeRef = useRef<DashboardRange>('24h');
  const refreshDashboardRef = useRef<MarketContextType['refreshDashboard']>(async () => {});

  const refreshDashboard = useCallback(async (range?: DashboardRange) => {
    const effectiveRange = range ?? activeDashboardRangeRef.current;
    activeDashboardRangeRef.current = effectiveRange;

    const nextDashboard = await apiDashboard(effectiveRange);
    setDashboard(nextDashboard);

    setPrices((previous) => {
      const sourceAssets = mergeAssetsBySymbol([
        ...nextDashboard.positions.map((position) => ({
          id: position.assetId,
          symbol: position.symbol,
          name: position.name,
          type: position.type,
          price: position.price,
          changePercent: position.changePercent,
          shares: position.quantity,
        })),
        ...nextDashboard.watchlist,
        ...marketAssets,
      ]);

      return buildPriceState(previous, sourceAssets);
    });
  }, [marketAssets]);

  useEffect(() => {
    refreshDashboardRef.current = refreshDashboard;
  }, [refreshDashboard]);

  const refreshMarketAssets = useCallback(async (params?: { type?: string; search?: string }) => {
    const nextAssets = await apiMarketAssets(params);

    if (!params?.type && !params?.search) {
      setMarketAssets(nextAssets);

      setPrices((previous) => {
        const sourceAssets = mergeAssetsBySymbol([
          ...nextAssets,
          ...(dashboard?.positions ?? []).map((position) => ({
            id: position.assetId,
            symbol: position.symbol,
            name: position.name,
            type: position.type,
            price: position.price,
            changePercent: position.changePercent,
            shares: position.quantity,
          })),
          ...(dashboard?.watchlist ?? []),
        ]);

        return buildPriceState(previous, sourceAssets);
      });
    }

    return nextAssets;
  }, [dashboard]);

  const refreshOrders = useCallback(async () => {
    const nextOrders = await apiOrders();
    setOrders(nextOrders);
    return nextOrders;
  }, []);

  const refreshNotifications = useCallback(async (params?: { limit?: number; unreadOnly?: boolean }) => {
    const payload = await apiNotifications(params);
    setNotifications(payload.items);
    setUnreadNotificationCount(payload.unreadCount);
    return payload.items;
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    const payload = await apiMarkNotificationRead(notificationId);

    setNotifications((previous) => previous.map((notification) => (
      notification.id === notificationId
        ? payload.notification
        : notification
    )));
    setUnreadNotificationCount(payload.unreadCount);
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    await apiMarkAllNotificationsRead();
    setNotifications((previous) => previous.map((notification) => ({
      ...notification,
      readAt: notification.readAt ?? new Date().toISOString(),
    })));
    setUnreadNotificationCount(0);
  }, []);

  const refreshCoreData = useCallback(async () => {
    const [nextUser, nextDashboard, nextMarketAssets, nextOrders, nextNotifications] = await Promise.all([
      apiMe(),
      apiDashboard(),
      apiMarketAssets(),
      apiOrders(),
      apiNotifications({ limit: 20 }),
    ]);

    setUser(nextUser);
    setDashboard(nextDashboard);
    setMarketAssets(nextMarketAssets);
    setOrders(nextOrders);
    setNotifications(nextNotifications.items);
    setUnreadNotificationCount(nextNotifications.unreadCount);

    const sourceAssets = mergeAssetsBySymbol([
      ...nextMarketAssets,
      ...nextDashboard.positions.map((position) => ({
        id: position.assetId,
        symbol: position.symbol,
        name: position.name,
        type: position.type,
        price: position.price,
        changePercent: position.changePercent,
        shares: position.quantity,
      })),
      ...nextDashboard.watchlist,
    ]);

    setPrices((previous) => buildPriceState(previous, sourceAssets));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);

    try {
      const payload = await apiLogin(email, password, 'web-terminal');
      setAuthToken(payload.token);
      await refreshCoreData();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to authenticate right now.';
      setAuthError(message);
      return false;
    }
  }, [refreshCoreData]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore server-side logout errors and always clear local auth state.
    }

    clearAuthToken();
    setUser(null);
    setDashboard(null);
    setMarketAssets([]);
    setOrders([]);
    setNotifications([]);
    setUnreadNotificationCount(0);
    setPrices({});
    setAuthError(null);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getAuthToken();

      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        await refreshCoreData();
      } catch {
        clearAuthToken();
        setUser(null);
        setDashboard(null);
        setMarketAssets([]);
        setOrders([]);
        setNotifications([]);
        setUnreadNotificationCount(0);
        setPrices({});
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, [refreshCoreData]);

  useEffect(() => {
    const realtimeEnabled = ['1', 'true', 'yes', 'on'].includes(
      String(import.meta.env.VITE_ENABLE_REALTIME ?? 'false').trim().toLowerCase(),
    );
    const token = getAuthToken();
    const appKey = String(import.meta.env.VITE_REVERB_APP_KEY ?? '').trim();
    const configuredHost = normalizeHost(String(import.meta.env.VITE_REVERB_HOST ?? ''));

    if (!realtimeEnabled || !user || !token || !appKey || !configuredHost) {
      return;
    }

    const apiBase = String(API_BASE_URL).replace(/\/$/, '');
    const currentHost = window.location.hostname;
    const configuredScheme = String(import.meta.env.VITE_REVERB_SCHEME ?? '').trim().toLowerCase();
    const scheme = configuredScheme === 'http' || configuredScheme === 'https'
      ? configuredScheme
      : (window.location.protocol === 'https:' ? 'https' : 'http');
    const defaultPort = scheme === 'https' ? 443 : 80;
    const configuredPortValue = Number(String(import.meta.env.VITE_REVERB_PORT ?? '').trim());

    const hostCandidate = configuredHost || currentHost;
    const shouldUseCurrentHost = isLoopbackHost(hostCandidate) && !isLoopbackHost(currentHost);
    const wsHost = shouldUseCurrentHost ? currentHost : hostCandidate;

    let wsPort = Number.isFinite(configuredPortValue) && configuredPortValue > 0
      ? configuredPortValue
      : defaultPort;

    if (shouldUseCurrentHost && wsPort === 8080) {
      wsPort = defaultPort;
    }

    const forceTLS = scheme === 'https';

    const windowWithPusher = window as Window & { Pusher?: typeof Pusher };
    windowWithPusher.Pusher = Pusher;

    const echo = new Echo({
      broadcaster: 'reverb',
      key: appKey,
      wsHost,
      wsPort,
      wssPort: wsPort,
      forceTLS,
      enabledTransports: forceTLS ? ['wss'] : ['ws'],
      authEndpoint: `${apiBase}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const channelName = `portfolio.${user.id}`;
    const channel = echo.private(channelName);
    let refreshTimeout: number | null = null;
    let disconnectedByError = false;

    const connector = echo.connector as { pusher?: { connection?: { bind: (event: string, callback: () => void) => void; unbind: (event: string, callback: () => void) => void } } };
    const socketConnection = connector.pusher?.connection;

    const disableRealtime = () => {
      if (disconnectedByError) {
        return;
      }

      disconnectedByError = true;
      echo.disconnect();
    };

    const queueRefresh = () => {
      if (disconnectedByError) {
        return;
      }

      if (refreshTimeout !== null) {
        return;
      }

      refreshTimeout = window.setTimeout(() => {
        refreshTimeout = null;
        void refreshDashboardRef.current(activeDashboardRangeRef.current).catch(() => {
          // Keep current state if a live refresh fails.
        });
      }, 350);
    };

    channel.listen('.portfolio.snapshot.updated', queueRefresh);
    socketConnection?.bind('failed', disableRealtime);
    socketConnection?.bind('unavailable', disableRealtime);

    return () => {
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      channel.stopListening('.portfolio.snapshot.updated');
      socketConnection?.unbind('failed', disableRealtime);
      socketConnection?.unbind('unavailable', disableRealtime);
      echo.leave(channelName);
      echo.disconnect();
    };
  }, [user]);

  const placeOrder: MarketContextType['placeOrder'] = useCallback(async (input) => {
    const order = await apiPlaceOrder(input);
    await Promise.all([refreshDashboard(), refreshOrders()]);
    return order;
  }, [refreshDashboard, refreshOrders]);

  const fetchAssetDetail: MarketContextType['fetchAssetDetail'] = useCallback((assetId) => apiMarketAssetDetail(assetId), []);

  const fetchWalletSummary: MarketContextType['fetchWalletSummary'] = useCallback(() => apiWalletSummary(), []);
  const fetchWalletTransactions: MarketContextType['fetchWalletTransactions'] = useCallback((params) => apiWalletTransactions(params), []);
  const createDeposit: MarketContextType['createDeposit'] = useCallback((input) => apiCreateDeposit(input), []);
  const createWithdrawal: MarketContextType['createWithdrawal'] = useCallback((input) => apiCreateWithdrawal(input), []);
  const submitDepositProof: MarketContextType['submitDepositProof'] = useCallback((depositRequestId, input) => apiSubmitDepositProof(depositRequestId, input), []);

  const fetchCopyDiscover: MarketContextType['fetchCopyDiscover'] = useCallback((params) => apiCopyDiscover(params), []);
  const fetchCopyFollowing: MarketContextType['fetchCopyFollowing'] = useCallback(() => apiCopyFollowing(), []);
  const fetchCopyHistory: MarketContextType['fetchCopyHistory'] = useCallback(() => apiCopyHistory(), []);
  const followTrader: MarketContextType['followTrader'] = useCallback((input) => apiFollowTrader(input), []);
  const updateCopyRelationship: MarketContextType['updateCopyRelationship'] = useCallback((id, input) => apiUpdateCopyRelationship(id, input), []);
  const closeCopyRelationship: MarketContextType['closeCopyRelationship'] = useCallback((id) => apiCloseCopyRelationship(id), []);
  const addToWatchlist: MarketContextType['addToWatchlist'] = useCallback(async (assetId) => {
    await apiAddToWatchlist(assetId);
    await refreshDashboard(activeDashboardRangeRef.current);
  }, [refreshDashboard]);
  const removeFromWatchlist: MarketContextType['removeFromWatchlist'] = useCallback(async (watchlistItemId) => {
    await apiRemoveFromWatchlist(watchlistItemId);
    await refreshDashboard(activeDashboardRangeRef.current);
  }, [refreshDashboard]);

  const fetchProfile: MarketContextType['fetchProfile'] = useCallback(() => apiProfile(), []);
  const updateProfileContext: MarketContextType['updateProfile'] = useCallback(async (input) => {
    const profile = await apiUpdateProfile(input);

    setUser((previous) => previous ? {
      ...previous,
      name: profile.name,
      phone: profile.phone,
      timezone: profile.timezone,
      notificationEmailAlerts: profile.notificationEmailAlerts,
      membershipTier: profile.membershipTier,
      kycStatus: profile.kycStatus,
    } : profile);

    return profile;
  }, []);

  const positions = dashboard?.positions ?? [];
  const watchlist = dashboard?.watchlist ?? [];

  const value = useMemo<MarketContextType>(() => ({
    prices,
    user,
    isAuthenticated: Boolean(user),
    isBootstrapping,
    authError,
    dashboard,
    marketAssets,
    orders,
    notifications,
    unreadNotificationCount,
    portfolioValue: dashboard?.portfolio.value ?? 0,
    buyingPower: dashboard?.portfolio.buyingPower ?? 0,
    positions,
    watchlist,
    login,
    logout,
    refreshCoreData,
    refreshDashboard,
    refreshMarketAssets,
    refreshOrders,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchAssetDetail,
    placeOrder,
    fetchWalletSummary,
    fetchWalletTransactions,
    createDeposit,
    createWithdrawal,
    submitDepositProof,
    fetchCopyDiscover,
    fetchCopyFollowing,
    fetchCopyHistory,
    followTrader,
    updateCopyRelationship,
    closeCopyRelationship,
    addToWatchlist,
    removeFromWatchlist,
    fetchProfile,
    updateProfile: updateProfileContext,
  }), [
    prices,
    user,
    isBootstrapping,
    authError,
    dashboard,
    marketAssets,
    orders,
    notifications,
    unreadNotificationCount,
    positions,
    watchlist,
    login,
    logout,
    refreshCoreData,
    refreshDashboard,
    refreshMarketAssets,
    refreshOrders,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchAssetDetail,
    placeOrder,
    fetchWalletSummary,
    fetchWalletTransactions,
    createDeposit,
    createWithdrawal,
    submitDepositProof,
    fetchCopyDiscover,
    fetchCopyFollowing,
    fetchCopyHistory,
    followTrader,
    updateCopyRelationship,
    closeCopyRelationship,
    addToWatchlist,
    removeFromWatchlist,
    fetchProfile,
    updateProfileContext,
  ]);

  return (
    <MarketContext.Provider value={value}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);

  if (!context) {
    throw new Error('useMarket must be used within MarketProvider');
  }

  return context;
};
