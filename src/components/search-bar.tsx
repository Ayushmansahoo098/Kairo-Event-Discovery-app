"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { getCities } from "@/lib/mock-data";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity: string | null;
  onCityChange: (city: string | null) => void;
}

export function SearchBar({ searchQuery, onSearchChange, selectedCity, onCityChange }: SearchBarProps) {
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const list = await getCities();
        setCities(list);
      } catch (err) {
        console.error("Failed to load cities in SearchBar:", err);
      }
    };
    fetchCities();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-kairo-light-gray" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for events, organizers, or topics..."
          className="w-full bg-kairo-dark-gray/20 border border-kairo-orange/15 rounded-none py-3.5 pl-12 pr-4 text-kairo-white placeholder-kairo-gray/50 focus:outline-none focus:border-kairo-orange transition-all duration-300 text-sm font-light tracking-wide shadow-md"
        />
      </div>

      <div className="relative min-w-[200px]">
        <select
          value={selectedCity || ""}
          onChange={(e) => onCityChange(e.target.value || null)}
          className="w-full appearance-none bg-kairo-dark-gray/20 border border-kairo-orange/15 rounded-none py-3.5 px-4 pr-10 text-kairo-white focus:outline-none focus:border-kairo-orange transition-all duration-300 [&>option]:bg-kairo-primary [&>option]:text-kairo-white text-sm font-light tracking-wide shadow-md"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <SlidersHorizontal className="w-4 h-4 text-kairo-light-gray" />
        </div>
      </div>
    </div>
  );
}
