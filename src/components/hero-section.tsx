"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, ChevronDown, X, Mail, Lock, Loader2 } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, Variants, AnimatePresence } from "framer-motion";
import { getTrendingEvents } from "@/lib/mock-data";
import Image from "next/image";
import { Event } from "@/lib/types";
import { useAuthContext } from "@/context/auth-context";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, login, loginWithGoogle, loginWithGithub } = useAuthContext();
  const router = useRouter();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

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
      const errorMessage = error instanceof Error ? error.message : "Failed to authenticate. Please check your credentials.";
      setAuthError(errorMessage);
      setIsAuthSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthSubmitting(true);
    setAuthError("");
    try {
      await loginWithGoogle();
      setShowAuthModal(false);
      router.push("/feed");
    } catch (error: unknown) {
      console.error("Hero Google Auth failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to authenticate with Google.";
      setAuthError(errorMessage);
      setIsAuthSubmitting(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsAuthSubmitting(true);
    setAuthError("");
    try {
      await loginWithGithub();
      setShowAuthModal(false);
      router.push("/feed");
    } catch (error: unknown) {
      console.error("Hero Github Auth failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to authenticate with GitHub.";
      setAuthError(errorMessage);
      setIsAuthSubmitting(false);
    }
  };
  
  // Mouse position for subtle interactive background movement
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    // Use requestAnimationFrame to avoid synchronous setState during effect execution
    requestAnimationFrame(updateSize);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("resize", updateSize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
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
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const list = await getTrendingEvents();
        setTrendingEvents(list.slice(0, 3));
      } catch (err) {
        console.error("HeroSection trending events fetch failed:", err);
      }
    };
    fetchTrending();
  }, []);

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
            onClick={handleExploreClick}
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
                onClick={handleExploreClick}
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

      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kairo-primary/80 backdrop-blur-xl"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-kairo-dark-gray border border-kairo-gray rounded-3xl p-8 shadow-2xl text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 text-kairo-gray hover:text-kairo-white p-2 rounded-full hover:bg-kairo-primary/50 transition-all duration-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-kairo-orange/10 border border-kairo-orange/20 rounded-2xl flex items-center justify-center text-kairo-orange mb-4">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-3xl font-extrabold tracking-tight text-kairo-white">
                  Step Into Kairo
                </h3>
                <p className="mt-2 text-sm text-kairo-light-gray">
                  Sign in or auto-create an account instantly to explore dynamic concerts, hackathons, and exclusive enclaves.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
                    {authError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-kairo-gray uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-kairo-gray">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="alex@kairo.com"
                      className="block w-full pl-10 pr-4 py-3 bg-kairo-primary border border-kairo-gray rounded-2xl text-kairo-white placeholder-kairo-gray focus:outline-none focus:border-kairo-orange focus:ring-4 focus:ring-kairo-orange/10 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-kairo-gray uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-kairo-gray">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-4 py-3 bg-kairo-primary border border-kairo-gray rounded-2xl text-kairo-white placeholder-kairo-gray focus:outline-none focus:border-kairo-orange focus:ring-4 focus:ring-kairo-orange/10 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthSubmitting || !authEmail || !authPassword}
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-2xl text-kairo-white bg-kairo-orange hover:bg-kairo-grad-2 hover:shadow-xl hover:shadow-kairo-orange/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6 cursor-pointer"
                >
                  {isAuthSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Enter the Enclave
                      <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-6">
                <div className="absolute w-full border-t border-kairo-gray/30"></div>
                <span className="relative px-4 text-xs text-kairo-light-gray uppercase tracking-widest font-extrabold bg-kairo-dark-gray">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isAuthSubmitting}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-kairo-primary border border-kairo-gray rounded-2xl text-kairo-white hover:text-kairo-orange hover:border-kairo-orange/50 hover:bg-white/5 transition-all duration-300 font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  onClick={handleGithubLogin}
                  disabled={isAuthSubmitting}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-kairo-primary border border-kairo-gray rounded-2xl text-kairo-white hover:text-kairo-orange hover:border-kairo-orange/50 hover:bg-white/5 transition-all duration-300 font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub
                </button>
              </div>

              <p className="text-center text-kairo-gray text-xs mt-4">
                Any email/password combination will auto-create an account!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
