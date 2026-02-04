import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { TOKENS, PROTOCOL_STATS } from '../data/mock';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  ArrowRight,
  Wallet,
  ArrowLeftRight,
  Droplets,
  BarChart3,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const HomePage = () => {
  const { isConnected, connectWallet, isConnecting } = useWallet();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-orange-500/3 rounded-full blur-[130px]" />
      </div>

      {/* Animated Token Ticker */}
      <div className="relative z-10 border-b border-white/5 bg-black/30 backdrop-blur-sm overflow-hidden">
        <div className="flex animate-scroll gap-8 py-3 px-4">
          {[...TOKENS, ...TOKENS].map((token, i) => (
            <div key={`${token.id}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
              <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
              <span className="text-white font-medium">{token.symbol}</span>
              <span className={token.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                {token.priceChange >= 0 ? '+' : ''}{token.priceChange}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Powered by PIOGOLD Network
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Swap <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">anytime</span>,
            <br />anywhere.
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Trade tokens with zero app fees on PIOGOLD network. The trusted DeFi platform for fast, secure swaps.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/swap">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl px-8 py-6 text-lg gap-2 group"
              >
                Start Trading
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/explore">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 rounded-xl px-8 py-6 text-lg gap-2"
              >
                Explore Tokens
              </Button>
            </Link>
          </div>
        </div>

        {/* Mini Swap Preview */}
        <div className="max-w-md mx-auto">
          <Card className="bg-[#1a1a1a]/80 backdrop-blur-sm border-white/5 p-6 rounded-2xl">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Sell</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 text-3xl font-bold text-gray-600">0</div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
                <img src={TOKENS[0].logo} alt="PIO" className="w-6 h-6 rounded-full" />
                <span className="font-semibold text-white">PIO</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Buy</span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 text-3xl font-bold text-gray-600">0</div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-gray-400">Select token</span>
              </div>
            </div>
            <Link to="/swap">
              <Button className="w-full py-5 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl">
                Get started
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-y border-white/5 bg-black/30 backdrop-blur-sm py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            DeFi&apos;s leading protocol.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Powering trillions.
            </span>
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            PioSwap powers some of the most used DeFi products on PIOGOLD. Experience permissionless access, proven security, and dedicated support.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-[#1a1a1a] border-white/5 p-6 rounded-2xl text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">${PROTOCOL_STATS.totalVolume}</div>
              <div className="text-gray-400">All time volume</div>
            </Card>
            <Card className="bg-[#1a1a1a] border-white/5 p-6 rounded-2xl text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">${PROTOCOL_STATS.tvl}</div>
              <div className="text-gray-400">Total value locked</div>
            </Card>
            <Card className="bg-[#1a1a1a] border-white/5 p-6 rounded-2xl text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">{PROTOCOL_STATS.totalSwappers}</div>
              <div className="text-gray-400">All time swappers</div>
            </Card>
            <Card className="bg-[#1a1a1a] border-white/5 p-6 rounded-2xl text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">${PROTOCOL_STATS.volume24h}</div>
              <div className="text-gray-400">24H swap volume</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Built for all the ways you swap
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
          Whether you&apos;re a trader, liquidity provider, or developer — PioSwap has you covered.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Swap Card */}
          <Link to="/swap">
            <Card className="bg-[#1a1a1a] border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-all group h-full">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4">
                <ArrowLeftRight className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                Instant Swaps
              </h3>
              <p className="text-gray-400 mb-4">
                Swap tokens instantly with deep liquidity and competitive rates. Zero platform fees.
              </p>
              <span className="text-amber-400 flex items-center gap-1">
                Start swapping <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Card>
          </Link>

          {/* Pools Card */}
          <Link to="/pools">
            <Card className="bg-[#1a1a1a] border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-all group h-full">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-4">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                Liquidity Pools
              </h3>
              <p className="text-gray-400 mb-4">
                Provide liquidity and earn fees on every swap. Create custom pools with flexible fee tiers.
              </p>
              <span className="text-blue-400 flex items-center gap-1">
                Explore pools <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Card>
          </Link>

          {/* Explore Card */}
          <Link to="/explore">
            <Card className="bg-[#1a1a1a] border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-all group h-full">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
                Token Explorer
              </h3>
              <p className="text-gray-400 mb-4">
                Discover trending tokens, track prices, and analyze market data on PIOGOLD network.
              </p>
              <span className="text-green-400 flex items-center gap-1">
                Explore tokens <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Card>
          </Link>
        </div>

        {/* Trust Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Secure & Audited</h4>
              <p className="text-gray-400 text-sm">Battle-tested smart contracts with multiple security audits</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Lightning Fast</h4>
              <p className="text-gray-400 text-sm">Near-instant transactions on PIOGOLD network</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <Globe className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Permissionless</h4>
              <p className="text-gray-400 text-sm">Open access for everyone, no restrictions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/30 backdrop-blur-sm py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <span className="text-black font-bold">P</span>
                </div>
                <span className="text-lg font-bold text-white">PioSwap</span>
              </div>
              <p className="text-gray-400 text-sm">
                The leading DEX on PIOGOLD network. Trade, earn, and build.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Products</h4>
              <ul className="space-y-2">
                <li><Link to="/swap" className="text-gray-400 hover:text-white transition-colors">Swap</Link></li>
                <li><Link to="/pools" className="text-gray-400 hover:text-white transition-colors">Pools</Link></li>
                <li><Link to="/explore" className="text-gray-400 hover:text-white transition-colors">Explore</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="https://pioscan.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">Explorer <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Network</h4>
              <div className="text-gray-400 text-sm space-y-1">
                <p>Chain ID: 42357</p>
                <p>Symbol: PIO</p>
                <p className="truncate">RPC: datasheed.pioscan.com</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 text-center text-gray-500 text-sm">
            © 2025 PioSwap. All rights reserved.
          </div>
        </div>
      </footer>

      {/* CSS for ticker animation */}
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
