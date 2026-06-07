
"use client";

import BitcoinMiniChartWidget from "@/components/market/BitcoinMiniChartWidget";
import AppleStockMiniChartWidget from "@/components/market/AppleStockMiniChartWidget";
import SearchBar from "@/components/market/SearchBar";
import { useRouter } from "next/navigation";

export default function MobileSearchPage() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/'); // Navigate to home if search is empty
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 pt-8">
      <div className="flex items-center justify-center gap-4">
        <BitcoinMiniChartWidget size="sm" />
        <AppleStockMiniChartWidget size="sm" />
      </div>
      <div className="w-full max-w-md px-4">
        <SearchBar onSearch={handleSearch} />
      </div>
      <p className="text-sm text-muted-foreground text-center px-4">
        Enter a stock or crypto name to search on the dashboard.
      </p>
    </div>
  );
}
