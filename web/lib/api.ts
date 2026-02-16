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
  PositionItem,
  ProfileData,
  SelectableAsset,
  TraderItem,
  WalletSummaryData,
  WalletTransactionItem,
  WatchlistItem,
} from '../types';

export const API_BASE_URL = String(__API_BASE_URL__ || '/api/v1');
const TOKEN_STORAGE_KEY = 'runwayalgo.api.token';

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableString(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  return null;
}

function mapAuthUser(raw: any): AuthUser {
  return {
    id: String(raw.id),
    username: toNullableString(raw.username) ?? undefined,
    name: String(raw.name),
    email: String(raw.email),
    country: toNullableString(raw.country),
    membershipTier: String(raw.membership_tier ?? raw.membershipTier ?? 'free'),
    kycStatus: String(raw.kyc_status ?? raw.kycStatus ?? 'pending'),
    phone: toNullableString(raw.phone),
    timezone: toNullableString(raw.timezone),
    notificationEmailAlerts: typeof raw.notification_email_alerts === 'boolean'
      ? raw.notification_email_alerts
      : raw.notificationEmailAlerts,
  };
}

function mapSelectableAsset(raw: any): SelectableAsset {
  return {
    id: String(raw.id),
    symbol: String(raw.symbol),
    name: String(raw.name),
    type: typeof raw.type === 'string' ? raw.type : undefined,
    price: toNumber(raw.price ?? raw.current_price),
    changePercent: toNumber(raw.change_percent),
    shares: raw.shares !== undefined ? toNumber(raw.shares) : undefined,
    lastPriceUpdateAt: raw.last_price_update_at ?? raw.lastPriceUpdateAt ?? null,
  };
}

function mapPosition(raw: any): PositionItem {
  return {
    id: String(raw.id),
    assetId: String(raw.asset_id ?? raw.assetId),
    symbol: String(raw.symbol),
    name: String(raw.name),
    type: typeof raw.type === 'string' ? raw.type : undefined,
    price: toNumber(raw.price),
    changePercent: toNumber(raw.change_percent),
    shares: toNumber(raw.quantity),
    quantity: toNumber(raw.quantity),
    averagePrice: toNumber(raw.average_price),
    marketValue: toNumber(raw.market_value),
  };
}

function mapWatchlist(raw: any): WatchlistItem {
  return {
    id: String(raw.id),
    assetId: String(raw.asset_id ?? raw.assetId ?? raw.id),
    symbol: String(raw.symbol),
    name: String(raw.name),
    type: typeof raw.type === 'string' ? raw.type : undefined,
    price: toNumber(raw.price),
    changePercent: toNumber(raw.change_percent),
  };
}

function mapOrder(raw: any): OrderItem {
  const asset = raw.asset ?? {};

  return {
    id: String(raw.id),
    side: raw.side,
    orderType: raw.order_type,
    status: String(raw.status),
    quantity: toNumber(raw.quantity),
    averageFillPrice: toNumber(raw.average_fill_price),
    totalValue: toNumber(raw.total_value),
    placedAt: String(raw.placed_at ?? ''),
    filledAt: raw.filled_at ?? null,
    asset: {
      id: String(asset.id ?? raw.asset_id ?? ''),
      symbol: String(asset.symbol ?? ''),
      name: String(asset.name ?? ''),
      type: typeof asset.type === 'string' ? asset.type : undefined,
    },
  };
}

function mapWalletTransaction(raw: any): WalletTransactionItem {
  return {
    id: String(raw.id),
    type: String(raw.type),
    status: String(raw.status),
    direction: String(raw.direction),
    amount: toNumber(raw.amount),
    quantity: raw.quantity == null ? null : toNumber(raw.quantity),
    symbol: raw.symbol ?? null,
    occurredAt: raw.occurred_at ?? null,
  };
}

function mapDepositRequest(raw: any): DepositRequestItem {
  return {
    id: String(raw.id),
    amount: toNumber(raw.amount),
    currency: String(raw.currency),
    network: raw.network ?? null,
    status: String(raw.status),
    expiresAt: raw.expires_at ?? raw.expiresAt ?? null,
    walletAddress: raw.wallet_address,
  };
}

