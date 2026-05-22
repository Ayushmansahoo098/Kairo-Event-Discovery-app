"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { getCities } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity: string | null;
  onCityChange: (city: string | null) => void;
}

export function SearchBar({ searchQuery, onSearchChange, selectedCity, onCityChange }: SearchBarProps) {
  const cities = getCities();

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/40" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for events, organizers, or topics..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
        />
      </div>

      <div className="relative min-w-[200px]">
        <select
          value={selectedCity || ""}
          onChange={(e) => onCityChange(e.target.value || null)}
          className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 [&>option]:bg-[#141418] [&>option]:text-white"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <SlidersHorizontal className="w-5 h-5 text-white/40" />
        </div>
      </div>
    </div>
  );
}
