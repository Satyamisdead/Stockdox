"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import { useState } from "react";

type FilterOptions = {
  type: "all" | "stock" | "crypto";
  marketCap: "all" | "large" | "mid" | "small";
  // Add more filters as needed
};

type FilterControlsProps = {
  onFilterChange: (filters: FilterOptions) => void;
};

export default function FilterControls({ onFilterChange }: FilterControlsProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    marketCap: "all",
  });

  const handleTypeChange = (type: "all" | "stock" | "crypto") => {
    const newFilters = { ...filters, type };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Add more handlers for other filters

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-1">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Asset Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.type === "all"}
            onCheckedChange={() => handleTypeChange("all")}
          >
            All Types
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.type === "stock"}
            onCheckedChange={() => handleTypeChange("stock")}
          >
            Stocks
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.type === "crypto"}
            onCheckedChange={() => handleTypeChange("crypto")}
          >
            Cryptocurrencies
          </DropdownMenuCheckboxItem>
          {/* Add more filter options here (e.g., Market Cap, Volume) */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
