
import { Asset, ChartDataPoint, MarketMover } from './types';

export const PORTFOLIO_HISTORY: ChartDataPoint[] = [
  { time: '09:00', value: 2850000 },
  { time: '10:00', value: 2875000 },
  { time: '11:00', value: 2920000 },
  { time: '12:00', value: 2900000 },
  { time: '13:00', value: 2950000 },
  { time: '14:00', value: 2980000 },
  { time: '15:00', value: 3010000 },
  { time: '16:00', value: 3020287.58 },
];

export const MY_ASSETS: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', shares: 1.00, price: 88325.00, change: -427, changePercent: -0.48, isCrypto: true },
  { symbol: 'ETH', name: 'Ethereum', shares: 5.00, price: 3450.20, change: -8, changePercent: -0.23, isCrypto: true },
  { symbol: 'USDC', name: 'USD Coin', shares: 15439.00, price: 1.00, change: 0, changePercent: 0, isCrypto: true },
  { symbol: 'AMD', name: 'Advanced Micro Devices', shares: 50.00, price: 145.20, change: 3634, changePercent: 50.9, isCrypto: false },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', shares: 74.00, price: 425.10, change: 11335, changePercent: 12.5, isCrypto: false },
];

export const WATCHLIST: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', shares: 0, price: 88325.00, change: 547, changePercent: 0.62, isCrypto: true },
  { symbol: 'FTM', name: 'Fantom', shares: 0, price: 0.62, change: 0.54, changePercent: 701.56, isCrypto: true },
  { symbol: 'SOL', name: 'Solana', shares: 0, price: 212.45, change: 12.3, changePercent: 5.8, isCrypto: true },
];

export const TOP_GAINERS: MarketMover[] = [
  { symbol: 'A01', change: 6.1 },
  { symbol: 'AD01', change: 6.1 },
  { symbol: 'AA', change: 5.9 },
];

export const TOP_LOSERS: MarketMover[] = [
  { symbol: 'AA03', change: -6.7 },
  { symbol: 'AD02', change: -6.4 },
  { symbol: 'AB', change: -5.3 },
];

export const HEATMAP_DATA = [
  { symbol: 'A', change: -0.2 },
  { symbol: 'A01', change: 6.1 },
  { symbol: 'A02', change: 0.3 },
  { symbol: 'A03', change: 2.4 },
  { symbol: 'A04', change: -1.1 },
  { symbol: 'AA', change: 5.9 },
  { symbol: 'AA01', change: 1.6 },
  { symbol: 'AA02', change: -1.2 },
  { symbol: 'AA03', change: -6.7 },
  { symbol: 'AAI', change: 5.9 },
  { symbol: 'AAI1', change: 4.3 },
  { symbol: 'AAI2', change: 3.0 },
  { symbol: 'AAPL', change: -0.3 },
  { symbol: 'AAVE', change: -1.3 },
  { symbol: 'AB', change: -5.3 },
  { symbol: 'ABBV', change: 1.6 },
];
