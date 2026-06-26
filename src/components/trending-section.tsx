"use client";

import { useRef, useState, useEffect } from "react";
import { getTrendingEvents } from "@/lib/mock-data";
import Link from "next/link";
import Image from "next/image";
import { Flame, MapPin, Calendar } from "lucide-react";
import { Event } from "@/lib/types";
import { motion, useScroll, useTransform } from "framer-motion";

interface TrendingSectionProps {
  onHoverEvent?: (imageUrl: string | null) => void;
}

export function TrendingSection({ onHoverEvent }: TrendingSectionProps) {
  const containerRef = useRef(null);
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const list = await getTrendingEvents();
        setTrendingEvents(list);
      } catch (err) {
        console.error("TrendingSection trending events fetch failed:", err);
      }
    };
    fetchTrending();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [100, 0]);

  if (trendingEvents.length === 0) {
    return (
      <motion.section 
        ref={containerRef}
        style={{ opacity, y }}
        className="py-32 relative bg-transparent border-y border-kairo-dark-gray/30 z-10"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 mb-12 flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-3xl md:text-5xl font-serif font-light flex items-center gap-3 sm:gap-4 uppercase tracking-wide">
            <Flame className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 text-kairo-orange drop-shadow-[0_0_15px_var(--color-kairo-orange)]" />
            <span className="text-kairo-white whitespace-nowrap">Trending Now</span>
          </h2>
        </div>
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex h-[200px] flex-col items-center justify-center rounded-none border border-kairo-orange/15 bg-kairo-dark-gray/10 p-6 text-center">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-kairo-white">No events yet</h3>
            <p className="text-xs text-kairo-light-gray font-light">Check back soon for new events.</p>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section 
      ref={containerRef}
      style={{ opacity, y }}
      className="py-32 relative bg-transparent z-10"
      onMouseLeave={() => onHoverEvent?.(null)}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 mb-12 flex items-center justify-between gap-4">
        <h2 className="text-xl sm:text-3xl md:text-5xl font-serif font-light flex items-center gap-3 sm:gap-4 uppercase tracking-wide">
          <Flame className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 text-kairo-orange drop-shadow-[0_0_15px_var(--color-kairo-orange)]" />
          <span className="text-kairo-white whitespace-nowrap">Trending Now</span>
        </h2>
        <Link href="/feed" className="text-[10px] font-bold tracking-[0.3em] uppercase text-kairo-light-gray hover:text-kairo-orange transition-colors whitespace-nowrap shrink-0">
          View all
        </Link>
      </div>

      <div className="w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-16 pt-4">
        <div className="flex gap-8 px-6 sm:px-10 max-w-7xl mx-auto">
          {trendingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
              className="snap-start shrink-0"
              onMouseEnter={() => onHoverEvent?.(event.bannerImage)}
            >
              <Link 
                href={`/events/${event.id}`}
                className="group block relative w-[85vw] sm:w-[450px] rounded-3xl overflow-hidden transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/5 backdrop-blur-sm hover:bg-white/10"
              >
                {/* Magnetic / 3D Hover container */}
                <motion.div 
                  className="relative h-[320px] w-full"
                  whileHover={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <Image
                    src={event.bannerImage}
                    alt={event.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 450px"
                    className="object-contain object-center transition-transform duration-1000 group-hover:scale-105"
                  />
                  {/* Heavy dark gradient overlay for text readability and cinematic feel */}
                  <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary via-kairo-primary/40 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-500" />
                  
                  <div className="absolute top-6 left-6">
                    <span className="px-3 py-1 rounded-full text-[9px] font-bold tracking-widest bg-kairo-orange/20 backdrop-blur-md text-kairo-orange uppercase">
                      HOT
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-xl md:text-2xl font-serif font-light text-white mb-3 line-clamp-2 leading-tight tracking-wide uppercase group-hover:text-kairo-orange transition-colors duration-300">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-6 text-[11px] font-light text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 tracking-wide">
                      <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-kairo-orange" /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-kairo-orange" /> {event.isOnline ? "Online" : event.city}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
