"use client";

import { useState } from "react";
import { HeroSection } from "@/components/hero-section";
import { TrendingSection } from "@/components/trending-section";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-kairo-primary overflow-hidden">
      {/* Dynamic Background Image Layer */}
      <AnimatePresence>
        {hoveredImage && (
          <motion.div
            key={hoveredImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-0 pointer-events-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hoveredImage}
              alt="Background"
              className="w-full h-full object-cover blur-2xl transform scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-kairo-primary via-kairo-primary/50 to-kairo-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* ── Hero ── */}
        <HeroSection />

        {/* ── Trending Events ── */}
        <section className="relative">
          <TrendingSection onHoverEvent={(image) => setHoveredImage(image)} />
        </section>
      </div>
    </div>
  );
}
