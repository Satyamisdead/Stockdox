
"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Simplified Bitcoin price data for the mini chart
const bitcoinChartData = [
  { name: 'Jan', price: 42000 },
  { name: 'Feb', price: 43500 },
  { name: 'Mar', price: 41500 },
  { name: 'Apr', price: 44000 },
  { name: 'May', price: 45000 },
  { name: 'Jun', price: 43000 },
];

interface BitcoinMiniChartWidgetProps {
  size?: 'sm' | 'md';
}

export default function BitcoinMiniChartWidget({ size = 'md' }: BitcoinMiniChartWidgetProps) {
  const isSmall = size === 'sm';

  return (
    <Link href="/asset/bitcoin" className="block">
      <Card className={cn(
        "border-primary/50 bg-black/40 backdrop-blur-sm shadow-inner flex flex-col cursor-pointer hover:border-primary transition-colors",
        isSmall ? "w-32 h-32" : "w-40 h-40"
      )}>
        <CardHeader className="p-2 shrink-0">
          <CardTitle className={cn(
            "font-medium text-white",
            isSmall ? "text-[10px]" : "text-xs"
          )}>Bitcoin (BTC)</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <p className={cn(
              "font-semibold text-white",
              isSmall ? "text-sm" : "text-base"
            )}>$65k</p>
            <p className={cn(
              "text-yellow-400",
               isSmall ? "text-[10px]" : "text-xs"
            )}>+1.5%</p>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bitcoinChartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 10, 10, 0.85)',
                    borderColor: 'hsl(var(--primary))',
                    color: '#FFFFFF',
                    fontSize: isSmall ? '9px' : '10px',
                    borderRadius: '0.25rem',
                    padding: '4px 8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                  labelStyle={{ color: '#BBBBBB' }}
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
                />
                <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} hide />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={isSmall ? 1 : 1.5}
                  dot={{ r: isSmall ? 0.5 : 1, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
