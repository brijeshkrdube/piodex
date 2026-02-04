import { ethers } from 'ethers';

// PIOGOLD Network Configuration
export const PIOGOLD_NETWORK = {
  chainId: 42357,
  chainIdHex: '0xa575',
  chainName: 'PIOGOLD Mainnet',
  nativeCurrency: {
    name: 'PIO',
    symbol: 'PIO',
    decimals: 18
  },
  rpcUrls: ['https://datasheed.pioscan.com'],
  blockExplorerUrls: ['https://pioscan.com']
};

// Contract Addresses on PIOGOLD Mainnet
export const CONTRACT_ADDRESSES = {
  WPIO: '0x9Da12b8CF8B94f2E0eedD9841E268631aF03aDb1',
  FACTORY: '0x3EE7ad0FD1C17A4d62a1a214d88dcf2C04ae43E5',
  ROUTER: '0xE2E593258a0012Af79221C518Fa058eB4fF3700A',
  // Token addresses
  USDT: '0x75C681D7d00b6cDa3778535Bba87E433cA369C96'
};

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Uniswap V2 Router ABI
export const ROUTER_ABI = [
  'function factory() external view returns (address)',
  'function WETH() external view returns (address)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
  'function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)',
  'function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB)'
];

// Uniswap V2 Factory ABI
export const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function allPairs(uint) external view returns (address pair)',
  'function allPairsLength() external view returns (uint)',
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
  'function feeTo() external view returns (address)',
  'function feeToSetter() external view returns (address)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)'
];

// Uniswap V2 Pair ABI
export const PAIR_ABI = [
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint)',
  'function balanceOf(address owner) external view returns (uint)',
  'function approve(address spender, uint value) external returns (bool)',
  'function transfer(address to, uint value) external returns (bool)',
  'function transferFrom(address from, address to, uint value) external returns (bool)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function price0CumulativeLast() external view returns (uint)',
  'function price1CumulativeLast() external view returns (uint)',
  'function kLast() external view returns (uint)',
  'function mint(address to) external returns (uint liquidity)',
  'function burn(address to) external returns (uint amount0, uint amount1)',
  'function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external',
  'function skim(address to) external',
  'function sync() external',
  'event Mint(address indexed sender, uint amount0, uint amount1)',
  'event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)',
  'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
  'event Sync(uint112 reserve0, uint112 reserve1)'
];

