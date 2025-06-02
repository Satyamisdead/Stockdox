
"use client";

import BitcoinMiniChartWidget from "@/components/market/BitcoinMiniChartWidget";
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
    <div className="flex flex-col items-center space-y-8 pt-8">
      <BitcoinMiniChartWidget />
      <div className="w-full max-w-md">
        <SearchBar onSearch={handleSearch} />
      </div>
      <p className="text-sm text-muted-foreground text-center px-4">
        Enter a stock or crypto name to search on the dashboard.
      </p>
    </div>
  );
}
