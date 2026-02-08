import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../data/mock';
import { getTokens, getPools, getStats } from '../services/api';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Droplets,
  Activity,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ExplorePage = () => {
  const [tokens, setTokens] = useState([]);
  const [pools, setPools] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tokens');
  const [favorites, setFavorites] = useState([]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedTokens, fetchedPools, fetchedStats] = await Promise.all([
          getTokens(),
          getPools(),
          getStats()
        ]);
        
        // Filter tokens to only show those with active trading pools
        const tokensInPools = new Set();
        fetchedPools.forEach(pool => {
          tokensInPools.add(pool.token0.address.toLowerCase());
          tokensInPools.add(pool.token1.address.toLowerCase());
        });
        
        const activeTokens = fetchedTokens.filter(token => 
          tokensInPools.has(token.address.toLowerCase())
        );
        
        setTokens(activeTokens);
        setPools(fetchedPools);
        setStats(fetchedStats);
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredTokens = tokens.filter(token => {
    const query = searchQuery.toLowerCase();
    return (
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query)
    );
  });

  const filteredPools = pools.filter(pool => {
    const query = searchQuery.toLowerCase();
    return (
      pool.token0.symbol.toLowerCase().includes(query) ||
      pool.token1.symbol.toLowerCase().includes(query)
    );
  });

  const toggleFavorite = (tokenId) => {
    setFavorites(prev =>
      prev.includes(tokenId)
        ? prev.filter(id => id !== tokenId)
        : [...prev, tokenId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-40 left-1/4 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-20 right-1/3 w-[500px] h-[500px] bg-orange-500/3 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Explore</h1>
          <p className="text-gray-400">Discover tokens and pools on PIOGOLD network</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1a1a1a] border-white/5 p-4 rounded-2xl">
            <div className="text-gray-400 text-sm mb-1">24h Volume</div>
            <div className="text-xl font-bold text-white">{formatCurrency(stats?.volume24h || 0)}</div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUpRight className="w-3 h-3" />
              +12.5%
            </div>
          </Card>
          <Card className="bg-[#1a1a1a] border-white/5 p-4 rounded-2xl">
            <div className="text-gray-400 text-sm mb-1">TVL</div>
            <div className="text-xl font-bold text-white">{formatCurrency(stats?.tvl || 0)}</div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUpRight className="w-3 h-3" />
              +3.2%
            </div>
          </Card>
          <Card className="bg-[#1a1a1a] border-white/5 p-4 rounded-2xl">
            <div className="text-gray-400 text-sm mb-1">Transactions</div>
            <div className="text-xl font-bold text-white">{(stats?.transactions24h || 0).toLocaleString()}</div>
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <ArrowDownRight className="w-3 h-3" />
              -2.1%
            </div>
          </Card>
          <Card className="bg-[#1a1a1a] border-white/5 p-4 rounded-2xl">
            <div className="text-gray-400 text-sm mb-1">Active Users</div>
            <div className="text-xl font-bold text-white">8,234</div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUpRight className="w-3 h-3" />
              +8.7%
            </div>
          </Card>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search tokens or pools"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 rounded-xl"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1">
              <TabsTrigger
                value="tokens"
                className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-black gap-2"
              >
                <Activity className="w-4 h-4" />
                Tokens
              </TabsTrigger>
              <TabsTrigger
                value="pools"
                className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-black gap-2"
              >
                <Droplets className="w-4 h-4" />
                Pools
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tokens Table */}
        {activeTab === 'tokens' && (
          <Card className="bg-[#1a1a1a] border-white/5 rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-sm text-gray-400">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Token</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right hidden sm:block">24h Change</div>
              <div className="col-span-2 text-right hidden md:block">Market Cap</div>
              <div className="col-span-1 text-right"></div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/5">
              {filteredTokens.map((token, index) => (
                <div
                  key={token.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-1 text-gray-500">{index + 1}</div>

                  {/* Token Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <button
                      onClick={() => toggleFavorite(token.id)}
                      className="text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${favorites.includes(token.id) ? 'fill-amber-400 text-cyan-400' : ''}`}
                      />
                    </button>
                    <img
                      src={token.logo}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-semibold text-white">{token.name}</div>
                      <div className="text-sm text-gray-500">{token.symbol}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right">
                    <span className="text-white font-medium">
                      ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* 24h Change */}
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className={`font-medium flex items-center justify-end gap-1 ${
                      token.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {token.priceChange >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {token.priceChange >= 0 ? '+' : ''}{token.priceChange}%
                    </span>
                  </div>

                  {/* Market Cap */}
                  <div className="col-span-2 text-right hidden md:block">
                    <span className="text-white font-medium">
                      {formatCurrency(token.price * 1000000)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 text-right">
                    <Link to="/swap">
                      <Button
                        size="sm"
                        className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg"
                      >
                        Trade
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pools Table */}
        {activeTab === 'pools' && (
          <Card className="bg-[#1a1a1a] border-white/5 rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-sm text-gray-400">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Pool</div>
              <div className="col-span-2 text-right">TVL</div>
              <div className="col-span-2 text-right hidden sm:block">Volume (24h)</div>
              <div className="col-span-2 text-right">APR</div>
              <div className="col-span-1 text-right"></div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/5">
              {filteredPools.map((pool, index) => (
                <div
                  key={pool.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-1 text-gray-500">{index + 1}</div>

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
                      <div className="text-sm text-gray-500">{pool.fee}% fee</div>
                    </div>
                  </div>

                  {/* TVL */}
                  <div className="col-span-2 text-right">
                    <span className="text-white font-medium">{formatCurrency(pool.tvl)}</span>
                  </div>

                  {/* Volume */}
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className="text-white font-medium">{formatCurrency(pool.volume24h)}</span>
                  </div>

                  {/* APR */}
                  <div className="col-span-2 text-right">
                    <span className="text-green-400 font-semibold">{pool.apr.toFixed(1)}%</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 text-right">
                    <Link to={`/pool/${pool.id}/add`}>
                      <Button
                        size="sm"
                        className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg"
                      >
                        Add
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Trending Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Trending on PioSwap
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tokens.slice(0, 4).map((token, index) => (
              <Card
                key={token.id}
                className="bg-[#1a1a1a] border-white/5 p-4 rounded-2xl hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-gray-500 text-sm">#{index + 1}</span>
                  <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{token.symbol}</div>
                  </div>
                  <span className={`text-sm font-medium ${
                    token.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {token.priceChange >= 0 ? '+' : ''}{token.priceChange}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">
                    ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <Link to="/swap">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 text-cyan-400 hover:text-amber-300 transition-all"
                    >
                      Trade <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
