"use client";

import { useState, useMemo } from "react";
import { Compass, X } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { EventCard } from "@/components/event-card";
import {
  events,
  getEventsByCategory,
  getEventsByCity,
  searchEvents,
} from "@/lib/mock-data";
import { Category } from "@/lib/types";

export default function FeedPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    let result = events;

    // Apply category filter
    if (selectedCategory !== null) {
      result = getEventsByCategory(selectedCategory as Category);
    }

    // Apply city filter
    if (selectedCity !== null) {
      const cityFiltered = getEventsByCity(selectedCity);
      result = result.filter((e) => cityFiltered.some((cf) => cf.id === e.id));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const searched = searchEvents(searchQuery);
      result = result.filter((e) => searched.some((se) => se.id === e.id));
    }

    return result;
  }, [selectedCategory, selectedCity, searchQuery]);

  const hasActiveFilters =
    selectedCategory !== null || selectedCity !== null || searchQuery !== "";

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedCity(null);
    setSearchQuery("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 ring-1 ring-white/10">
            <Compass className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Discover</h1>
            <p className="text-sm text-white/40">
              Find events that match your vibe
            </p>
          </div>
        </div>
      </div>

      {/* ── Search & City ── */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />

      {/* ── Category Filter ── */}
      <div className="mb-6">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* ── Results Count ── */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-white/40">
          Showing{" "}
          <span className="font-medium text-white/70">
            {filteredEvents.length}
          </span>{" "}
          event{filteredEvents.length !== 1 ? "s" : ""}
        </p>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Event Grid ── */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event, index) => (
            <div
              key={event.id}
              className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
              style={{ animationDelay: `${index * 60}ms`, animationDuration: "500ms" }}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Compass className="h-10 w-10 text-white/20" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white/80">
            No events found
          </h3>
          <p className="mb-8 max-w-sm text-white/40">
            We couldn&apos;t find any events matching your filters. Try
            adjusting your search or browse all events.
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:brightness-110"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
