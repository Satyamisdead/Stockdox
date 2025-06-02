"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart" // Using ShadCN chart components

const chartData = [
  { date: "2024-01", price: 150 },
  { date: "2024-02", price: 155 },
  { date: "2024-03", price: 160 },
  { date: "2024-04", price: 158 },
  { date: "2024-05", price: 165 },
  { date: "2024-06", price: 170 },
  { date: "2024-07", price: 175 },
]

const chartConfig = {
  price: {
    label: "Price (USD)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

type AssetChartProps = {
  assetName: string;
  // In a real app, historicalData would be passed as a prop
  // historicalData: { date: string; price: number }[]; 
};

export default function AssetChart({ assetName }: AssetChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{assetName} Price History (Mock Data)</CardTitle>
        <CardDescription>Last 7 months price trend</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                tickFormatter={(value) => value.slice(-2)} // Show only month part for brevity
                stroke="hsl(var(--foreground))"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                stroke="hsl(var(--foreground))" 
                domain={['dataMin - 5', 'dataMax + 5']}
              />
               <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="price" fill="var(--color-price)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
