"use client";

import { useState, useMemo } from "react";
import { Compass, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-kairo-dark-gray shadow-sm border border-kairo-gray">
            <Compass className="h-6 w-6 text-kairo-orange" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-kairo-white">Discover</h1>
            <p className="text-base text-kairo-light-gray font-medium">
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
      <div className="mb-8">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* ── Results Count ── */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm font-medium text-kairo-light-gray">
          Showing{" "}
          <span className="font-bold text-kairo-white">
            {filteredEvents.length}
          </span>{" "}
          event{filteredEvents.length !== 1 ? "s" : ""}
        </p>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-kairo-gray bg-kairo-dark-gray px-3 py-1.5 text-xs font-semibold text-kairo-light-gray shadow-sm transition-colors hover:border-kairo-orange hover:text-kairo-orange hover:bg-kairo-gray"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Event Grid ── */}
      {filteredEvents.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event) => (
              <motion.div
                layout
                key={event.id}
                initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 350, damping: 25, mass: 1 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-24 text-center bg-kairo-dark-gray rounded-3xl border border-kairo-gray shadow-sm">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-kairo-primary border border-kairo-dark-gray">
            <Compass className="h-10 w-10 text-kairo-gray" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-kairo-white">
            No events found
          </h3>
          <p className="mb-8 max-w-sm text-kairo-light-gray text-lg">
            We couldn&apos;t find any events matching your filters. Try
            adjusting your search or browse all events.
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-full bg-kairo-orange px-8 py-4 text-base font-bold text-kairo-white shadow-lg shadow-kairo-orange/25 transition-all hover:shadow-xl hover:scale-105"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
