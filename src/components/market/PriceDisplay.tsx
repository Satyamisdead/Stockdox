import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type PriceDisplayProps = {
  price: number;
  change: number; // percentage
  symbol?: string;
};

export default function PriceDisplay({ price, change, symbol = "USD" }: PriceDisplayProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const formattedPrice = price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: symbol === "BTC" || symbol === "ETH" ? 8 : 2, // More precision for crypto
  });

  return (
    <div className="flex flex-col items-start">
      <p className="text-2xl font-semibold text-foreground">
        ${formattedPrice}
      </p>
      <div
        className={cn(
          "flex items-center text-sm font-medium",
          isPositive && "text-green-500",
          isNegative && "text-red-500",
          isNeutral && "text-muted-foreground"
        )}
      >
        {isPositive && <TrendingUp className="mr-1 h-4 w-4" />}
        {isNegative && <TrendingDown className="mr-1 h-4 w-4" />}
        {isNeutral && <Minus className="mr-1 h-4 w-4" />}
        {change.toFixed(2)}% (24h)
      </div>
    </div>
  );
}
