
"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Simplified Apple stock price data for the mini chart (remains static)
const appleStockChartData = [
  { name: 'Jan', price: 165 },
  { name: 'Feb', price: 170 },
  { name: 'Mar', price: 168 },
  { name: 'Apr', price: 172 },
  { name: 'May', price: 175 },
  { name: 'Jun', price: 170 },
];

interface AppleStockMiniChartWidgetProps {
  size?: 'sm' | 'md';
  currentPrice?: number;
  currentChangePercent?: number;
}

export default function AppleStockMiniChartWidget({ size = 'md', currentPrice, currentChangePercent }: AppleStockMiniChartWidgetProps) {
  const isSmall = size === 'sm';

  let displayPrice: string;
  if (currentPrice !== undefined) {
    displayPrice = `$${currentPrice.toFixed(2)}`;
  } else {
    displayPrice = "$170.00"; // Static fallback
  }

  const change = currentChangePercent;
  const isPositive = change !== undefined ? change > 0 : true; // Default based on static
  let displayChange: string;
  if (change !== undefined) {
    displayChange = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
  } else {
    displayChange = "+1.25%"; // Static fallback
  }

  return (
    <Link href="/asset/aapl" className="block">
      <Card className={cn(
        "border-sky-500/50 bg-black/40 backdrop-blur-sm shadow-inner flex flex-col cursor-pointer hover:border-sky-500 transition-colors border-2",
        isSmall ? "w-28 h-28" : "w-36 h-36"
      )}>
        <CardHeader className={cn("shrink-0", isSmall ? "p-1.5" : "p-2")}>
          <CardTitle className={cn(
            "font-medium text-white",
            isSmall ? "text-[9px]" : "text-xs"
          )}>Apple (AAPL)</CardTitle>
        </CardHeader>
        <CardContent className={cn("flex flex-col flex-1 pt-0", isSmall ? "p-1.5" : "p-2")}>
          <div className="flex items-center justify-between mb-0.5 shrink-0">
            <p className={cn(
              "font-semibold text-white",
              isSmall ? "text-xs" : "text-base"
            )}>{displayPrice}</p>
            <p className={cn(
              isPositive ? 'text-sky-400' : 'text-red-400',
              isSmall ? "text-[9px]" : "text-xs"
            )}>{displayChange}</p>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appleStockChartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 10, 10, 0.85)',
                    borderColor: 'hsl(var(--chart-2))',
                    color: '#FFFFFF',
                    fontSize: isSmall ? '9px' : '10px',
                    borderRadius: '0.25rem',
                    padding: '4px 8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                  labelStyle={{ color: '#BBBBBB' }}
                  cursor={{ stroke: 'hsl(var(--chart-2))', strokeWidth: 1 }}
                />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={isSmall ? 1.5 : 2}
                  dot={{ r: isSmall ? 1 : 1.5, fill: 'hsl(var(--chart-2))', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
