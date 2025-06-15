
"use client";

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type AssetChartProps = {
  symbol: string;
  assetType: 'stock' | 'crypto';
  exchange?: string;
  name: string;
};

const AssetChart: React.FC<AssetChartProps> = ({ symbol, assetType, exchange, name }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const scriptAddedRef = useRef(false); 

  useEffect(() => {
    if (typeof window === 'undefined' || !chartContainerRef.current) {
      return;
    }

    const tradingViewSymbol = () => {
      let tvSymbol = symbol.toUpperCase();
      if (assetType === 'stock') {
        if (exchange) {
          if (exchange.toUpperCase().includes('NASDAQ')) tvSymbol = `NASDAQ:${symbol.toUpperCase()}`;
          else if (exchange.toUpperCase().includes('NYSE')) tvSymbol = `NYSE:${symbol.toUpperCase()}`;
          else tvSymbol = `${exchange.split(' ')[0].toUpperCase()}:${symbol.toUpperCase()}`;
        } else {
           tvSymbol = symbol.toUpperCase(); 
        }
      } else if (assetType === 'crypto') {
        // Prefer more specific exchange pairs if known, otherwise default to BINANCE:SYMBOLUSDT
        // This mapping can be expanded based on common TradingView crypto symbols
        const commonCryptoExchanges = ["BINANCE", "COINBASE", "KRAKEN", "BITSTAMP", "KUCOIN", "BYBIT", "OKX"];
        let found = false;
        for (const ex of commonCryptoExchanges) {
            // Attempt common pairings like BTCUSDT, ETHUSDT. Some exchanges might list BTCUSD.
            // This is a heuristic. A more robust solution might involve a symbol mapping service.
            if (symbol.toUpperCase() === 'BTC') { tvSymbol = `${ex}:BTCUSDT`; found = true; break;}
            if (symbol.toUpperCase() === 'ETH') { tvSymbol = `${ex}:ETHUSDT`; found = true; break;}
        }
        if (!found) { // Default if not BTC/ETH or a more specific mapping isn't set
            tvSymbol = `BINANCE:${symbol.toUpperCase()}USDT`; 
        }
      }
      return tvSymbol;
    };

    const initializeWidget = () => {
      if (chartContainerRef.current && typeof (window as any).TradingView !== 'undefined') {
        chartContainerRef.current.innerHTML = ''; // Clear previous widget
        
        const widgetOptions = {
          autosize: true,
          symbol: tradingViewSymbol(),
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1", // Candlesticks
          locale: "en",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: chartContainerRef.current.id,
          hide_side_toolbar: true, // For compactness
          details: true, // Shows OHL C under legend
          // Removed hotlist, calendar, news for more compactness
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#FFD700",    // Yellow
            "mainSeriesProperties.candleStyle.downColor": "#AAAAAA",  // Light Grey
            "mainSeriesProperties.candleStyle.drawBorder": true,
            "mainSeriesProperties.candleStyle.borderUpColor": "#FFD700",
            "mainSeriesProperties.candleStyle.borderDownColor": "#AAAAAA",
            "mainSeriesProperties.candleStyle.wickUpColor": "#FFD700",
            "mainSeriesProperties.candleStyle.wickDownColor": "#AAAAAA",
            // You can also override background and grid colors if needed
            // "paneProperties.background": "#1A1A1A", // Example: very dark grey
            // "paneProperties.vertGridProperties.color": "#333333",
            // "paneProperties.horzGridProperties.color": "#333333",
          },
          // For further compactness, especially on mobile, you might consider:
          // hide_top_toolbar: true, // If you want to remove the top toolbar with timeframes, etc.
        };
        
        new (window as any).TradingView.widget(widgetOptions);
      }
    };

    if (!scriptAddedRef.current) {
      const script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        scriptAddedRef.current = true;
        initializeWidget();
      };
      script.onerror = () => {
        console.error("TradingView script failed to load.");
      }
      document.head.appendChild(script);
    } else {
      initializeWidget();
    }

    return () => {
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
      }
    };

  }, [symbol, assetType, exchange, name]); // Added name to dependencies, though not directly used in logic, good practice if future options depend on it.

  return (
    <Card className="h-[350px] md:h-[450px] w-full"> {/* Adjusted height for compactness */}
      <CardHeader>
        <CardTitle>{name} Chart</CardTitle>
        <CardDescription>Powered by TradingView</CardDescription>
      </CardHeader>
      <CardContent className="h-full pb-6">
        <div 
          id={`tradingview_chart_widget_${symbol.replace(/[^a-zA-Z0-9]/g, '')}`} // Ensure ID is DOM-friendly
          ref={chartContainerRef} 
          style={{ height: 'calc(100% - 40px)', width: '100%' }}
        />
      </CardContent>
    </Card>
  );
};

export default AssetChart;
