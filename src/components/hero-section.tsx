"use client";

import { useState, useRef, MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, X, Mail, Lock, Loader2 } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useAuthContext } from "@/context/auth-context";
import { OAuthButtons } from "@/components/oauth-buttons";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import Image from "next/image";

// ── Magnetic Button Component ──
function MagneticButton({ children, onClick, href }: { children: React.ReactNode; onClick?: (e: any) => void; href?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    mouseX.set(middleX * 0.3);
    mouseY.set(middleY * 0.3);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const content = (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden inline-flex items-center justify-center bg-kairo-orange text-kairo-primary px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-shadow duration-300 shadow-[0_0_20px_rgba(184,168,138,0.3)] hover:shadow-[0_0_30px_rgba(184,168,138,0.5)] cursor-pointer"
    >
      <motion.div 
        className="absolute inset-0 bg-kairo-white pointer-events-none rounded-full origin-center"
        initial={{ scale: 0 }}
        animate={{ scale: isHovered ? 1.5 : 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      <span className="relative z-10 flex items-center gap-2 group-hover:text-kairo-dark-gray transition-colors duration-300">
        {children}
      </span>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-block">
        {content}
      </Link>
    );
  }
  
  return <div onClick={onClick} className="inline-block">{content}</div>;
}

export function HeroSection() {
  const { user, login } = useAuthContext();
  const router = useRouter();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax Mouse Tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const { width, height, left, top } = containerRef.current.getBoundingClientRect();
    // Normalized values from -1 to 1
    const x = (e.clientX - left - width / 2) / (width / 2);
    const y = (e.clientY - top - height / 2) / (height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleExploreClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    setIsAuthSubmitting(true);
    setAuthError("");
    try {
      await login(authEmail, authPassword);
      setShowAuthModal(false);
      router.push("/feed");
    } catch (error: unknown) {
      console.error("Hero Auth failed:", error);
      setAuthError(getAuthErrorMessage(error, "Failed to authenticate. Please check your credentials."));
      setIsAuthSubmitting(false);
    }
  };

  // 3D Parallax Transforms
  // Cards tilt opposite to mouse movement for depth
  const rotateX = useTransform(smoothY, [-1, 1], [15, -15]);
  const rotateY = useTransform(smoothX, [-1, 1], [-15, 15]);
  
  // Background moves slightly with mouse
  const bgX = useTransform(smoothX, [-1, 1], [-50, 50]);
  const bgY = useTransform(smoothY, [-1, 1], [-50, 50]);

  // Masked Text Reveal Variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };
  
  const wordVariants = {
    hidden: { y: "120%", opacity: 0 },
    visible: { 
      y: "0%", 
      opacity: 1, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } 
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative flex flex-col z-10 w-full min-h-[90vh] md:min-h-[95vh] perspective-1000"
    >
      {/* Background now handled globally in page.tsx */}
      {/* ── MAIN HERO CONTENT ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 z-10 max-w-5xl mx-auto">
        {/* Masked Headline Reveal */}
        <motion.h1 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[85px] font-serif font-light text-kairo-white tracking-tight leading-[1.1] mb-8 flex flex-col items-center"
        >
          <div className="flex flex-wrap justify-center overflow-hidden pb-2">
            {["Find", "the", "events", "that"].map((word, i) => (
              <span key={i} className="overflow-hidden inline-block mr-4 md:mr-6">
                <motion.span variants={wordVariants} className="inline-block">{word}</motion.span>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center overflow-hidden pt-1 pb-4">
            {["match", "your", "vibe"].map((word, i) => (
              <span key={i} className="overflow-hidden inline-block mr-4 md:mr-6">
                <motion.span 
                  variants={wordVariants} 
                  className="inline-block bg-gradient-to-r from-kairo-grad-2 via-kairo-orange to-kairo-grad-4 bg-clip-text text-transparent italic font-normal"
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </div>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          className="text-base md:text-lg text-kairo-light-gray max-w-2xl leading-relaxed mb-12 font-light mix-blend-screen"
        >
          Skip the noise. Discover curated concerts, tech meetups, comedy shows, and exclusive experiences tailored perfectly for you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1, ease: "easeOut" }}
          className="z-20"
        >
          <MagneticButton href="/feed" onClick={handleExploreClick}>
            Start Exploring
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </MagneticButton>
        </motion.div>

        {/* 3D Floating Feature Images */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="mt-24 w-full max-w-5xl relative h-[280px] sm:h-[400px] perspective-1000 z-10"
        >
          {/* Left Card */}
          <motion.div 
            style={{ rotateX, rotateY, x: useTransform(smoothX, [-1, 1], [-20, 20]), y: useTransform(smoothY, [-1, 1], [-20, 20]) }}
            className="absolute left-[5%] top-12 w-[35%] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 border border-white/10 backdrop-blur-sm"
          >
            <motion.div 
              animate={{ y: ["-2%", "2%"] }} 
              transition={{ duration: 4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              <Image src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80" alt="Tech" fill className="object-cover scale-110" />
              <div className="absolute inset-0 bg-gradient-to-tr from-kairo-primary/60 to-transparent" />
            </motion.div>
          </motion.div>

          {/* Center Card */}
          <motion.div 
            style={{ rotateX, rotateY, x: useTransform(smoothX, [-1, 1], [-30, 30]), y: useTransform(smoothY, [-1, 1], [-30, 30]) }}
            className="absolute left-[32.5%] top-0 w-[35%] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.7)] z-30 border border-white/20 backdrop-blur-md"
          >
            <motion.div 
              animate={{ y: ["2%", "-2%"] }} 
              transition={{ duration: 5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              <Image src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80" alt="Music" fill className="object-cover scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary/80 via-transparent to-transparent" />
              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]" />
            </motion.div>
          </motion.div>

          {/* Right Card */}
          <motion.div 
            style={{ rotateX, rotateY, x: useTransform(smoothX, [-1, 1], [-15, 15]), y: useTransform(smoothY, [-1, 1], [-15, 15]) }}
            className="absolute right-[5%] top-16 w-[35%] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 border border-white/10 backdrop-blur-sm"
          >
            <motion.div 
              animate={{ y: ["-3%", "3%"] }} 
              transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              <Image src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80" alt="Networking" fill className="object-cover scale-110" />
              <div className="absolute inset-0 bg-gradient-to-tl from-kairo-primary/60 to-transparent" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-kairo-primary/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-md bg-kairo-dark-gray/50 border border-kairo-orange/20 p-8 md:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.8)] text-left rounded-2xl backdrop-blur-2xl"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 text-kairo-light-gray hover:text-kairo-white p-2 rounded-full hover:bg-white/5 transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-12 h-12 rounded-full bg-kairo-orange/10 flex items-center justify-center text-kairo-orange mb-4 shadow-[0_0_15px_rgba(184,168,138,0.2)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-serif text-kairo-white mb-2">Welcome to Kairo</h3>
                <p className="text-sm text-kairo-light-gray">Log in to discover personalized events.</p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authError && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                    {authError}
                  </motion.div>
                )}
                <div>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-kairo-gray group-focus-within:text-kairo-orange transition-colors">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-kairo-white placeholder-kairo-gray/50 focus:outline-none focus:border-kairo-orange/50 focus:ring-1 focus:ring-kairo-orange/50 transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-kairo-gray group-focus-within:text-kairo-orange transition-colors">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-kairo-white placeholder-kairo-gray/50 focus:outline-none focus:border-kairo-orange/50 focus:ring-1 focus:ring-kairo-orange/50 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthSubmitting || !authEmail || !authPassword}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-full text-sm font-bold text-kairo-primary bg-kairo-orange hover:bg-white hover:text-kairo-primary transition-all duration-300 disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(184,168,138,0.3)]"
                >
                  {isAuthSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-6">
                <div className="absolute w-full border-t border-white/10"></div>
                <span className="relative px-4 text-xs text-kairo-gray bg-kairo-dark-gray/50">Or continue with</span>
              </div>

              <OAuthButtons
                disabled={isAuthSubmitting}
                onStart={() => { setIsAuthSubmitting(true); setAuthError(""); }}
                onSuccess={() => { setShowAuthModal(false); router.push("/feed"); }}
                onError={(msg) => { setAuthError(msg); setIsAuthSubmitting(false); }}
                onCancel={() => setIsAuthSubmitting(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
