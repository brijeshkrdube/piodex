import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token APIs
export const getTokens = async () => {
  const response = await apiClient.get('/tokens');
  return response.data.map(token => ({
    ...token,
    priceChange: token.price_change_24h,
    isNative: token.is_native
  }));
};

export const getToken = async (address) => {
  const response = await apiClient.get(`/tokens/${address}`);
  return {
    ...response.data,
    priceChange: response.data.price_change_24h,
    isNative: response.data.is_native
  };
};

// Pool APIs
export const getPools = async () => {
  const response = await apiClient.get('/pools');
  return response.data.map(pool => ({
    ...pool,
    token0: {
      ...pool.token0,
      priceChange: pool.token0.price_change_24h,
      isNative: pool.token0.is_native
    },
    token1: {
      ...pool.token1,
      priceChange: pool.token1.price_change_24h,
      isNative: pool.token1.is_native
    },
    volume24h: pool.volume_24h,
    token0Reserve: pool.token0_reserve,
    token1Reserve: pool.token1_reserve
  }));
};

export const getPool = async (poolId) => {
  const response = await apiClient.get(`/pools/${poolId}`);
  const pool = response.data;
  return {
    ...pool,
    token0: {
      ...pool.token0,
      priceChange: pool.token0.price_change_24h,
      isNative: pool.token0.is_native
    },
    token1: {
      ...pool.token1,
      priceChange: pool.token1.price_change_24h,
      isNative: pool.token1.is_native
    },
    volume24h: pool.volume_24h,
    token0Reserve: pool.token0_reserve,
    token1Reserve: pool.token1_reserve
  };
};

export const createPool = async (token0Address, token1Address, fee) => {
  const response = await apiClient.post('/pools', {
    token0_address: token0Address,
    token1_address: token1Address,
    fee
  });
  return response.data;
};

// Position APIs
export const getPositions = async (walletAddress) => {
  const response = await apiClient.get(`/positions/${walletAddress}`);
  return response.data.map(pos => ({
    ...pos,
    poolId: pos.pool_id,
    walletAddress: pos.wallet_address,
    token0Amount: pos.token0_amount,
    token1Amount: pos.token1_amount,
    minPrice: pos.min_price,
    maxPrice: pos.max_price,
    unclaimedFees: pos.unclaimed_fees,
    inRange: pos.in_range
  }));
};

export const addLiquidity = async (poolId, walletAddress, token0Amount, token1Amount, minPrice, maxPrice) => {
  const response = await apiClient.post('/positions/add', {
    pool_id: poolId,
    wallet_address: walletAddress,
    token0_amount: token0Amount,
    token1_amount: token1Amount,
    min_price: minPrice,
    max_price: maxPrice
  });
  return response.data;
};

export const removeLiquidity = async (positionId, walletAddress, percent) => {
  const response = await apiClient.post('/positions/remove', {
    position_id: positionId,
    wallet_address: walletAddress,
    percent
  });
  return response.data;
};

// Swap APIs
export const getSwapQuote = async (tokenIn, tokenOut, amountIn) => {
  const response = await apiClient.post('/swap/quote', {
    token_in: tokenIn,
    token_out: tokenOut,
    amount_in: amountIn
  });
  return {
    amountOut: response.data.amount_out,
    priceImpact: response.data.price_impact,
    route: response.data.route,
    exchangeRate: response.data.exchange_rate,
    minimumReceived: response.data.minimum_received,
    fee: response.data.fee
  };
};

export const executeSwap = async (walletAddress, tokenIn, tokenOut, amountIn, amountOut, slippage, txHash) => {
  const response = await apiClient.post('/swap/execute', {
    wallet_address: walletAddress,
    token_in: tokenIn,
    token_out: tokenOut,
    amount_in: amountIn,
    amount_out: amountOut,
    slippage,
    tx_hash: txHash
  });
  return response.data;
};

// Transaction APIs
export const getTransactions = async (walletAddress) => {
  const response = await apiClient.get(`/transactions/${walletAddress}`);
  return response.data.map(tx => ({
    ...tx,
    token0: {
      ...tx.token0,
      priceChange: tx.token0.price_change_24h,
      isNative: tx.token0.is_native
    },
    token1: {
      ...tx.token1,
      priceChange: tx.token1.price_change_24h,
      isNative: tx.token1.is_native
    },
    walletAddress: tx.wallet_address,
    txHash: tx.tx_hash
  }));
};

// Stats APIs
export const getStats = async () => {
  const response = await apiClient.get('/stats');
  return {
    totalVolume: response.data.total_volume,
    tvl: response.data.tvl,
    totalSwappers: response.data.total_swappers,
    volume24h: response.data.volume_24h,
    transactions24h: response.data.transactions_24h,
    activePools: response.data.active_pools
  };
};

export default apiClient;
