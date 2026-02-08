import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress, NETWORK_CONFIG } from '../../data/mock';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog';
import {
  Wallet,
  ChevronDown,
  ExternalLink,
  Copy,
  LogOut,
  Settings,
  BarChart3,
  Droplets,
  ArrowLeftRight,
  Menu,
  X
} from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const { isConnected, address, connectWallet, disconnectWallet, isConnecting, networkConfig } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const navItems = [
    { path: '/swap', label: 'Swap', icon: ArrowLeftRight },
    { path: '/pools', label: 'Pools', icon: Droplets },
    { path: '/explore', label: 'Explore', icon: BarChart3 }
  ];

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    setShowWalletModal(false);
    await connectWallet();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src="/logo.png" 
              alt="PioSwap" 
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Network Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-400 text-sm font-medium">{networkConfig.name}</span>
            </div>

            {/* Wallet Button */}
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-xl gap-2"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500" />
                    {shortenAddress(address)}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#1a1a1a] border-white/10" align="end">
                  <DropdownMenuItem
                    onClick={handleCopyAddress}
                    className="text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy Address'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.open(`${networkConfig.explorer}/address/${address}`, '_blank')}
                    className="text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={disconnectWallet}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setShowWalletModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl gap-2"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0d0d0d]">
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Wallet Connection Modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Connect a Wallet</DialogTitle>
            <DialogDescription className="text-gray-400">
              Connect your wallet to start trading on PIOGOLD network
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold group-hover:text-amber-400 transition-colors">
                  {isConnecting ? 'Connecting...' : 'PioGold Wallet'}
                </div>
                <div className="text-sm text-gray-500">Connect to PIOGOLD Mainnet</div>
              </div>
            </button>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 40 40" fill="currentColor">
                  <path d="M12.23 14.88c4.29-4.18 11.25-4.18 15.54 0l.52.5a.55.55 0 010 .76l-1.77 1.72a.29.29 0 01-.39 0l-.71-.69c-2.99-2.92-7.84-2.92-10.84 0l-.76.74a.29.29 0 01-.39 0l-1.77-1.72a.55.55 0 010-.76l.57-.55zm19.19 3.57l1.57 1.53a.55.55 0 010 .76l-7.09 6.91a.58.58 0 01-.78 0l-5.03-4.9a.14.14 0 00-.19 0l-5.03 4.9a.58.58 0 01-.78 0L7 20.74a.55.55 0 010-.76l1.57-1.53a.58.58 0 01.78 0l5.03 4.9c.05.05.14.05.19 0l5.03-4.9a.58.58 0 01.78 0l5.03 4.9c.05.05.14.05.19 0l5.03-4.9a.58.58 0 01.78 0z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold group-hover:text-blue-400 transition-colors">
                  WalletConnect
                </div>
                <div className="text-sm text-gray-500">Scan with your wallet</div>
              </div>
            </button>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-600/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0052FF] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                  <rect x="9" y="9" width="6" height="6" rx="1" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold group-hover:text-blue-400 transition-colors">
                  Coinbase Wallet
                </div>
                <div className="text-sm text-gray-500">Connect to Coinbase</div>
              </div>
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            By connecting, you agree to PioSwap&apos;s Terms of Service
          </p>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
