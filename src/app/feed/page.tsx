"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Compass,
  X,
  SlidersHorizontal,
  RefreshCw,
  Flame,
  MapPin,
  Sparkles,
  CalendarRange,
  Bookmark,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { EventCard } from "@/components/event-card";
import { getEvents, getEventById } from "@/lib/mock-data";
import { Event } from "@/lib/types";
import { searchEvents } from "@/lib/search/search";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useAuthContext } from "@/context/auth-context";
import { logInteractionEvent } from "@/lib/analytics";

function EventCardSkeleton() {
  return (
    <div className="relative rounded-none overflow-hidden border border-kairo-orange/10 h-[420px] sm:h-[440px] shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-kairo-dark-gray/30 to-kairo-gray/10 animate-pulse" />
      
      {/* Top badges skeleton */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between">
        <div className="flex gap-1.5">
          <div className="h-5 w-16 bg-kairo-gray/20 rounded-none animate-pulse" />
          <div className="h-5 w-14 bg-kairo-gray/10 rounded-none animate-pulse" style={{ animationDelay: "150ms" }} />
        </div>
        <div className="h-8 w-8 bg-kairo-gray/20 rounded-none animate-pulse" />
      </div>

      {/* Bottom content skeleton */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="bg-kairo-primary/95 border border-kairo-orange/10 p-4 sm:p-5 rounded-none flex flex-col">
          <div className="h-4 w-3/4 bg-kairo-gray/20 rounded-none mb-3 animate-pulse" />
          <div className="h-3 w-full bg-kairo-gray/10 rounded-none mb-2 animate-pulse" style={{ animationDelay: "100ms" }} />
          <div className="h-3 w-5/6 bg-kairo-gray/10 rounded-none mb-3 animate-pulse" style={{ animationDelay: "200ms" }} />
          <div className="pt-3 border-t border-kairo-orange/10">
            <div className="h-2.5 w-24 bg-kairo-gray/15 rounded-none animate-pulse" style={{ animationDelay: "300ms" }} />
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
  const { user } = useAuthContext();
  
  // Tab & Recommendations States
  const [selectedTab, setSelectedTab] = useState<"all" | "recommended" | "trending" | "near_you" | "upcoming" | "because_saved">("all");
  const [recommendations, setRecommendations] = useState<{ eventId: string; score: number; matchScore?: number; reason?: string }[]>([]);
  const [similarToSaved, setSimilarToSaved] = useState<{ eventId: string; score: number; matchScore?: number; reason?: string }[]>([]);
  const [savedReferenceTitle, setSavedReferenceTitle] = useState<string | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [userPreferredCities, setUserPreferredCities] = useState<string[]>([]);
  const [userGeoCity, setUserGeoCity] = useState<string | null>(null);

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
      setVisibleCount(12);

      // Track search query events in telemetry
      if (searchVal.trim().length > 1) {
        logInteractionEvent({
          userId: user?.id,
          action: "search",
          query: searchVal.trim(),
        });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal, user]);

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

  // Fetch user location preferences
  useEffect(() => {
    if (!user) return;
    const fetchUserLocation = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserPreferredCities(data.preferredCities || []);
          if (data.lastLocation?.city) {
            setUserGeoCity(data.lastLocation.city);
          }
        }
      } catch (err) {
        console.error("Error fetching user location for feed:", err);
      }
    };
    fetchUserLocation();
  }, [user]);

  // Fetch recommendations or similar events when tab changes
  useEffect(() => {
    if (!user) return;

    const fetchRecommendations = async () => {
      setLoadingRecommendations(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/recommendations?userId=${user.id}&limit=30`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendedEvents || []);
        }
      } catch (err) {
        console.error("Failed to fetch AI recommendations:", err);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    const fetchBecauseSaved = async () => {
      try {
        const bookmarksColRef = collection(db, "users", user.id, "bookmarks");
        const bookmarksSnap = await getDocs(bookmarksColRef);
        if (bookmarksSnap.empty) {
          setSimilarToSaved([]);
          setSavedReferenceTitle(null);
          return;
        }

        const docs = bookmarksSnap.docs;
        const latestBookmarkId = docs[docs.length - 1].id;

        // Fetch event title
        const refEvent = eventsList.find((e) => e.id === latestBookmarkId) || await getEventById(latestBookmarkId);
        if (refEvent) {
          setSavedReferenceTitle(refEvent.title);
        }

        setLoadingRecommendations(true);
        const apiBase = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/similar?eventId=${latestBookmarkId}&limit=6`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSimilarToSaved(data.similarEvents || []);
        }
      } catch (err) {
        console.error("Failed to fetch similar events for because_saved tab:", err);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    if (selectedTab === "recommended" && recommendations.length === 0) {
      fetchRecommendations();
    }
    if (selectedTab === "because_saved") {
      fetchBecauseSaved();
    }
  }, [selectedTab, user, eventsList, recommendations.length]);

  const filteredEvents = useMemo(() => {
    // 1. Apply standard filters (search query, category, city, mode, source)
    const baseList = searchEvents(
      searchQuery,
      {
        category: selectedCategory,
        city: selectedCity,
        isOnline: selectedOnline,
        source: selectedSource,
      },
      eventsList
    );

    // 2. Apply Tab Filter and Sorts
    if (selectedTab === "recommended") {
      if (recommendations.length > 0) {
        return baseList
          .map((event) => {
            const rScore = recommendations.find((r) => r.eventId === event.id);
            return {
              ...event,
              matchScore: rScore ? (rScore.matchScore !== undefined ? rScore.matchScore : Math.round(rScore.score * 100)) : undefined,
              reason: rScore?.reason,
            };
          })
          .filter((event) => event.matchScore !== undefined)
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }
      return baseList; // fallback
    }

    if (selectedTab === "trending") {
      // Sort by popularityScore descending
      return [...baseList].sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    }

    if (selectedTab === "near_you") {
      const targetCities = [...userPreferredCities];
      if (userGeoCity) targetCities.push(userGeoCity);
      
      const targetCitiesLower = targetCities.map((c) => c.toLowerCase());
      if (targetCitiesLower.length === 0) {
        return baseList; // fallback
      }
      return baseList.filter((e) => targetCitiesLower.includes(e.city.toLowerCase()));
    }

    if (selectedTab === "upcoming") {
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];
      
      return baseList.filter((e) => e.date >= today && e.date <= nextWeekStr);
    }

    if (selectedTab === "because_saved") {
      if (similarToSaved.length > 0) {
        return baseList
          .map((event) => {
            const sScore = similarToSaved.find((s) => s.eventId === event.id);
            return {
              ...event,
              matchScore: sScore ? (sScore.matchScore !== undefined ? sScore.matchScore : Math.round(sScore.score * 100)) : undefined,
              reason: sScore?.reason,
            };
          })
          .filter((event) => event.matchScore !== undefined)
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }
      return []; // Empty if no similarities fetched
    }

    return baseList;
  }, [
    eventsList,
    selectedCategory,
    selectedCity,
    selectedOnline,
    selectedSource,
    searchQuery,
    selectedTab,
    recommendations,
    similarToSaved,
    userPreferredCities,
    userGeoCity,
  ]);

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
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
      {/* ── Header ── */}
      <div className="mb-12">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20 shadow-md">
            <Compass className="h-5 w-5 text-kairo-orange" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide uppercase text-kairo-white">Discover</h1>
            <p className="text-xs text-kairo-light-gray font-light uppercase tracking-[0.2em] mt-1">
              Find events that match your vibe
            </p>
          </div>
        </div>
      </div>

      {/* ── Feed Sections Tabs ── */}
      <div className="flex overflow-x-auto gap-3 pb-4 mb-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 scrollbar-thin scrollbar-thumb-kairo-orange/20 scrollbar-track-transparent">
        {[
          { id: "all", label: "All Events", icon: Compass },
          { id: "recommended", label: "Recommended For You", icon: Sparkles },
          { id: "trending", label: "Trending", icon: Flame },
          { id: "near_you", label: "Near You", icon: MapPin },
          { id: "upcoming", label: "Upcoming This Week", icon: CalendarRange },
          { id: "because_saved", label: `Because You Saved${savedReferenceTitle ? `: ${savedReferenceTitle}` : ''}`, icon: Bookmark },
        ].map((tab) => {
          const isSelected = selectedTab === tab.id;
          const Icon = tab.icon;
          
          if (tab.id === "because_saved" && !user) return null;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTab(tab.id as "all" | "recommended" | "trending" | "near_you" | "upcoming" | "because_saved");
                setVisibleCount(12);
              }}
              className={cn(
                "flex items-center gap-2.5 px-5 py-3 border transition-all duration-500 cursor-pointer text-[10px] tracking-[0.2em] font-bold uppercase rounded-none shrink-0",
                isSelected
                  ? "bg-kairo-orange text-kairo-primary border-kairo-orange shadow-[0_4px_15px_rgba(184,168,138,0.15)]"
                  : "bg-kairo-dark-gray/10 border-kairo-orange/10 text-kairo-light-gray hover:text-kairo-white hover:border-kairo-orange/30"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-kairo-primary" : "text-kairo-orange")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Search & City ── */}
      <SearchBar
        searchQuery={searchVal}
        onSearchChange={setSearchVal}
        selectedCity={selectedCity}
        onCityChange={(city) => {
          setSelectedCity(city);
          setVisibleCount(12);
        }}
      />

      {/* ── Additional Filter Row ── */}
      <div className="flex flex-wrap gap-4 mb-8">
        {/* Online/Offline Filter Pills */}
        <div className="flex bg-transparent border border-kairo-orange/15 rounded-none p-1 gap-1">
          <button
            onClick={() => {
              setSelectedOnline(null);
              setVisibleCount(12);
            }}
            className={cn(
              "px-4 py-2 text-[10px] tracking-[0.15em] font-bold transition-all uppercase rounded-none border border-transparent cursor-pointer",
              selectedOnline === null
                ? "bg-kairo-orange text-kairo-primary"
                : "text-kairo-light-gray hover:text-kairo-white"
            )}
          >
            All Formats
          </button>
          <button
            onClick={() => {
              setSelectedOnline(true);
              setVisibleCount(12);
            }}
            className={cn(
              "px-4 py-2 text-[10px] tracking-[0.15em] font-bold transition-all uppercase rounded-none border border-transparent cursor-pointer",
              selectedOnline === true
                ? "bg-kairo-orange text-kairo-primary"
                : "text-kairo-light-gray hover:text-kairo-white"
            )}
          >
            Online Only
          </button>
          <button
            onClick={() => {
              setSelectedOnline(false);
              setVisibleCount(12);
            }}
            className={cn(
              "px-4 py-2 text-[10px] tracking-[0.15em] font-bold transition-all uppercase rounded-none border border-transparent cursor-pointer",
              selectedOnline === false
                ? "bg-kairo-orange text-kairo-primary"
                : "text-kairo-light-gray hover:text-kairo-white"
            )}
          >
            In-Person
          </button>
        </div>

        {/* Source Filter Dropdown */}
        <div className="relative min-w-[200px]">
          <select
            value={selectedSource || ""}
            onChange={(e) => {
              setSelectedSource(e.target.value || null);
              setVisibleCount(12);
            }}
            className="w-full appearance-none bg-kairo-dark-gray/20 border border-kairo-orange/15 rounded-none py-3 px-4 pr-10 text-kairo-white focus:outline-none focus:border-kairo-orange transition-all duration-300 [&>option]:bg-kairo-primary [&>option]:text-kairo-white text-[10px] font-bold uppercase tracking-[0.2em]"
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
      <div className="mb-10">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setVisibleCount(12);
            if (cat) {
              logInteractionEvent({
                userId: user?.id,
                action: "category_click",
                category: cat,
              });
            }
          }}
        />
      </div>

      {/* ── Results Count ── */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-kairo-light-gray">
          Showing{" "}
          <span className="text-kairo-white">
            {filteredEvents.length}
          </span>{" "}
          event{filteredEvents.length !== 1 ? "s" : ""}
        </p>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-none border border-kairo-orange/20 bg-kairo-dark-gray/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-kairo-light-gray transition-colors hover:border-kairo-orange hover:text-kairo-orange hover:bg-white/5"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Event Grid ── */}
      {(loading || loadingRecommendations) ? (
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
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
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
                className="inline-flex items-center gap-3 rounded-none bg-transparent border border-kairo-orange/30 hover:border-kairo-orange px-10 py-4.5 text-xs font-bold tracking-[0.3em] text-kairo-white hover:text-kairo-primary hover:bg-kairo-orange shadow-md hover:scale-[1.02] transition-all duration-500 uppercase cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-kairo-orange group-hover:text-kairo-primary" />
                Load More Events
              </button>
            </div>
          )}
        </>
      ) : (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-24 text-center bg-kairo-dark-gray/10 rounded-none border border-kairo-orange/15 shadow-md">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20">
            <Compass className="h-6 w-6 text-kairo-orange" />
          </div>
          <h3 className="mb-2 text-xl font-serif uppercase tracking-wider text-kairo-white">
            No events found
          </h3>
          <p className="mb-8 max-w-sm text-kairo-light-gray text-xs font-light tracking-wide leading-relaxed">
            We couldn&apos;t find any events matching your filters. Try adjusting your search or resetting filters.
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 bg-kairo-orange text-kairo-primary px-8 py-4 text-xs font-bold uppercase tracking-[0.25em] transition-all hover:scale-105 rounded-none cursor-pointer border border-kairo-orange"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