function mapTrader(raw: any): TraderItem {
  return {
    id: String(raw.id),
    name: String(raw.name),
    username: String(raw.username),
    avatarColor: raw.avatar_color ?? null,
    strategy: String(raw.strategy),
    return: toNumber(raw.return),
    winRate: toNumber(raw.win_rate),
    copiers: toNumber(raw.copiers),
    riskScore: toNumber(raw.risk_score),
    isVerified: Boolean(raw.is_verified),
    isFollowing: Boolean(raw.is_following),
    allocation: raw.allocation == null ? null : toNumber(raw.allocation),
    pnl: raw.pnl == null ? null : toNumber(raw.pnl),
    trades: raw.trades == null ? null : toNumber(raw.trades),
  };
}

function mapCopyRelationship(raw: any): CopyRelationshipItem {
  return {
    id: String(raw.id),
    traderId: String(raw.trader_id),
    traderName: String(raw.trader_name ?? raw.trader?.display_name ?? raw.trader?.name ?? ''),
    strategy: String(raw.strategy ?? raw.trader?.strategy ?? ''),
    status: raw.status,
    allocation: toNumber(raw.allocation),
    copyRatio: toNumber(raw.copy_ratio),
    pnl: toNumber(raw.pnl),
    trades: toNumber(raw.trades),
  };
}

function mapCopyTrade(raw: any): CopyTradeHistoryItem {
  return {
    id: String(raw.id),
    side: raw.side,
    quantity: toNumber(raw.quantity),
    price: toNumber(raw.price),
    pnl: toNumber(raw.pnl),
    executedAt: raw.executed_at ?? null,
    traderName: String(raw.copy_relationship?.trader?.display_name ?? ''),
    symbol: raw.asset?.symbol ?? null,
  };
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getAuthToken(): string | null {
  return getStoredToken();
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit & { authenticated?: boolean } = {},
): Promise<T> {
  const { authenticated = true, headers, body, ...rest } = options;
  const token = getStoredToken();

  const requestHeaders = new Headers(headers ?? {});
  requestHeaders.set('Accept', 'application/json');

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (authenticated && token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...rest,
    headers: requestHeaders,
    body,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error: ApiError = new Error(payload?.message ?? `API error (${response.status})`);
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return payload as T;
}

export async function apiLogin(email: string, password: string, deviceName = 'web-client'): Promise<{ token: string; user: AuthUser }> {
  const payload = await request<any>('/auth/login', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({
      email,
      password,
      device_name: deviceName,
    }),
  });

  return {
    token: String(payload.token),
    user: mapAuthUser(payload.user),
  };
}

export async function apiRegister(input: {
  username: string;
  name: string;
  email: string;
  country: string;
  currency?: string;
  phone: string;
  password: string;
}): Promise<{ email: string; debugOtp?: string }> {
  const payload = await request<any>('/auth/register', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({
      username: input.username,
      name: input.name,
      email: input.email,
      country: input.country,
      currency: input.currency,
      phone: input.phone,
      password: input.password,
    }),
  });

  return {
    email: String(payload.email),
    debugOtp: toNullableString(payload.debug_otp) ?? undefined,
  };
}

export async function apiVerifyEmailOtp(email: string, otp: string, deviceName = 'web-client'): Promise<{ token: string; user: AuthUser }> {
  const payload = await request<any>('/auth/verify-otp', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({
      email,
      otp,
      device_name: deviceName,
    }),
  });

  return {
    token: String(payload.token),
    user: mapAuthUser(payload.user),
  };
}

export async function apiResendEmailOtp(email: string): Promise<{ debugOtp?: string }> {
  const payload = await request<any>('/auth/resend-otp', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({ email }),
  });

  return {
    debugOtp: toNullableString(payload.debug_otp) ?? undefined,
  };
}

export async function apiForgotPassword(email: string): Promise<{ debugOtp?: string }> {
  const payload = await request<any>('/auth/forgot-password', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({ email }),
  });

  return {
    debugOtp: toNullableString(payload.debug_otp) ?? undefined,
  };
}

export async function apiResetPasswordWithOtp(email: string, otp: string, password: string): Promise<void> {
  await request('/auth/reset-password', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({
      email,
      otp,
      password,
    }),
  });
}

export async function apiMe(): Promise<AuthUser> {
  const payload = await request<any>('/auth/me');
  return mapAuthUser(payload.data);
}

export async function apiLogout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}

