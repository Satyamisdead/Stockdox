
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
  const isWidgetCreated = useRef(false); 

  useEffect(() => {
    // Ensure this code runs only on the client
    if (typeof window === 'undefined' || !chartContainerRef.current) {
      return;
    }

    const tradingViewSymbol = () => {
      let tvSymbol = symbol.toUpperCase();
      if (assetType === 'stock') {
        const upperExchange = exchange?.toUpperCase();
        if (upperExchange === 'NASDAQ' || upperExchange === 'NYSE') {
          tvSymbol = `${upperExchange}:${symbol.toUpperCase()}`;
        } else {
          tvSymbol = symbol.toUpperCase();
        }
      } else if (assetType === 'crypto') {
        const cryptoExchange = exchange ? exchange.toUpperCase() : "BINANCE";
        if (symbol.toUpperCase() === 'BTC') tvSymbol = `${cryptoExchange}:BTCUSDT`;
        else if (symbol.toUpperCase() === 'ETH') tvSymbol = `${cryptoExchange}:ETHUSDT`;
        else tvSymbol = `${cryptoExchange}:${symbol.toUpperCase()}USDT`; 
      }
      console.log(`[AssetChart] Attempting TradingView Symbol: ${tvSymbol} for ${name} (${symbol}, ${assetType}, exchange: ${exchange})`);
      return tvSymbol;
    };

    const initializeWidget = () => {
      if (chartContainerRef.current && typeof (window as any).TradingView !== 'undefined' && !isWidgetCreated.current) {
        // Clear previous widget if any
        chartContainerRef.current.innerHTML = ''; 
        
        const darkCardBackground = '#0D0D0D'; 
        const darkBorderTransparent = 'rgba(38, 38, 38, 0.2)'; 
        const darkCardForeground = '#D3D3D3'; 
        const darkPrimaryYellow = '#FFD700'; 
        const candleDownColor = '#AAAAAA'; 

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
        isWidgetCreated.current = true;
      }
    };
    
    // Check if TradingView is already loaded. If not, wait for it.
    if (typeof (window as any).TradingView !== 'undefined') {
        initializeWidget();
    } else {
        const interval = setInterval(() => {
            if (typeof (window as any).TradingView !== 'undefined') {
                clearInterval(interval);
                initializeWidget();
            }
        }, 100);
    }

  }, [symbol, assetType, exchange, name]); 

  return (
    <Card className="h-[350px] md:h-[450px] w-full flex flex-col shadow-lg overflow-hidden">
      <CardHeader className="shrink-0 z-10">
        <CardTitle className="font-headline">{name} ({symbol.toUpperCase()}) Chart</CardTitle>
        <CardDescription>Realtime chart Powered By TradingView</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4 pr-2 flex z-0"> 
        <div 
          id={`tradingview_chart_widget_${symbol.replace(/[^a-zA-Z0-9]/g, '')}_${assetType}`} 
          ref={chartContainerRef} 
          className="h-full w-full"
        />
      </CardContent>
    </Card>
  );
};

export default AssetChart;
