"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Explore", href: "/feed", icon: Compass },
    { label: "Saved", href: "/saved", icon: Heart },
    { label: "Profile", href: "#", icon: User, disabled: true },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe">
        <nav className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.label}
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 transition-all duration-300",
                  item.disabled && "opacity-40 cursor-not-allowed pointer-events-none",
                  isActive ? "text-white" : "text-white/50 hover:text-white/80"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-6 h-6 transition-all duration-300", isActive && "text-purple-400")} />
                  {isActive && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />
                  )}
                </div>
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop Top Navigation */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-white">
                K
              </div>
              <span className="font-bold text-xl tracking-tight text-white">Kairo</span>
            </Link>

            <div className="flex items-center gap-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.label}
                    href={item.disabled ? "#" : item.href}
                    className={cn(
                      "text-sm font-medium transition-all duration-300 relative py-2",
                      item.disabled && "opacity-40 cursor-not-allowed pointer-events-none",
                      isActive ? "text-white" : "text-white/60 hover:text-white"
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
