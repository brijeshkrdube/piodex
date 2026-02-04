import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (web3Service.isMetaMaskInstalled() && window.ethereum.selectedAddress) {
        try {
          await connectWallet();
        } catch (err) {
          console.log('Auto-connect failed:', err);
        }
      }
    };
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, []);

  // Load token balances
  const loadBalances = useCallback(async (walletAddress) => {
    if (!walletAddress) return;

    try {
      // Get native PIO balance
      const nativeBalance = await web3Service.getNativeBalance(walletAddress);
      
      // Mock balances for demo tokens (in production, fetch from blockchain)
      const mockBalances = {
        'pio': parseFloat(nativeBalance),
        'wpio': parseFloat(nativeBalance) * 0.4,
        'usdt': 5000.00,
        'usdc': 3500.00,
        'pgold': 10.5,
        'peth': 2.35,
        'pbtc': 0.15,
        'pdai': 1000.00
      };
      
      setBalances(mockBalances);
    } catch (err) {
      console.error('Error loading balances:', err);
      // Fallback to mock balances
      setBalances({
        'pio': 1250.45,
        'wpio': 500.00,
        'usdt': 5000.00,
        'usdc': 3500.00,
        'pgold': 10.5,
        'peth': 2.35,
        'pbtc': 0.15,
        'pdai': 1000.00
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
