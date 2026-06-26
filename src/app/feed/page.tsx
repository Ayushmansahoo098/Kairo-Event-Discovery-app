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
  ArrowRight,
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
import { getRecommendationApiBase } from "@/lib/api-config";

function EventCardSkeleton() {
  return (
    <div className="relative rounded-xl overflow-hidden border border-kairo-orange/10 h-[420px] sm:h-[440px] shadow-sm shrink-0 w-[300px] md:w-[350px]">
      <div className="absolute inset-0 bg-gradient-to-br from-kairo-dark-gray/30 to-kairo-gray/10 animate-pulse" />
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between">
        <div className="flex gap-1.5">
          <div className="h-5 w-16 bg-kairo-gray/20 rounded-full animate-pulse" />
          <div className="h-5 w-14 bg-kairo-gray/10 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
        </div>
        <div className="h-8 w-8 bg-kairo-gray/20 rounded-full animate-pulse" />
      </div>
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="bg-kairo-primary/95 border border-kairo-orange/10 p-4 sm:p-5 rounded-xl flex flex-col">
          <div className="h-4 w-3/4 bg-kairo-gray/20 rounded mb-3 animate-pulse" />
          <div className="h-3 w-full bg-kairo-gray/10 rounded mb-2 animate-pulse" style={{ animationDelay: "100ms" }} />
          <div className="h-3 w-5/6 bg-kairo-gray/10 rounded mb-3 animate-pulse" style={{ animationDelay: "200ms" }} />
          <div className="pt-3 border-t border-kairo-orange/10">
            <div className="h-2.5 w-24 bg-kairo-gray/15 rounded animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EventRow({ title, icon: Icon, events, isRecommendation = false }: { title: string, icon: React.ElementType, events: Event[], isRecommendation?: boolean }) {
  if (events.length === 0) return null;
  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Icon className="w-5 h-5 text-kairo-orange" />
        <h2 className="text-xl font-serif text-kairo-white">{title}</h2>
      </div>
      <div className="flex overflow-x-auto gap-6 pb-6 -mx-6 px-6 sm:-mx-10 sm:px-10 scrollbar-hide">
        {events.map((event) => (
          <div key={event.id} className="shrink-0 w-[300px] md:w-[350px]">
            <EventCard event={event} isRecommendation={isRecommendation} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const { user } = useAuthContext();
  
  const [recommendations, setRecommendations] = useState<{ eventId: string; score: number; matchScore?: number; reason?: string }[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Filtering & searching states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchVal);
      setVisibleCount(12);
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

  useEffect(() => {
    if (!user) return;
    const fetchRecommendations = async () => {
      setLoadingRecommendations(true);
      try {
        const apiBase = getRecommendationApiBase();
        const res = await fetch(`${apiBase}/recommendations?userId=${user.id}&limit=10`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
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
    fetchRecommendations();
  }, [user]);

  // Derived Event Lists for Rows
  const trendingEvents = useMemo(() => {
    return [...eventsList].sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0)).slice(0, 10);
  }, [eventsList]);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];
    return eventsList.filter((e) => e.date >= today && e.date <= nextWeekStr).slice(0, 10);
  }, [eventsList]);

  const recommendedEvents = useMemo(() => {
    if (recommendations.length === 0) return [];
    return eventsList
      .map((event) => {
        const rScore = recommendations.find((r) => r.eventId === event.id);
        return {
          ...event,
          matchScore: rScore ? (rScore.matchScore !== undefined ? rScore.matchScore : Math.round(rScore.score * 100)) : undefined,
          reason: rScore?.reason,
        };
      })
      .filter((event) => event.matchScore !== undefined)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 10);
  }, [eventsList, recommendations]);

  const filteredEvents = useMemo(() => {
    return searchEvents(
      searchQuery,
      { category: selectedCategory },
      eventsList
    );
  }, [eventsList, selectedCategory, searchQuery]);

  const hasActiveFilters = selectedCategory !== null || searchVal !== "";

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchVal("");
    setSearchQuery("");
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 min-h-screen">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-light text-kairo-white mb-6">Discover</h1>
        
        {/* ── Search & City ── */}
        <SearchBar
          searchQuery={searchVal}
          onSearchChange={setSearchVal}
        />
      </div>

      {/* ── Quick Categories ── */}
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

      {loading ? (
        <div className="flex overflow-x-hidden gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : hasActiveFilters ? (
        /* ── Filtered Grid View ── */
        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-medium text-kairo-light-gray">
              Showing <span className="text-kairo-white">{filteredEvents.length}</span> events
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-full border border-kairo-orange/20 bg-kairo-dark-gray/20 px-4 py-2 text-xs font-medium text-kairo-light-gray transition-colors hover:border-kairo-orange hover:text-kairo-orange hover:bg-white/5"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          </div>

          {filteredEvents.length > 0 ? (
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

              {filteredEvents.length > visibleCount && (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="inline-flex items-center gap-2 rounded-full bg-transparent border border-kairo-orange/30 hover:border-kairo-orange px-8 py-3 text-sm font-medium text-kairo-white transition-all shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-kairo-orange" />
                    Load More Events
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-kairo-dark-gray/10 rounded-2xl border border-kairo-orange/15">
              <Compass className="h-8 w-8 text-kairo-orange mb-4" />
              <h3 className="mb-2 text-xl font-serif text-kairo-white">No events found</h3>
              <p className="mb-6 text-kairo-light-gray text-sm">Try adjusting your filters or search query.</p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 bg-kairo-orange text-kairo-primary px-6 py-3 text-sm font-medium rounded-full transition-all hover:scale-105"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Discovery View (No Filters) ── */
        <div className="flex flex-col gap-4">
          <EventRow title="Trending Near You" icon={Flame} events={trendingEvents} />
          
          {user && (
            loadingRecommendations ? (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-kairo-orange" />
                  <h2 className="text-xl font-serif text-kairo-white">Recommended For You</h2>
                </div>
                <div className="flex overflow-x-hidden gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <EventCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : recommendedEvents.length > 0 ? (
              <EventRow title="Recommended For You" icon={Sparkles} events={recommendedEvents} isRecommendation />
            ) : null
          )}

          <EventRow title="Upcoming This Week" icon={CalendarRange} events={upcomingEvents} />

          {/* Browse All Section */}
          <div className="mt-8 mb-6 border-t border-kairo-gray/20 pt-10">
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-5 h-5 text-kairo-orange" />
              <h2 className="text-xl font-serif text-kairo-white">Browse All Events</h2>
            </div>
            
            <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {eventsList.slice(0, visibleCount).map((event) => (
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

            {eventsList.length > visibleCount && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="inline-flex items-center gap-2 rounded-full bg-transparent border border-kairo-orange/30 hover:border-kairo-orange px-8 py-3 text-sm font-medium text-kairo-white transition-all shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-kairo-orange" />
                  Load More Events
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
