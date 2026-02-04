import React, { useState, useMemo, useEffect } from 'react';
import { getTokens } from '../services/api';
import { useWallet } from '../context/WalletContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';

const TokenSelector = ({ open, onOpenChange, onSelect, selectedToken, excludeToken, tokens: propTokens }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState(propTokens || []);
  const [loading, setLoading] = useState(false);
  const { getBalance, isConnected } = useWallet();

  // Load tokens if not provided via props
  useEffect(() => {
    if (propTokens && propTokens.length > 0) {
      setTokens(propTokens);
      return;
    }
    
    const loadTokens = async () => {
      if (!open) return;
      setLoading(true);
      try {
        const fetchedTokens = await getTokens();
        setTokens(fetchedTokens);
      } catch (error) {
        console.error('Error loading tokens:', error);
      }
      setLoading(false);
    };
    loadTokens();
  }, [open, propTokens]);

  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      if (excludeToken && token.id === excludeToken.id) return false;
      const query = searchQuery.toLowerCase();
      return (
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, excludeToken, tokens]);

  const popularTokens = tokens.filter(t => ['pio', 'usdt', 'usdc', 'peth'].includes(t.id));

  const handleSelect = (token) => {
    onSelect(token);
    onOpenChange(false);
    setSearchQuery('');
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
              placeholder="Search by name or address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50"
            />
          </div>
        </div>

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
            ) : filteredTokens.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No tokens found
              </div>
            ) : (
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
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelector;