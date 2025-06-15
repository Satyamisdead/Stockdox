
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
  const scriptAddedRef = useRef(false); // To ensure script is added only once

  useEffect(() => {
    // Ensure this effect runs only on the client
    if (typeof window === 'undefined' || !chartContainerRef.current) {
      return;
    }

    const tradingViewSymbol = () => {
      let tvSymbol = symbol.toUpperCase();
      if (assetType === 'stock') {
        if (exchange) {
          if (exchange.toUpperCase().includes('NASDAQ')) tvSymbol = `NASDAQ:${symbol.toUpperCase()}`;
          else if (exchange.toUpperCase().includes('NYSE')) tvSymbol = `NYSE:${symbol.toUpperCase()}`;
          // Add more common exchange mappings if needed
          else tvSymbol = `${exchange.split(' ')[0].toUpperCase()}:${symbol.toUpperCase()}`; // Basic attempt
        } else {
           tvSymbol = symbol.toUpperCase(); // Default to symbol if no exchange
        }
      } else if (assetType === 'crypto') {
        // Common TradingView crypto pairings
        if (symbol.toUpperCase() === 'BTC') tvSymbol = 'BINANCE:BTCUSDT';
        else if (symbol.toUpperCase() === 'ETH') tvSymbol = 'BINANCE:ETHUSDT';
        else if (symbol.toUpperCase() === 'SOL') tvSymbol = 'BINANCE:SOLUSDT';
        else if (symbol.toUpperCase() === 'ADA') tvSymbol = 'BINANCE:ADAUSDT';
        else tvSymbol = `BINANCE:${symbol.toUpperCase()}USDT`; // Default to Binance USDT pair
      }
      return tvSymbol;
    };

    const initializeWidget = () => {
      if (chartContainerRef.current && typeof (window as any).TradingView !== 'undefined') {
        // Clear previous widget if any
        chartContainerRef.current.innerHTML = '';
        
        const widgetOptions = {
          autosize: true,
          symbol: tradingViewSymbol(),
          interval: "D", // Daily interval
          timezone: "Etc/UTC",
          theme: "dark", // Match app theme
          style: "1", // 1 for Candlesticks, 2 for Line, 3 for Area
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: chartContainerRef.current.id,
          hide_side_toolbar: false,
          details: true, // Show details like open, high, low, close
          hotlist: true,
          calendar: true, // Show economic calendar
          news: [symbol.toUpperCase()], // Attempt to show news for the symbol
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
        scriptAddedRef.current = true; // Mark script as loaded
        initializeWidget();
      };
      script.onerror = () => {
        console.error("TradingView script failed to load.");
      }
      document.head.appendChild(script);
    } else {
      // Script already loaded, just initialize widget
      initializeWidget();
    }

    // Basic cleanup: remove the widget container's content when symbol changes or component unmounts
    return () => {
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
      }
      // Note: Properly "destroying" a TradingView widget created this way can be complex.
      // For more robust cleanup, especially if this component re-renders frequently with
      // different symbols without full page reloads, a more advanced integration pattern
      // with TradingView's Charting Library (if licensed) might be needed.
      // The script itself is generally not removed as it might be used by other widgets.
    };

  }, [symbol, assetType, exchange]); // Re-initialize if these props change

  return (
    <Card className="h-[400px] md:h-[500px] w-full"> {/* Ensure Card has defined height for autosize */}
      <CardHeader>
        <CardTitle>{name} Chart</CardTitle>
        <CardDescription>Powered by TradingView</CardDescription>
      </CardHeader>
      <CardContent className="h-full pb-6"> {/* Adjust padding as needed */}
        <div 
          id={`tradingview_chart_widget_${symbol}`} // Unique ID per symbol instance (though one per page)
          ref={chartContainerRef} 
          style={{ height: 'calc(100% - 40px)', width: '100%' }} // Ensure container has dimensions
        />
      </CardContent>
    </Card>
  );
};

export default AssetChart;
