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

---

## Core Requirements

### P0 - Must Have (MVP) ✅
- [x] Token swapping interface with real blockchain swaps
- [x] Liquidity pools display
- [x] Create new pools (on-chain via Factory)
- [x] Add/Remove liquidity (creator-only restriction)
- [x] Real token balance display from blockchain
- [x] Connect Wallet UI with network switching

### P1 - Implemented ✅
- [x] Filter Explore page to only show tokens with active pools
- [x] Token approval flow for swaps
- [x] Transaction hash display with explorer links
- [x] Creator-only liquidity management

### P2 - Pending
- [ ] Add more tokens as they are deployed (USDC, etc.)

---

## What's Implemented

### Blockchain Integration
- **Swap functionality** - Real on-chain swaps via Router contract
- **Pool creation** - Creates pools on-chain via Factory contract
- **Add Liquidity** - Creator-only, on-chain via Router
- **Remove Liquidity** - Creator-only, tokens transferred to wallet
- **Real Balances** - Fetches actual token balances from blockchain (no mocked values)
- **Token approvals** - Handles ERC20 approvals before transactions

### Backend APIs
- `POST /api/pools` - Create pool with creator_address tracking
- `POST /api/pools/add-liquidity` - Creator-only add liquidity
- `POST /api/pools/remove-liquidity` - Creator-only remove liquidity
- Pool responses include `creator_address` and `pair_address`

---

## Token Addresses

| Token | Address | Status |
|-------|---------|--------|
| PIO (Native) | `0x0000...0000` | Active |
| WPIO | `0x9Da12b8CF8B94f2E0eedD9841E268631aF03aDb1` | Active |
| USDT | `0x75C681D7d00b6cDa3778535Bba87E433cA369C96` | Active |

---

## URLs
- **Frontend:** https://pionetswap.preview.emergentagent.com
- **API:** https://pionetswap.preview.emergentagent.com/api
- **Block Explorer:** https://pioscan.com
