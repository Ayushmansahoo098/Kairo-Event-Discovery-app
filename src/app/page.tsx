"use client";

import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-kairo-primary overflow-hidden flex flex-col items-center justify-center">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      {/* ─── Static Grid Lines ─── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-[1px] bg-kairo-orange/40 h-[calc(max(0px,50vh-140px))] mix-blend-screen" />
        </div>

        {/* Bottom Line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-end">
          <div className="w-[1px] bg-kairo-orange/40 h-[calc(max(0px,50vh-140px))] mix-blend-screen" />
        </div>
      </div>

      {/* ─── Center Branding ─── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-kairo-white px-4 pointer-events-none">
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.5em] uppercase text-kairo-light-gray font-semibold mb-6 text-center"
        >
          The Kairo Conclave
        </motion.p>

        <div className="overflow-hidden py-2">
          <motion.h1
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-[100px] font-light tracking-[0.1em] sm:tracking-[0.15em] uppercase text-center leading-none text-kairo-white font-serif"
          >
            KAIRO
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
          className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.4em] uppercase text-kairo-orange font-bold mt-6 text-center"
        >
          Event Discovery
        </motion.p>
      </div>
    </div>
  );
}