export async function apiDashboard(range?: DashboardRange): Promise<DashboardData> {
  const query = new URLSearchParams();

  if (range) {
    query.set('range', range);
  }

  const queryString = query.toString();
  const path = queryString ? `/dashboard?${queryString}` : '/dashboard';
  const payload = await request<any>(path);
  const data = payload.data;

  return {
    portfolio: {
      value: toNumber(data.portfolio?.value),
      buyingPower: toNumber(data.portfolio?.buying_power),
      dailyChange: toNumber(data.portfolio?.daily_change),
      dailyChangePercent: toNumber(data.portfolio?.daily_change_percent),
      history: (data.portfolio?.history ?? []).map((point: any) => ({
        time: String(point.time),
        value: toNumber(point.value),
        buyingPower: toNumber(point.buying_power, undefined as unknown as number),
        timestamp: point.timestamp == null ? undefined : toNumber(point.timestamp, undefined as unknown as number),
      })),
    },
    analytics: {
      riskLevel: String(data.analytics?.risk_level ?? 'Conservative'),
      diversificationScore: toNumber(data.analytics?.diversification_score),
      allocation: data.analytics?.allocation ?? {},
      assetCount: toNumber(data.analytics?.asset_count),
    },
    positions: (data.positions ?? []).map(mapPosition),
    watchlist: (data.watchlist ?? []).map(mapWatchlist),
    topGainers: (data.top_gainers ?? []).map((item: any) => ({
      id: item.id ? String(item.id) : undefined,
      symbol: String(item.symbol),
      change: toNumber(item.change),
    })),
    topLosers: (data.top_losers ?? []).map((item: any) => ({
      id: item.id ? String(item.id) : undefined,
      symbol: String(item.symbol),
      change: toNumber(item.change),
    })),
    heatmap: (data.heatmap ?? []).map((item: any) => ({
      symbol: String(item.symbol),
      change: toNumber(item.change),
    })),
  };
}

export async function apiMarketAssets(params?: { type?: string; search?: string }): Promise<SelectableAsset[]> {
  const query = new URLSearchParams();

  if (params?.type) query.set('type', params.type);
  if (params?.search) query.set('search', params.search);

  const queryString = query.toString();
  const path = queryString ? `/market/assets?${queryString}` : '/market/assets';
  const payload = await request<any>(path);

  return (payload.data ?? []).map(mapSelectableAsset);
}

export async function apiMarketAssetDetail(assetId: string): Promise<MarketAssetDetail> {
  const payload = await request<any>(`/market/assets/${assetId}`);
  const data = payload.data;

  return {
    id: String(data.id),
    symbol: String(data.symbol),
    name: String(data.name),
    type: String(data.type),
    price: toNumber(data.price),
    changePercent: toNumber(data.change_percent),
    changeValue: toNumber(data.change_value),
    lastPriceUpdateAt: data.last_price_update_at ?? data.lastPriceUpdateAt ?? null,
    marketCap: toNumber(data.market_cap),
    volume24h: toNumber(data.volume_24h),
    chart: (data.chart ?? []).map((point: any) => ({
      time: String(point.time),
      value: toNumber(point.value),
    })),
    relatedAssets: (data.related_assets ?? []).map((item: any) => ({
      id: String(item.id),
      symbol: String(item.symbol),
      name: String(item.name),
    })),
    recentTrades: (data.recent_trades ?? []).map((item: any) => ({
      id: String(item.id),
      side: item.side,
      quantity: toNumber(item.quantity),
      price: toNumber(item.price),
      executedAt: item.executed_at ?? null,
      trader: String(item.trader ?? ''),
    })),
  };
}

export async function apiOrders(): Promise<OrderItem[]> {
  const payload = await request<any>('/orders');
  return (payload.data ?? []).map(mapOrder);
}

export async function apiPlaceOrder(input: {
  assetId: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType?: 'market' | 'limit';
  requestedPrice?: number;
}): Promise<OrderItem> {
  const payload = await request<any>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      asset_id: input.assetId,
      side: input.side,
      quantity: input.quantity,
      order_type: input.orderType ?? 'market',
      requested_price: input.requestedPrice,
    }),
  });

  return mapOrder(payload.data);
}

export async function apiWalletSummary(): Promise<WalletSummaryData> {
  const payload = await request<any>('/wallet');
  const data = payload.data;

  return {
    wallet: {
      id: String(data.wallet.id),
      cashBalance: toNumber(data.wallet.cash_balance),
      investingBalance: toNumber(data.wallet.investing_balance),
      profitLoss: toNumber(data.wallet.profit_loss),
      currency: String(data.wallet.currency),
    },
    recentTransactions: (data.recent_transactions ?? []).map(mapWalletTransaction),
    pendingDeposits: (data.pending_deposits ?? []).map(mapDepositRequest),
  };
}

