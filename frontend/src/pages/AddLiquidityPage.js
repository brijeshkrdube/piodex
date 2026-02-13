import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { getPool, addPoolLiquidity, removePoolLiquidity } from '../services/api';
import { web3Service, CONTRACT_ADDRESSES, ROUTER_ABI, ERC20_ABI } from '../services/web3';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import {
  ArrowLeft,
  Plus,
  Minus,
  Loader2,
  Check,
  AlertTriangle,
  Wallet,
  Lock,
  ExternalLink
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// Helper to display PIO instead of WPIO
const getDisplayToken = (token) => {
  if (token.symbol === 'WPIO') {
    return {
      ...token,
      symbol: 'PIO',
      name: 'PIOGOLD',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=pio&backgroundColor=FFD700'
    };
  }
  return token;
};

const AddLiquidityPage = () => {
  const { poolId } = useParams();
  const { isConnected, connectWallet, getBalance, isConnecting, address } = useWallet();
  
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('add');
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [removePercent, setRemovePercent] = useState([50]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [needsApproval0, setNeedsApproval0] = useState(false);
  const [needsApproval1, setNeedsApproval1] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Check if current user is the pool creator
  const isCreator = pool && address && 
    pool.creatorAddress?.toLowerCase() === address.toLowerCase();

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

  // Check approvals when amounts change
  useEffect(() => {
    const checkApprovals = async () => {
      if (!isConnected || !pool || !amount0 || !amount1) return;
      
      try {
        // Check token0 approval (skip if native)
        if (!pool.token0.isNative && pool.token0.address !== '0x0000000000000000000000000000000000000000') {
          const allowance0 = await web3Service.checkAllowance(
            pool.token0.address,
            CONTRACT_ADDRESSES.ROUTER,
            address
          );
          setNeedsApproval0(parseFloat(allowance0) < parseFloat(amount0));
        }
        
        // Check token1 approval (skip if native)
        if (!pool.token1.isNative && pool.token1.address !== '0x0000000000000000000000000000000000000000') {
          const allowance1 = await web3Service.checkAllowance(
            pool.token1.address,
            CONTRACT_ADDRESSES.ROUTER,
            address
          );
          setNeedsApproval1(parseFloat(allowance1) < parseFloat(amount1));
        }
      } catch (error) {
        console.error('Error checking approvals:', error);
      }
    };
    
    checkApprovals();
  }, [isConnected, pool, amount0, amount1, address]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
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
  
  const currentPrice = pool.token1.price > 0 ? pool.token0.price / pool.token1.price : 1;

  // Calculate amount1 based on amount0
  const handleAmount0Change = (value) => {
    setAmount0(value);
    if (value && !isNaN(value) && currentPrice > 0) {
      const calculated = parseFloat(value) * currentPrice;
      setAmount1(calculated.toFixed(6));
    } else {
      setAmount1('');
    }
  };

  // Calculate amount0 based on amount1
  const handleAmount1Change = (value) => {
    setAmount1(value);
    if (value && !isNaN(value) && currentPrice > 0) {
      const calculated = parseFloat(value) / currentPrice;
      setAmount0(calculated.toFixed(6));
    } else {
      setAmount0('');
    }
  };

  const handleApprove = async (tokenIndex) => {
    if (!pool) return;
    
    setIsApproving(true);
    try {
      const tokenAddress = tokenIndex === 0 ? pool.token0.address : pool.token1.address;
      await web3Service.approveTokenMax(tokenAddress, CONTRACT_ADDRESSES.ROUTER);
      
      if (tokenIndex === 0) {
        setNeedsApproval0(false);
      } else {
        setNeedsApproval1(false);
      }
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Approval failed: ' + error.message);
    }
    setIsApproving(false);
  };

  const handleAddLiquidity = async () => {
    if (!isConnected || !address || !isCreator) return;
    
    setIsSubmitting(true);
    setTxHash(null);
    
    try {
      // Get token addresses
      const token0Addr = pool.token0.isNative ? CONTRACT_ADDRESSES.WPIO : pool.token0.address;
      const token1Addr = pool.token1.isNative ? CONTRACT_ADDRESSES.WPIO : pool.token1.address;
      
      const decimals0 = pool.token0.decimals || 18;
      const decimals1 = pool.token1.decimals || 18;
      
      const amount0Wei = ethers.utils.parseUnits(amount0, decimals0);
      const amount1Wei = ethers.utils.parseUnits(amount1, decimals1);
      
      // Calculate minimum amounts (with 1% slippage)
      const amount0Min = amount0Wei.mul(99).div(100);
      const amount1Min = amount1Wei.mul(99).div(100);
      
      let result;
      
      if (pool.token0.isNative || pool.token1.isNative) {
        // Use addLiquidityETH for native token pairs
        const tokenAddr = pool.token0.isNative ? token1Addr : token0Addr;
        const tokenAmount = pool.token0.isNative ? amount1Wei : amount0Wei;
        const tokenMin = pool.token0.isNative ? amount1Min : amount0Min;
        const ethAmount = pool.token0.isNative ? amount0Wei : amount1Wei;
        const ethMin = pool.token0.isNative ? amount0Min : amount1Min;
        
        result = await web3Service.addLiquidityETH(
          tokenAddr,
          tokenAmount,
          tokenMin,
          ethMin,
          ethAmount
        );
      } else {
        // Use addLiquidity for token-token pairs
        result = await web3Service.addLiquidity(
          token0Addr,
          token1Addr,
          amount0Wei,
          amount1Wei,
          amount0Min,
          amount1Min
        );
      }
      
      setTxHash(result.hash);
      
      // Update backend
      await addPoolLiquidity(
        pool.id,
        address,
        parseFloat(amount0),
        parseFloat(amount1),
        result.hash
      );
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setAmount0('');
        setAmount1('');
        setTxHash(null);
      }, 5000);
    } catch (error) {
      console.error('Add liquidity failed:', error);
      alert('Failed to add liquidity: ' + (error.reason || error.message));
    }
    setIsSubmitting(false);
  };

  const handleRemoveLiquidity = async () => {
    if (!isConnected || !address || !isCreator) return;
    
    setIsSubmitting(true);
    setTxHash(null);
    
    try {
      const percent = removePercent[0];
      
      // Get LP token balance
      if (pool.pairAddress) {
        const lpBalance = await web3Service.getLPBalance(pool.pairAddress, address);
        const lpToRemove = lpBalance.mul(percent).div(100);
        
        // Approve LP token spending if needed
        const lpAllowance = await web3Service.checkAllowance(
          pool.pairAddress,
          CONTRACT_ADDRESSES.ROUTER,
          address
        );
        
        if (parseFloat(lpAllowance) < parseFloat(ethers.utils.formatEther(lpToRemove))) {
          await web3Service.approveTokenMax(pool.pairAddress, CONTRACT_ADDRESSES.ROUTER);
        }
        
        // Get token addresses
        const token0Addr = pool.token0.isNative ? CONTRACT_ADDRESSES.WPIO : pool.token0.address;
        const token1Addr = pool.token1.isNative ? CONTRACT_ADDRESSES.WPIO : pool.token1.address;
        
        let result;
        
        if (pool.token0.isNative || pool.token1.isNative) {
          const tokenAddr = pool.token0.isNative ? token1Addr : token0Addr;
          result = await web3Service.removeLiquidityETH(
            tokenAddr,
            lpToRemove,
            0, // amountTokenMin (set to 0 for simplicity, should calculate properly)
            0  // amountETHMin
          );
        } else {
          result = await web3Service.removeLiquidity(
            token0Addr,
            token1Addr,
            lpToRemove,
            0,
            0
          );
        }
        
        setTxHash(result.hash);
        
        // Update backend
        await removePoolLiquidity(pool.id, address, percent, result.hash);
      } else {
        // No on-chain pair, just update backend
        await removePoolLiquidity(pool.id, address, percent);
      }
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setRemovePercent([50]);
        setTxHash(null);
      }, 5000);
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      alert('Failed to remove liquidity: ' + (error.reason || error.message));
    }
    setIsSubmitting(false);
  };

  const insufficientBalance0 = parseFloat(amount0) > balance0;
  const insufficientBalance1 = parseFloat(amount1) > balance1;

  // Render not creator warning
  const renderNotCreatorWarning = () => (
    <div className="py-8 text-center space-y-4">
      <Lock className="w-16 h-16 mx-auto text-red-400" />
      <h3 className="text-xl font-bold text-white">Access Restricted</h3>
      <p className="text-gray-400 max-w-sm mx-auto">
        Only the pool creator can add or remove liquidity from this pool.
      </p>
      {pool.creatorAddress && (
        <div className="bg-white/5 rounded-xl p-4 max-w-sm mx-auto">
          <div className="text-sm text-gray-400 mb-1">Pool Creator</div>
          <a 
            href={`https://pioscan.com/address/${pool.creatorAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-amber-300 flex items-center justify-center gap-1"
          >
            {pool.creatorAddress.slice(0, 10)}...{pool.creatorAddress.slice(-8)}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
      <Link to="/pools">
        <Button variant="outline" className="mt-4">
          Back to Pools
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
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
              <span>TVL: <span className="text-green-400">${pool.tvl?.toFixed(2) || '0.00'}</span></span>
            </div>
          </div>
        </div>

        {/* Creator Badge */}
        {isConnected && (
          <div className={`mb-4 p-3 rounded-xl ${isCreator ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <div className="flex items-center gap-2">
              {isCreator ? (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-green-200 text-sm">You are the pool creator - you can manage liquidity</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-red-400" />
                  <span className="text-red-200 text-sm">Only the pool creator can manage liquidity</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Card */}
        <Card className="bg-[#1a1a1a] border-white/5 rounded-2xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none p-0">
              <TabsTrigger
                value="add"
                className="flex-1 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Liquidity
              </TabsTrigger>
              <TabsTrigger
                value="remove"
                className="flex-1 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent"
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
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                </div>
              ) : !isCreator ? (
                renderNotCreatorWarning()
              ) : (
                <>
                  {/* Token 0 Input */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Deposit {pool.token0.symbol}</span>
                      <button
                        onClick={() => handleAmount0Change(balance0.toString())}
                        className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                      >
                        Balance: {balance0.toFixed(4)}
                        <span className="ml-1 text-cyan-400">MAX</span>
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
                        className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                      >
                        Balance: {balance1.toFixed(4)}
                        <span className="ml-1 text-cyan-400">MAX</span>
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

                  {/* Transaction Hash */}
                  {txHash && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <div className="text-sm text-blue-200">
                        <strong>Transaction:</strong>{' '}
                        <a 
                          href={`https://pioscan.com/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          {txHash.slice(0, 20)}...
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Approval Buttons */}
                  {needsApproval0 && (
                    <Button
                      onClick={() => handleApprove(0)}
                      disabled={isApproving}
                      className="w-full py-4 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-xl"
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Approve {pool.token0.symbol}
                    </Button>
                  )}
                  
                  {needsApproval1 && (
                    <Button
                      onClick={() => handleApprove(1)}
                      disabled={isApproving}
                      className="w-full py-4 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-xl"
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Approve {pool.token1.symbol}
                    </Button>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleAddLiquidity}
                    disabled={
                      !amount0 ||
                      !amount1 ||
                      insufficientBalance0 ||
                      insufficientBalance1 ||
                      needsApproval0 ||
                      needsApproval1 ||
                      isSubmitting ||
                      submitSuccess
                    }
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl disabled:opacity-50"
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
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                </div>
              ) : !isCreator ? (
                renderNotCreatorWarning()
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
                              ? 'bg-cyan-500 text-black'
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
                    <div className="text-sm text-gray-400">You will receive (estimated)</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={pool.token0.logo} alt={pool.token0.symbol} className="w-6 h-6 rounded-full" />
                        <span className="text-white">{pool.token0.symbol}</span>
                      </div>
                      <span className="text-white font-medium">
                        {((pool.token0Reserve || 0) * removePercent[0] / 100).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={pool.token1.logo} alt={pool.token1.symbol} className="w-6 h-6 rounded-full" />
                        <span className="text-white">{pool.token1.symbol}</span>
                      </div>
                      <span className="text-white font-medium">
                        {((pool.token1Reserve || 0) * removePercent[0] / 100).toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <div className="text-sm text-amber-200">
                      Tokens will be transferred to your wallet: {address?.slice(0, 10)}...
                    </div>
                  </div>

                  {/* Transaction Hash */}
                  {txHash && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <div className="text-sm text-blue-200">
                        <strong>Transaction:</strong>{' '}
                        <a 
                          href={`https://pioscan.com/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          {txHash.slice(0, 20)}...
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleRemoveLiquidity}
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
