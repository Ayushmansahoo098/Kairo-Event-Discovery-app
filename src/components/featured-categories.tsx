"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { categories, getEvents } from "@/lib/mock-data";
import Link from "next/link";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

// Map some cool Unsplash images to categories for the hover reveal
const categoryImages: Record<string, string> = {
  hackathon: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
  workshop: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80",
  meetup: "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&q=80",
  startup: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  concert: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  comedy: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80",
  "food-festival": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
  party: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
  networking: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80",
  "tech-talk": "https://images.unsplash.com/photo-1475721028314-3905d677a233?w=800&q=80",
  "ai-ml": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
  gaming: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
};

export function FeaturedCategories() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getEvents().then((eventsList) => {
      const tally: Record<string, number> = {};
      eventsList.forEach((e) => {
        if (e.category) {
          tally[e.category] = (tally[e.category] || 0) + 1;
        }
      });
      setCounts(tally);
    }).catch((err) => {
      console.warn("Failed to compute dynamic category counts:", err);
    });
  }, []);

  // Mouse tracking for the floating image
  const mouseX = useSpring(0, { damping: 20, stiffness: 100, mass: 0.5 });
  const mouseY = useSpring(0, { damping: 20, stiffness: 100, mass: 0.5 });

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  // Only take the top 6 for the list to keep it elegant
  const displayCategories = categories.slice(0, 6);

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="py-32 relative"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="mb-20">
          <p className="text-kairo-orange tracking-widest uppercase text-sm font-bold mb-4">Discover</p>
          <h2 className="text-4xl md:text-6xl font-serif text-kairo-white font-light">Explore by Vibe</h2>
        </div>

        <div className="relative z-30 flex flex-col items-start gap-4 md:gap-8">
          {displayCategories.map((cat) => {
            const isHovered = hoveredCategory === cat.id;
            const isOtherHovered = hoveredCategory !== null && hoveredCategory !== cat.id;
            
            return (
              <Link
                key={cat.id}
                href={`/feed?category=${cat.id}`}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                className="group relative block w-full border-b border-white/5 pb-4 md:pb-8 transition-colors hover:border-white/20"
              >
                <div className="flex items-end justify-between w-full">
                  <h3 
                    className={`text-4xl md:text-6xl lg:text-7xl font-serif tracking-tight transition-all duration-500
                      ${isHovered ? 'text-kairo-white translate-x-4 md:translate-x-8' : 'text-kairo-gray'}
                      ${isOtherHovered ? 'opacity-30' : 'opacity-100'}
                    `}
                  >
                    {cat.name}
                  </h3>
                  
                  <span className={`text-sm md:text-lg font-mono transition-all duration-500
                    ${isHovered ? 'text-kairo-orange' : 'text-kairo-gray/50'}
                    ${isOtherHovered ? 'opacity-30' : 'opacity-100'}
                  `}>
                    ({counts[cat.id] ?? cat.count})
                  </span>
                </div>
              </Link>
            );
          })}
          
          <Link
            href="/feed"
            className="group flex items-center gap-4 mt-8 text-kairo-white hover:text-kairo-orange transition-colors"
          >
            <span className="text-xl md:text-2xl font-light">View All Categories</span>
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-kairo-orange group-hover:bg-kairo-orange/10 transition-all">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Floating Hover Image */}
      <AnimatePresence>
        {hoveredCategory && categoryImages[hoveredCategory] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ 
              x: mouseX, 
              y: mouseY,
              translateX: "-50%",
              translateY: "-50%",
            }}
            className="absolute top-0 left-0 w-[300px] h-[400px] pointer-events-none z-20 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
          >
            <Image 
              src={categoryImages[hoveredCategory]}
              alt="Category Preview"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary/80 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
