import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

// Generate mock price data for charts
const generateMockPriceData = (basePrice, days = 30, volatility = 0.05) => {
  const data = [];
  let currentPrice = basePrice;
  const now = Math.floor(Date.now() / 1000);
  const daySeconds = 86400;
  
  for (let i = days; i >= 0; i--) {
    const time = now - (i * daySeconds);
    const change = (Math.random() - 0.5) * 2 * volatility;
    currentPrice = currentPrice * (1 + change);
    
    const open = currentPrice;
    const close = currentPrice * (1 + (Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    
    data.push({
      time,
      open,
      high,
      low,
      close
    });
  }
  
  return data;
};

// Generate volume data
const generateVolumeData = (priceData, baseVolume = 100000) => {
  return priceData.map((item) => ({
    time: item.time,
    value: baseVolume * (0.5 + Math.random()),
    color: item.close >= item.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
  }));
};

const TradeChart = ({ token0, token1, height = 400 }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [loading, setLoading] = useState(true);
  const [priceChange, setPriceChange] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    if (!chartContainerRef.current || !token0 || !token1) return;

    let isMounted = true;
    
    const initChart = () => {
      if (!isMounted) return;
      
      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      // Calculate base price from token prices
      const basePrice = token0.price / token1.price;
      
      // Days based on timeframe
      const daysMap = {
        '1H': 1,
        '1D': 30,
        '1W': 90,
        '1M': 180,
        '1Y': 365
      };
      
      const days = daysMap[timeframe] || 30;
      const priceData = generateMockPriceData(basePrice, days);
      const volumeData = generateVolumeData(priceData);

      // Calculate price change
      if (priceData.length >= 2) {
        const firstPrice = priceData[0].close;
        const lastPrice = priceData[priceData.length - 1].close;
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;
        setPriceChange(change);
        setCurrentPrice(lastPrice);
      }

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#9ca3af'
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: 'rgba(245, 158, 11, 0.5)',
            width: 1,
            style: 2
          },
          horzLine: {
            color: 'rgba(245, 158, 11, 0.5)',
            width: 1,
            style: 2
          }
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)'
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          timeVisible: true,
          secondsVisible: false
        }
      });

      // Add candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e'
      });
      candlestickSeries.setData(priceData);

      // Add volume series
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume'
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0
        }
      });
      volumeSeries.setData(volumeData);

      // Fit content
      chart.timeScale().fitContent();

      chartRef.current = chart;
      setLoading(false);
    };
    
    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setLoading(true);
      requestAnimationFrame(initChart);
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [token0, token1, timeframe, height]);

  if (!token0 || !token1) {
    return (
      <Card className="bg-[#1a1a1a] border-white/5 p-4 rounded-2xl">
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          Select tokens to view chart
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1a1a1a] border-white/5 p-4 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <img src={token0.logo} alt={token0.symbol} className="w-8 h-8 rounded-full border-2 border-[#1a1a1a]" />
            <img src={token1.logo} alt={token1.symbol} className="w-8 h-8 rounded-full border-2 border-[#1a1a1a]" />
          </div>
          <div>
            <div className="font-semibold text-white">
              {token0.symbol}/{token1.symbol}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white font-medium">
                {currentPrice.toFixed(6)}
              </span>
              <span className={priceChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-1">
          {['1H', '1D', '1W', '1M', '1Y'].map((tf) => (
            <Button
              key={tf}
              size="sm"
              variant={timeframe === tf ? 'default' : 'ghost'}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs rounded-lg ${
                timeframe === tf
                  ? 'bg-amber-500 text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/80 z-10">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>
    </Card>
  );
};

export default TradeChart;
