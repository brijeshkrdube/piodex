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

// Simple AMM Router ABI (Uniswap V2 style)
export const ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];

// Factory ABI for pool creation
export const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)'
];

// LP Token ABI
export const LP_TOKEN_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)'
];

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
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

  // Check allowance
  async checkAllowance(tokenAddress, spenderAddress, ownerAddress) {
    const provider = this.getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const allowance = await contract.allowance(ownerAddress || this.address, spenderAddress);
    const decimals = await contract.decimals();
    return ethers.utils.formatUnits(allowance, decimals);
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
}

export const web3Service = new Web3Service();
export default web3Service;
