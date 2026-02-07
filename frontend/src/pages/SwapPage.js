import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { getTokens, getSwapQuote, executeSwap, getTradeHistory } from '../services/api';
import { web3Service, CONTRACT_ADDRESSES } from '../services/web3';
import TokenSelector from '../components/TokenSelector';
import TradeChart from '../components/TradeChart';
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
  Loader2,
  TrendingUp,
  History
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const SwapPage = () => {
  const { isConnected, connectWallet, getBalance, isConnecting, address, isCorrectNetwork, switchNetwork } = useWallet();
  
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
  const [activeView, setActiveView] = useState('swap');
  const [recentTrades, setRecentTrades] = useState([]);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [txHash, setTxHash] = useState(null);

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

  // Load real trade history
  useEffect(() => {
    if (sellToken && buyToken) {
      const loadTrades = async () => {
        try {
          const trades = await getTradeHistory(sellToken.address, buyToken.address, 20);
          if (trades.length > 0) {
            // Format real trades
            const formattedTrades = trades.map((trade, index) => ({
              id: trade.id || index,
              type: trade.token0Amount > 0 ? 'sell' : 'buy',
              amount: trade.token0Amount.toFixed(4),
              price: trade.price.toFixed(6),
              total: (trade.token0Amount * trade.price).toFixed(2),
              time: trade.timestamp.toLocaleTimeString(),
              txHash: trade.txHash,
              isReal: true
            }));
            setRecentTrades(formattedTrades);
          } else {
            // No real trades - show placeholder message
            setRecentTrades([]);
          }
        } catch (error) {
          console.error('Error loading trade history:', error);
          setRecentTrades([]);
        }
      };
      loadTrades();
    }
  }, [sellToken, buyToken]);

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

  // Check if approval is needed for the sell token
  const checkApproval = useCallback(async () => {
    if (!isConnected || !sellToken || !sellAmount || parseFloat(sellAmount) <= 0) {
      return false;
    }

    // Native token (PIO) doesn't need approval
    if (sellToken.isNative || sellToken.address === '0x0000000000000000000000000000000000000000') {
      return false;
    }

    try {
      const allowance = await web3Service.checkAllowance(
        sellToken.address,
        CONTRACT_ADDRESSES.ROUTER,
        address
      );
      const sellAmountNum = parseFloat(sellAmount);
      return parseFloat(allowance) < sellAmountNum;
    } catch (error) {
      console.error('Error checking allowance:', error);
      return true;
    }
  }, [isConnected, sellToken, sellAmount, address]);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const needs = await checkApproval();
      if (isMounted) {
        setNeedsApproval(needs);
      }
    };
    check();
    return () => { isMounted = false; };
  }, [checkApproval]);

  const handleApprove = async () => {
    if (!sellToken) return;
    
    setIsApproving(true);
    try {
      await web3Service.approveTokenMax(sellToken.address, CONTRACT_ADDRESSES.ROUTER);
      setNeedsApproval(false);
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Approval failed: ' + error.message);
    }
    setIsApproving(false);
  };

  const handleSwap = async () => {
    if (!isConnected || !sellAmount || parseFloat(sellAmount) <= 0) return;
    
    setIsSwapping(true);
    setTxHash(null);
    
    try {
      // Determine the swap path
      const sellAddr = sellToken.isNative ? CONTRACT_ADDRESSES.WPIO : sellToken.address;
      const buyAddr = buyToken.isNative ? CONTRACT_ADDRESSES.WPIO : buyToken.address;
      
      // Get decimals for amount conversion
      const sellDecimals = sellToken.decimals || 18;
      const buyDecimals = buyToken.decimals || 18;
      
      const amountIn = ethers.utils.parseUnits(sellAmount, sellDecimals);
      const minAmountOut = ethers.utils.parseUnits(
        (parseFloat(buyAmount) * (1 - slippage / 100)).toFixed(buyDecimals),
        buyDecimals
      );
      
      let result;
      
      if (sellToken.isNative) {
        // Swap PIO for tokens
        result = await web3Service.swapExactETHForTokens(
          minAmountOut,
          [CONTRACT_ADDRESSES.WPIO, buyAddr],
          amountIn
        );
      } else if (buyToken.isNative) {
        // Swap tokens for PIO
        result = await web3Service.swapExactTokensForETH(
          amountIn,
          minAmountOut,
          [sellAddr, CONTRACT_ADDRESSES.WPIO]
        );
      } else {
        // Swap tokens for tokens
        const path = [sellAddr, buyAddr];
        result = await web3Service.swapExactTokensForTokens(
          amountIn,
          minAmountOut,
          path
        );
      }
      
      setTxHash(result.hash);
      setSwapSuccess(true);
      
      // Also record in backend
      await executeSwap(
        address,
        sellToken.address,
        buyToken.address,
        parseFloat(sellAmount),
        parseFloat(buyAmount),
        slippage,
        result.hash
      );
      
      setTimeout(() => {
        setSwapSuccess(false);
        setSellAmount('');
        setBuyAmount('');
        setTxHash(null);
      }, 5000);
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed: ' + (error.reason || error.message));
    }
    
    setIsSwapping(false);
  };

  const sellBalance = isConnected ? getBalance(sellToken?.id) : 0;
  const buyBalance = isConnected ? getBalance(buyToken?.id) : 0;
  const insufficientBalance = parseFloat(sellAmount) > sellBalance;

  if (tokens.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Chart and Trade History */}
          <div className="lg:col-span-2 space-y-4">
            {/* Chart */}
            <TradeChart token0={sellToken} token1={buyToken} height={350} />

            {/* Trade History */}
            <Card className="bg-[#1a1a1a] border-white/5 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-white">Recent Trades</h3>
                </div>
                {recentTrades.length > 0 && recentTrades[0].isReal && (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                    Live
                  </span>
                )}
              </div>
              
              {recentTrades.length === 0 ? (
                <div className="py-8 text-center">
                  <History className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400 text-sm">No trades yet for this pair</p>
                  <p className="text-gray-500 text-xs mt-1">Make the first trade to see history here!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/5">
                        <th className="text-left py-2">Price ({buyToken?.symbol})</th>
                        <th className="text-right py-2">Amount ({sellToken?.symbol})</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-right py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTrades.map((trade) => (
                        <tr 
                          key={trade.id} 
                          className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                          onClick={() => trade.txHash && window.open(`https://pioscan.com/tx/${trade.txHash}`, '_blank')}
                        >
                          <td className={`py-2 ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.price}
                          </td>
                          <td className="text-right text-white">{trade.amount}</td>
                          <td className="text-right text-gray-400">{trade.total}</td>
                          <td className="text-right text-gray-500">{trade.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Swap Panel */}
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
                <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1">
                  <TabsTrigger
                    value="swap"
                    className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black px-4"
                  >
                    Swap
                  </TabsTrigger>
                  <TabsTrigger
                    value="limit"
                    className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black px-4"
                  >
                    Limit
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
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
                    {sellToken ? (
                      <>
                        <img src={sellToken.logo} alt={sellToken.symbol} className="w-6 h-6 rounded-full" />
                        <span className="font-semibold text-white">{sellToken.symbol}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">Select</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                {sellAmount && sellToken && (
                  <div className="mt-2 text-sm text-gray-500">
                    ~${(parseFloat(sellAmount) * sellToken.price).toFixed(2)}
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
                  <div className="flex-1 flex items-center">
                    {isLoadingQuote ? (
                      <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                    ) : (
                      <input
                        type="number"
                        value={buyAmount}
                        readOnly
                        placeholder="0"
                        className="w-full bg-transparent text-3xl font-medium text-white placeholder:text-gray-600 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => setShowBuySelector(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-all"
                  >
                    {buyToken ? (
                      <>
                        <img src={buyToken.logo} alt={buyToken.symbol} className="w-6 h-6 rounded-full" />
                        <span className="font-semibold text-white">{buyToken.symbol}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">Select</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                {buyAmount && (
                  <div className="mt-2 text-sm text-gray-500">
                    ~${(parseFloat(buyAmount) * (buyToken?.price || 0)).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Exchange Rate Info */}
              {sellAmount && buyAmount && (
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
                ) : !isCorrectNetwork ? (
                  <Button
                    onClick={switchNetwork}
                    className="w-full py-6 text-lg font-semibold bg-amber-500/20 text-amber-400 rounded-xl"
                  >
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Switch to PIOGOLD Network
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
                ) : needsApproval ? (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl"
                  >
                    {isApproving ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Approving...</>
                    ) : (
                      <>Approve {sellToken?.symbol}</>
                    )}
                  </Button>
                ) : swapSuccess ? (
                  <div className="space-y-2">
                    <Button
                      disabled
                      className="w-full py-6 text-lg font-semibold bg-green-500 text-white rounded-xl"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Swap Successful!
                    </Button>
                    {txHash && (
                      <a 
                        href={`https://pioscan.com/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-center text-sm text-amber-400 hover:text-amber-300"
                      >
                        View on Explorer →
                      </a>
                    )}
                  </div>
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
            <p className="text-center text-gray-500 text-sm">
              Trade tokens with zero app fees on PIOGOLD network
            </p>
          </div>
        </div>
      </div>

      {/* Token Selectors */}
      <TokenSelector
        open={showSellSelector}
        onOpenChange={setShowSellSelector}
        onSelect={setSellToken}
        selectedToken={sellToken}
        excludeToken={buyToken}
        tokens={tokens}
      />
      <TokenSelector
        open={showBuySelector}
        onOpenChange={setShowBuySelector}
        onSelect={setBuyToken}
        selectedToken={buyToken}
        excludeToken={sellToken}
        tokens={tokens}
      />
    </div>
  );
};

export default SwapPage;
