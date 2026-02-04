import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { NETWORK_CONFIG } from '../data/mock';
import { getTokens, getSwapQuote, executeSwap } from '../services/api';
import TokenSelector from '../components/TokenSelector';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../components/ui/tooltip';
import {
  ArrowDownUp,
  Settings,
  Info,
  ChevronDown,
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../components/ui/popover';

const SwapPage = () => {
  const { isConnected, connectWallet, getBalance, isConnecting, address } = useWallet();
  
  const [tokens, setTokens] = useState([]);
  const [sellToken, setSellToken] = useState(null);
  const [buyToken, setBuyToken] = useState(null);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [showSellSelector, setShowSellSelector] = useState(false);
  const [showBuySelector, setShowBuySelector] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Load tokens on mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const fetchedTokens = await getTokens();
        setTokens(fetchedTokens);
        if (fetchedTokens.length >= 3) {
          setSellToken(fetchedTokens[0]); // PIO
          setBuyToken(fetchedTokens[2]); // USDT
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
      }
    };
    loadTokens();
  }, []);

  // Get swap quote when sell amount changes
  const fetchQuote = useCallback(async () => {
    if (!sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) <= 0) {
      setBuyAmount('');
      setPriceImpact(0);
      setExchangeRate(0);
      return;
    }

    setIsLoadingQuote(true);
    try {
      const quote = await getSwapQuote(sellToken.address, buyToken.address, parseFloat(sellAmount));
      setBuyAmount(quote.amountOut.toString());
      setPriceImpact(quote.priceImpact);
      setExchangeRate(quote.exchangeRate);
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Fallback to simple calculation
      const rate = sellToken.price / buyToken.price;
      setBuyAmount((parseFloat(sellAmount) * rate * 0.997).toFixed(6));
      setExchangeRate(rate);
      setPriceImpact(0.1);
    }
    setIsLoadingQuote(false);
  }, [sellToken, buyToken, sellAmount]);

  useEffect(() => {
    const debounceTimer = setTimeout(fetchQuote, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchQuote]);

  const handleSwapTokens = () => {
    const tempToken = sellToken;
    const tempAmount = sellAmount;
    setSellToken(buyToken);
    setBuyToken(tempToken);
    setSellAmount(buyAmount);
    setBuyAmount(tempAmount);
  };

  const handleMaxClick = () => {
    if (isConnected && sellToken) {
      const balance = getBalance(sellToken.id);
      setSellAmount(balance.toString());
    }
  };

  const handleSwap = async () => {
    if (!isConnected || !sellAmount || parseFloat(sellAmount) <= 0) return;
    
    setIsSwapping(true);
    
    try {
      // Execute swap via API
      await executeSwap(
        address,
        sellToken.address,
        buyToken.address,
        parseFloat(sellAmount),
        parseFloat(buyAmount),
        slippage,
        `0x${Date.now().toString(16)}` // Mock tx hash
      );
      
      setSwapSuccess(true);
      setTimeout(() => {
        setSwapSuccess(false);
        setSellAmount('');
        setBuyAmount('');
      }, 3000);
    } catch (error) {
      console.error('Swap failed:', error);
    }
    
    setIsSwapping(false);
  };
    
    setIsSwapping(false);
    setSwapSuccess(true);
    
    setTimeout(() => {
      setSwapSuccess(false);
      setSellAmount('');
    }, 3000);
  };

  const sellBalance = isConnected ? getBalance(sellToken?.id) : 0;
  const buyBalance = isConnected ? getBalance(buyToken?.id) : 0;
  const insufficientBalance = parseFloat(sellAmount) > sellBalance;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[480px] mx-auto px-4 pt-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Swap</h1>
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                <Settings className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-[#1a1a1a] border-white/10 text-white" align="end">
              <div className="space-y-4">
                <h3 className="font-semibold">Swap Settings</h3>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Slippage Tolerance</label>
                  <div className="flex gap-2">
                    {[0.1, 0.5, 1.0].map((value) => (
                      <button
                        key={value}
                        onClick={() => setSlippage(value)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          slippage === value
                            ? 'bg-amber-500 text-black'
                            : 'bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                        className="w-full py-2 px-3 rounded-lg bg-white/5 text-white text-sm text-right pr-6 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Swap Card */}
        <Card className="bg-[#1a1a1a] border-white/5 p-4 rounded-2xl">
          {/* Sell Section */}
          <div className="bg-white/5 rounded-xl p-4 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Sell</span>
              {isConnected && (
                <button
                  onClick={handleMaxClick}
                  className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  Balance: {sellBalance.toFixed(4)}
                  <span className="ml-1 text-amber-400">MAX</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-3xl font-medium text-white placeholder:text-gray-600 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setShowSellSelector(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-all"
              >
                <img src={sellToken?.logo} alt={sellToken?.symbol} className="w-6 h-6 rounded-full" />
                <span className="font-semibold text-white">{sellToken?.symbol}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            {sellAmount && (
              <div className="mt-2 text-sm text-gray-500">
                ~${(parseFloat(sellAmount) * sellToken?.price || 0).toFixed(2)}
              </div>
            )}
          </div>

          {/* Swap Direction Button */}
          <div className="relative h-0 flex justify-center">
            <button
              onClick={handleSwapTokens}
              className="absolute -top-4 z-10 p-2 rounded-xl bg-[#1a1a1a] border-4 border-[#0d0d0d] text-gray-400 hover:text-amber-400 hover:rotate-180 transition-all duration-300"
            >
              <ArrowDownUp className="w-5 h-5" />
            </button>
          </div>

          {/* Buy Section */}
          <div className="bg-white/5 rounded-xl p-4 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Buy</span>
              {isConnected && (
                <span className="text-sm text-gray-500">
                  Balance: {buyBalance.toFixed(4)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={calculatedBuyAmount}
                readOnly
                placeholder="0"
                className="flex-1 bg-transparent text-3xl font-medium text-white placeholder:text-gray-600 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setShowBuySelector(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-all"
              >
                <img src={buyToken?.logo} alt={buyToken?.symbol} className="w-6 h-6 rounded-full" />
                <span className="font-semibold text-white">{buyToken?.symbol}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            {calculatedBuyAmount && (
              <div className="mt-2 text-sm text-gray-500">
                ~${(parseFloat(calculatedBuyAmount) * buyToken?.price || 0).toFixed(2)}
              </div>
            )}
          </div>

          {/* Exchange Rate Info */}
          {sellAmount && calculatedBuyAmount && (
            <div className="mt-4 p-3 rounded-xl bg-white/5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Rate</span>
                <span className="text-white">
                  1 {sellToken?.symbol} = {exchangeRate.toFixed(6)} {buyToken?.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1">
                  Price Impact
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#2a2a2a] border-white/10">
                        <p className="text-xs">The difference between market price and estimated price</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span className={priceImpact > 1 ? 'text-amber-400' : 'text-green-400'}>
                  {priceImpact}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Max Slippage</span>
                <span className="text-white">{slippage}%</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4">
            {!isConnected ? (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl"
              >
                {isConnecting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            ) : !sellAmount || parseFloat(sellAmount) <= 0 ? (
              <Button
                disabled
                className="w-full py-6 text-lg font-semibold bg-white/10 text-gray-500 rounded-xl cursor-not-allowed"
              >
                Enter an amount
              </Button>
            ) : insufficientBalance ? (
              <Button
                disabled
                className="w-full py-6 text-lg font-semibold bg-red-500/20 text-red-400 rounded-xl cursor-not-allowed"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Insufficient {sellToken?.symbol} balance
              </Button>
            ) : swapSuccess ? (
              <Button
                disabled
                className="w-full py-6 text-lg font-semibold bg-green-500 text-white rounded-xl"
              >
                <Check className="w-5 h-5 mr-2" />
                Swap Successful!
              </Button>
            ) : (
              <Button
                onClick={handleSwap}
                disabled={isSwapping}
                className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl"
              >
                {isSwapping ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Swapping...</>
                ) : (
                  'Swap'
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Info Text */}
        <p className="text-center text-gray-500 text-sm mt-4">
          Trade tokens with zero app fees on PIOGOLD network
        </p>
      </div>

      {/* Token Selectors */}
      <TokenSelector
        open={showSellSelector}
        onOpenChange={setShowSellSelector}
        onSelect={setSellToken}
        selectedToken={sellToken}
        excludeToken={buyToken}
      />
      <TokenSelector
        open={showBuySelector}
        onOpenChange={setShowBuySelector}
        onSelect={setBuyToken}
        selectedToken={buyToken}
        excludeToken={sellToken}
      />
    </div>
  );
};

export default SwapPage;
