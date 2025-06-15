
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
          else {
            const simpleExchange = exchange.split(' ')[0].toUpperCase();
            tvSymbol = `${simpleExchange}:${symbol.toUpperCase()}`;
          }
        } else {
           tvSymbol = symbol.toUpperCase(); 
        }
      } else if (assetType === 'crypto') {
        const commonCryptoExchanges = ["BINANCE", "COINBASE", "KRAKEN", "BITSTAMP", "KUCOIN", "BYBIT", "OKX"];
        let found = false;
        for (const ex of commonCryptoExchanges) {
          if (ex === (exchange?.toUpperCase())) {
             tvSymbol = `${ex}:${symbol.toUpperCase()}USDT`;
             found = true;
             break;
          }
        }
        if (!found) {
          if (symbol.toUpperCase() === 'BTC') { tvSymbol = `BINANCE:BTCUSDT`; }
          else if (symbol.toUpperCase() === 'ETH') { tvSymbol = `BINANCE:ETHUSDT`; }
          else { tvSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;  }
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
          // "calendar": false, // Already removed by default in minimal widgets. Explicitly keeping it commented.
          // "hotlist": false, // Already removed by default.
          // "news": [], // Already removed by default.
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#FFD700", // Bright Yellow
            "mainSeriesProperties.candleStyle.downColor": "#AAAAAA", // Light Grey (changed from D3D3D3 as AAAA is more distinct on black)
            "mainSeriesProperties.candleStyle.drawBorder": true,
            "mainSeriesProperties.candleStyle.borderUpColor": "#FFD700",
            "mainSeriesProperties.candleStyle.borderDownColor": "#AAAAAA",
            "mainSeriesProperties.candleStyle.wickUpColor": "#FFD700",
            "mainSeriesProperties.candleStyle.wickDownColor": "#AAAAAA",
            "paneProperties.backgroundType": "solid", 
            "paneProperties.background": "hsl(var(--card))", // Match card background from theme
            "paneProperties.vertGridProperties.color": "hsla(var(--border), 0.2)", // Softer grid lines
            "paneProperties.horzGridProperties.color": "hsla(var(--border), 0.2)", // Softer grid lines
            "scalesProperties.textColor": "hsl(var(--card-foreground))", // Match card text from theme
            "mainSeriesProperties.priceLineColor": "hsl(var(--primary))" // Primary color for price line
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

  }, [symbol, assetType, exchange, name]); // Dependencies for re-initializing if asset changes

  return (
    <Card className="h-[350px] md:h-[450px] w-full flex flex-col shadow-lg">
      <CardHeader className="shrink-0">
        <CardTitle className="font-headline">{name} ({symbol}) Chart</CardTitle>
        <CardDescription>Interactive chart powered by TradingView</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4 pr-2"> 
        <div 
          id={`tradingview_chart_widget_${symbol.replace(/[^a-zA-Z0-9]/g, '')}_${assetType}`} // Ensure unique ID
          ref={chartContainerRef} 
          className="h-full w-full"
        />
      </CardContent>
    </Card>
  );
};

export default AssetChart;
