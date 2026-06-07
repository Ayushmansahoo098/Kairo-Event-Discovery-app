"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, MapPin, Calendar, LogIn } from "lucide-react";
import { Event } from "@/lib/types";
import { getEventById } from "@/lib/mock-data";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuthContext } from "@/context/auth-context";

interface RecommendedSectionProps {
  onHoverEvent?: (imageUrl: string | null) => void;
}

export function RecommendedSection({ onHoverEvent }: RecommendedSectionProps) {
  const { user } = useAuthContext();
  const containerRef = useRef(null);
  const [recommendedEvents, setRecommendedEvents] = useState<(Event & { reason?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const apiBase = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/recommendations?userId=${user.id}&limit=10`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          const recs = data.recommendedEvents || [];
          
          // Hydrate the full events
          const hydratedEvents = [];
          for (const rec of recs) {
            const event = await getEventById(rec.eventId);
            if (event) {
              hydratedEvents.push({
                ...event,
                reason: rec.reason,
              });
            }
          }
          setRecommendedEvents(hydratedEvents);
        }
      } catch (err) {
        console.error("Failed to fetch AI recommendations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [user]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [100, 0]);

  if (!user) {
    return (
      <motion.section 
        ref={containerRef}
        style={{ opacity, y }}
        className="py-16 relative bg-transparent z-10"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="relative overflow-hidden rounded-none border border-kairo-orange/20 bg-kairo-dark-gray/30 backdrop-blur-md p-10 flex flex-col items-center justify-center text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-kairo-orange/5 via-transparent to-kairo-orange/5" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kairo-orange/10 mb-6 relative z-10">
              <Sparkles className="h-8 w-8 text-kairo-orange" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-white mb-4 uppercase tracking-wide relative z-10">
              Unlock AI Recommendations
            </h2>
            <p className="text-kairo-light-gray text-xs md:text-sm max-w-lg mb-8 font-light tracking-wide leading-relaxed relative z-10">
              Sign in to let our recommendation engine analyze your interests, saves, and viewing history to curate a personalized event feed just for you.
            </p>
            <Link 
              href="/login"
              className="group relative z-10 inline-flex items-center gap-3 overflow-hidden rounded-none border border-kairo-orange bg-kairo-orange/10 px-8 py-4 text-xs font-bold uppercase tracking-[0.25em] text-kairo-orange transition-all hover:bg-kairo-orange hover:text-kairo-primary"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In Now</span>
            </Link>
          </div>
        </div>
      </motion.section>
    );
  }

  if (loading) {
    return null; // Or a skeleton
  }

  if (recommendedEvents.length === 0) {
    return null; // Hide if no recommendations could be hydrated
  }

  return (
    <motion.section 
      ref={containerRef}
      style={{ opacity, y }}
      className="py-24 relative bg-transparent z-10"
      onMouseLeave={() => onHoverEvent?.(null)}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 mb-10 flex items-center justify-between">
        <h2 className="text-3xl md:text-5xl font-serif font-light flex items-center gap-4 uppercase tracking-wide">
          <Sparkles className="w-8 h-8 text-kairo-orange drop-shadow-[0_0_15px_var(--color-kairo-orange)]" />
          <span className="text-kairo-white">Recommended For You</span>
        </h2>
        <Link href="/feed" className="text-[10px] font-bold tracking-[0.3em] uppercase text-kairo-light-gray hover:text-kairo-orange transition-colors">
          View all
        </Link>
      </div>

      <div className="w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-12 pt-4">
        <div className="flex gap-8 px-6 sm:px-10 max-w-7xl mx-auto">
          {recommendedEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
              className="snap-start shrink-0"
              onMouseEnter={() => onHoverEvent?.(event.bannerImage)}
            >
              <Link 
                href={`/events/${event.id}`}
                className="group block relative w-[85vw] sm:w-[400px] h-[450px] rounded-none overflow-hidden transition-all duration-500 shadow-2xl border border-kairo-orange/20 bg-kairo-dark-gray/40 backdrop-blur-sm hover:border-kairo-orange/60"
              >
                <div className="relative h-full w-full flex flex-col">
                  {/* Image Header */}
                  <div className="relative h-[220px] w-full overflow-hidden shrink-0">
                    <Image
                      src={event.bannerImage}
                      alt={event.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 400px"
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary to-transparent opacity-80" />
                    
                    {event.reason && (
                      <div className="absolute top-4 left-4 right-4 z-20">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-kairo-primary/90 border border-kairo-orange/30 backdrop-blur-md text-[9px] font-bold tracking-widest text-kairo-orange uppercase shadow-lg">
                          <Sparkles className="w-3 h-3" />
                          <span className="truncate">{event.reason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Content Body */}
                  <div className="p-6 flex flex-col flex-grow justify-between bg-gradient-to-b from-kairo-primary via-kairo-primary/95 to-kairo-dark-gray/90">
                    <div>
                      <h3 className="text-xl font-serif font-light text-white mb-4 line-clamp-2 leading-tight tracking-wide uppercase group-hover:text-kairo-orange transition-colors duration-300">
                        {event.title}
                      </h3>
                      <p className="text-xs text-kairo-light-gray line-clamp-3 font-light leading-relaxed mb-4">
                        {event.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-kairo-orange/10 pt-4 mt-auto">
                      <div className="flex items-center gap-4 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-kairo-orange" /> 
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-kairo-orange" /> 
                          {event.isOnline ? "Online" : event.city}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
