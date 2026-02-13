# PioSwap - Uniswap Clone for PIOGOLD Mainnet

## Project Overview
A decentralized exchange (DEX) clone of Uniswap, built for the PIOGOLD blockchain network with **REAL BLOCKCHAIN INTEGRATION**.

## Target Network
- **Network Name:** PIOGOLD Mainnet
- **RPC URL:** https://datasheed.pioscan.com
- **Chain ID:** 42357
- **Symbol:** PIO
- **Block Explorer:** https://pioscan.com

## Deployed Smart Contracts
| Contract | Address |
|----------|---------|
| **WPIO (Wrapped PIO)** | `0x9Da12b8CF8B94f2E0eedD9841E268631aF03aDb1` |
| **Factory** | `0x3EE7ad0FD1C17A4d62a1a214d88dcf2C04ae43E5` |
| **Router** | `0xE2E593258a0012Af79221C518Fa058eB4fF3700A` |
| **USDT** | `0x75C681D7d00b6cDa3778535Bba87E433cA369C96` |

---

## Business Rules

### Liquidity Management
- **Only the pool creator** can add or remove liquidity from a pool
- When liquidity is removed, tokens are transferred back to the creator's wallet
- Pool creation only initializes the trading pair - no liquidity is added at creation time
- Users must use "Add Liquidity" separately after creating a pool

### Pool Creation
- Requires wallet connection
- Checks if pair already exists on-chain before creating
- Stores creator's wallet address for permission checks
- Duplicate pairs cannot be created

### Token Discovery (NEW - Feb 13, 2026)
- Users can paste any ERC-20 contract address to discover new tokens
- Valid tokens are automatically saved to the database for persistence
- Tokens show "Pool exists" badge if they have a liquidity pool
- Error handling with 10-second timeout for blockchain RPC calls
- Toast notifications for success/failure

### Chart & Trade History
- **Real data when available**: Shows "Live" badge and actual trade history
- **Simulated fallback**: Shows "Simulated" badge when no real trades exist
- All trades are recorded in MongoDB with transaction hashes
- Trade history links to PioScan block explorer

---

## Core Requirements

### P0 - Must Have (MVP) ✅
- [x] Token swapping interface with real blockchain swaps
- [x] Liquidity pools display
- [x] Create new pools (on-chain via Factory)
- [x] Add/Remove liquidity (creator-only restriction)
- [x] Real token balance display from blockchain
- [x] Connect Wallet UI with network switching
- [x] Real trade history (when trades are made)
- [x] Real price chart (when trades are made)
- [x] Token discovery via contract address (Feb 13, 2026)

### P1 - Implemented ✅
- [x] Filter Explore page to only show tokens with active pools
- [x] Token approval flow for swaps
- [x] Transaction hash display with explorer links
- [x] Creator-only liquidity management
- [x] Simulated chart with fallback when no real trades
- [x] Pool registration endpoint for syncing on-chain pools

### P2 - Pending
- [ ] Remove Liquidity UI page (backend exists)
- [ ] Add more tokens as they are deployed (USDC, etc.)
- [ ] Comprehensive frontend testing suite

---

## API Endpoints

### Tokens
- `GET /api/tokens` - List all tokens
- `GET /api/tokens/{address}` - Get token by address
- `POST /api/tokens` - Create/save new token (for discovery)

### Swap
- `POST /api/swap/quote` - Get swap quote
- `POST /api/swap/execute` - Execute swap and record transaction
- `GET /api/swap/trades/{token0}/{token1}` - Get real trade history
- `GET /api/swap/price-history/{token0}/{token1}` - Get price history for charts

### Pools
- `GET /api/pools` - List all pools
- `POST /api/pools` - Create pool with creator_address
- `POST /api/pools/register` - Register existing on-chain pool
- `POST /api/pools/add-liquidity` - Add liquidity (creator only)
- `POST /api/pools/remove-liquidity` - Remove liquidity (creator only)

---

## Token Addresses

| Token | Address | Status |
|-------|---------|--------|
| PIO (Native) | `0x0000...0000` | Active |
| WPIO | `0x9Da12b8CF8B94f2E0eedD9841E268631aF03aDb1` | Active |
| USDT | `0x75C681D7d00b6cDa3778535Bba87E433cA369C96` | Active |
| TESTPIO | `0x912002b2e258dd68d97fb559efc5a102112361e9` | Discovered (Feb 13) |

---

## Testing Status (Feb 13, 2026)
- ✅ Backend: Token creation endpoint fixed (duplicate address parameter bug)
- ✅ Frontend: Token discovery with contract address working
- ✅ Error handling: Shows clear error messages for invalid addresses
- ✅ Toast notifications: Working for success/failure cases
- ✅ Pool existence indicator: Shows "Pool exists" badge when applicable

---

## URLs
- **Frontend:** https://piogold-dex-preview.preview.emergentagent.com
- **API:** https://piogold-dex-preview.preview.emergentagent.com/api
- **Block Explorer:** https://pioscan.com
- **Production:** https://pioswap.ai (user's server)

---

## Files Modified (Feb 13, 2026)
- `/app/frontend/src/components/TokenSelector.js` - Added token persistence and toast notifications
- `/app/backend/routes/tokens.py` - Fixed duplicate address parameter bug in create_token
