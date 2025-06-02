"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

type SearchBarProps = {
  onSearch: (query: string) => void;
};

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl items-center space-x-2 mx-auto">
      <Input
        type="text"
        placeholder="Search for stocks or crypto (e.g., BTC, Apple)..."
        className="flex-grow"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button type="submit" variant="default">
        <Search className="h-4 w-4 mr-2 md:hidden" />
        <span className="hidden md:inline">Search</span>
      </Button>
    </form>
  );
}
