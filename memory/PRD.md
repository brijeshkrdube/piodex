# PioSwap - Uniswap Clone for PIOGOLD Mainnet

## Project Overview
A decentralized exchange (DEX) clone of Uniswap, built for the PIOGOLD blockchain network.

## Target Network
- **Network Name:** PIOGOLD Mainnet
- **RPC URL:** https://datasheed.pioscan.com
- **Chain ID:** 42357
- **Symbol:** PIO
- **Block Explorer:** https://pioscan.com

---

## Core Requirements

### P0 - Must Have (MVP)
- [x] Token swapping interface
- [x] Liquidity pools display
- [x] Create new pools
- [x] Explore page with token listings
- [x] Trade chart with historical data
- [x] Token selector with contract address paste support
- [x] Connect Wallet UI

### P1 - Important
- [x] Filter Explore page to only show tokens with active pools
- [x] Automated frontend testing
- [ ] Real blockchain integration (requires smart contracts)
- [ ] Remove liquidity functionality

### P2 - Nice to Have
- [ ] Deploy smart contracts to PIOGOLD
- [ ] Transaction history
- [ ] User portfolio view
- [ ] Price alerts

---

## What's Implemented

### Frontend (React)
- **Home Page:** Hero section, stats, token ticker, call-to-action buttons
- **Swap Page:** Token selection, amount input, trade chart (lightweight-charts), recent trades
- **Pools Page:** Pool list with TVL/Volume/APR, Create Pool modal, search, tabs
- **Explore Page:** Token list (filtered by active pools), pools tab, trending section
- **Components:** TokenSelector, TradeChart, Layout with navigation

### Backend (FastAPI + MongoDB)
- **Tokens API:** GET /api/tokens, GET /api/tokens/:address
- **Pools API:** GET /api/pools, POST /api/pools (with initial liquidity)
- **Stats API:** GET /api/stats
- **Swap API:** POST /api/swap/quote, POST /api/swap/execute
- **Positions API:** GET/POST positions management

### Wallet Integration
- WalletContext for state management
- ethers.js integration scaffolding
- Connect Wallet modal with 3 wallet options

---

## Architecture

```
/app
├── backend/
│   ├── server.py         # FastAPI main app
│   ├── database.py       # MongoDB connection
│   ├── models.py         # Pydantic models
│   ├── seed_data.py      # Initial mock data
│   └── routes/
│       ├── pools.py      # Pool CRUD
│       ├── swap.py       # Swap quotes
│       ├── stats.py      # Platform stats
│       └── positions.py  # Liquidity positions
└── frontend/
    └── src/
        ├── pages/        # Page components
        ├── components/   # Reusable components
        ├── context/      # WalletContext
        └── services/     # API & web3 services
```

---

## Current Limitations

⚠️ **SIMULATION MODE:** The entire application runs on simulated data. No actual blockchain transactions occur.

To enable real trading:
1. Deploy Uniswap V2-style smart contracts (Factory, Router, Pair)
2. Deploy WPIO (Wrapped PIO) contract
3. Update frontend to call contract methods
4. See `/app/SMART_CONTRACTS.md` for detailed requirements

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
1. Implement "Remove Liquidity" functionality
2. Real blockchain integration (pending smart contract deployment)
3. Transaction history page
4. User portfolio tracking

### Smart Contracts Needed
See `/app/SMART_CONTRACTS.md` for detailed documentation on:
- Factory Contract
- Router Contract  
- Pair/Pool Contract
- WPIO Contract

---

## URLs
- **Frontend:** https://pionetswap.preview.emergentagent.com
- **API:** https://pionetswap.preview.emergentagent.com/api
