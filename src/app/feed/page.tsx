"use client";

import { useState, useMemo, useEffect } from "react";
import { Compass, X, Loader2, SlidersHorizontal, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { EventCard } from "@/components/event-card";
import { getEvents } from "@/lib/mock-data";
import { Category, Event } from "@/lib/types";
import { searchEvents } from "@/lib/search/search";
import { cn } from "@/lib/utils";

function EventCardSkeleton() {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-sm h-[420px] sm:h-[440px]">
      {/* Full bleed background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-kairo-dark-gray/60 to-kairo-gray/20 animate-pulse" />

      {/* Top badges skeleton */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between">
        <div className="flex gap-1.5">
          <div className="h-5 w-16 bg-kairo-gray/30 rounded-full animate-pulse" />
          <div className="h-5 w-14 bg-kairo-gray/20 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
        </div>
        <div className="h-8 w-8 bg-kairo-gray/30 rounded-full animate-pulse" />
      </div>

      {/* Bottom content skeleton */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="bg-kairo-primary/70 backdrop-blur-xl border border-kairo-dark-gray p-4 sm:p-5 rounded-2xl">
          <div className="h-5 w-3/4 bg-kairo-gray/25 rounded-lg mb-3 animate-pulse" />
          <div className="h-4 w-full bg-kairo-gray/15 rounded-lg mb-2 animate-pulse" style={{ animationDelay: "100ms" }} />
          <div className="h-4 w-5/6 bg-kairo-gray/15 rounded-lg mb-3 animate-pulse" style={{ animationDelay: "200ms" }} />
          <div className="pt-3 border-t border-kairo-dark-gray">
            <div className="h-3 w-24 bg-kairo-gray/20 rounded-lg animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}


export default function FeedPage() {
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  
  // Filtering & searching states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedOnline, setSelectedOnline] = useState<boolean | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Debounce search query input (300ms pacing)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Reset pagination on filter mutations
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, selectedCity, selectedOnline, selectedSource, searchQuery]);

  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        setEventsList(data);
      } catch (err) {
        console.error("Failed to load events for feed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return searchEvents(
      searchQuery,
      {
        category: selectedCategory,
        city: selectedCity,
        isOnline: selectedOnline,
        source: selectedSource,
      },
      eventsList
    );
  }, [eventsList, selectedCategory, selectedCity, selectedOnline, selectedSource, searchQuery]);

  const hasActiveFilters =
    selectedCategory !== null || 
    selectedCity !== null || 
    selectedOnline !== null || 
    selectedSource !== null || 
    searchVal !== "";

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedCity(null);
    setSelectedOnline(null);
    setSelectedSource(null);
    setSearchVal("");
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
        searchQuery={searchVal}
        onSearchChange={setSearchVal}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />

      {/* ── Additional Filter Row ── */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Online/Offline Filter Pills */}
        <div className="flex bg-kairo-dark-gray border border-kairo-gray rounded-2xl p-1 gap-1">
          <button
            onClick={() => setSelectedOnline(null)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
              selectedOnline === null
                ? "bg-kairo-orange text-kairo-white shadow-md shadow-kairo-orange/20"
                : "text-kairo-light-gray hover:text-kairo-white hover:bg-kairo-primary"
            )}
          >
            All Formats
          </button>
          <button
            onClick={() => setSelectedOnline(true)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
              selectedOnline === true
                ? "bg-kairo-orange text-kairo-white shadow-md shadow-kairo-orange/20"
                : "text-kairo-light-gray hover:text-kairo-white hover:bg-kairo-primary"
            )}
          >
            Online Only
          </button>
          <button
            onClick={() => setSelectedOnline(false)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
              selectedOnline === false
                ? "bg-kairo-orange text-kairo-white shadow-md shadow-kairo-orange/20"
                : "text-kairo-light-gray hover:text-kairo-white hover:bg-kairo-primary"
            )}
          >
            In-Person
          </button>
        </div>

        {/* Source Filter Dropdown */}
        <div className="relative min-w-[200px]">
          <select
            value={selectedSource || ""}
            onChange={(e) => setSelectedSource(e.target.value || null)}
            className="w-full appearance-none bg-kairo-dark-gray border border-kairo-gray rounded-2xl py-3 px-4 pr-10 text-kairo-white focus:outline-none focus:border-kairo-orange focus:ring-4 focus:ring-kairo-orange/10 shadow-sm transition-all duration-300 [&>option]:bg-kairo-dark-gray [&>option]:text-kairo-white font-bold text-xs uppercase tracking-wider"
          >
            <option value="">All Sources</option>
            <option value="Devfolio">Devfolio</option>
            <option value="Unstop">Unstop</option>
            <option value="HackerEarth">HackerEarth</option>
            <option value="Eventbrite">Eventbrite</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <SlidersHorizontal className="w-4 h-4 text-kairo-light-gray" />
          </div>
        </div>
      </div>

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
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <>
          <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredEvents.slice(0, visibleCount).map((event) => (
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

          {/* Load More Pagination Footer */}
          {filteredEvents.length > visibleCount && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="inline-flex items-center gap-2.5 rounded-full bg-kairo-dark-gray border border-kairo-gray hover:border-kairo-orange px-8 py-4 text-sm font-black tracking-widest text-kairo-white hover:text-kairo-orange shadow-lg hover:scale-105 transition-all duration-300 uppercase"
              >
                <RefreshCw className="w-4 h-4 animate-pulse text-kairo-orange" />
                Load More Events
              </button>
            </div>
          )}
        </>
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
