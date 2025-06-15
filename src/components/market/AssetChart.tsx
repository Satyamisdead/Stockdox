
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
          // Finnhub exchange names can be "NEW YORK STOCK EXCHANGE, INC." or "NASDAQ NMS - GLOBAL MARKET"
          // We need to simplify them for TradingView.
          else {
            const simpleExchange = exchange.split(' ')[0].toUpperCase(); // Basic heuristic
            tvSymbol = `${simpleExchange}:${symbol.toUpperCase()}`;
          }
        } else {
           // If no exchange, just use symbol - TradingView might pick a default exchange
           tvSymbol = symbol.toUpperCase(); 
        }
      } else if (assetType === 'crypto') {
        const commonCryptoExchanges = ["BINANCE", "COINBASE", "KRAKEN", "BITSTAMP", "KUCOIN", "BYBIT", "OKX"];
        let found = false;

        // Try common USDT pairings first
        for (const ex of commonCryptoExchanges) {
          if (ex === (exchange?.toUpperCase())) { // If exchange prop is provided and matches
             tvSymbol = `${ex}:${symbol.toUpperCase()}USDT`;
             found = true;
             break;
          }
        }
        if (!found) { // Generic fallbacks
          if (symbol.toUpperCase() === 'BTC') { tvSymbol = `BINANCE:BTCUSDT`; }
          else if (symbol.toUpperCase() === 'ETH') { tvSymbol = `BINANCE:ETHUSDT`; }
          else { tvSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;  } // Default if not BTC/ETH or specific exchange
        }
      }
      return tvSymbol;
    };

    const initializeWidget = () => {
      if (chartContainerRef.current && typeof (window as any).TradingView !== 'undefined') {
        chartContainerRef.current.innerHTML = ''; 
        
        const widgetOptions = {
          autosize: true,
          symbol: tradingViewSymbol(),
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1", 
          locale: "en",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: chartContainerRef.current.id,
          hide_side_toolbar: true, 
          details: true, 
          // Removing calendar, hotlist, news to make it more compact
          // "calendar": false,
          // "hotlist": false,
          // "news": [], 
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#FFD700", // Yellow
            "mainSeriesProperties.candleStyle.downColor": "#AAAAAA", // Light Grey
            "mainSeriesProperties.candleStyle.drawBorder": true,
            "mainSeriesProperties.candleStyle.borderUpColor": "#FFD700",
            "mainSeriesProperties.candleStyle.borderDownColor": "#AAAAAA",
            "mainSeriesProperties.candleStyle.wickUpColor": "#FFD700",
            "mainSeriesProperties.candleStyle.wickDownColor": "#AAAAAA",
            "paneProperties.backgroundType": "solid", 
            "paneProperties.background": "hsl(var(--card))", 
            "paneProperties.vertGridProperties.color": "hsla(var(--border), 0.5)",
            "paneProperties.horzGridProperties.color": "hsla(var(--border), 0.5)",
            "scalesProperties.textColor": "hsl(var(--card-foreground))",
            "mainSeriesProperties.priceLineColor": "hsl(var(--primary))"
          },
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
      // Clean up the widget if the component unmounts
      // if (chartContainerRef.current) {
      // chartContainerRef.current.innerHTML = ''; // This can cause issues if script re-runs too quickly
      // }
    };

  }, [symbol, assetType, exchange, name]);

  return (
    <Card className="h-[350px] md:h-[450px] w-full flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">{name} ({symbol}) Chart</CardTitle>
        <CardDescription>Interactive chart powered by TradingView</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4 pr-2"> 
        <div 
          id={`tradingview_chart_widget_${symbol.replace(/[^a-zA-Z0-9]/g, '')}`} 
          ref={chartContainerRef} 
          className="h-full w-full"
        />
      </CardContent>
    </Card>
  );
};

export default AssetChart;

    
