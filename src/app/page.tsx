"use client";

import { useState, useRef } from "react";
import { HeroSection } from "@/components/hero-section";
import { TrendingSection } from "@/components/trending-section";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { RecommendedSection } from "@/components/recommended-section";
import { FeaturedCategories } from "@/components/featured-categories";

import { Footer } from "@/components/footer";

export default function HomePage() {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax offsets for sections
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const categoriesY = useTransform(scrollYProgress, [0, 0.3], [100, 0]);
  const recommendedY = useTransform(scrollYProgress, [0.1, 0.5], [100, 0]);
  const trendingY = useTransform(scrollYProgress, [0.3, 0.7], [100, 0]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-kairo-primary overflow-hidden selection:bg-kairo-orange/30">
      
      {/* ── GLOBAL BACKGROUND LAYER ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Dynamic Mesh Aurora */}
        <div className="absolute inset-0 w-[120%] h-[120%] -left-[10%] -top-[10%]">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute top-[10%] left-[15%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-kairo-orange/15 rounded-full blur-[120px] mix-blend-screen" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.3, 1] }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[20%] right-[10%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] bg-kairo-grad-2/20 rounded-full blur-[150px] mix-blend-screen" 
          />
        </div>
        
        {/* Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        {/* Base Gradient Fade to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-kairo-primary/70 to-kairo-primary opacity-100" />
      </div>

      {/* Dynamic Hover Image Layer (over background, under content) */}
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

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="flex-1">
          {/* ── Hero ── */}
          <motion.div style={{ y: heroY }} className="relative z-10">
            <HeroSection />
          </motion.div>

          {/* ── Featured Categories ── */}
          <motion.div style={{ y: categoriesY }} className="relative z-20 pt-20">
            <FeaturedCategories />
          </motion.div>

          {/* ── Recommended Events ── */}
          <motion.section style={{ y: recommendedY }} className="relative z-20 pt-20">
            <RecommendedSection onHoverEvent={(image) => setHoveredImage(image)} />
          </motion.section>

          {/* ── Trending Events ── */}
          <motion.section style={{ y: trendingY }} className="relative z-20 pt-20 pb-20">
            <TrendingSection onHoverEvent={(image) => setHoveredImage(image)} />
          </motion.section>
        </div>

        {/* ── Footer ── */}
        <Footer />
      </div>
    </div>
  );
}
