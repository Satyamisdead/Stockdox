
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type PriceDisplayProps = {
  price: number;
  change: number; // percentage, can be null from Finnhub initially
  symbol?: string;
};

export default function PriceDisplay({ price, change, symbol = "USD" }: PriceDisplayProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0 || change === null; // Treat null change as neutral

  // Determine precision based on asset type or price magnitude
  let minFractionDigits = 2;
  let maxFractionDigits = 2;

  if (symbol === "BTC" || symbol === "ETH") {
    minFractionDigits = 2; // BTC/ETH usually shown with 2, but can be more
    maxFractionDigits = price < 1 ? 8 : (price < 100 ? 4 : 2); // More precision for smaller prices
  } else if (price < 0.01 && price !== 0) { // For very small crypto prices (altcoins)
    minFractionDigits = Math.min(8, (price.toString().split('.')[1] || '').length); // Show significant digits
    maxFractionDigits = 8;
  } else if (price < 1 && price !== 0) {
    minFractionDigits = 4;
    maxFractionDigits = 4;
  }


  const formattedPrice = price.toLocaleString(undefined, {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  });
  
  const formattedChange = change !== null ? change.toFixed(2) : "0.00";

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
        {formattedChange}% (24h)
      </div>
    </div>
  );
}
