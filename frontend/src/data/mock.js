// Mock data for PioSwap DEX

export const NETWORK_CONFIG = {
  name: 'PIOGOLD Mainnet',
  rpc: 'https://datasheed.pioscan.com',
  chainId: 42357,
  symbol: 'PIO',
  explorer: 'https://pioscan.com'
};

export const TOKENS = [
  {
    id: 'pio',
    symbol: 'PIO',
    name: 'PIOGOLD',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=pio&backgroundColor=FFD700',
    price: 2.45,
    priceChange: 3.24,
    isNative: true
  },
  {
    id: 'wpio',
    symbol: 'WPIO',
    name: 'Wrapped PIO',
    address: '0x1111111111111111111111111111111111111111',
    decimals: 18,
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=wpio&backgroundColor=DAA520',
    price: 2.45,
    priceChange: 3.24
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x2222222222222222222222222222222222222222',
    decimals: 6,
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=usdt&backgroundColor=26A17B',
    price: 1.00,
    priceChange: 0.01
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x3333333333333333333333333333333333333333',
    decimals: 6,
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=usdc&backgroundColor=2775CA',
    price: 1.00,
    priceChange: 0.00
  },
  {
    id: 'pgold',
    symbol: 'PGOLD',
    name: 'Pio Gold Token',
    address: '0x4444444444444444444444444444444444444444',
    decimals: 18,
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=pgold&backgroundColor=B8860B',
    price: 156.78,
    priceChange: -1.23
  },
  {
    id: 'peth',
    symbol: 'PETH',
    name: 'Pio Ethereum',
    address: '0x5555555555555555555555555555555555555555',
    decimals: 18,
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=peth&backgroundColor=627EEA',
    price: 2320.50,
    priceChange: 0.58
  },
  {
    id: 'pbtc',
    symbol: 'PBTC',
    name: 'Pio Bitcoin',
    address: '0x6666666666666666666666666666666666666666',
    decimals: 8,
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=pbtc&backgroundColor=F7931A',
    price: 67234.00,
    priceChange: 1.85
  },
  {
    id: 'pdai',
    symbol: 'PDAI',
    name: 'Pio DAI',
    address: '0x7777777777777777777777777777777777777777',
    decimals: 18,
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=pdai&backgroundColor=F4B731',
    price: 1.00,
    priceChange: 0.06
  }
];

export const POOLS = [
  {
    id: 'pool1',
    token0: TOKENS[0], // PIO
    token1: TOKENS[2], // USDT
    fee: 0.3,
    tvl: 2456789.45,
    volume24h: 345678.90,
    apr: 24.5,
    userLiquidity: 0
  },
  {
    id: 'pool2',
    token0: TOKENS[0], // PIO
    token1: TOKENS[3], // USDC
    fee: 0.3,
    tvl: 1876543.21,
    volume24h: 234567.80,
    apr: 18.7,
    userLiquidity: 0
  },
  {
    id: 'pool3',
    token0: TOKENS[5], // PETH
    token1: TOKENS[2], // USDT
    fee: 0.3,
    tvl: 5678901.23,
    volume24h: 567890.12,
    apr: 32.1,
    userLiquidity: 0
  },
  {
    id: 'pool4',
    token0: TOKENS[6], // PBTC
    token1: TOKENS[2], // USDT
    fee: 0.05,
    tvl: 8765432.10,
    volume24h: 876543.21,
    apr: 15.8,
    userLiquidity: 0
  },
  {
    id: 'pool5',
    token0: TOKENS[4], // PGOLD
    token1: TOKENS[0], // PIO
    fee: 1.0,
    tvl: 987654.32,
    volume24h: 98765.43,
    apr: 45.2,
    userLiquidity: 0
  }
];

export const USER_POSITIONS = [
  {
    id: 'pos1',
    pool: POOLS[0],
    liquidity: 5000,
    token0Amount: 2500,
    token1Amount: 2500,
    unclaimedFees: 45.67,
    inRange: true,
    minPrice: 2.20,
    maxPrice: 2.80
  }
];

export const RECENT_TRANSACTIONS = [
  {
    id: 'tx1',
    type: 'swap',
    token0: TOKENS[0],
    token1: TOKENS[2],
    amount0: 100,
    amount1: 245,
    timestamp: Date.now() - 300000,
    hash: '0xabc...123'
  },
  {
    id: 'tx2',
    type: 'add',
    token0: TOKENS[0],
    token1: TOKENS[3],
    amount0: 500,
    amount1: 500,
    timestamp: Date.now() - 600000,
    hash: '0xdef...456'
  },
  {
    id: 'tx3',
    type: 'remove',
    token0: TOKENS[5],
    token1: TOKENS[2],
    amount0: 0.5,
    amount1: 1160.25,
    timestamp: Date.now() - 900000,
    hash: '0xghi...789'
  }
];

export const PROTOCOL_STATS = {
  totalVolume: '4.8T',
  tvl: '2.7B',
  totalSwappers: '120.5M',
  volume24h: '4.1B'
};

export const FEE_TIERS = [
  { value: 0.01, label: '0.01%', description: 'Best for very stable pairs' },
  { value: 0.05, label: '0.05%', description: 'Best for stable pairs' },
  { value: 0.3, label: '0.3%', description: 'Best for most pairs' },
  { value: 1.0, label: '1%', description: 'Best for exotic pairs' }
];

// Helper functions
export const formatCurrency = (value, decimals = 2) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(decimals)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`;
  return `$${value.toFixed(decimals)}`;
};

export const formatNumber = (value, decimals = 4) => {
  return parseFloat(value).toFixed(decimals);
};

export const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
