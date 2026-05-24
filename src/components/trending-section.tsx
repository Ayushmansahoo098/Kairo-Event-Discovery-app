"use client";

import { useRef, useState } from "react";
import { getTrendingEvents } from "@/lib/mock-data";
import Link from "next/link";
import Image from "next/image";
import { Flame, MapPin, Calendar } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

interface TrendingSectionProps {
  onHoverEvent?: (imageUrl: string | null) => void;
}

export function TrendingSection({ onHoverEvent }: TrendingSectionProps) {
  const containerRef = useRef(null);
  const trendingEvents = getTrendingEvents();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Fade section in as it scrolls into view
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [100, 0]);

  return (
    <motion.section 
      ref={containerRef}
      style={{ opacity, y }}
      className="py-32 relative bg-transparent border-y border-kairo-dark-gray/30 z-10"
      onMouseLeave={() => onHoverEvent?.(null)}
    >
      <div className="max-w-7xl mx-auto px-4 mb-12 flex items-center justify-between">
        <h2 className="text-4xl md:text-5xl font-black flex items-center gap-4 tracking-tight">
          <Flame className="w-10 h-10 text-kairo-orange drop-shadow-[0_0_15px_rgba(232,80,2,0.5)]" />
          <span className="text-kairo-white">Trending Now</span>
        </h2>
        <Link href="/feed" className="text-sm font-bold tracking-widest uppercase text-kairo-light-gray hover:text-kairo-orange transition-colors">
          View all
        </Link>
      </div>

      <div className="w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-16 pt-4">
        <div className="flex gap-8 px-4 md:px-safe max-w-7xl mx-auto">
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
                className="group block relative w-[85vw] sm:w-[450px] rounded-3xl overflow-hidden transition-all duration-500 shadow-xl shadow-black/50 border border-kairo-dark-gray/50 hover:border-kairo-orange/50"
              >
                {/* Magnetic / 3D Hover container */}
                <motion.div 
                  className="relative h-[320px] w-full"
                  whileHover={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <Image
                    src={event.bannerImage}
                    alt={event.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 450px"
                    className="object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
                  />
                  {/* Heavy dark gradient overlay for text readability and cinematic feel */}
                  <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary via-kairo-primary/50 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-500" />
                  
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest bg-kairo-orange text-kairo-white shadow-[0_0_20px_rgba(232,80,2,0.6)]">
                      HOT
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-3 line-clamp-2 leading-tight tracking-tight drop-shadow-lg">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-6 text-sm font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-kairo-orange" /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-kairo-grad-4" /> {event.isOnline ? "Online" : event.city}</span>
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
