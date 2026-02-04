import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTokens, getPools } from '../services/api';
import { web3Service } from '../services/web3';
import { useWallet } from '../context/WalletContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Search, Loader2, Plus, AlertCircle, CheckCircle } from 'lucide-react';

const TokenSelector = ({ open, onOpenChange, onSelect, selectedToken, excludeToken, tokens: propTokens }) => {
  const navigate = useNavigate();
  const { isConnected, getBalance } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState([]);
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customTokenLoading, setCustomTokenLoading] = useState(false);
  const [customTokenInfo, setCustomTokenInfo] = useState(null);
  const [customTokenError, setCustomTokenError] = useState(null);
  const [hasPoolForCustomToken, setHasPoolForCustomToken] = useState(false);

  // Load tokens and pools
  useEffect(() => {
    const loadData = async () => {
      if (!open) return;
      
      if (propTokens && propTokens.length > 0) {
        setTokens(propTokens);
      } else {
        setLoading(true);
        try {
          const [fetchedTokens, fetchedPools] = await Promise.all([
            getTokens(),
            getPools()
          ]);
          setTokens(fetchedTokens);
          setPools(fetchedPools);
        } catch (error) {
          console.error('Error loading data:', error);
        }
        setLoading(false);
      }
    };
    loadData();
  }, [open, propTokens]);

  // Check if search query is a valid contract address
  const isContractAddress = useMemo(() => {
    return web3Service.isValidAddress(searchQuery);
  }, [searchQuery]);

  // Fetch token info when contract address is entered
  const fetchCustomToken = useCallback(async (address) => {
    setCustomTokenLoading(true);
    setCustomTokenError(null);
    setCustomTokenInfo(null);
    setHasPoolForCustomToken(false);

    try {
      // First check if token already exists in our list
      const existingToken = tokens.find(
        t => t.address.toLowerCase() === address.toLowerCase()
      );
      
      if (existingToken) {
        setCustomTokenInfo(existingToken);
        setHasPoolForCustomToken(true);
        setCustomTokenLoading(false);
        return;
      }

      // Try to fetch token info from blockchain
      const tokenInfo = await web3Service.getTokenInfo(address);
      
      if (tokenInfo) {
        // Generate logo and add additional fields
        const customToken = {
          id: `custom_${address.slice(0, 8)}`,
          ...tokenInfo,
          logo: `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenInfo.symbol}&backgroundColor=6366f1`,
          price: 0,
          priceChange: 0,
          isCustom: true
        };
        setCustomTokenInfo(customToken);

        // Check if pool exists for this token
        const poolExists = pools.some(
          p => p.token0.address.toLowerCase() === address.toLowerCase() ||
               p.token1.address.toLowerCase() === address.toLowerCase()
        );
        setHasPoolForCustomToken(poolExists);
      } else {
        setCustomTokenError('Could not fetch token information. Make sure this is a valid ERC-20 token contract.');
      }
    } catch (error) {
      console.error('Error fetching custom token:', error);
      setCustomTokenError('Failed to fetch token information. The address may not be a valid token contract.');
    }
    
    setCustomTokenLoading(false);
  }, [tokens, pools]);

  // Auto-fetch when valid address is entered
  useEffect(() => {
    if (isContractAddress && searchQuery.length === 42) {
      const timer = setTimeout(() => {
        fetchCustomToken(searchQuery);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchQuery, isContractAddress, fetchCustomToken]);

  // Clear custom token info when search is not a contract address
  useEffect(() => {
    if (!isContractAddress) {
      const timer = setTimeout(() => {
        setCustomTokenInfo(null);
        setCustomTokenError(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isContractAddress]);

  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      if (excludeToken && token.id === excludeToken.id) return false;
      const query = searchQuery.toLowerCase();
      
      // If it's a contract address search, don't filter by name
      if (isContractAddress) return false;
      
      return (
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, excludeToken, tokens, isContractAddress]);

  const popularTokens = tokens.filter(t => ['pio', 'usdt', 'usdc', 'peth'].includes(t.id));

  const handleSelect = (token) => {
    onSelect(token);
    onOpenChange(false);
    setSearchQuery('');
    setCustomTokenInfo(null);
    setCustomTokenError(null);
  };

  const handleCreatePool = () => {
    if (customTokenInfo) {
      // Store custom token info and redirect to pool creation
      onOpenChange(false);
      navigate('/pools', { 
        state: { 
          createPoolWith: customTokenInfo,
          autoOpenCreate: true
        } 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 text-white sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-lg font-bold">Select a token</DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by name or paste contract address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50"
            />
          </div>
          {isContractAddress && (
            <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Contract address detected - fetching token info...
            </p>
          )}
        </div>

        {/* Custom Token Result */}
        {isContractAddress && (customTokenLoading || customTokenInfo || customTokenError) && (
          <div className="px-4 pb-3">
            {customTokenLoading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-gray-400">Fetching token info...</span>
              </div>
            )}
            
            {customTokenError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {customTokenError}
                </div>
              </div>
            )}
            
            {customTokenInfo && !customTokenLoading && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <img src={customTokenInfo.logo} alt={customTokenInfo.symbol} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{customTokenInfo.symbol}</div>
                    <div className="text-sm text-gray-400">{customTokenInfo.name}</div>
                  </div>
                  {hasPoolForCustomToken ? (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <CheckCircle className="w-4 h-4" />
                      Pool exists
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <AlertCircle className="w-4 h-4" />
                      No pool
                    </div>
                  )}
                </div>
                
                {hasPoolForCustomToken ? (
                  <Button
                    onClick={() => handleSelect(customTokenInfo)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg"
                  >
                    Select {customTokenInfo.symbol}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">
                      No liquidity pool exists for this token. Create one to enable trading.
                    </p>
                    <Button
                      onClick={handleCreatePool}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-lg gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Pool for {customTokenInfo.symbol}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Popular Tokens */}
        {!searchQuery && popularTokens.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {popularTokens.map((token) => (
                <button
                  key={token.id}
                  onClick={() => handleSelect(token)}
                  disabled={excludeToken?.id === token.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    selectedToken?.id === token.id
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : excludeToken?.id === token.id
                      ? 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                  <span className="text-sm font-medium">{token.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Token List */}
        <ScrollArea className="h-[300px] border-t border-white/10">
          <div className="p-2">
            {loading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            ) : !isContractAddress && filteredTokens.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No tokens found
              </div>
            ) : !isContractAddress ? (
              filteredTokens.map((token) => {
                const balance = isConnected ? getBalance(token.id) : 0;
                return (
                  <button
                    key={token.id}
                    onClick={() => handleSelect(token)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedToken?.id === token.id
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <img src={token.logo} alt={token.symbol} className="w-9 h-9 rounded-full" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{token.symbol}</span>
                        {token.isNative && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            Native
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{token.name}</div>
                    </div>
                    <div className="text-right">
                      {isConnected && balance > 0 && (
                        <div className="text-sm font-medium">{balance.toFixed(4)}</div>
                      )}
                      <div className="text-sm text-gray-500">${token.price.toFixed(2)}</div>
                    </div>
                  </button>
                );
              })
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelector;
