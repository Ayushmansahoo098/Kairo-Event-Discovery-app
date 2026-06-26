"use client";

import { useState, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { getCities } from "@/lib/mock-data";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity?: string | null;
  onCityChange?: (city: string | null) => void;
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
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <div className="relative flex-grow group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-kairo-gray group-focus-within:text-kairo-orange transition-colors duration-300" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for events, organizers, or topics..."
          className="w-full bg-kairo-dark-gray/30 border border-kairo-gray/20 rounded-xl py-3.5 pl-12 pr-4 text-kairo-white placeholder-kairo-gray/60 focus:outline-none focus:border-kairo-orange focus:ring-1 focus:ring-kairo-orange/50 transition-all duration-300 text-sm font-medium shadow-sm hover:border-kairo-orange/30"
        />
      </div>

      {onCityChange && (
        <div className="relative min-w-[200px] group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-kairo-gray group-focus-within:text-kairo-orange transition-colors duration-300" />
          </div>
          <select
            value={selectedCity || ""}
            onChange={(e) => onCityChange(e.target.value || null)}
            className="w-full appearance-none bg-kairo-dark-gray/30 border border-kairo-gray/20 rounded-xl py-3.5 pl-12 pr-10 text-kairo-white focus:outline-none focus:border-kairo-orange focus:ring-1 focus:ring-kairo-orange/50 transition-all duration-300 [&>option]:bg-kairo-primary [&>option]:text-kairo-white text-sm font-medium shadow-sm hover:border-kairo-orange/30 cursor-pointer"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-kairo-gray group-focus-within:text-kairo-orange transition-colors duration-300">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
