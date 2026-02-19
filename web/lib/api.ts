import type {
  AuthUser,
  CopyFollowingSummary,
  CopyRelationshipItem,
  CopyTradeHistoryItem,
  KycDocumentType,
  KycSubmissionData,
  DashboardRange,
  DashboardData,
  DepositMethodItem,
  DepositRequestItem,
  MarketAssetDetail,
  OrderItem,
  PositionItem,
  ProfileData,
  PublicSettings,
  SelectableAsset,
  TraderItem,
  UserNotificationItem,
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

function mapKycSubmission(raw: any): KycSubmissionData | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  return {
    id: String(raw.id ?? ''),
    status: String(raw.status ?? 'pending'),
    address: String(raw.address ?? ''),
    city: String(raw.city ?? ''),
    country: String(raw.country ?? ''),
    documentType: String(raw.document_type ?? raw.documentType ?? 'drivers_license') as KycDocumentType,
    submittedAt: raw.submitted_at ?? raw.submittedAt ?? null,
    reviewedAt: raw.reviewed_at ?? raw.reviewedAt ?? null,
    reviewNotes: raw.review_notes ?? raw.reviewNotes ?? null,
  };
}

function mapProfile(raw: any): ProfileData {
  const authUser = mapAuthUser(raw);

  return {
    ...authUser,
    notificationEmailAlerts: typeof raw.notification_email_alerts === 'boolean'
      ? raw.notification_email_alerts
      : Boolean(raw.notificationEmailAlerts ?? authUser.notificationEmailAlerts),
    kycSubmission: mapKycSubmission(raw.kyc_submission ?? raw.kycSubmission),
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
    changeValue: raw.change_value == null ? undefined : toNumber(raw.change_value, undefined as unknown as number),
    shares: raw.shares !== undefined ? toNumber(raw.shares) : undefined,
    marketValue: raw.market_value == null ? undefined : toNumber(raw.market_value, undefined as unknown as number),
    dayChangeValue: raw.day_change_value == null ? undefined : toNumber(raw.day_change_value, undefined as unknown as number),
    dayChangePercent: raw.day_change_percent == null ? undefined : toNumber(raw.day_change_percent, undefined as unknown as number),
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
    changeValue: raw.change_value == null ? undefined : toNumber(raw.change_value, undefined as unknown as number),
    shares: toNumber(raw.quantity),
    quantity: toNumber(raw.quantity),
    averagePrice: toNumber(raw.average_price),
    marketValue: toNumber(raw.market_value),
    dayChangeValue: raw.day_change_value == null ? undefined : toNumber(raw.day_change_value, undefined as unknown as number),
    dayChangePercent: raw.day_change_percent == null
      ? toNumber(raw.change_percent, undefined as unknown as number)
      : toNumber(raw.day_change_percent, undefined as unknown as number),
    openedAt: raw.opened_at ?? null,
    updatedAt: raw.updated_at ?? null,
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
    symbol: raw.symbol ?? raw.asset?.symbol ?? null,
    occurredAt: raw.occurred_at ?? null,
  };
}

