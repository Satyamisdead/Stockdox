
"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Simplified Apple stock price data for the mini chart
const appleStockChartData = [
  { name: 'Jan', price: 165 },
  { name: 'Feb', price: 170 },
  { name: 'Mar', price: 168 },
  { name: 'Apr', price: 172 },
  { name: 'May', price: 175 },
  { name: 'Jun', price: 170 },
];

export default function AppleStockMiniChartWidget() {
  // Placeholder values for Apple stock
  const displayPrice = "$170"; 
  const displayChange = "+1.25%";
  const isPositive = true; // Based on +1.25%

  return (
    <Link href="/asset/aapl" className="block">
      <Card className="border-sky-500/50 bg-black/40 backdrop-blur-sm shadow-inner w-40 h-40 flex flex-col cursor-pointer hover:border-sky-500 transition-colors">
        <CardHeader className="p-2 shrink-0">
          <CardTitle className="text-xs font-medium text-white">Apple (AAPL)</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <p className="text-base font-semibold text-white">{displayPrice}</p>
            <p className={`text-xs ${isPositive ? 'text-sky-400' : 'text-red-400'}`}>{displayChange}</p>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appleStockChartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 10, 10, 0.85)',
                    borderColor: 'hsl(var(--chart-2))', // Sky blue for tooltip border
                    color: '#FFFFFF',
                    fontSize: '10px',
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
                  stroke="hsl(var(--chart-2))" // Sky blue color for the line
                  strokeWidth={1.5}
                  dot={{ r: 1, fill: 'hsl(var(--chart-2))', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