export async function apiWalletTransactions(params?: { type?: string; status?: string }): Promise<WalletTransactionItem[]> {
  const query = new URLSearchParams();

  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);

  const queryString = query.toString();
  const path = queryString ? `/wallet/transactions?${queryString}` : '/wallet/transactions';
  const payload = await request<any>(path);

  return (payload.data ?? []).map(mapWalletTransaction);
}

export async function apiCreateDeposit(input: {
  amount: number;
  currency: string;
  network?: string;
  assetId?: string;
}): Promise<DepositRequestItem> {
  const payload = await request<any>('/wallet/deposits', {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      network: input.network,
      asset_id: input.assetId,
    }),
  });

  return mapDepositRequest(payload.data);
}

export async function apiSubmitDepositProof(
  depositRequestId: string,
  input: {
    transactionHash: string;
    proofPath?: string;
    autoApprove?: boolean;
  },
): Promise<DepositRequestItem> {
  const payload = await request<any>(`/wallet/deposits/${depositRequestId}/proof`, {
    method: 'POST',
    body: JSON.stringify({
      transaction_hash: input.transactionHash,
      proof_path: input.proofPath,
      auto_approve: input.autoApprove ?? true,
    }),
  });

  return mapDepositRequest(payload.data);
}

export async function apiCopyDiscover(params?: { filter?: string; search?: string }): Promise<TraderItem[]> {
  const query = new URLSearchParams();

  if (params?.filter) query.set('filter', params.filter);
  if (params?.search) query.set('search', params.search);

  const queryString = query.toString();
  const path = queryString ? `/copy-trading/discover?${queryString}` : '/copy-trading/discover';
  const payload = await request<any>(path);

  return (payload.data?.traders ?? []).map(mapTrader);
}

export async function apiCopyFollowing(): Promise<{ summary: CopyFollowingSummary; items: CopyRelationshipItem[] }> {
  const payload = await request<any>('/copy-trading/following');
  const data = payload.data;

  return {
    summary: {
      followingCount: toNumber(data.summary?.following_count),
      totalAllocated: toNumber(data.summary?.total_allocated),
      totalPnl: toNumber(data.summary?.total_pnl),
    },
    items: (data.items ?? []).map(mapCopyRelationship),
  };
}

export async function apiCopyHistory(): Promise<CopyTradeHistoryItem[]> {
  const payload = await request<any>('/copy-trading/history');
  return (payload.data ?? []).map(mapCopyTrade);
}

export async function apiFollowTrader(input: {
  traderId: string;
  allocationAmount: number;
  copyRatio: number;
}): Promise<CopyRelationshipItem> {
  const payload = await request<any>('/copy-trading/follow', {
    method: 'POST',
    body: JSON.stringify({
      trader_id: input.traderId,
      allocation_amount: input.allocationAmount,
      copy_ratio: input.copyRatio,
    }),
  });

  return mapCopyRelationship(payload.data);
}

export async function apiUpdateCopyRelationship(
  id: string,
  input: { allocationAmount?: number; copyRatio?: number; status?: 'active' | 'paused' | 'closed' },
): Promise<CopyRelationshipItem> {
  const payload = await request<any>(`/copy-trading/following/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      allocation_amount: input.allocationAmount,
      copy_ratio: input.copyRatio,
      status: input.status,
    }),
  });

  return mapCopyRelationship(payload.data);
}

export async function apiCloseCopyRelationship(id: string): Promise<void> {
  await request(`/copy-trading/following/${id}`, {
    method: 'DELETE',
  });
}

export async function apiProfile(): Promise<ProfileData> {
  const payload = await request<any>('/profile');
  return mapAuthUser(payload.data) as ProfileData;
}

export async function apiUpdateProfile(input: {
  name?: string;
  phone?: string | null;
  timezone?: string | null;
  notificationEmailAlerts?: boolean;
  currentPassword?: string;
  newPassword?: string;
}): Promise<ProfileData> {
  const payload = await request<any>('/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      name: input.name,
      phone: input.phone,
      timezone: input.timezone,
      notification_email_alerts: input.notificationEmailAlerts,
      current_password: input.currentPassword,
      new_password: input.newPassword,
    }),
  });

  return mapAuthUser(payload.data) as ProfileData;
}
