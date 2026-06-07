"use client";

import { BookmarkButton } from "@/components/bookmark-button";
import { EventCard } from "@/components/event-card";
import { useAuthContext } from "@/context/auth-context";
import { logInteractionEvent } from "@/lib/analytics";
import { getEventById, getEvents } from "@/lib/mock-data";
import { Event } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Share2,
  Tag,
  User,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

/* ── Countdown Hook ─────────────────────────────────────────────── */
function useCountdown(targetDate: string) {
  const target = useMemo(() => {
    const d = new Date(targetDate + "T23:59:59");
    return isNaN(d.getTime()) ? null : d;
  }, [targetDate]);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!target) return null;

  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
}

/* ── Countdown Digit ────────────────────────────────────────────── */
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-kairo-primary border border-kairo-orange/20 flex items-center justify-center overflow-hidden">
        {/* Subtle shimmer */}
        <div className="absolute inset-0 bg-gradient-to-b from-kairo-orange/5 to-transparent" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-xl sm:text-2xl md:text-3xl text-kairo-orange font-light tabular-nums relative z-10"
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-kairo-light-gray/60 text-center">
        {label}
      </span>
    </div>
  );
}

/* ── Stagger Animation Variants ──────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/* ── Main Page ───────────────────────────────────────────────────── */
export default function EventDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-kairo-primary">
        <Loader2 className="w-8 h-8 animate-spin text-kairo-orange" />
        <p className="mt-4 text-kairo-light-gray font-bold tracking-widest text-xs uppercase">Decoding Event...</p>
      </div>
    }>
      <EventDetailPageContent />
    </Suspense>
  );
}

function EventDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRecommendation = searchParams ? (searchParams.get("ref") === "rec" || searchParams.get("isRecommendation") === "true") : false;
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  // Similar events & Recently Viewed states
  const [similarEvents, setSimilarEvents] = useState<Event[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const countdown = useCountdown(event?.date || "");

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
          isRecommendation,
        });
      }
    };

    window.addEventListener("beforeunload", logOnExit);

    return () => {
      window.removeEventListener("beforeunload", logOnExit);
      logOnExit();
    };
  }, [event, user, isRecommendation]);

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

  // Fetch Similar Events from FastAPI or fallback to local heuristic
  useEffect(() => {
    if (!event) return;

    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      let usedFallback = false;
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
        } else {
          usedFallback = true;
        }
      } catch (err) {
        console.error("Failed to fetch similar events from FastAPI:", err);
        usedFallback = true;
      }
      
      if (usedFallback) {
        try {
          const all = await getEvents();
          const eventTags = event.tags || [];
          
          const fallbackSims = all
            .filter((e) => e.id !== event.id)
            .map((e) => {
              let score = 0;
              if (e.category === event.category) score += 40;
              if (e.city === event.city) score += 30;
              
              const eTags = e.tags || [];
              const commonTags = eTags.filter((t) => eventTags.includes(t));
              score += commonTags.length * 10;
              
              const reason = commonTags.length > 0 
                ? `Shared tags: ${commonTags.slice(0, 2).join(', ')}` 
                : e.category === event.category 
                  ? `Similar Category` 
                  : `Popular in ${e.city}`;

              return { ...e, matchScore: Math.min(score, 99), reason };
            })
            .filter((e) => e.matchScore && e.matchScore >= 30)
            .sort((a, b) => b.matchScore! - a.matchScore!)
            .slice(0, 10);
            
          setSimilarEvents(fallbackSims);
        } catch (fallbackErr) {
          console.error("Fallback similarity failed:", fallbackErr);
        }
      }

      setLoadingSimilar(false);
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-[300px] w-full md:h-[400px] bg-black"
      >
        <Image
          src={event.bannerImage}
          alt={event.title}
          fill
          className="object-scale-down"
          priority
          sizes="100vw"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary via-kairo-primary/40 to-transparent" />

        {/* Top controls */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20 shadow-md backdrop-blur-md transition-all hover:border-kairo-orange text-kairo-light-gray hover:text-kairo-white hover:scale-105"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2"
          >
            <button
              onClick={handleShare}
              className="flex h-11 w-11 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20 shadow-md backdrop-blur-md transition-all hover:border-kairo-orange text-kairo-light-gray hover:text-kairo-white hover:scale-105 cursor-pointer"
              aria-label="Share event"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <BookmarkButton eventId={event.id} isRecommendation={isRecommendation} className="bg-kairo-primary shadow-md border border-kairo-orange/20 h-11 w-11 flex items-center justify-center hover:border-kairo-orange rounded-none text-kairo-orange" />
          </motion.div>
        </div>

        {/* Online/Offline badge on banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-6 left-4 md:left-6"
        >
          <span
            className={`inline-flex items-center gap-1.5 rounded-none px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-md text-kairo-white border border-kairo-orange/20 ${event.isOnline
                ? "bg-kairo-primary/95 text-kairo-orange"
                : "bg-kairo-primary/95 text-kairo-white"
              }`}
          >
            <Globe className="h-3.5 w-3.5" />
            {event.isOnline ? "Online" : "In Person"}
          </span>
        </motion.div>
      </motion.div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mt-8">
        {/* Title */}
        <motion.h1
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-2xl sm:text-3xl font-serif font-light leading-tight tracking-wide md:text-5xl text-kairo-white uppercase"
        >
          {event.title}
        </motion.h1>

        {/* ── Live Countdown Timer ── */}
        {countdown && !countdown.expired && (
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8"
          >
            <div className="border border-kairo-orange/15 bg-kairo-dark-gray/20 p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-4 h-4 text-kairo-orange" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-kairo-light-gray">
                  Event Starts In
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/80">Live</span>
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-5">
                <CountdownUnit value={countdown.days} label="Days" />
                <span className="font-serif text-xl sm:text-2xl text-kairo-orange/40 mt-[-1rem] sm:mt-[-1.5rem]">:</span>
                <CountdownUnit value={countdown.hours} label="Hours" />
                <span className="font-serif text-xl sm:text-2xl text-kairo-orange/40 mt-[-1rem] sm:mt-[-1.5rem]">:</span>
                <CountdownUnit value={countdown.minutes} label="Min" />
                <span className="font-serif text-xl sm:text-2xl text-kairo-orange/40 mt-[-1rem] sm:mt-[-1.5rem]">:</span>
                <CountdownUnit value={countdown.seconds} label="Sec" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Expired Badge */}
        {countdown?.expired && (
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8 border border-red-500/20 bg-red-950/20 px-6 py-4 flex items-center gap-3"
          >
            <Zap className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              This event has ended
            </span>
          </motion.div>
        )}

        {/* Meta row */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-8 flex flex-wrap gap-x-8 gap-y-4"
        >
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
        </motion.div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-wrap gap-2"
          >
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-none bg-kairo-dark-gray/20 border border-kairo-orange/10 px-3.5 py-1 text-xs font-light text-kairo-light-gray tracking-wide shadow-sm hover:border-kairo-orange/30 transition-colors duration-200"
              >
                <Tag className="h-3 w-3 text-kairo-orange" />
                {tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* Divider */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="my-10 h-px bg-kairo-orange/10"
        />

        {/* Description */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <h2 className="mb-4 text-2xl font-serif font-light text-kairo-white uppercase tracking-wide">About This Event</h2>
          <p className="whitespace-pre-line leading-relaxed text-base sm:text-lg text-kairo-light-gray font-light tracking-wide">
            {event.description}
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="my-10 h-px bg-kairo-orange/10"
        />

        {/* Info Cards */}
        <motion.div
          custom={7}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Organizer Card */}
          <div className="rounded-none border border-kairo-orange/15 bg-kairo-dark-gray/10 p-6 shadow-sm hover:border-kairo-orange/30 transition-all duration-300 group">
            <h3 className="mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-kairo-light-gray">
              Organized by
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20 text-kairo-orange group-hover:border-kairo-orange/50 transition-colors duration-300">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-base text-kairo-white uppercase tracking-wide">{event.organizer}</p>
                <p className="text-[10px] uppercase tracking-wider text-kairo-light-gray mt-0.5">Event Organizer</p>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="rounded-none border border-kairo-orange/15 bg-kairo-dark-gray/10 p-6 shadow-sm hover:border-kairo-orange/30 transition-all duration-300 group">
            <h3 className="mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-kairo-light-gray">
              Location
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-none bg-kairo-primary border border-kairo-orange/20 text-kairo-orange group-hover:border-kairo-orange/50 transition-colors duration-300">
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
        </motion.div>

        {/* Divider */}
        <div className="my-10 h-px bg-kairo-orange/10" />

        {/* Similar Events Carousel */}
        <motion.div
          custom={8}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
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
        </motion.div>
      </div>

      {/* ── Fixed Bottom CTA ── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 bottom-[60px] md:bottom-0 z-50 border-t border-kairo-orange/10 bg-kairo-primary/90 px-4 py-4.5 backdrop-blur-xl md:px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]"
      >
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
                isRecommendation,
              });
            }}
            className="group relative flex w-full items-center justify-center gap-3 bg-kairo-orange hover:bg-kairo-orange/95 px-6 py-4 text-xs font-bold uppercase tracking-[0.3em] text-kairo-primary shadow-lg transition-all duration-300 hover:scale-[1.01] rounded-none overflow-hidden"
          >
            {/* Pulse shimmer effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            <span className="relative z-10 flex items-center gap-3">
              Register Now
              <ExternalLink className="h-4 w-4" />
            </span>
          </a>
        </div>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-55 px-6 py-3 bg-kairo-dark-gray border border-kairo-orange/30 text-xs font-bold text-kairo-white uppercase tracking-[0.2em] backdrop-blur-xl shadow-2xl flex items-center gap-2"
          >
            <span className="h-2 w-2 bg-kairo-orange animate-ping" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
