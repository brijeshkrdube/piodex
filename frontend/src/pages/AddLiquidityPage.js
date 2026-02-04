import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { getPool, addLiquidity, removeLiquidity } from '../services/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import {
  ArrowLeft,
  Plus,
  Minus,
  Info,
  Loader2,
  Check,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const AddLiquidityPage = () => {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const { isConnected, connectWallet, getBalance, isConnecting, address } = useWallet();
  
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('add');
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [removePercent, setRemovePercent] = useState([50]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [minPrice, setMinPrice] = useState('2.20');
  const [maxPrice, setMaxPrice] = useState('2.80');

  // Load pool data
  useEffect(() => {
    const loadPool = async () => {
      try {
        const fetchedPool = await getPool(poolId);
        setPool(fetchedPool);
      } catch (error) {
        console.error('Error loading pool:', error);
      }
      setLoading(false);
    };
    loadPool();
  }, [poolId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-4">Pool not found</p>
        <Link to="/pools">
          <Button variant="outline">Back to Pools</Button>
        </Link>
      </div>
    );
  }

  const balance0 = isConnected ? getBalance(pool.token0.id) : 0;
  const balance1 = isConnected ? getBalance(pool.token1.id) : 0;
  
  const currentPrice = pool.token0.price / pool.token1.price;

  // Calculate amount1 based on amount0
  const handleAmount0Change = (value) => {
    setAmount0(value);
    if (value && !isNaN(value)) {
      const calculated = parseFloat(value) * currentPrice;
      setAmount1(calculated.toFixed(6));
    } else {
      setAmount1('');
    }
  };

  // Calculate amount0 based on amount1
  const handleAmount1Change = (value) => {
    setAmount1(value);
    if (value && !isNaN(value)) {
      const calculated = parseFloat(value) / currentPrice;
      setAmount0(calculated.toFixed(6));
    } else {
      setAmount0('');
    }
  };

  const handleSubmit = async () => {
    if (!isConnected || !address) return;
    
    setIsSubmitting(true);
    try {
      if (activeTab === 'add') {
        await addLiquidity(
          pool.id,
          address,
          parseFloat(amount0),
          parseFloat(amount1),
          parseFloat(minPrice),
          parseFloat(maxPrice)
        );
      } else {
        // For remove, we'd need position ID - this is a simplified version
        // In a real app, you'd fetch user's position first
      }
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setAmount0('');
        setAmount1('');
        navigate('/pools');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
    }
    setIsSubmitting(false);
  };

  const insufficientBalance0 = parseFloat(amount0) > balance0;
  const insufficientBalance1 = parseFloat(amount1) > balance1;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          to="/pools"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pools
        </Link>

        {/* Pool Info Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex -space-x-2">
            <img
              src={pool.token0.logo}
              alt={pool.token0.symbol}
              className="w-10 h-10 rounded-full border-2 border-[#0d0d0d]"
            />
            <img
              src={pool.token1.logo}
              alt={pool.token1.symbol}
              className="w-10 h-10 rounded-full border-2 border-[#0d0d0d]"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {pool.token0.symbol}/{pool.token1.symbol}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="px-2 py-0.5 rounded bg-white/10">{pool.fee}% fee</span>
              <span>APR: <span className="text-green-400">{pool.apr}%</span></span>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-[#1a1a1a] border-white/5 rounded-2xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none p-0">
              <TabsTrigger
                value="add"
                className="flex-1 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-400 data-[state=active]:bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Liquidity
              </TabsTrigger>
              <TabsTrigger
                value="remove"
                className="flex-1 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-400 data-[state=active]:bg-transparent"
              >
                <Minus className="w-4 h-4 mr-2" />
                Remove Liquidity
              </TabsTrigger>
            </TabsList>

            {/* Add Liquidity Tab */}
            <TabsContent value="add" className="p-6 space-y-6">
              {!isConnected ? (
                <div className="py-8 text-center">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400 mb-4">Connect your wallet to add liquidity</p>
                  <Button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Token 0 Input */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Deposit {pool.token0.symbol}</span>
                      <button
                        onClick={() => handleAmount0Change(balance0.toString())}
                        className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                      >
                        Balance: {balance0.toFixed(4)}
                        <span className="ml-1 text-amber-400">MAX</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={amount0}
                        onChange={(e) => handleAmount0Change(e.target.value)}
                        placeholder="0"
                        className="flex-1 bg-transparent border-none text-2xl font-medium text-white placeholder:text-gray-600 focus-visible:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
                        <img src={pool.token0.logo} alt={pool.token0.symbol} className="w-6 h-6 rounded-full" />
                        <span className="font-semibold text-white">{pool.token0.symbol}</span>
                      </div>
                    </div>
                    {amount0 && (
                      <div className="mt-2 text-sm text-gray-500">
                        ~${(parseFloat(amount0) * pool.token0.price || 0).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Plus Icon */}
                  <div className="flex justify-center">
                    <div className="p-2 rounded-xl bg-white/5">
                      <Plus className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Token 1 Input */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Deposit {pool.token1.symbol}</span>
                      <button
                        onClick={() => handleAmount1Change(balance1.toString())}
                        className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                      >
                        Balance: {balance1.toFixed(4)}
                        <span className="ml-1 text-amber-400">MAX</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={amount1}
                        onChange={(e) => handleAmount1Change(e.target.value)}
                        placeholder="0"
                        className="flex-1 bg-transparent border-none text-2xl font-medium text-white placeholder:text-gray-600 focus-visible:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
                        <img src={pool.token1.logo} alt={pool.token1.symbol} className="w-6 h-6 rounded-full" />
                        <span className="font-semibold text-white">{pool.token1.symbol}</span>
                      </div>
                    </div>
                    {amount1 && (
                      <div className="mt-2 text-sm text-gray-500">
                        ~${(parseFloat(amount1) * pool.token1.price || 0).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Price Range */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        Set Price Range
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3 h-3" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#2a2a2a] border-white/10">
                              <p className="text-xs max-w-xs">Your liquidity will only earn fees when the market price is within your specified range</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                      <span className="text-sm text-gray-400">
                        Current: {currentPrice.toFixed(4)} {pool.token1.symbol}/{pool.token0.symbol}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <label className="text-sm text-gray-400 mb-2 block">Min Price</label>
                        <Input
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="bg-transparent border-none text-lg font-medium text-white focus-visible:ring-0 p-0"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {pool.token1.symbol} per {pool.token0.symbol}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <label className="text-sm text-gray-400 mb-2 block">Max Price</label>
                        <Input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="bg-transparent border-none text-lg font-medium text-white focus-visible:ring-0 p-0"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {pool.token1.symbol} per {pool.token0.symbol}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !amount0 ||
                      !amount1 ||
                      insufficientBalance0 ||
                      insufficientBalance1 ||
                      isSubmitting ||
                      submitSuccess
                    }
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl disabled:opacity-50"
                  >
                    {submitSuccess ? (
                      <><Check className="w-5 h-5 mr-2" /> Liquidity Added!</>
                    ) : isSubmitting ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Adding Liquidity...</>
                    ) : insufficientBalance0 || insufficientBalance1 ? (
                      <><AlertTriangle className="w-5 h-5 mr-2" /> Insufficient Balance</>
                    ) : !amount0 || !amount1 ? (
                      'Enter amounts'
                    ) : (
                      'Add Liquidity'
                    )}
                  </Button>
                </>
              )}
            </TabsContent>

            {/* Remove Liquidity Tab */}
            <TabsContent value="remove" className="p-6 space-y-6">
              {!isConnected ? (
                <div className="py-8 text-center">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400 mb-4">Connect your wallet to remove liquidity</p>
                  <Button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Amount to Remove */}
                  <div className="space-y-4">
                    <label className="text-sm text-gray-400">Amount to Remove</label>
                    <div className="text-center">
                      <span className="text-5xl font-bold text-white">{removePercent[0]}%</span>
                    </div>
                    <Slider
                      value={removePercent}
                      onValueChange={setRemovePercent}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between gap-2">
                      {[25, 50, 75, 100].map((value) => (
                        <button
                          key={value}
                          onClick={() => setRemovePercent([value])}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            removePercent[0] === value
                              ? 'bg-amber-500 text-black'
                              : 'bg-white/5 text-white hover:bg-white/10'
                          }`}
                        >
                          {value}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    <div className="text-sm text-gray-400">You will receive</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={pool.token0.logo} alt={pool.token0.symbol} className="w-6 h-6 rounded-full" />
                        <span className="text-white">{pool.token0.symbol}</span>
                      </div>
                      <span className="text-white font-medium">
                        {((1000 * removePercent[0]) / 100).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={pool.token1.logo} alt={pool.token1.symbol} className="w-6 h-6 rounded-full" />
                        <span className="text-white">{pool.token1.symbol}</span>
                      </div>
                      <span className="text-white font-medium">
                        {((2450 * removePercent[0]) / 100).toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={removePercent[0] === 0 || isSubmitting || submitSuccess}
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white rounded-xl disabled:opacity-50"
                  >
                    {submitSuccess ? (
                      <><Check className="w-5 h-5 mr-2" /> Liquidity Removed!</>
                    ) : isSubmitting ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Removing Liquidity...</>
                    ) : (
                      'Remove Liquidity'
                    )}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AddLiquidityPage;