function mapNotification(raw: any): UserNotificationItem {
  return {
    id: String(raw.id),
    type: String(raw.type ?? ''),
    eventType: String(raw.event_type ?? raw.eventType ?? 'system'),
    title: String(raw.title ?? 'Notification'),
    message: String(raw.message ?? ''),
    actionUrl: toNullableString(raw.action_url ?? raw.actionUrl),
    metadata: typeof raw.metadata === 'object' && raw.metadata !== null ? raw.metadata : {},
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    readAt: raw.read_at ?? raw.readAt ?? null,
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

function mapDepositMethod(raw: any): DepositMethodItem {
  const walletAddress = toNullableString(
    raw.wallet_address
    ?? raw.walletAddress
    ?? raw.address
    ?? raw.wallet
    ?? raw.settings?.wallet_address,
  ) ?? '';
  const currency = String(raw.currency ?? raw.asset_symbol ?? raw.symbol ?? '').trim().toUpperCase();
  const network = toNullableString(raw.network ?? raw.chain ?? raw.protocol);
  const name = String(raw.name ?? `${currency || 'Crypto'}${network ? ` ${network}` : ''} Wallet`).trim();
  const paymentMethodId = toNullableString(raw.id);
  const localSelectionId = paymentMethodId
    ?? [name, currency, network ?? '', walletAddress].join('|');

  return {
    id: localSelectionId,
    paymentMethodId,
    name,
    currency,
    network,
    walletAddress,
  };
}

function mapTrader(raw: any): TraderItem {
  return {
    id: String(raw.id),
    name: String(raw.name),
    username: String(raw.username),
    avatarColor: raw.avatar_color ?? null,
    strategy: String(raw.strategy),
    copyFee: toNumber(raw.copy_fee),
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
    copyFee: toNumber(raw.copy_fee ?? raw.trader?.copy_fee),
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

function mapPublicSettings(raw: any): PublicSettings {
  return {
    siteMode: String(raw.site_mode ?? 'live'),
    depositsEnabled: Boolean(raw.deposits_enabled),
    withdrawalsEnabled: Boolean(raw.withdrawals_enabled),
    requireKycForDeposits: Boolean(raw.require_kyc_for_deposits),
    requireKycForWithdrawals: Boolean(raw.require_kyc_for_withdrawals),
    sessionTimeoutMinutes: toNumber(raw.session_timeout_minutes),
    supportEmail: String(raw.support_email ?? ''),
    livechatEnabled: Boolean(raw.livechat_enabled),
    livechatProvider: raw.livechat_provider ?? null,
    livechatEmbedCode: raw.livechat_embed_code ?? null,
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

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body !== undefined && !isFormData && !requestHeaders.has('Content-Type')) {
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
}): Promise<{ email: string }> {
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

export async function apiResendEmailOtp(email: string): Promise<void> {
  await request('/auth/resend-otp', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({ email }),
  });
}

export async function apiForgotPassword(email: string): Promise<void> {
  await request('/auth/forgot-password', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({ email }),
  });
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
      holdingsValue: data.portfolio?.holdings_value == null
        ? undefined
        : toNumber(data.portfolio?.holdings_value, undefined as unknown as number),
      dailyChange: toNumber(data.portfolio?.daily_change),
      dailyChangePercent: toNumber(data.portfolio?.daily_change_percent),
      history: (data.portfolio?.history ?? []).map((point: any) => ({
        time: String(point.time),
        value: toNumber(point.value),
        buyingPower: toNumber(point.buying_power, undefined as unknown as number),
        holdingsValue: point.holdings_value == null
          ? undefined
          : toNumber(point.holdings_value, undefined as unknown as number),
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

export async function apiWatchlist(): Promise<WatchlistItem[]> {
  const payload = await request<any>('/watchlist');
  return (payload.data ?? []).map(mapWatchlist);
}

export async function apiAddToWatchlist(assetId: string): Promise<WatchlistItem> {
  const payload = await request<any>('/watchlist', {
    method: 'POST',
    body: JSON.stringify({
      asset_id: assetId,
    }),
  });

  return mapWatchlist(payload.data);
}

export async function apiRemoveFromWatchlist(watchlistItemId: string): Promise<void> {
  await request(`/watchlist/${watchlistItemId}`, {
    method: 'DELETE',
  });
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

export async function apiNotifications(params?: { limit?: number; unreadOnly?: boolean }): Promise<{
  items: UserNotificationItem[];
  unreadCount: number;
}> {
  const query = new URLSearchParams();

  if (typeof params?.limit === 'number') {
    query.set('limit', String(params.limit));
  }

  if (typeof params?.unreadOnly === 'boolean') {
    query.set('unread_only', params.unreadOnly ? '1' : '0');
  }

  const queryString = query.toString();
  const path = queryString ? `/notifications?${queryString}` : '/notifications';
  const payload = await request<any>(path);

  return {
    items: (payload.data ?? []).map(mapNotification),
    unreadCount: toNumber(payload.meta?.unread_count),
  };
}

export async function apiMarkAllNotificationsRead(): Promise<number> {
  const payload = await request<any>('/notifications/read-all', {
    method: 'POST',
  });

  return toNumber(payload.meta?.unread_count);
}

export async function apiMarkNotificationRead(notificationId: string): Promise<{ notification: UserNotificationItem; unreadCount: number }> {
  const payload = await request<any>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });

  return {
    notification: mapNotification(payload.data),
    unreadCount: toNumber(payload.meta?.unread_count),
  };
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
    depositMethods: (data.deposit_methods ?? []).map(mapDepositMethod),
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
  paymentMethodId?: string;
}): Promise<DepositRequestItem> {
  const payload = await request<any>('/wallet/deposits', {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      network: input.network,
      asset_id: input.assetId,
      payment_method_id: input.paymentMethodId,
    }),
  });

  return mapDepositRequest(payload.data);
}

export async function apiCreateWithdrawal(input: {
  amount: number;
  currency: string;
  network?: string;
  destination: string;
  assetId?: string;
}): Promise<WalletTransactionItem> {
  const payload = await request<any>('/wallet/withdrawals', {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      network: input.network,
      destination: input.destination,
      asset_id: input.assetId,
    }),
  });

  return mapWalletTransaction(payload.data);
}

export async function apiSubmitDepositProof(
  depositRequestId: string,
  input: {
    transactionHash: string;
    proofFile: File;
  },
): Promise<DepositRequestItem> {
  const formData = new FormData();
  formData.append('transaction_hash', input.transactionHash);
  formData.append('proof_file', input.proofFile);

  const payload = await request<any>(`/wallet/deposits/${depositRequestId}/proof`, {
    method: 'POST',
    body: formData,
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
  return mapProfile(payload.data);
}

export async function apiPublicSettings(): Promise<PublicSettings> {
  const payload = await request<any>('/public/settings', {
    authenticated: false,
  });

  return mapPublicSettings(payload.data ?? {});
}

export async function apiUpdateProfile(input: {
  name?: string;
  phone?: string | null;
  timezone?: string | null;
  notificationEmailAlerts?: boolean;
  currentPassword?: string;
  newPassword?: string;
  newPasswordConfirmation?: string;
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
      new_password_confirmation: input.newPasswordConfirmation,
    }),
  });

  return mapProfile(payload.data);
}

export async function apiSendKycOtp(): Promise<void> {
  await request('/profile/kyc/send-otp', {
    method: 'POST',
  });
}

export async function apiSubmitKyc(input: {
  address: string;
  city: string;
  country: string;
  documentType: KycDocumentType;
  documentFile: File;
}): Promise<ProfileData> {
  const formData = new FormData();
  formData.append('address', input.address);
  formData.append('city', input.city);
  formData.append('country', input.country);
  formData.append('document_type', input.documentType);
  formData.append('document_file', input.documentFile);

  const payload = await request<any>('/profile/kyc/submit', {
    method: 'POST',
    body: formData,
  });

  return mapProfile(payload.data);
}

export async function apiConfirmKycOtp(input: { otp: string }): Promise<ProfileData> {
  const payload = await request<any>('/profile/kyc/confirm', {
    method: 'POST',
    body: JSON.stringify({
      otp: input.otp,
    }),
  });

  return mapProfile(payload.data);
}
