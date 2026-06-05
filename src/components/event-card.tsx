"use client";

import { Event } from "@/lib/types";
import { Calendar, MapPin, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookmarkButton } from "./bookmark-button";
import { useAuthContext } from "@/context/auth-context";
import { logInteractionEvent } from "@/lib/analytics";

/** Source branding color palette */
const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Devfolio: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  Unstop: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  HackerEarth: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  Eventbrite: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
};

/** Category accent color palette */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  hackathon: { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30" },
  workshop: { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30" },
  startup: { bg: "bg-teal-500/15", text: "text-teal-400", border: "border-teal-500/30" },
  meetup: { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30" },
  concert: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" },
  festival: { bg: "bg-fuchsia-500/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },
  gaming: { bg: "bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/30" },
};

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
    if (diffDays === 0) return { label: "🚨 Closes today!", className: "bg-red-500/90 text-white animate-pulse" };
    if (diffDays === 1) return { label: "⏳ Closes tomorrow!", className: "bg-amber-500/90 text-white" };
    if (diffDays <= 3) return { label: `⚠️ ${diffDays} days left`, className: "bg-yellow-500/80 text-black" };
    if (diffDays <= 7) return { label: `📅 ${diffDays} days left`, className: "bg-kairo-dark-gray/90 text-kairo-light-gray" };
    return null;
  } catch {
    return null;
  }
}

export function EventCard({ event }: { event: Event }) {
  const extendedEvent = event as Event & { source?: string; expiresAt?: string; tags?: string[] };
  const urgency = getUrgencyBadge(extendedEvent.expiresAt || event.date);
  const source = extendedEvent.source || "";
  const sourceStyle = SOURCE_COLORS[source];
  const categoryStyle = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.hackathon;

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
    });
  };

  return (
    <Link href={`/events/${event.id}`} className="group block h-full" onClick={handleCardClick}>
      <div className="relative flex flex-col h-[420px] sm:h-[440px] rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl hover:shadow-kairo-orange/20">
        
        {/* Full Bleed Banner Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={event.bannerImage}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        
        {/* Top Row: Category Badge + Urgency + Bookmark */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {/* Category Badge */}
            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold backdrop-blur-md shadow-sm uppercase tracking-wider border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
              {event.category}
            </span>

            {/* Source Branding Pill */}
            {sourceStyle && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold backdrop-blur-md shadow-sm uppercase tracking-wider border ${sourceStyle.bg} ${sourceStyle.text} ${sourceStyle.border}`}>
                {source}
              </span>
            )}
          </div>

          <BookmarkButton eventId={event.id} className="bg-kairo-dark-gray/90 backdrop-blur-md shadow-sm border border-kairo-gray/50 flex-shrink-0" />
        </div>

        {/* Urgency Badge */}
        {urgency && (
          <div className="absolute top-12 left-3 z-10">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold shadow-lg ${urgency.className}`}>
              {urgency.label}
            </span>
          </div>
        )}

        {/* Trending Badge */}
        {event.isTrending && (
          <div className="absolute top-12 right-3 z-10">
            <span className="inline-flex inline-items gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-kairo-orange to-kairo-grad-2 text-white shadow-lg">
              <Zap className="w-3 h-3" />
              TRENDING
            </span>
          </div>
        )}

        {/* Match Score Badge */}
        {(event as any).matchScore !== undefined && (
          <div className="absolute top-12 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl border border-emerald-400/20 uppercase tracking-widest">
              🎯 {(event as any).matchScore}% Match
            </span>
          </div>
        )}

        {/* Bottom Frosted Glass Content */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-kairo-primary/85 backdrop-blur-xl border border-kairo-dark-gray p-4 sm:p-5 rounded-2xl flex flex-col shadow-lg transition-all duration-300 group-hover:bg-kairo-primary/95">
            <h3 className="font-extrabold text-lg sm:text-xl text-kairo-white line-clamp-2 mb-2 sm:mb-3 leading-tight">
              {event.title}
            </h3>
            
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex items-center text-xs sm:text-sm font-semibold text-kairo-light-gray">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0 text-kairo-orange" />
                <span className="truncate">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.time}</span>
              </div>
              
              <div className="flex items-center text-xs sm:text-sm font-semibold text-kairo-light-gray">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0 text-kairo-orange" />
                <span className="truncate">{event.isOnline ? "Online Event" : `${event.location}, ${event.city}`}</span>
              </div>
            </div>
            
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-kairo-dark-gray flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-kairo-gray truncate uppercase tracking-widest">
                By {event.organizer}
              </span>
            </div>
          </div>
        </div>
        
      </div>
    </Link>
  );
}
