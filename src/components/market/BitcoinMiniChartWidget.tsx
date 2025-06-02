
"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Simplified Bitcoin price data for the mini chart
const bitcoinChartData = [
  { name: 'Jan', price: 42000 },
  { name: 'Feb', price: 43500 },
  { name: 'Mar', price: 41500 },
  { name: 'Apr', price: 44000 },
  { name: 'May', price: 45000 },
  { name: 'Jun', price: 43000 },
];

export default function BitcoinMiniChartWidget() {
  return (
    <Link href="/asset/bitcoin" className="block">
      <Card className="border-primary/50 bg-black/40 backdrop-blur-sm shadow-inner w-40 h-40 flex flex-col cursor-pointer hover:border-primary transition-colors">
        <CardHeader className="p-2 shrink-0">
          <CardTitle className="text-xs font-medium text-white">Bitcoin (BTC)</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <p className="text-base font-semibold text-white">$65k</p> {/* Placeholder price, shortened, updated to reflect new data */}
            <p className="text-xs text-yellow-400">+1.5%</p> {/* Placeholder change, yellow accent */}
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bitcoinChartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 10, 10, 0.85)',
                    borderColor: 'hsl(var(--primary))',
                    color: '#FFFFFF',
                    fontSize: '10px', // Smaller tooltip font
                    borderRadius: '0.25rem', // Smaller border radius
                    padding: '4px 8px', // Reduced padding
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
                  stroke="hsl(var(--primary))" // Yellow color from theme
                  strokeWidth={1.5} // Thinner line
                  dot={{ r: 1, fill: 'hsl(var(--primary))', strokeWidth: 0 }} // Smaller dots
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
