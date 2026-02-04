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

## Core Requirements

### P0 - Must Have (MVP) ✅
- [x] Token swapping interface with real blockchain swaps
- [x] Liquidity pools display
- [x] Create new pools (on-chain via Factory)
- [x] Explore page with token listings (filtered by active pools)
- [x] Trade chart with historical data
- [x] Token selector with contract address paste support
- [x] Connect Wallet UI with network switching
- [x] Real blockchain integration

### P1 - Implemented
- [x] Filter Explore page to only show tokens with active pools
- [x] Automated frontend testing (100% pass rate)
- [x] Token approval flow for swaps
- [x] Transaction hash display with explorer links

### P2 - Pending
- [ ] Remove liquidity functionality (UI exists, needs testing)
- [ ] Add more tokens as they are deployed

---

## What's Implemented

### Blockchain Integration (Dec 4, 2025)
- **Swap functionality** - Real on-chain swaps via Router contract
- **Pool creation** - Creates pools on-chain via Factory contract
- **Token approval** - Handles ERC20 approvals before swaps
- **Wallet connection** - MetaMask integration with PIOGOLD network
- **Transaction tracking** - Shows tx hash with explorer links

### Frontend (React)
- **Home Page:** Hero section, stats, token ticker, call-to-action buttons
- **Swap Page:** Token selection, amount input, trade chart, real blockchain swaps
- **Pools Page:** Pool list with TVL/Volume/APR, Create Pool modal with on-chain execution
- **Explore Page:** Token list (filtered by active pools), pools tab, trending section
- **Components:** TokenSelector, TradeChart, Layout with navigation

### Backend (FastAPI + MongoDB)
- **Tokens API:** GET /api/tokens (with real contract addresses)
- **Pools API:** GET /api/pools, POST /api/pools
- **Stats API:** GET /api/stats
- **Swap API:** POST /api/swap/quote, POST /api/swap/execute

---

## Token Addresses

| Token | Address | Status |
|-------|---------|--------|
| PIO (Native) | `0x0000...0000` | Active |
| WPIO | `0x9Da12b8CF8B94f2E0eedD9841E268631aF03aDb1` | Active |
| USDT | `0x75C681D7d00b6cDa3778535Bba87E433cA369C96` | Active |

*More tokens can be added as they are deployed on PIOGOLD*

---

## Architecture

```
/app
├── backend/
│   ├── server.py         # FastAPI main app
│   ├── database.py       # MongoDB connection
│   ├── models.py         # Pydantic models
│   ├── seed_data.py      # Initial data with real addresses
│   └── routes/           # API endpoints
└── frontend/
    └── src/
        ├── pages/        # Page components
        ├── components/   # Reusable components
        ├── context/      # WalletContext
        └── services/
            ├── api.js    # Backend API service
            └── web3.js   # Blockchain integration (contracts, ABIs)
```

---

## Testing Status

### Frontend Testing (Dec 4, 2025)
- ✅ Home page - PASS
- ✅ Swap page with trade chart - PASS  
- ✅ Pools page with Create Pool - PASS
- ✅ Explore page with token filtering - PASS
- ✅ Navigation between pages - PASS
- ✅ Connect Wallet modal - PASS

**Success Rate: 100%**

---

## Backlog

### Next Steps
1. Test real swap transactions with connected wallet
2. Add more tokens as they are deployed (USDC, etc.)
3. Implement Remove Liquidity UI testing

### Future Enhancements
- Transaction history page
- User portfolio tracking
- Price alerts
- Multi-hop swaps (A→B→C)

---

## URLs
- **Frontend:** https://pionetswap.preview.emergentagent.com
- **API:** https://pionetswap.preview.emergentagent.com/api
- **Block Explorer:** https://pioscan.com
