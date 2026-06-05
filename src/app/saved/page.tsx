"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Compass, Loader2 } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { useBookmarkContext } from "@/context/bookmark-context";
import { getEvents } from "@/lib/mock-data";
import { Event } from "@/lib/types";

export default function SavedPage() {
  const { bookmarks } = useBookmarkContext();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const list = await getEvents();
        setAllEvents(list);
      } catch (err) {
        console.error("Failed to fetch events for bookmarks page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const savedEvents = useMemo(
    () => allEvents.filter((e) => bookmarks.includes(e.id)),
    [allEvents, bookmarks]
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
      {/* ── Header ── */}
      <div className="mb-12 flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20 shadow-md">
          <Heart className="h-5 w-5 text-kairo-orange fill-kairo-orange/20" />
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide uppercase text-kairo-white">Saved Events</h1>
          {savedEvents.length > 0 && (
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-none bg-kairo-orange text-kairo-primary border border-kairo-orange px-2 text-xs font-bold">
              {savedEvents.length}
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-kairo-dark-gray/10 border border-kairo-orange/15 rounded-none">
          <Loader2 className="w-8 h-8 animate-spin text-kairo-orange" />
          <p className="mt-4 text-kairo-light-gray font-bold tracking-[0.2em] text-xs uppercase">Syncing Saved Events...</p>
        </div>
      ) : savedEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedEvents.map((event, index) => (
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
        <div className="flex flex-col items-center justify-center py-24 text-center bg-kairo-dark-gray/10 rounded-none border border-kairo-orange/15 shadow-md">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20">
            <Heart className="h-6 w-6 text-kairo-gray" />
          </div>
          <h2 className="mb-2 text-2xl font-serif uppercase tracking-wider text-kairo-white">
            No saved events yet
          </h2>
          <p className="mb-10 max-w-sm text-kairo-light-gray text-xs font-light tracking-wide leading-relaxed">
            Start exploring and bookmark events you&apos;re interested in. They&apos;ll show up here so you never lose track.
          </p>
          <Link
            href="/feed"
            className="group inline-flex items-center gap-3 bg-kairo-orange text-kairo-primary px-8 py-4 text-xs font-bold uppercase tracking-[0.25em] transition-all duration-300 hover:scale-105 rounded-none border border-kairo-orange cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            Explore Events
          </Link>
        </div>
      )}
    </div>
  );
}
