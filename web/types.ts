export interface SelectableAsset {
  id?: string;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  shares?: number;
  type?: string;
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
}

export interface PortfolioSummary {
  value: number;
  buyingPower: number;
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

export interface WalletSummaryData {
  wallet: {
    id: string;
    cashBalance: number;
    investingBalance: number;
    profitLoss: number;
    currency: string;
  };
  recentTransactions: WalletTransactionItem[];
  pendingDeposits: DepositRequestItem[];
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

export interface TraderItem {
  id: string;
  name: string;
  username: string;
  avatarColor?: string | null;
  strategy: string;
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

export interface ProfileData extends AuthUser {
  notificationEmailAlerts: boolean;
}
