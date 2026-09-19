export * from './market/MarketDataProvider.interface';
export * from './market/MockMarketDataProvider';
export * from './market/CryptoMarketDataProvider';
export * from './market/ForexMarketDataProvider';
export * from './market/CompositeMarketDataProvider';

import { CompositeMarketDataProvider } from './market/CompositeMarketDataProvider';
import { env } from '../config/env';

export const marketService = new CompositeMarketDataProvider(env.MARKET_DATA_PROVIDER);
