# Smart Contracts Required for PioSwap DEX

This document explains what smart contracts need to be deployed on the **PIOGOLD Mainnet** to enable real blockchain functionality for PioSwap.

---

## Overview

To create a fully functional DEX like Uniswap, you need **three main smart contracts**:

1. **Factory Contract** - Creates new trading pools
2. **Router Contract** - Handles swaps and liquidity operations
3. **Pair (Pool) Contract** - Each trading pair has its own contract

---

## 1. Factory Contract

### Purpose
The Factory contract is the "parent" contract that creates new trading pairs (pools).

### Key Functions
```solidity
// Creates a new trading pair for two tokens
function createPair(address tokenA, address tokenB) external returns (address pair);

// Get the address of an existing pair
function getPair(address tokenA, address tokenB) external view returns (address pair);

// Get all pairs created
function allPairs(uint) external view returns (address pair);
function allPairsLength() external view returns (uint);
```

### What it stores
- Mapping of token pairs to their pool addresses
- Fee recipient address (for protocol fees)
- List of all created pairs

---

## 2. Router Contract

### Purpose
The Router is the main contract users interact with. It handles:
- Token swaps
- Adding liquidity
- Removing liquidity

### Key Functions
```solidity
// Swap tokens
function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external returns (uint[] memory amounts);

// Add liquidity to a pool
function addLiquidity(
    address tokenA,
    address tokenB,
    uint amountADesired,
    uint amountBDesired,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
) external returns (uint amountA, uint amountB, uint liquidity);

// Remove liquidity from a pool
function removeLiquidity(
    address tokenA,
    address tokenB,
    uint liquidity,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
) external returns (uint amountA, uint amountB);
```

### Dependencies
- Needs the Factory contract address
- Needs WPIO (Wrapped PIO) address for native token swaps

---

## 3. Pair (Pool) Contract

### Purpose
Each trading pair has its own Pair contract that:
- Holds the token reserves
- Mints LP (Liquidity Provider) tokens
- Executes swaps
- Tracks prices

### Key Functions
```solidity
// Get current reserves
function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

// Swap tokens (called by Router)
function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;

// Add liquidity (called by Router)
function mint(address to) external returns (uint liquidity);

// Remove liquidity (called by Router)
function burn(address to) external returns (uint amount0, uint amount1);
```

### What it stores
- Token0 and Token1 addresses
- Reserve amounts for both tokens
- Total LP token supply
- Price accumulators (for TWAP oracle)

---

## Additional Contracts Needed

### 4. WPIO (Wrapped PIO) Contract
To trade the native PIO token, you need a wrapped version (ERC20):
```solidity
function deposit() external payable;  // Wrap PIO to WPIO
function withdraw(uint) external;      // Unwrap WPIO to PIO
```

### 5. ERC20 Tokens
Each tradeable token needs to be an ERC20 contract with:
- `transfer`, `transferFrom`, `approve`
- `balanceOf`, `allowance`

---

## Deployment Order

1. **Deploy WPIO** (Wrapped PIO token)
2. **Deploy Factory** (with fee recipient address)
3. **Deploy Router** (with Factory and WPIO addresses)
4. **Create Pairs** via Factory for each token pair

---

## Network Configuration for PIOGOLD

```
Network Name: PIOGOLD Mainnet
RPC URL: https://datasheed.pioscan.com
Chain ID: 42357
Symbol: PIO
Block Explorer: https://pioscan.com
```

---

## Integration Steps

Once contracts are deployed, update PioSwap:

1. **Add contract addresses** to environment variables:
   ```
   FACTORY_ADDRESS=0x...
   ROUTER_ADDRESS=0x...
   WPIO_ADDRESS=0x...
   ```

2. **Update web3.js service** to call contract functions
3. **Implement transaction signing** for swaps and liquidity operations
4. **Add transaction status tracking** using the block explorer

---

## Security Considerations

- ✅ Use audited Uniswap V2 contracts as a base
- ✅ Test thoroughly on testnet first
- ✅ Consider adding admin functions for emergencies
- ✅ Implement proper slippage protection
- ✅ Add deadline parameters to prevent stale transactions

---

## Resources

- [Uniswap V2 Core Contracts](https://github.com/Uniswap/v2-core)
- [Uniswap V2 Periphery Contracts](https://github.com/Uniswap/v2-periphery)
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)

---

## Current State

⚠️ **PioSwap is currently running in SIMULATION MODE**

All trading, pool creation, and liquidity operations are simulated using a MongoDB database. No actual blockchain transactions occur. To enable real trading:

1. Deploy the contracts described above to PIOGOLD Mainnet
2. Update the frontend to interact with these contracts
3. Connect user wallets for transaction signing
