import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { web3Service, PIOGOLD_NETWORK } from '../services/web3';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [balances, setBalances] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [error, setError] = useState(null);
  
  // Track if auto-connect has run
  const hasAutoConnected = useRef(false);

  // Load REAL token balances from blockchain
  const loadBalances = useCallback(async (walletAddress) => {
    if (!walletAddress) return;

    try {
      // Get native PIO balance
      const nativeBalance = await web3Service.getNativeBalance(walletAddress);
      
      // Fetch real balances from blockchain for each token
      const realBalances = {
        'pio': parseFloat(nativeBalance)
      };
      
      // Token addresses on PIOGOLD
      const tokenAddresses = {
        'wpio': '0x9Da12b8CF8B94f2E0eedD9841E268631aF03aDb1',
        'usdt': '0x75C681D7d00b6cDa3778535Bba87E433cA369C96'
      };
      
      // Fetch real balances for each token
      for (const [tokenId, tokenAddress] of Object.entries(tokenAddresses)) {
        try {
          const balance = await web3Service.getTokenBalance(tokenAddress, walletAddress);
          realBalances[tokenId] = parseFloat(balance) || 0;
        } catch (err) {
          console.error(`Error fetching ${tokenId} balance:`, err);
          realBalances[tokenId] = 0;
        }
      }
      
      setBalances(realBalances);
    } catch (err) {
      console.error('Error loading balances:', err);
      // Set zero balances on error - don't use fake values
      setBalances({
        'pio': 0,
        'wpio': 0,
        'usdt': 0
      });
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const result = await web3Service.connectWallet();
      setAddress(result.address);
      setChainId(result.chainId);
      setIsConnected(true);
      setIsCorrectNetwork(result.chainId === PIOGOLD_NETWORK.chainId);
      
      await loadBalances(result.address);
      
      return result.address;
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [loadBalances]);

  const disconnectWallet = useCallback(() => {
    web3Service.disconnect();
    setIsConnected(false);
    setAddress(null);
    setBalances({});
    setChainId(null);
    setIsCorrectNetwork(false);
  }, []);

  const getBalance = useCallback((tokenId) => {
    return balances[tokenId] || 0;
  }, [balances]);

  const switchNetwork = useCallback(async () => {
    try {
      await web3Service.switchNetwork();
      setIsCorrectNetwork(true);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (hasAutoConnected.current) return;
      hasAutoConnected.current = true;
      
      if (web3Service.isMetaMaskInstalled() && window.ethereum?.selectedAddress) {
        try {
          await connectWallet();
        } catch (err) {
          console.log('Auto-connect failed:', err);
        }
      }
    };
    checkConnection();
  }, [connectWallet]);

  // Listen for wallet events
  useEffect(() => {
    const handleAccountChanged = (e) => {
      setAddress(e.detail.address);
      loadBalances(e.detail.address);
    };

    const handleChainChanged = (e) => {
      setChainId(e.detail.chainId);
      setIsCorrectNetwork(e.detail.chainId === PIOGOLD_NETWORK.chainId);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setAddress(null);
      setBalances({});
      setChainId(null);
    };

    window.addEventListener('walletAccountChanged', handleAccountChanged);
    window.addEventListener('walletChainChanged', handleChainChanged);
    window.addEventListener('walletDisconnected', handleDisconnected);

    return () => {
      window.removeEventListener('walletAccountChanged', handleAccountChanged);
      window.removeEventListener('walletChainChanged', handleChainChanged);
      window.removeEventListener('walletDisconnected', handleDisconnected);
    };
  }, [loadBalances]);

  const value = {
    isConnected,
    address,
    balances,
    isConnecting,
    chainId,
    isCorrectNetwork,
    error,
    connectWallet,
    disconnectWallet,
    getBalance,
    switchNetwork,
    loadBalances,
    networkConfig: PIOGOLD_NETWORK,
    web3Service
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
