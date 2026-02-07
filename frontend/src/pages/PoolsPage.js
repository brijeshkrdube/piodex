import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { FEE_TIERS, formatCurrency } from '../data/mock';
import { getPools, createPool as createPoolAPI, getTokens } from '../services/api';
import { web3Service, CONTRACT_ADDRESSES, FACTORY_ABI } from '../services/web3';
import TokenSelector from '../components/TokenSelector';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../components/ui/dialog';
import {
  Plus,
  Search,
  TrendingUp,
  Droplets,
  ChevronDown,
  ExternalLink,
  Loader2,
  Check,
  Wallet,
  AlertCircle
} from 'lucide-react';

const PoolsPage = () => {
  const location = useLocation();
  const { isConnected, connectWallet, isConnecting, address } = useWallet();
  const [pools, setPools] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Create Pool State
  const [token0, setToken0] = useState(null);
  const [token1, setToken1] = useState(null);
  const [showToken0Selector, setShowToken0Selector] = useState(false);
  const [showToken1Selector, setShowToken1Selector] = useState(false);
  const [selectedFee, setSelectedFee] = useState(FEE_TIERS[2]);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [pairAddress, setPairAddress] = useState(null);

  // Handle redirect from TokenSelector with custom token
  useEffect(() => {
    if (location.state?.createPoolWith && location.state?.autoOpenCreate) {
      // Use timeout to avoid synchronous setState
      const timer = setTimeout(() => {
        setToken0(location.state.createPoolWith);
        setShowCreatePool(true);
        window.history.replaceState({}, document.title);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Load pools and tokens on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedPools, fetchedTokens] = await Promise.all([
          getPools(),
          getTokens()
        ]);
        setPools(fetchedPools);
        setTokens(fetchedTokens);
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredPools = pools.filter(pool => {
    const query = searchQuery.toLowerCase();
    return (
      pool.token0.symbol.toLowerCase().includes(query) ||
      pool.token1.symbol.toLowerCase().includes(query) ||
      pool.token0.name.toLowerCase().includes(query) ||
      pool.token1.name.toLowerCase().includes(query)
    );
  });

  const handleCreatePool = async () => {
    if (!token0 || !token1) return;
    
    // Require wallet connection for pool creation
    if (!isConnected) {
      alert('Please connect your wallet to create a pool');
      return;
    }
    
    setIsCreating(true);
    setTxHash(null);
    setPairAddress(null);
    
    try {
      // Get token addresses (use WPIO for native PIO)
      const addr0 = token0.isNative ? CONTRACT_ADDRESSES.WPIO : token0.address;
      const addr1 = token1.isNative ? CONTRACT_ADDRESSES.WPIO : token1.address;
      
      // Check if pair already exists on-chain FIRST
      const existingPair = await web3Service.getPairAddress(addr0, addr1);
      
      if (existingPair && existingPair !== ethers.constants.AddressZero) {
        // Pair already exists - don't allow creating again
        setPairAddress(existingPair);
        alert(`This pool already exists!\n\nPair Address: ${existingPair}\n\nGo to "Add Liquidity" to add funds to this existing pool.`);
        setIsCreating(false);
        return;
      }
      
      // Create pair on blockchain using Factory contract
      const provider = web3Service.getProvider();
      const signer = provider.getSigner();
      const factory = new ethers.Contract(CONTRACT_ADDRESSES.FACTORY, FACTORY_ABI, signer);
      
      const tx = await factory.createPair(addr0, addr1);
      setTxHash(tx.hash);
      
      const receipt = await tx.wait();
      
      // Get the new pair address from the event
      const pairCreatedEvent = receipt.events?.find(e => e.event === 'PairCreated');
      if (pairCreatedEvent) {
        setPairAddress(pairCreatedEvent.args.pair);
      }
      
      // Also record in backend database with creator address
      try {
        await createPoolAPI(
          token0.address, 
          token1.address, 
          selectedFee.value,
          address, // Creator's wallet address
          pairCreatedEvent?.args?.pair || null // On-chain pair address
        );
      } catch (dbError) {
        console.log('Backend sync failed, but pool created on-chain:', dbError);
      }
      
      setCreateSuccess(true);
      
      // Refresh pools list
      const fetchedPools = await getPools();
      setPools(fetchedPools);
      
      setTimeout(() => {
        setShowCreatePool(false);
        setCreateSuccess(false);
        setToken0(null);
        setToken1(null);
        setTxHash(null);
        setPairAddress(null);
      }, 5000);
    } catch (error) {
      console.error('Error creating pool:', error);
      
      if (error.code === 4001) {
        alert('Transaction rejected by user');
      } else if (error.reason) {
        alert(`Failed to create pool: ${error.reason}`);
      } else if (error.message?.includes('Pair exists')) {
        alert('This pool already exists on the blockchain!');
      } else {
        alert(`Failed to create pool: ${error.message || 'Unknown error'}`);
      }
    }
    setIsCreating(false);
  };

  // Calculate total TVL
  const totalTVL = pools.reduce((sum, pool) => sum + pool.tvl, 0);
  const totalVolume24h = pools.reduce((sum, pool) => sum + (pool.volume24h || 0), 0);

  if (loading) {
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
        <div className="absolute top-40 left-1/3 w-[600px] h-[600px] bg-amber-500/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-40 right-1/3 w-[500px] h-[500px] bg-orange-500/3 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Pools</h1>
            <p className="text-gray-400">Provide liquidity and earn fees on every swap</p>
          </div>
          <Button
            onClick={() => setShowCreatePool(true)}
            data-testid="create-pool-btn"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" />
            New Position
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search pools by token name or symbol"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50 rounded-xl"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1">
              <TabsTrigger
                value="all"
                className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black"
              >
                All Pools
              </TabsTrigger>
              <TabsTrigger
                value="my"
                className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black"
              >
                My Positions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pools Table */}
        <Card className="bg-[#1a1a1a] border-white/5 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-sm text-gray-400">
            <div className="col-span-4">Pool</div>
            <div className="col-span-2 text-right hidden sm:block">TVL</div>
            <div className="col-span-2 text-right hidden md:block">Volume (24h)</div>
            <div className="col-span-2 text-right">APR</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {filteredPools.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Droplets className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pools found</p>
              </div>
            ) : (
              filteredPools.map((pool) => (
                <div
                  key={pool.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors"
                >
                  {/* Pool Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <img
                        src={pool.token0.logo}
                        alt={pool.token0.symbol}
                        className="w-8 h-8 rounded-full border-2 border-[#1a1a1a]"
                      />
                      <img
                        src={pool.token1.logo}
                        alt={pool.token1.symbol}
                        className="w-8 h-8 rounded-full border-2 border-[#1a1a1a]"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {pool.token0.symbol}/{pool.token1.symbol}
                      </div>
                      <div className="text-xs text-gray-500">{pool.fee}% fee</div>
                    </div>
                  </div>

                  {/* TVL */}
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className="text-white font-medium">{formatCurrency(pool.tvl)}</span>
                  </div>

                  {/* Volume */}
                  <div className="col-span-2 text-right hidden md:block">
                    <span className="text-white font-medium">{formatCurrency(pool.volume24h)}</span>
                  </div>

                  {/* APR */}
                  <div className="col-span-2 text-right">
                    <span className="text-green-400 font-semibold">{pool.apr.toFixed(1)}%</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-2">
                    <Link to={`/pool/${pool.id}/add`}>
                      <Button
                        size="sm"
                        className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
                      onClick={() => window.open('https://pioscan.com', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <Card className="bg-[#1a1a1a] border-white/5 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Droplets className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-gray-400">Total Value Locked</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalTVL)}</div>
          </Card>

          <Card className="bg-[#1a1a1a] border-white/5 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400">24h Volume</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalVolume24h)}</div>
          </Card>

          <Card className="bg-[#1a1a1a] border-white/5 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400">Active Pools</span>
            </div>
            <div className="text-2xl font-bold text-white">{pools.length}</div>
          </Card>
        </div>
      </div>

      {/* Create Pool Modal */}
      <Dialog open={showCreatePool} onOpenChange={setShowCreatePool}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="create-pool-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Pool</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a pair of tokens, fee tier, and add initial liquidity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Token Selection */}
            <div className="space-y-3">
              <label className="text-sm text-gray-400">Select Pair</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowToken0Selector(true)}
                  data-testid="select-token0-btn"
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  {token0 ? (
                    <>
                      <img src={token0.logo} alt={token0.symbol} className="w-8 h-8 rounded-full" />
                      <span className="font-semibold">{token0.symbol}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <span className="text-gray-500">Select token</span>
                    </>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                </button>

                <button
                  onClick={() => setShowToken1Selector(true)}
                  data-testid="select-token1-btn"
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  {token1 ? (
                    <>
                      <img src={token1.logo} alt={token1.symbol} className="w-8 h-8 rounded-full" />
                      <span className="font-semibold">{token1.symbol}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <span className="text-gray-500">Select token</span>
                    </>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                </button>
              </div>
            </div>

            {/* Fee Tier Selection */}
            <div className="space-y-3">
              <label className="text-sm text-gray-400">Select Fee Tier</label>
              <div className="grid grid-cols-2 gap-3">
                {FEE_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    onClick={() => setSelectedFee(tier)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      selectedFee.value === tier.value
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold text-white">{tier.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{tier.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info about pool creation */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <strong>Note:</strong> Creating a pool only initializes the trading pair on-chain. After creation, use "Add Liquidity" to deposit tokens into the pool.
                </div>
              </div>
            </div>

            {/* Info about blockchain integration */}
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-200">
                  <strong>Blockchain Enabled:</strong> Pools will be created on-chain via the Factory contract at {CONTRACT_ADDRESSES.FACTORY.slice(0, 10)}...
                </div>
              </div>
            </div>

            {/* Transaction info */}
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
                {pairAddress && (
                  <div className="text-sm text-blue-200 mt-1">
                    <strong>Pair Address:</strong>{' '}
                    <a 
                      href={`https://pioscan.com/address/${pairAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {pairAddress.slice(0, 20)}...
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Create Button */}
            <Button
              onClick={handleCreatePool}
              disabled={!token0 || !token1 || isCreating || createSuccess}
              data-testid="submit-create-pool-btn"
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl disabled:opacity-50"
            >
              {createSuccess ? (
                <><Check className="w-5 h-5 mr-2" /> Pool Created!</>
              ) : isCreating ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Pool...</>
              ) : !token0 || !token1 ? (
                'Select both tokens'
              ) : (
                'Create Pool'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Selectors */}
      <TokenSelector
        open={showToken0Selector}
        onOpenChange={setShowToken0Selector}
        onSelect={setToken0}
        selectedToken={token0}
        excludeToken={token1}
        tokens={tokens}
      />
      <TokenSelector
        open={showToken1Selector}
        onOpenChange={setShowToken1Selector}
        onSelect={setToken1}
        selectedToken={token1}
        excludeToken={token0}
        tokens={tokens}
      />
    </div>
  );
};

export default PoolsPage;