// WETH/WPIO ABI (extends ERC20)
export const WETH_ABI = [
  ...ERC20_ABI,
  'function deposit() external payable',
  'function withdraw(uint256 amount) external'
];

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
    this.contracts = {};
  }

  // Check if MetaMask is installed
  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  // Get provider (read-only if no wallet)
  getProvider() {
    if (this.provider) return this.provider;
    
    // Try to use MetaMask provider first
    if (this.isMetaMaskInstalled()) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
    } else {
      // Fallback to RPC provider for read-only operations
      this.provider = new ethers.providers.JsonRpcProvider(PIOGOLD_NETWORK.rpcUrls[0]);
    }
    return this.provider;
  }

  // Initialize contract instances
  initContracts() {
    const provider = this.getProvider();
    const signerOrProvider = this.signer || provider;

    this.contracts = {
      router: new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ROUTER_ABI, signerOrProvider),
      factory: new ethers.Contract(CONTRACT_ADDRESSES.FACTORY, FACTORY_ABI, signerOrProvider),
      wpio: new ethers.Contract(CONTRACT_ADDRESSES.WPIO, WETH_ABI, signerOrProvider)
    };
  }

  // Connect wallet
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('Please install MetaMask to connect your wallet');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      this.address = accounts[0];
      
      // Get current chain
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;
      
      // Check if on correct network
      if (this.chainId !== PIOGOLD_NETWORK.chainId) {
        await this.switchNetwork();
      }
      
      this.isConnected = true;
      
      // Initialize contracts with signer
      this.initContracts();
      
      // Setup event listeners
      this.setupEventListeners();
      
      return {
        address: this.address,
        chainId: this.chainId
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  // Switch to PIOGOLD network
  async switchNetwork() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: PIOGOLD_NETWORK.chainIdHex }]
      });
    } catch (switchError) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: PIOGOLD_NETWORK.chainIdHex,
              chainName: PIOGOLD_NETWORK.chainName,
              nativeCurrency: PIOGOLD_NETWORK.nativeCurrency,
              rpcUrls: PIOGOLD_NETWORK.rpcUrls,
              blockExplorerUrls: PIOGOLD_NETWORK.blockExplorerUrls
            }]
          });
        } catch (addError) {
          throw new Error('Failed to add PIOGOLD network');
        }
      } else {
        throw switchError;
      }
    }
    
    // Update chain ID
    const network = await this.provider.getNetwork();
    this.chainId = network.chainId;
  }

  // Setup event listeners for account/network changes
  setupEventListeners() {
    if (!this.isMetaMaskInstalled()) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.address = accounts[0];
        window.dispatchEvent(new CustomEvent('walletAccountChanged', { detail: { address: this.address } }));
      }
    });

    window.ethereum.on('chainChanged', (chainId) => {
      this.chainId = parseInt(chainId, 16);
      window.dispatchEvent(new CustomEvent('walletChainChanged', { detail: { chainId: this.chainId } }));
      // Reload to reset state
      window.location.reload();
    });
  }

  // Disconnect wallet
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
    this.contracts = {};
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  }

  // Get native token balance
  async getNativeBalance(address) {
    const provider = this.getProvider();
    const balance = await provider.getBalance(address || this.address);
    return ethers.utils.formatEther(balance);
  }

  // Get ERC20 token balance
  async getTokenBalance(tokenAddress, walletAddress) {
    const provider = this.getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(walletAddress || this.address);
    const decimals = await contract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  }

  // Get token info from contract address
  async getTokenInfo(tokenAddress) {
    try {
      const provider = this.getProvider();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);
      
      return {
        address: tokenAddress.toLowerCase(),
        name,
        symbol,
        decimals,
        totalSupply: ethers.utils.formatUnits(totalSupply, decimals)
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  }

  // Approve token spending
  async approveToken(tokenAddress, spenderAddress, amount) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
    const decimals = await contract.decimals();
    const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);
    
    const tx = await contract.approve(spenderAddress, amountWei);
    await tx.wait();
    return tx.hash;
  }

  // Approve max token spending (common pattern)
  async approveTokenMax(tokenAddress, spenderAddress) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
    const maxAmount = ethers.constants.MaxUint256;
    
    const tx = await contract.approve(spenderAddress, maxAmount);
    await tx.wait();
    return tx.hash;
  }

  // Check allowance
  async checkAllowance(tokenAddress, spenderAddress, ownerAddress) {
    const provider = this.getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const allowance = await contract.allowance(ownerAddress || this.address, spenderAddress);
    const decimals = await contract.decimals();
    return ethers.utils.formatUnits(allowance, decimals);
  }

  // ============ DEX FUNCTIONS ============

  // Get pair address from factory
  async getPairAddress(tokenA, tokenB) {
    const provider = this.getProvider();
    const factory = new ethers.Contract(CONTRACT_ADDRESSES.FACTORY, FACTORY_ABI, provider);
    const pairAddress = await factory.getPair(tokenA, tokenB);
    return pairAddress;
  }

  // Check if pair exists
  async pairExists(tokenA, tokenB) {
    const pairAddress = await this.getPairAddress(tokenA, tokenB);
    return pairAddress !== ethers.constants.AddressZero;
  }

  // Get pair reserves
  async getPairReserves(pairAddress) {
    const provider = this.getProvider();
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    
    const [reserves, token0, token1] = await Promise.all([
      pair.getReserves(),
      pair.token0(),
      pair.token1()
    ]);
    
    return {
      reserve0: reserves.reserve0,
      reserve1: reserves.reserve1,
      token0,
      token1,
      blockTimestamp: reserves.blockTimestampLast
    };
  }

  // Get swap quote (amounts out)
  async getAmountsOut(amountIn, path) {
    const provider = this.getProvider();
    const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ROUTER_ABI, provider);
    
    try {
      const amounts = await router.getAmountsOut(amountIn, path);
      return amounts;
    } catch (error) {
      console.error('Error getting amounts out:', error);
      throw error;
    }
  }

  // Execute swap (tokens for tokens)
  async swapExactTokensForTokens(amountIn, amountOutMin, path, deadline = 20) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ROUTER_ABI, this.signer);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    const tx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      this.address,
      deadlineTimestamp
    );
    
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      receipt
    };
  }

  // Execute swap (ETH/PIO for tokens)
  async swapExactETHForTokens(amountOutMin, path, value, deadline = 20) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ROUTER_ABI, this.signer);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    const tx = await router.swapExactETHForTokens(
      amountOutMin,
      path,
      this.address,
      deadlineTimestamp,
      { value }
    );
    
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      receipt
    };
  }

  // Execute swap (tokens for ETH/PIO)
  async swapExactTokensForETH(amountIn, amountOutMin, path, deadline = 20) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ROUTER_ABI, this.signer);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    const tx = await router.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      this.address,
      deadlineTimestamp
    );
    
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      receipt
    };
  }

  // Add liquidity (token-token)
  async addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, deadline = 20) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ROUTER_ABI, this.signer);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    const tx = await router.addLiquidity(
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      this.address,
      deadlineTimestamp
    );
    
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      receipt
    };
  }

  // Add liquidity (token-ETH/PIO)
  async addLiquidityETH(token, amountTokenDesired, amountTokenMin, amountETHMin, value, deadline = 20) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ROUTER_ABI, this.signer);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    const tx = await router.addLiquidityETH(
      token,
      amountTokenDesired,
      amountTokenMin,
      amountETHMin,
      this.address,
      deadlineTimestamp,
      { value }
    );
    
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      receipt
    };
  }

  // Remove liquidity (token-token)
  async removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, deadline = 20) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ROUTER_ABI, this.signer);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    const tx = await router.removeLiquidity(
      tokenA,
      tokenB,
      liquidity,
      amountAMin,
      amountBMin,
      this.address,
      deadlineTimestamp
    );
    
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      receipt
    };
  }

  // Remove liquidity (token-ETH/PIO)
  async removeLiquidityETH(token, liquidity, amountTokenMin, amountETHMin, deadline = 20) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const router = new ethers.Contract(CONTRACT_ADDRESSES.ROUTER, ROUTER_ABI, this.signer);
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
    
    const tx = await router.removeLiquidityETH(
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      this.address,
      deadlineTimestamp
    );
    
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      receipt
    };
  }

  // Wrap PIO to WPIO
  async wrapPIO(amount) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const wpio = new ethers.Contract(CONTRACT_ADDRESSES.WPIO, WETH_ABI, this.signer);
    const tx = await wpio.deposit({ value: amount });
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      receipt
    };
  }

  // Unwrap WPIO to PIO
  async unwrapPIO(amount) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const wpio = new ethers.Contract(CONTRACT_ADDRESSES.WPIO, WETH_ABI, this.signer);
    const tx = await wpio.withdraw(amount);
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      receipt
    };
  }

  // Get LP token balance
  async getLPBalance(pairAddress, walletAddress) {
    const provider = this.getProvider();
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const balance = await pair.balanceOf(walletAddress || this.address);
    return balance;
  }

  // Validate Ethereum address
  isValidAddress(address) {
    try {
      ethers.utils.getAddress(address);
      return true;
    } catch {
      return false;
    }
  }

  // Format address for display
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Parse units helper
  parseUnits(amount, decimals = 18) {
    return ethers.utils.parseUnits(amount.toString(), decimals);
  }

  // Format units helper
  formatUnits(amount, decimals = 18) {
    return ethers.utils.formatUnits(amount, decimals);
  }
}

export const web3Service = new Web3Service();
export default web3Service;
