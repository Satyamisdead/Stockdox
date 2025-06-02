
"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Simplified Apple stock price data for the mini chart
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
}

export default function AppleStockMiniChartWidget({ size = 'md' }: AppleStockMiniChartWidgetProps) {
  const isSmall = size === 'sm';
  // Placeholder values for Apple stock
  const displayPrice = "$170"; 
  const displayChange = "+1.25%";
  const isPositive = true; // Based on +1.25%

  return (
    <Link href="/asset/aapl" className="block">
      <Card className={cn(
        "border-sky-500/50 bg-black/40 backdrop-blur-sm shadow-inner flex flex-col cursor-pointer hover:border-sky-500 transition-colors",
        isSmall ? "w-32 h-32" : "w-40 h-40"
      )}>
        <CardHeader className="p-2 shrink-0">
          <CardTitle className={cn(
            "font-medium text-white",
            isSmall ? "text-[10px]" : "text-xs"
          )}>Apple (AAPL)</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <p className={cn(
              "font-semibold text-white",
              isSmall ? "text-sm" : "text-base"
            )}>{displayPrice}</p>
            <p className={cn(
              isPositive ? 'text-sky-400' : 'text-red-400',
              isSmall ? "text-[10px]" : "text-xs"
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
                  strokeWidth={isSmall ? 1 : 1.5}
                  dot={{ r: isSmall ? 0.5 : 1, fill: 'hsl(var(--chart-2))', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
