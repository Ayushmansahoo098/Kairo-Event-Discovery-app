"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  ExternalLink,
  Globe,
  Tag,
  Loader2,
  Share2,
} from "lucide-react";
import { getEventById, getEvents } from "@/lib/mock-data";
import { BookmarkButton } from "@/components/bookmark-button";
import { Event } from "@/lib/types";
import { useAuthContext } from "@/context/auth-context";
import { logInteractionEvent } from "@/lib/analytics";
import { EventCard } from "@/components/event-card";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  // Similar events & Recently Viewed states
  const [similarEvents, setSimilarEvents] = useState<Event[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventById(eventId);
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch event:", err);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // Track page dwell time and log event views
  useEffect(() => {
    if (!event) return;
    const startTime = Date.now();

    const logOnExit = () => {
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      if (elapsedSeconds >= 1) {
        logInteractionEvent({
          userId: user?.id,
          eventId: event.id,
          action: "view",
          category: event.category,
          source: event.source,
          tags: event.tags,
          dwellTime: elapsedSeconds,
        });
      }
    };

    window.addEventListener("beforeunload", logOnExit);

    return () => {
      window.removeEventListener("beforeunload", logOnExit);
      logOnExit();
    };
  }, [event, user]);

  // Track Recently Viewed in LocalStorage
  useEffect(() => {
    if (!event) return;
    try {
      const raw = localStorage.getItem("kairo-recently-viewed");
      const current = raw ? JSON.parse(raw) : [];
      const next = [event.id, ...current.filter((id: string) => id !== event.id)].slice(0, 6);
      localStorage.setItem("kairo-recently-viewed", JSON.stringify(next));
    } catch (err) {
      console.error("Failed to track recently viewed event:", err);
    }
  }, [event]);

  // Fetch Similar Events from FastAPI
  useEffect(() => {
    if (!event) return;

    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/similar?eventId=${event.id}&limit=10`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          const sims = data.similarEvents || [];

          // Map scores and match details
          const all = await getEvents();
          const mappedSims = sims
            .map((s: { eventId: string; score: number; matchScore?: number; reason?: string }) => {
              const found = all.find((e) => e.id === s.eventId);
              if (found) {
                return {
                  ...found,
                  matchScore: s.matchScore !== undefined ? s.matchScore : Math.round(s.score * 100),
                  reason: s.reason,
                };
              }
              return null;
            })
            .filter(Boolean) as Event[];

          setSimilarEvents(mappedSims);
        }
      } catch (err) {
        console.error("Failed to fetch similar events from FastAPI:", err);
      } finally {
        setLoadingSimilar(false);
      }
    };

    fetchSimilar();
  }, [event]);

  const handleShare = async () => {
    if (!event) return;
    const shareData = {
      title: event.title,
      text: `Check out ${event.title} on KAIRO Events!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Web Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setToastMessage("Event link copied to clipboard!");
        setTimeout(() => setToastMessage(null), 3000);
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
    }
  };

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-kairo-primary">
        <Loader2 className="w-8 h-8 animate-spin text-kairo-orange" />
        <p className="mt-4 text-kairo-light-gray font-bold tracking-widest text-xs uppercase">Decoding Event...</p>
      </div>
    );
  }

  /* ── Not Found ── */
  if (!event) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-kairo-dark-gray border border-kairo-gray shadow-sm">
          <Calendar className="h-10 w-10 text-kairo-gray" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-kairo-white">Event Not Found</h1>
        <p className="mb-8 max-w-sm text-kairo-light-gray">
          The event you&apos;re looking for doesn&apos;t exist or may have been
          removed.
        </p>
        <button
          onClick={() => router.push("/feed")}
          className="inline-flex items-center gap-2 rounded-full bg-kairo-orange px-8 py-4 text-sm font-bold text-kairo-white shadow-lg shadow-kairo-orange/20 transition-all hover:scale-105"
        >
          Browse Events
        </button>
      </div>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative pb-36 md:pb-28 bg-kairo-primary min-h-screen">
      {/* ── Banner ── */}
      <div className="relative h-[300px] w-full md:h-[400px]">
        <Image
          src={event.bannerImage}
          alt={event.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary/90 via-kairo-primary/40 to-transparent" />

        {/* Top controls */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20 shadow-md backdrop-blur-md transition-all hover:border-kairo-orange text-kairo-light-gray hover:text-kairo-white hover:scale-105"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex h-11 w-11 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20 shadow-md backdrop-blur-md transition-all hover:border-kairo-orange text-kairo-light-gray hover:text-kairo-white hover:scale-105 cursor-pointer"
              aria-label="Share event"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <BookmarkButton eventId={event.id} className="bg-kairo-primary shadow-md border border-kairo-orange/20 h-11 w-11 flex items-center justify-center hover:border-kairo-orange rounded-none text-kairo-orange" />
          </div>
        </div>

        {/* Online/Offline badge on banner */}
        <div className="absolute bottom-6 left-4 md:left-6">
          <span
            className={`inline-flex items-center gap-1.5 rounded-none px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-md text-kairo-white border border-kairo-orange/20 ${
              event.isOnline
                ? "bg-kairo-primary/95 text-kairo-orange"
                : "bg-kairo-primary/95 text-kairo-white"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            {event.isOnline ? "Online" : "In Person"}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mt-8">
        {/* Title */}
        <h1 className="text-3xl font-serif font-light leading-tight tracking-wide md:text-5xl text-kairo-white uppercase">
          {event.title}
        </h1>

        {/* Meta row */}
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
          <div className="flex items-center gap-3 text-kairo-light-gray font-light text-sm tracking-wide">
            <div className="w-9 h-9 rounded-none bg-kairo-dark-gray/30 border border-kairo-orange/15 flex items-center justify-center text-kairo-orange">
              <Calendar className="h-4 w-4" />
            </div>
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-3 text-kairo-light-gray font-light text-sm tracking-wide">
            <div className="w-9 h-9 rounded-none bg-kairo-dark-gray/30 border border-kairo-orange/15 flex items-center justify-center text-kairo-orange">
              <MapPin className="h-4 w-4" />
            </div>
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-3 text-kairo-light-gray font-light text-sm tracking-wide">
            <div className="w-9 h-9 rounded-none bg-kairo-dark-gray/30 border border-kairo-orange/15 flex items-center justify-center text-kairo-orange">
              <User className="h-4 w-4" />
            </div>
            <span>{event.organizer}</span>
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-none bg-kairo-dark-gray/20 border border-kairo-orange/10 px-3.5 py-1 text-xs font-light text-kairo-light-gray tracking-wide shadow-sm"
              >
                <Tag className="h-3 w-3 text-kairo-orange" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="my-10 h-px bg-kairo-orange/10" />

        {/* Description */}
        <div>
          <h2 className="mb-4 text-2xl font-serif font-light text-kairo-white uppercase tracking-wide">About This Event</h2>
          <p className="whitespace-pre-line leading-relaxed text-base sm:text-lg text-kairo-light-gray font-light tracking-wide">
            {event.description}
          </p>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-kairo-orange/10" />

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Organizer Card */}
          <div className="rounded-none border border-kairo-orange/15 bg-kairo-dark-gray/10 p-6 shadow-sm hover:border-kairo-orange/30 transition-all duration-300">
            <h3 className="mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-kairo-light-gray">
              Organized by
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20 text-kairo-orange">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-base text-kairo-white uppercase tracking-wide">{event.organizer}</p>
                <p className="text-[10px] uppercase tracking-wider text-kairo-light-gray mt-0.5">Event Organizer</p>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="rounded-none border border-kairo-orange/15 bg-kairo-dark-gray/10 p-6 shadow-sm hover:border-kairo-orange/30 transition-all duration-300">
            <h3 className="mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-kairo-light-gray">
              Location
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20 text-kairo-orange">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-base text-kairo-white uppercase tracking-wide">{event.location}</p>
                <p className="text-[10px] uppercase tracking-wider text-kairo-light-gray mt-0.5">
                  {event.city}
                  {event.isOnline ? " • Virtual" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-kairo-orange/10" />

        {/* Similar Events Carousel */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-serif font-light text-kairo-white uppercase tracking-wide">Similar Events You Might Like</h2>
          {loadingSimilar ? (
            <div className="flex h-[200px] items-center justify-center rounded-none border border-kairo-orange/15 bg-kairo-dark-gray/10">
              <Loader2 className="w-5 h-5 animate-spin text-kairo-orange" />
              <span className="ml-3 text-xs tracking-wider text-kairo-light-gray uppercase font-bold">Finding similar events...</span>
            </div>
          ) : similarEvents.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-kairo-orange/30 scrollbar-track-transparent snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              {similarEvents.map((simEvent) => (
                <div key={simEvent.id} className="w-[280px] sm:w-[320px] flex-shrink-0 snap-start">
                  <EventCard event={simEvent} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[150px] flex-col items-center justify-center rounded-none border border-kairo-orange/15 bg-kairo-dark-gray/10 p-6 text-center">
              <p className="text-xs tracking-wider text-kairo-light-gray uppercase font-bold">No similar events found at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed Bottom CTA ── */}
      <div className="fixed inset-x-0 bottom-[60px] md:bottom-0 z-50 border-t border-kairo-orange/10 bg-kairo-primary/90 px-4 py-4.5 backdrop-blur-xl md:px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
        <div className="mx-auto max-w-3xl">
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              logInteractionEvent({
                userId: user?.id,
                eventId: event.id,
                action: "register",
                category: event.category,
                source: event.source,
                tags: event.tags,
              });
            }}
            className="flex w-full items-center justify-center gap-3 bg-kairo-orange hover:bg-kairo-orange/95 px-6 py-4 text-xs font-bold uppercase tracking-[0.3em] text-kairo-primary shadow-lg transition-all duration-300 hover:scale-[1.01] rounded-none"
          >
            Register Now
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-55 px-6 py-3 bg-kairo-dark-gray/90 border border-kairo-gray/50 rounded-full text-sm font-bold text-kairo-white backdrop-blur-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="h-2 w-2 rounded-full bg-kairo-orange animate-ping" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
