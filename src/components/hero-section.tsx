"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, Variants } from "framer-motion";
import { getTrendingEvents } from "@/lib/mock-data";
import Image from "next/image";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse position for subtle interactive background movement
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Calculate mouse offset from center (-1 to 1)
  const mouseX = windowSize.width ? (mousePosition.x / windowSize.width) * 2 - 1 : 0;
  const mouseY = windowSize.height ? (mousePosition.y / windowSize.height) * 2 - 1 : 0;

  // Scroll Tracking for the Hero section (to drive vertical scroll fade-outs)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothScroll = useSpring(scrollYProgress, { stiffness: 80, damping: 15 });

  // Scene 1 (The Hook): Fades out and translates upwards as the user scrolls down
  const introOpacity = useTransform(smoothScroll, [0, 0.25], [1, 0]);
  const introScale = useTransform(smoothScroll, [0, 0.25], [1, 0.95]);
  const introY = useTransform(smoothScroll, [0, 0.25], [0, -50]);

  // Data
  const trendingEvents = getTrendingEvents().slice(0, 3);

  // Stagger reveal animations for the main text
  const textContainerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.5,
      },
    },
  };

  const textItemVariants: Variants = {
    hidden: { y: 60, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  return (
    <div ref={containerRef} className="relative bg-kairo-primary flex flex-col z-10 w-full overflow-hidden">
      
      {/* ── BACKGROUND LAYER (Always fixed/sticky behind) ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ x: mouseX * -40, y: mouseY * -40 }}
          transition={{ type: "spring", stiffness: 45, damping: 25 }}
          className="absolute top-[10%] left-[15%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-kairo-orange/10 rounded-full blur-[130px] animate-pulse"
        />
        <motion.div
          animate={{ x: mouseX * 60, y: mouseY * 60 }}
          transition={{ type: "spring", stiffness: 35, damping: 25 }}
          className="absolute bottom-[20%] right-[10%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] bg-kairo-grad-2/8 rounded-full blur-[160px] animate-pulse delay-1000"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
        <div className="absolute inset-0 bg-gradient-to-b from-kairo-primary via-transparent to-kairo-primary opacity-90" />
      </div>

      {/* ── SECTION 1: THE IMMERSIVE HOOK (100vh) ── */}
      <motion.div
        style={{ opacity: introOpacity, scale: introScale, y: introY }}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-kairo-orange/30 text-[10px] sm:text-xs font-black tracking-[0.2em] text-kairo-orange mb-8 sm:mb-12 backdrop-blur-md shadow-[0_0_30px_rgba(232,80,2,0.15)]"
        >
          <Sparkles className="w-4 h-4" />
          CURATED EXPERIENCES
        </motion.div>

        {/* Cinematic Stagger Title */}
        <motion.h1
          variants={textContainerVariants}
          initial="hidden"
          animate="show"
          className="text-5xl sm:text-7xl md:text-8xl lg:text-[130px] font-black tracking-tighter text-kairo-white flex flex-col items-center leading-[0.9]"
        >
          <div className="overflow-hidden py-1">
            <motion.span variants={textItemVariants} className="block">
              Find Your
            </motion.span>
          </div>
          <div className="overflow-hidden py-1 pb-4 pr-4">
            <motion.span
              variants={textItemVariants}
              className="block bg-gradient-to-r from-kairo-grad-2 via-kairo-orange to-kairo-grad-4 bg-clip-text text-transparent"
            >
              Next Obsession.
            </motion.span>
          </div>
        </motion.h1>

        {/* Dynamic subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-base sm:text-lg md:text-xl text-kairo-light-gray max-w-2xl mx-auto leading-relaxed mt-6 sm:mt-8 font-medium px-4"
        >
          Ditch the ordinary. Step into a realm of underground concerts, hackathons, and exclusive enclaves tailored strictly to your vibe.
        </motion.p>

        {/* Explore Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-10 sm:mt-12"
        >
          <Link
            href="/feed"
            className="group relative overflow-hidden inline-flex items-center justify-center gap-3 bg-kairo-orange text-kairo-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-base sm:text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(232,80,2,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Events
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-kairo-grad-2 to-kairo-orange opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-10 flex flex-col items-center gap-2 cursor-pointer pointer-events-none"
        >
          <span className="text-[10px] tracking-[0.3em] font-bold text-kairo-light-gray uppercase">Scroll Down</span>
          <ChevronDown className="w-4 h-4 text-kairo-orange animate-bounce" />
        </motion.div>
      </motion.div>

      {/* ── SECTION 2: VERTICAL NARRATIVE FLOW (Scrolling reveals and fade outs) ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-20 flex flex-col gap-32 md:gap-48 w-full">
        
        {/* Narrative Card 1 */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.25 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          className="flex flex-col md:flex-row items-center gap-12 md:gap-16 w-full"
        >
          <div className="flex-1 space-y-6">
            <div className="text-kairo-orange font-bold tracking-widest text-xs uppercase sm:text-sm">
              [ 01 // VIBE CHECK ]
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-kairo-white tracking-tight leading-[1.1]">
              Ditch the FOMO.<br />Enter the Grid.
            </h2>
            <p className="text-base sm:text-lg text-kairo-light-gray leading-relaxed font-medium">
              No more spam. No more generic event feeds. Kairo curates the local underground scene to connect you directly with tech cohorts, live sets, and secret enclaves.
            </p>
          </div>
          
          <div className="flex-1 w-full aspect-[4/3] relative rounded-3xl overflow-hidden group border border-white/10 shadow-2xl shadow-black/80">
            {trendingEvents[0] && (
              <Image
                src={trendingEvents[0].bannerImage}
                alt="Immersive Event"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary via-transparent to-transparent opacity-60" />
          </div>
        </motion.div>

        {/* Narrative Card 2 */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.25 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16 w-full"
        >
          <div className="flex-1 space-y-6">
            <div className="text-kairo-orange font-bold tracking-widest text-xs uppercase sm:text-sm">
              [ 02 // MATCH ]
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-kairo-white tracking-tight leading-[1.1]">
              Discover What<br />Moves You.
            </h2>
            <p className="text-base sm:text-lg text-kairo-light-gray leading-relaxed font-medium">
              Filter by specific vibes. Dive into sub-cultures. From algorithmic art galleries to late-night coding bashes, we index the events that conventional search ignores.
            </p>
          </div>

          <div className="flex-1 w-full aspect-[4/3] relative rounded-3xl overflow-hidden group border border-white/10 shadow-2xl shadow-black/80">
            {trendingEvents[1] && (
              <Image
                src={trendingEvents[1].bannerImage}
                alt="Vibrant Event"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary via-transparent to-transparent opacity-60" />
          </div>
        </motion.div>

        {/* Narrative Card 3 */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.25 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          className="flex flex-col md:flex-row items-center gap-12 md:gap-16 w-full"
        >
          <div className="flex-1 space-y-6">
            <div className="text-kairo-orange font-bold tracking-widest text-xs uppercase sm:text-sm">
              [ 03 // CTA ]
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-kairo-white tracking-tight leading-[1.1]">
              Ready to<br />Step In?
            </h2>
            <p className="text-base sm:text-lg text-kairo-light-gray leading-relaxed font-medium">
              Start matching with upcoming hacker hangouts, synth jams, and tech networks nearby.
            </p>
            <div className="pt-4">
              <Link
                href="/feed"
                className="group relative overflow-hidden inline-flex items-center justify-center gap-3 bg-kairo-orange text-kairo-white px-8 py-4 rounded-full font-bold text-base transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(232,80,2,0.4)] animate-pulse"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Enter the Feed
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-kairo-grad-2 to-kairo-orange opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full aspect-[4/3] relative rounded-3xl overflow-hidden group border border-white/10 shadow-2xl shadow-black/80">
            {trendingEvents[2] && (
              <Image
                src={trendingEvents[2].bannerImage}
                alt="Exclusive Event"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary via-transparent to-transparent opacity-60" />
          </div>
        </motion.div>
        
      </div>
      
      {/* Visual Divider / Stats panel */}
      <div className="relative z-10 w-full bg-kairo-dark-gray/30 border-y border-white/5 py-12 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-5xl font-black text-kairo-white">500+</div>
            <div className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-kairo-light-gray uppercase mt-2">Active Events</div>
          </div>
          <div>
            <div className="text-3xl sm:text-5xl font-black text-kairo-white">50+</div>
            <div className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-kairo-light-gray uppercase mt-2">Cities Covered</div>
          </div>
          <div>
            <div className="text-3xl sm:text-5xl font-black text-kairo-orange">10K+</div>
            <div className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-kairo-light-gray uppercase mt-2">Discoveries</div>
          </div>
        </div>
      </div>

    </div>
  );
}
