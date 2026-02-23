export interface SelectableAsset {
  id?: string;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  changeValue?: number;
  shares?: number;
  type?: string;
  marketValue?: number;
  dayChangeValue?: number;
  dayChangePercent?: number;
  openedAt?: string | null;
  updatedAt?: string | null;
  lastPriceUpdateAt?: string | null;
}

export interface Asset extends SelectableAsset {
  shares: number;
  change: number;
  isCrypto: boolean;
}

export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface PriceEntry {
  price: number;
  changePercent: number;
  lastAction: 'up' | 'down' | 'none';
  timestamp: number;
}

export type PriceState = Record<string, PriceEntry>;

export interface PortfolioHistoryPoint {
  time: string;
  value: number;
  buyingPower?: number;
  holdingsValue?: number;
  timestamp?: number;
}

export interface PortfolioSummary {
  value: number;
  buyingPower: number;
  holdingsValue?: number;
  investingTotal?: number;
  assetProfit?: number;
  totalProfit?: number;
  totalProfitPercent?: number;
  tradeProfit?: number;
  dailyChange: number;
  dailyChangePercent: number;
  history: PortfolioHistoryPoint[];
}

export interface AnalyticsSummary {
  riskLevel: string;
  diversificationScore: number;
  allocation: Record<string, number>;
  assetCount: number;
}

export interface PositionItem extends SelectableAsset {
  id: string;
  assetId: string;
  quantity: number;
  averagePrice: number;
  marketValue: number;
  dayChangeValue?: number;
  dayChangePercent?: number;
  openedAt?: string | null;
  updatedAt?: string | null;
}

export interface WatchlistItem extends SelectableAsset {
  id: string;
  assetId: string;
}

export interface MarketMover {
  id?: string;
  symbol: string;
  change: number;
}

export interface DashboardData {
  portfolio: PortfolioSummary;
  analytics: AnalyticsSummary;
  positions: PositionItem[];
  watchlist: WatchlistItem[];
  topGainers: MarketMover[];
  topLosers: MarketMover[];
  heatmap: MarketMover[];
}

export type DashboardRange = '24h' | '1w' | '1m' | '3m' | '6m' | '1y';

export interface AuthUser {
  id: string;
  username?: string;
  name: string;
  email: string;
  country?: string | null;
  membershipTier: string;
  kycStatus: string;
  phone?: string | null;
  timezone?: string | null;
  notificationEmailAlerts?: boolean;
}

export interface PublicSettings {
  siteMode: string;
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  requireKycForDeposits: boolean;
  requireKycForWithdrawals: boolean;
  sessionTimeoutMinutes: number;
  supportEmail: string;
  livechatEnabled: boolean;
  livechatProvider?: string | null;
  livechatEmbedCode?: string | null;
}

export interface OrderItem {
  id: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  status: string;
  quantity: number;
  averageFillPrice: number;
  totalValue: number;
  placedAt: string;
  filledAt?: string | null;
  asset: {
    id: string;
    symbol: string;
    name: string;
    type?: string;
  };
}

export interface MarketAssetDetail {
  id: string;
  symbol: string;
  name: string;
  type: string;
  price: number;
  changePercent: number;
  changeValue: number;
  lastPriceUpdateAt?: string | null;
  marketCap: number;
  volume24h: number;
  chart: ChartDataPoint[];
  relatedAssets: Array<{
    id: string;
    symbol: string;
    name: string;
  }>;
  recentTrades: Array<{
    id: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    executedAt?: string | null;
    trader: string;
  }>;
}

export interface WalletTransactionItem {
  id: string;
  type: string;
  status: string;
  direction: string;
  amount: number;
  quantity?: number | null;
  symbol?: string | null;
  occurredAt?: string | null;
}

export interface UserNotificationItem {
  id: string;
  type: string;
  eventType: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string | null;
  readAt?: string | null;
}

export interface WalletSummaryData {
  wallet: {
    id: string;
    cashBalance: number;
    investingBalance: number;
    profitLoss: number;
    tradeProfit: number;
    currency: string;
  };
  recentTransactions: WalletTransactionItem[];
  pendingDeposits: DepositRequestItem[];
  depositMethods: DepositMethodItem[];
}

export interface DepositRequestItem {
  id: string;
  amount: number;
  currency: string;
  network?: string | null;
  status: string;
  expiresAt?: string | null;
  walletAddress?: string;
}

export interface DepositMethodItem {
  id: string;
  paymentMethodId?: string | null;
  name: string;
  currency: string;
  network?: string | null;
  walletAddress: string;
}

export interface TraderItem {
  id: string;
  name: string;
  username: string;
  avatarColor?: string | null;
  strategy: string;
  copyFee: number;
  return: number;
  winRate: number;
  copiers: number;
  riskScore: number;
  isVerified: boolean;
  isFollowing: boolean;
  allocation?: number | null;
  pnl?: number | null;
  trades?: number | null;
}

export interface CopyFollowingSummary {
  followingCount: number;
  totalAllocated: number;
  totalPnl: number;
}

export interface CopyRelationshipItem {
  id: string;
  traderId: string;
  traderName: string;
  strategy: string;
  copyFee: number;
  status: 'active' | 'paused' | 'closed';
  allocation: number;
  copyRatio: number;
  pnl: number;
  trades: number;
}

export interface CopyTradeHistoryItem {
  id: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  pnl: number;
  executedAt?: string | null;
  traderName: string;
  symbol?: string | null;
}

export type KycDocumentType = 'drivers_license' | 'international_passport' | 'national_id_card';

export interface KycSubmissionData {
  id: string;
  status: string;
  address: string;
  city: string;
  country: string;
  documentType: KycDocumentType;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
}

export interface ProfileData extends AuthUser {
  notificationEmailAlerts: boolean;
  kycSubmission?: KycSubmissionData | null;
}
