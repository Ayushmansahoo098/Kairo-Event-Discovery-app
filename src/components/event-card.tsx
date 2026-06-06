"use client";

import { Event } from "@/lib/types";
import { Calendar, MapPin, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookmarkButton } from "./bookmark-button";
import { useAuthContext } from "@/context/auth-context";
import { logInteractionEvent } from "@/lib/analytics";


/**
 * Calculates the deadline urgency status for a given event date string.
 */
function getUrgencyBadge(dateStr: string): { label: string; className: string } | null {
  try {
    const eventDate = new Date(dateStr + "T23:59:59");
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null; // Already passed
    if (diffDays === 0) return { label: "🚨 Closes today!", className: "bg-red-950/90 text-red-400 border border-red-500/30 animate-pulse" };
    if (diffDays === 1) return { label: "⏳ Closes tomorrow!", className: "bg-amber-955/90 text-amber-400 border border-amber-500/30" };
    if (diffDays <= 3) return { label: `⚠️ ${diffDays} days left`, className: "bg-kairo-dark-gray/95 text-kairo-light-gray border border-kairo-orange/20" };
    if (diffDays <= 7) return { label: `📅 ${diffDays} days left`, className: "bg-kairo-dark-gray/90 text-kairo-light-gray border border-kairo-orange/10" };
    return null;
  } catch {
    return null;
  }
}

export function EventCard({ event, isRecommendation }: { event: Event; isRecommendation?: boolean }) {
  const extendedEvent = event as Event & { source?: string; expiresAt?: string; tags?: string[] };
  const urgency = getUrgencyBadge(extendedEvent.expiresAt || event.date);
  const source = extendedEvent.source || "";

  let userId: string | undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { user } = useAuthContext();
    userId = user?.id;
  } catch {
    // AuthProvider may not be available in all contexts
  }

  const handleCardClick = () => {
    logInteractionEvent({
      userId,
      eventId: event.id,
      action: "view",
      category: event.category,
      source: source,
      tags: extendedEvent.tags,
      isRecommendation,
    });
  };

  return (
    <Link href={`/events/${event.id}${isRecommendation ? "?ref=rec" : ""}`} className="group block h-full animate-in fade-in duration-500" onClick={handleCardClick}>
      <div className="relative flex flex-col h-[420px] sm:h-[440px] rounded-none overflow-hidden transition-all duration-500 hover:-translate-y-1.5 border border-kairo-orange/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-kairo-orange/30">
        
        {/* Full Bleed Banner Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={event.bannerImage}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        </div>
        
        {/* Top Row: Category Badge + Urgency + Bookmark */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {/* Category Badge */}
            <span className="px-2.5 py-1 rounded-none text-[9px] font-bold tracking-[0.2em] bg-kairo-primary/90 text-kairo-white border border-kairo-orange/20 backdrop-blur-md shadow-md uppercase">
              {event.category}
            </span>

            {/* Source Branding Pill */}
            {source && (
              <span className="px-2.5 py-1 rounded-none text-[9px] font-bold tracking-[0.2em] bg-kairo-primary/90 text-kairo-orange border border-kairo-orange/20 backdrop-blur-md shadow-md uppercase">
                {source}
              </span>
            )}
          </div>

          <BookmarkButton eventId={event.id} isRecommendation={isRecommendation} className="bg-kairo-primary/90 backdrop-blur-md shadow-md border border-kairo-orange/20 flex-shrink-0 rounded-none text-kairo-orange hover:bg-kairo-orange hover:text-kairo-primary transition-all duration-300" />
        </div>

        {/* Urgency Badge */}
        {urgency && (
          <div className="absolute top-12 left-3 z-10">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[9px] font-bold tracking-wider uppercase shadow-md ${urgency.className}`}>
              {urgency.label}
            </span>
          </div>
        )}

        {/* Trending Badge */}
        {event.isTrending && (
          <div className="absolute top-12 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[9px] font-bold tracking-widest bg-gradient-to-r from-kairo-orange to-kairo-grad-2 text-kairo-white shadow-md border border-kairo-orange/20 uppercase">
              <Zap className="w-3 h-3" />
              TRENDING
            </span>
          </div>
        )}

        {/* Match Score Badge */}
        {event.matchScore !== undefined && (
          <div className="absolute top-12 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-[9px] font-bold bg-kairo-primary/95 text-emerald-400 shadow-md border border-emerald-500/20 uppercase tracking-[0.15em]">
              🎯 {event.matchScore}% Match
            </span>
          </div>
        )}

        {/* Bottom Parchment / Glass Plate Content */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-kairo-primary/90 backdrop-blur-md border border-kairo-orange/15 p-4 sm:p-5 rounded-none flex flex-col shadow-lg transition-all duration-500 group-hover:border-kairo-orange/30">
            <h3 className="font-serif font-light text-base sm:text-lg text-kairo-white line-clamp-2 mb-2 sm:mb-3 leading-tight tracking-wide uppercase transition-colors duration-300 group-hover:text-kairo-orange">
              {event.title}
            </h3>
            
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center text-[11px] sm:text-xs font-light text-kairo-light-gray tracking-wide">
                <Calendar className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-kairo-orange" />
                <span className="truncate">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.time}</span>
              </div>
              
              <div className="flex items-center text-[11px] sm:text-xs font-light text-kairo-light-gray tracking-wide">
                <MapPin className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-kairo-orange" />
                <span className="truncate">{event.isOnline ? "Online Event" : `${event.location}, ${event.city}`}</span>
              </div>
            </div>
            
            {event.reason && (
              <div className="mt-3 pt-2.5 border-t border-emerald-500/10 flex items-center text-[9px] text-emerald-400 font-bold uppercase tracking-widest gap-1.5">
                <Zap className="w-3 h-3 text-emerald-400 flex-shrink-0 animate-pulse" />
                <span className="truncate">{event.reason}</span>
              </div>
            )}

            <div className="mt-3 sm:mt-4 pt-3 border-t border-kairo-orange/10 flex items-center justify-between">
              <span className="text-[9px] font-bold text-kairo-light-gray truncate uppercase tracking-[0.2em]">
                By {event.organizer}
              </span>
            </div>
          </div>
        </div>
        
      </div>
    </Link>
  );
}

