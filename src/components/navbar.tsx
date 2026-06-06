"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useAuthContext } from "@/context/auth-context";

const navItems = [
  { label: "Home", href: "/", icon: Home, num: "01" },
  { label: "Explore", href: "/feed", icon: Compass, num: "02" },
  { label: "Saved", href: "/saved", icon: Heart, num: "03" },
  { label: "Profile", href: "/profile", icon: User, num: "04" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const profileHref = user ? "/profile" : "/login";

  return (
    <>
      {/* ── Mobile Bottom Navigation ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-kairo-primary/90 backdrop-blur-xl border-t border-kairo-orange/10 pb-safe">
        <nav className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/profile" && pathname === "/login");
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href === "/profile" ? profileHref : item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 transition-all duration-300",
                  isActive ? "text-kairo-orange" : "text-kairo-light-gray hover:text-kairo-white"
                )}
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  {Icon && <Icon className={cn("w-5 h-5 transition-all duration-300", isActive && "text-kairo-orange")} />}
                  {isActive && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-kairo-orange" />
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1.5">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Desktop Top Bar ── */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-[60] bg-kairo-primary/80 backdrop-blur-xl border-b border-kairo-orange/10">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-7 h-7 flex items-center justify-center transition-transform duration-500 group-hover:rotate-12">
                <Logo />
              </div>
              <span className="font-serif font-light text-xl tracking-[0.25em] uppercase text-kairo-white transition-colors duration-300 group-hover:text-kairo-orange">
                KAIRO
              </span>
            </Link>

            {/* Hamburger Button */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="relative flex flex-col justify-center items-end gap-[6px] w-10 h-10 cursor-pointer group"
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 9, width: "100%" } : { rotate: 0, y: 0, width: "100%" }}
                transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
                className="block h-[1.5px] bg-kairo-white group-hover:bg-kairo-orange transition-colors duration-300 origin-center"
                style={{ width: "28px" }}
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.2 }}
                className="block h-[1.5px] bg-kairo-white group-hover:bg-kairo-orange transition-colors duration-300"
                style={{ width: "20px" }}
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -9, width: "100%" } : { rotate: 0, y: 0, width: "100%" }}
                transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
                className="block h-[1.5px] bg-kairo-white group-hover:bg-kairo-orange transition-colors duration-300 origin-center"
                style={{ width: "28px" }}
              />
            </button>
          </nav>
        </div>
      </div>

      {/* ── Full-screen Overlay Menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="overlay-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[55] hidden md:flex flex-col bg-kairo-primary"
          >
            {/* Subtle texture */}
            <div className="absolute inset-0 opacity-[0.025] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* Menu content */}
            <div className="relative z-10 flex flex-col justify-center h-full max-w-7xl mx-auto px-6 w-full pt-16">
              <nav className="flex flex-col gap-2">
                {navItems.map((item, i) => {
                  const href = item.href === "/profile" ? profileHref : item.href;
                  const isActive = pathname === href;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: 0.1 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "group flex items-baseline gap-6 py-5 border-b border-kairo-orange/10 transition-all duration-300",
                          isActive ? "text-kairo-white" : "text-kairo-gray hover:text-kairo-white"
                        )}
                      >
                        <span className="text-[10px] font-bold tracking-[0.3em] text-kairo-orange/50 font-mono w-6 shrink-0">
                          {item.num}
                        </span>
                        <span className="text-5xl sm:text-6xl md:text-7xl font-serif font-light tracking-[0.08em] uppercase leading-none transition-all duration-300 group-hover:translate-x-3">
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="ml-auto text-[9px] uppercase tracking-widest text-kairo-orange font-bold self-center">
                            Current
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Footer hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="mt-12 text-[10px] uppercase tracking-[0.3em] text-kairo-gray/50"
              >
                Kairo — Event Discovery
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
