"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Heart, Compass } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { useBookmarkContext } from "@/context/bookmark-context";
import { getEventById } from "@/lib/mock-data";

export default function SavedPage() {
  const { bookmarks } = useBookmarkContext();

  const savedEvents = useMemo(
    () =>
      bookmarks
        .map((id) => getEventById(id))
        .filter((event): event is NonNullable<typeof event> => event != null),
    [bookmarks]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 ring-1 ring-white/10">
          <Heart className="h-5 w-5 text-pink-400" />
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Saved Events</h1>
          {savedEvents.length > 0 && (
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-2.5 text-xs font-bold text-white">
              {savedEvents.length}
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {savedEvents.length > 0 ? (
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
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Heart className="h-12 w-12 text-white/20" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white/80">
            No saved events yet
          </h2>
          <p className="mb-10 max-w-md text-white/40">
            Start exploring and bookmark events you&apos;re interested in.
            They&apos;ll show up here so you never lose track.
          </p>
          <Link
            href="/feed"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:brightness-110"
          >
            <Compass className="h-4 w-4" />
            Explore Events
          </Link>
        </div>
      )}
    </div>
  );
}
