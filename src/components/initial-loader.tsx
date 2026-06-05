"use client";

import { useEffect, useState, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";

type LoaderStep = "loading" | "ready" | "wiping" | "done";

// Jagged brush-stroke edge: static irregularities per Y-position to mimic paint strokes
const BRUSH_JITTER = [3, -2.5, 4, -1.5, 2.5, -3.5, 1.5, -2, 3.5, -1, 2];

export function InitialLoader() {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<LoaderStep>("loading");
  const [showButton, setShowButton] = useState(false);

  // Motion value for the leading edge X position of the brush wipe (0 = full coverage, 110 = off screen)
  const brushX = useMotionValue(0);

  // Derive clip-path from brushX — this creates the jagged brush-stroke edge
  const brushClipPath = useTransform(brushX, (x) => {
    const j = BRUSH_JITTER;
    // The polygon covers the screen from X% to 100% (right side stays covered)
    // The left (leading) edge has jitter to look like a brush stroke
    return (
      `polygon(` +
      `${x}% 0%, ` +
      `100% 0%, ` +
      `100% 100%, ` +
      `${x}% 100%, ` +
      `${x + j[10]}% 92%, ` +
      `${x + j[9]}% 84%, ` +
      `${x + j[8]}% 75%, ` +
      `${x + j[7]}% 66%, ` +
      `${x + j[6]}% 58%, ` +
      `${x + j[5]}% 50%, ` +
      `${x + j[4]}% 42%, ` +
      `${x + j[3]}% 33%, ` +
      `${x + j[2]}% 25%, ` +
      `${x + j[1]}% 16%, ` +
      `${x + j[0]}% 8%, ` +
      `${x}% 0%` +
      `)`
    );
  });

  // Progress counter: 0 → 100 over 2 seconds
  useEffect(() => {
    const duration = 2000;
    const interval = 25;
    const totalSteps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(Math.min(Math.round((currentStep / totalSteps) * 100), 100));
      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setStep("ready");
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Show Enter button ONLY after the counter lines have finished fading out
  // Lines fade: delay 2.2s + duration 0.5s = 2.7s → show button at 3.0s after 'ready'
  useEffect(() => {
    if (step === "ready") {
      const t = setTimeout(() => setShowButton(true), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Brush wipe on click: animate brushX from 0 → 110 with cinematic easing
  const handleProceed = useCallback(() => {
    setShowButton(false);
    setStep("wiping");
    animate(brushX, 115, {
      duration: 1.4,
      ease: [0.76, 0, 0.24, 1],
      onComplete: () => setStep("done"),
    });
  }, [brushX]);

  if (step === "done") return null;

  return (
    <motion.div
      className="fixed inset-0 z-[999] bg-kairo-primary overflow-hidden"
      style={step === "wiping" ? { clipPath: brushClipPath } : undefined}
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      {/* ─── Progress Lines & Counter ─── */}
      <motion.div
        animate={{ opacity: step === "wiping" ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Top Line + Number */}
        <motion.div
          animate={
            step === "ready" || step === "wiping"
              ? { opacity: 0, y: -20 }
              : { opacity: 1, y: 0 }
          }
          transition={{ delay: 2.2, duration: 0.5, ease: "easeOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
        >
          <div
            className="w-[1px] bg-kairo-orange/40"
            style={{
              height: `calc(max(0px, 50vh - 140px) * ${progress / 100})`,
              transition: "height 30ms linear",
            }}
          />
          <div className="mt-4 text-kairo-orange font-mono text-xs tracking-[0.2em]">
            {progress}%
          </div>
        </motion.div>

        {/* Bottom Line + Number */}
        <motion.div
          animate={
            step === "ready" || step === "wiping"
              ? { opacity: 0, y: 20 }
              : { opacity: 1, y: 0 }
          }
          transition={{ delay: 2.2, duration: 0.5, ease: "easeOut" }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-end"
        >
          <div className="mb-4 text-kairo-orange font-mono text-xs tracking-[0.2em]">
            {progress}%
          </div>
          <div
            className="w-[1px] bg-kairo-orange/40"
            style={{
              height: `calc(max(0px, 50vh - 140px) * ${progress / 100})`,
              transition: "height 30ms linear",
            }}
          />
        </motion.div>
      </motion.div>

      {/* ─── Center Branding ─── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-kairo-white px-4 pointer-events-none">
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-[10px] sm:text-xs tracking-[0.5em] uppercase text-kairo-light-gray font-semibold mb-6"
        >
          T h e &nbsp; K a i r o &nbsp; C o n c l a v e
        </motion.p>

        <div className="overflow-hidden py-2">
          <motion.h1
            initial={{ opacity: 0, y: 80 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                delay: 0.5,
                duration: 1.0,
                ease: [0.16, 1, 0.3, 1],
              },
            }}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-[100px] font-light tracking-[0.15em] uppercase text-center leading-none text-kairo-white font-serif"
          >
            KAIRO
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-[10px] sm:text-xs tracking-[0.4em] uppercase text-kairo-orange font-bold mt-6"
        >
          E v e n t &nbsp; D i s c o v e r y
        </motion.p>
      </div>

      {/* ─── Enter Button (appears only after counter fades out) ─── */}
      <AnimatePresence>
        {showButton && step === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto"
          >
            <button
              onClick={handleProceed}
              className="group flex items-center gap-6 px-10 py-5 bg-transparent border border-kairo-orange/30 text-kairo-white hover:bg-kairo-orange hover:text-kairo-primary hover:border-kairo-orange transition-all duration-500 tracking-[0.5em] text-[10px] uppercase font-bold rounded-none cursor-pointer"
            >
              <span className="relative z-10">Enter</span>
              <div className="w-6 h-[1px] bg-current transform origin-left transition-transform duration-500 group-hover:scale-x-150" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
