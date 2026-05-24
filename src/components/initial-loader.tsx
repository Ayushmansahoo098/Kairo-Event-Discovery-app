"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function InitialLoader() {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'loading' | 'ready' | 'transitioning' | 'exiting' | 'done'>('loading');

  useEffect(() => {
    // Simulate loading progress
    const duration = 2500; 
    const interval = 30;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setStep('ready'); // Reached 100%, show proceed button
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleProceed = () => {
    setStep('transitioning');
  };

  if (step === 'done') return null;

  // The visual content of the loader (rendered twice for the curtain split effect)
  const LoaderVisuals = () => (
    <div className="absolute inset-0 w-full h-full bg-[#f4f4f4] overflow-hidden">
      {/* Light background texture */}
      <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      {/* Dark Sweep Transition */}
      <motion.div
        initial={{ x: "-100%", y: "100%", rotate: -45 }}
        animate={
          (step === 'transitioning' || step === 'exiting')
            ? { x: "-50%", y: "-50%", rotate: -45 }
            : { x: "-100%", y: "100%", rotate: -45 }
        }
        transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
        onAnimationComplete={() => {
          if (step === 'transitioning') setStep('exiting');
        }}
        className="absolute top-0 left-0 w-[300vw] h-[300vh] bg-kairo-primary z-20 origin-center"
      />

      {/* Lines and Numbers (Fade out when transitioning) */}
      <motion.div 
        animate={{ opacity: (step === 'loading' || step === 'ready') ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-30 pointer-events-none"
      >
        {/* Top Line & Number */}
        <motion.div 
          initial={{ opacity: 1 }}
          animate={step === 'ready' ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.5, ease: "easeOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
        >
          <div 
            className="w-[1px] bg-kairo-orange"
            style={{ height: `calc(max(0px, 50vh - 180px) * ${progress / 100})`, transition: "height 30ms linear" }}
          />
          <div className="mt-4 text-kairo-orange font-mono text-sm tracking-widest">{progress}</div>
        </motion.div>

        {/* Bottom Line & Number */}
        <motion.div 
          initial={{ opacity: 1 }}
          animate={step === 'ready' ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.5, ease: "easeOut" }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-end"
        >
          <div className="mb-4 text-kairo-orange font-mono text-sm tracking-widest">{progress}</div>
          <div 
            className="w-[1px] bg-kairo-orange"
            style={{ height: `calc(max(0px, 50vh - 180px) * ${progress / 100})`, transition: "height 30ms linear" }}
          />
        </motion.div>
      </motion.div>

      {/* Center Text (Mix Blend Difference)
          - Over #f4f4f4 (Light), text-white -> looks Dark
          - Over #0a0a0b (Dark Sweep), text-white -> looks White
      */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center mix-blend-difference text-white pointer-events-none">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xs sm:text-sm tracking-[0.4em] uppercase mb-4"
        >
          K a i r o &nbsp; E x p e r i e n c e
        </motion.p>
        
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={
            step === 'ready' 
              ? { opacity: 1, scale: [1, 1.05, 1], transition: { delay: 1.5, duration: 0.4, ease: "easeInOut" } }
              : { opacity: 1, scale: 1, transition: { delay: 0.6, duration: 0.8, ease: "easeOut" } }
          }
          className="text-5xl sm:text-7xl md:text-8xl lg:text-[110px] font-black tracking-tighter uppercase text-center leading-none"
        >
          Event Mania
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-xs sm:text-sm tracking-[0.4em] uppercase mt-4"
        >
          D i s c o v e r &nbsp; Y o u r &nbsp; V i b e
        </motion.p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none">
      {/* Top Half Curtain */}
      <motion.div
        animate={step === 'exiting' ? { y: "-100%" } : { y: "0%" }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        onAnimationComplete={() => {
          if (step === 'exiting') setStep('done');
        }}
        className="absolute inset-0"
        style={{ clipPath: "inset(0 0 50% 0)" }}
      >
        <LoaderVisuals />
      </motion.div>

      {/* Bottom Half Curtain */}
      <motion.div
        animate={step === 'exiting' ? { y: "100%" } : { y: "0%" }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-0"
        style={{ clipPath: "inset(50% 0 0 0)" }}
      >
        <LoaderVisuals />
      </motion.div>

      {/* Interactive Proceed Button */}
      <AnimatePresence>
        {step === 'ready' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, pointerEvents: "none" }}
            transition={{ delay: 3.0, type: "spring", stiffness: 300, damping: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto"
          >
            <button
              onClick={handleProceed}
              className="group flex items-center gap-4 px-8 py-4 bg-transparent border border-kairo-dark-gray/30 text-[#111] hover:bg-[#111] hover:text-[#fff] hover:border-[#111] transition-all duration-500 tracking-[0.4em] text-[10px] uppercase font-bold"
            >
              <span className="relative z-10">Proceed</span>
              <div className="w-8 h-[1px] bg-current transform origin-left transition-transform duration-500 group-hover:scale-x-150" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
