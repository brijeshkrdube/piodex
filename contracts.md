# PioSwap DEX - API Contracts

## Network Configuration
- **Network Name**: PIOGOLD Mainnet
- **RPC**: https://datasheed.pioscan.com
- **Chain ID**: 42357
- **Symbol**: PIO
- **Explorer**: https://pioscan.com

## API Endpoints

### 1. Tokens API

#### GET /api/tokens
Get all supported tokens on the platform.
```json
Response: {
  "tokens": [
    {
      "id": "string",
      "symbol": "string",
      "name": "string",
      "address": "string",
      "decimals": 18,
      "logo": "string",
      "price": 0.0,
      "priceChange24h": 0.0,
      "isNative": false
    }
  ]
}
```

#### GET /api/tokens/{address}
Get token details by address.

#### POST /api/tokens
Add a new custom token (for user-added tokens).
```json
Request: {
  "address": "string",
  "symbol": "string",
  "name": "string",
  "decimals": 18,
  "logo": "string (optional)"
}
```

### 2. Pools API

#### GET /api/pools
Get all liquidity pools.
```json
Response: {
  "pools": [
    {
      "id": "string",
      "token0": { /* Token object */ },
      "token1": { /* Token object */ },
      "fee": 0.3,
      "tvl": 0.0,
      "volume24h": 0.0,
      "apr": 0.0,
      "token0Reserve": 0.0,
      "token1Reserve": 0.0
    }
  ]
}
```

#### GET /api/pools/{pool_id}
Get pool details by ID.

#### POST /api/pools
Create a new liquidity pool.
```json
Request: {
  "token0_address": "string",
  "token1_address": "string",
  "fee_tier": 0.3
}
```

### 3. Liquidity API

#### GET /api/positions/{wallet_address}
Get user's liquidity positions.
```json
Response: {
  "positions": [
    {
      "id": "string",
      "pool_id": "string",
      "wallet_address": "string",
      "liquidity": 0.0,
      "token0_amount": 0.0,
      "token1_amount": 0.0,
      "unclaimed_fees": 0.0,
      "min_price": 0.0,
      "max_price": 0.0,
      "in_range": true
    }
  ]
}
```

#### POST /api/positions/add
Add liquidity to a pool.
```json
Request: {
  "pool_id": "string",
  "wallet_address": "string",
  "token0_amount": 0.0,
  "token1_amount": 0.0,
  "min_price": 0.0,
  "max_price": 0.0
}
```

#### POST /api/positions/remove
Remove liquidity from a pool.
```json
Request: {
  "position_id": "string",
  "wallet_address": "string",
  "percent": 100
}
```

### 4. Swap API

#### POST /api/swap/quote
Get a swap quote.
```json
Request: {
  "token_in": "string (address)",
  "token_out": "string (address)",
  "amount_in": 0.0
}
Response: {
  "amount_out": 0.0,
  "price_impact": 0.0,
  "route": ["pool_id1", "pool_id2"],
  "exchange_rate": 0.0,
  "minimum_received": 0.0,
  "fee": 0.0
}
```

#### POST /api/swap/execute
Execute a swap (stores transaction record).
```json
Request: {
  "wallet_address": "string",
  "token_in": "string",
  "token_out": "string",
  "amount_in": 0.0,
  "amount_out": 0.0,
  "slippage": 0.5,
  "tx_hash": "string"
}
```

### 5. Transactions API

#### GET /api/transactions/{wallet_address}
Get user's transaction history.
```json
Response: {
  "transactions": [
    {
      "id": "string",
      "type": "swap | add | remove",
      "wallet_address": "string",
      "token0": { /* Token object */ },
      "token1": { /* Token object */ },
      "amount0": 0.0,
      "amount1": 0.0,
      "tx_hash": "string",
      "timestamp": "datetime",
      "status": "pending | confirmed | failed"
    }
  ]
}
```

### 6. Stats API

#### GET /api/stats
Get protocol statistics.
```json
Response: {
  "total_volume": 0.0,
  "tvl": 0.0,
  "total_swappers": 0,
  "volume_24h": 0.0,
  "transactions_24h": 0,
  "active_pools": 0
}
```

## Mock Data to Replace

From `/app/frontend/src/data/mock.js`:
- `TOKENS` - Replace with `/api/tokens` response
- `POOLS` - Replace with `/api/pools` response
- `USER_POSITIONS` - Replace with `/api/positions/{wallet}` response
- `RECENT_TRANSACTIONS` - Replace with `/api/transactions/{wallet}` response
- `PROTOCOL_STATS` - Replace with `/api/stats` response

## Frontend Integration Points

1. **WalletContext.js**: Keep mock wallet connection (real wallet integration requires Web3 provider)
2. **SwapPage.js**: Call `/api/swap/quote` for exchange rates
3. **PoolsPage.js**: Fetch pools from `/api/pools`
4. **AddLiquidityPage.js**: Use `/api/positions/add` and `/api/positions/remove`
5. **ExplorePage.js**: Fetch tokens from `/api/tokens`, pools from `/api/pools`
6. **HomePage.js**: Fetch stats from `/api/stats`

## Database Collections

1. `tokens` - Token registry
2. `pools` - Liquidity pools
3. `positions` - User liquidity positions
4. `transactions` - Transaction history
5. `stats` - Protocol statistics (cached)
