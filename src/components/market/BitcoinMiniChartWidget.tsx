
"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className="border-primary/50 bg-black/40 backdrop-blur-sm shadow-inner"> {/* Removed mt-4 */}
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium text-white">Bitcoin (BTC) Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-lg font-semibold text-white">$43,000.50</p> {/* Placeholder price */}
          <p className="text-xs text-yellow-400">+1.5%</p> {/* Placeholder change, yellow accent */}
        </div>
        <div className="h-[60px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bitcoinChartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 10, 10, 0.85)',
                  borderColor: 'hsl(var(--primary))',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  borderRadius: '0.375rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
                itemStyle={{ color: '#FFFFFF' }}
                labelStyle={{ color: '#BBBBBB' }}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5 }}
              />
              <YAxis domain={['dataMin - 500', 'dataMax + 500']} hide />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))" // Yellow color from theme
                strokeWidth={2}
                dot={{ r: 2, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
