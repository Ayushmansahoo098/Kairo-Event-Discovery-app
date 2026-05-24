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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-10 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-kairo-dark-gray shadow-sm border border-kairo-gray">
          <Heart className="h-6 w-6 text-kairo-grad-2 fill-kairo-grad-2" />
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-kairo-white">Saved Events</h1>
          {savedEvents.length > 0 && (
            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-kairo-orange/20 px-3 text-sm font-bold text-kairo-orange">
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
        <div className="flex flex-col items-center justify-center py-32 text-center bg-kairo-dark-gray rounded-3xl border border-kairo-gray shadow-sm">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-kairo-primary border border-kairo-dark-gray">
            <Heart className="h-10 w-10 text-kairo-gray" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-kairo-white">
            No saved events yet
          </h2>
          <p className="mb-10 max-w-md text-kairo-light-gray text-lg">
            Start exploring and bookmark events you&apos;re interested in.
            They&apos;ll show up here so you never lose track.
          </p>
          <Link
            href="/feed"
            className="group inline-flex items-center gap-2 rounded-full bg-kairo-orange px-8 py-4 text-base font-bold text-kairo-white shadow-lg shadow-kairo-orange/25 transition-all duration-300 hover:shadow-xl hover:shadow-kairo-orange/30 hover:scale-105"
          >
            <Compass className="h-5 w-5" />
            Explore Events
          </Link>
        </div>
      )}
    </div>
  );
}
