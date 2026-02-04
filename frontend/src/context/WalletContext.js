import React, { createContext, useContext, useState, useCallback } from 'react';
import { TOKENS, NETWORK_CONFIG } from '../data/mock';

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

  // Mock balances for demo
  const mockBalances = {
    'pio': 1250.45,
    'wpio': 500.00,
    'usdt': 5000.00,
    'usdc': 3500.00,
    'pgold': 10.5,
    'peth': 2.35,
    'pbtc': 0.15,
    'pdai': 1000.00
  };

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock wallet connection
    const mockAddress = '0x' + Array(40).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    setAddress(mockAddress);
    setIsConnected(true);
    setBalances(mockBalances);
    setChainId(NETWORK_CONFIG.chainId);
    setIsConnecting(false);
    
    return mockAddress;
  }, []);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setBalances({});
    setChainId(null);
  }, []);

  const getBalance = useCallback((tokenId) => {
    return balances[tokenId] || 0;
  }, [balances]);

  const switchNetwork = useCallback(async () => {
    // Mock network switch
    await new Promise(resolve => setTimeout(resolve, 500));
    setChainId(NETWORK_CONFIG.chainId);
    return true;
  }, []);

  const value = {
    isConnected,
    address,
    balances,
    isConnecting,
    chainId,
    connectWallet,
    disconnectWallet,
    getBalance,
    switchNetwork,
    networkConfig: NETWORK_CONFIG
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
