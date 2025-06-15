
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
    // Ensure this code runs only on the client
    if (typeof window === 'undefined' || !chartContainerRef.current) {
      return;
    }

    const tradingViewSymbol = () => {
      let tvSymbol = symbol.toUpperCase();
      if (assetType === 'stock') {
        const upperExchange = exchange?.toUpperCase();
        if (upperExchange === 'NASDAQ') tvSymbol = `NASDAQ:${symbol.toUpperCase()}`;
        else if (upperExchange === 'NYSE') tvSymbol = `NYSE:${symbol.toUpperCase()}`;
        else if (upperExchange) tvSymbol = `${upperExchange}:${symbol.toUpperCase()}`;
        // If no exchange or not a major one, TradingView might still find common symbols like 'AAPL'
      } else if (assetType === 'crypto') {
        // Default to USDT pairing on a major exchange like Binance or use provided exchange.
        const cryptoExchange = exchange ? exchange.toUpperCase() : "BINANCE";
        if (symbol.toUpperCase() === 'BTC') tvSymbol = `${cryptoExchange}:BTCUSDT`;
        else if (symbol.toUpperCase() === 'ETH') tvSymbol = `${cryptoExchange}:ETHUSDT`;
        else tvSymbol = `${cryptoExchange}:${symbol.toUpperCase()}USDT`; 
      }
      console.log(`[AssetChart] Attempting TradingView Symbol: ${tvSymbol} for ${name} (${symbol}, ${assetType}, exchange: ${exchange})`);
      return tvSymbol;
    };

    const initializeWidget = () => {
      if (chartContainerRef.current && typeof (window as any).TradingView !== 'undefined') {
        // Clear previous widget if any
        chartContainerRef.current.innerHTML = ''; 
        
        // Dark theme color values from your globals.css (approximated HEX/RGBA)
        const darkCardBackground = '#0D0D0D'; // hsl(0 0% 5%)
        const darkBorderTransparent = 'rgba(38, 38, 38, 0.2)'; // hsla(0, 0%, 15%, 0.2)
        const darkCardForeground = '#D3D3D3'; // hsl(0 0% 82.7%)
        const darkPrimaryYellow = '#FFD700'; // hsl(51 100% 50%)
        const candleDownColor = '#AAAAAA'; // Light grey

        const widgetOptions = {
          autosize: true,
          symbol: tradingViewSymbol(),
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark", // Using TradingView's dark theme as a base
          style: "1", // Candlesticks
          locale: "en",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: chartContainerRef.current.id,
          hide_side_toolbar: true,
          details: true, 
          // Removed calendar, hotlist, news for compactness
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": darkPrimaryYellow,
            "mainSeriesProperties.candleStyle.downColor": candleDownColor,
            "mainSeriesProperties.candleStyle.drawBorder": true,
            "mainSeriesProperties.candleStyle.borderUpColor": darkPrimaryYellow,
            "mainSeriesProperties.candleStyle.borderDownColor": candleDownColor,
            "mainSeriesProperties.candleStyle.wickUpColor": darkPrimaryYellow,
            "mainSeriesProperties.candleStyle.wickDownColor": candleDownColor,
            
            "paneProperties.backgroundType": "solid",
            "paneProperties.background": darkCardBackground,
            "paneProperties.vertGridProperties.color": darkBorderTransparent,
            "paneProperties.horzGridProperties.color": darkBorderTransparent,
            "scalesProperties.textColor": darkCardForeground,
            "mainSeriesProperties.priceLineColor": darkPrimaryYellow 
          },
        };
        
        new (window as any).TradingView.widget(widgetOptions);
      } else if (chartContainerRef.current && !scriptAddedRef.current) {
        // Script might not be loaded yet, wait for script.onload
        console.warn("[AssetChart] TradingView script not loaded yet, widget initialization deferred.");
      } else if (!chartContainerRef.current) {
        console.warn("[AssetChart] Chart container ref is not available.");
      }
    };

    if (!scriptAddedRef.current) {
      const script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        console.log("[AssetChart] TradingView script loaded successfully.");
        scriptAddedRef.current = true;
        initializeWidget();
      };
      script.onerror = () => {
        console.error("[AssetChart] TradingView script failed to load.");
      }
      document.head.appendChild(script);
    } else {
      // Script already added, just initialize
      initializeWidget();
    }

    // Cleanup function to remove the script if the component unmounts,
    // though generally not strictly necessary if scriptAddedRef prevents re-adding.
    // return () => {
    //   const tvScript = document.getElementById('tradingview-widget-script');
    //   if (tvScript && tvScript.parentElement === document.head) {
    //      // document.head.removeChild(tvScript); // Be cautious with removing shared scripts
    //      // scriptAddedRef.current = false; // Reset if script removal is aggressive
    //   }
    // };
  }, [symbol, assetType, exchange, name]); // Re-initialize if these key props change

  return (
    <Card className="h-[350px] md:h-[450px] w-full flex flex-col shadow-lg">
      <CardHeader className="shrink-0">
        <CardTitle className="font-headline">{name} ({symbol.toUpperCase()}) Chart</CardTitle>
        <CardDescription>Interactive chart powered by TradingView</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4 pr-2 flex"> {/* Added flex here */}
        <div 
          id={`tradingview_chart_widget_${symbol.replace(/[^a-zA-Z0-9]/g, '')}_${assetType}`} 
          ref={chartContainerRef} 
          className="h-full w-full" // Ensure div takes full space of CardContent
        />
      </CardContent>
    </Card>
  );
};

export default AssetChart;

