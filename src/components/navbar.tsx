"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useAuthContext } from "@/context/auth-context";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthContext();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Explore", href: "/feed", icon: Compass },
    { label: "Saved", href: "/saved", icon: Heart },
    { label: "Profile", href: user ? "/profile" : "/login", icon: User },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-kairo-primary/80 backdrop-blur-xl border-t border-kairo-dark-gray pb-safe">
        <nav className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 transition-all duration-300",
                  isActive ? "text-kairo-orange" : "text-kairo-light-gray hover:text-kairo-white"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-6 h-6 transition-all duration-300", isActive && "text-kairo-orange")} />
                  {isActive && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-kairo-orange" />
                  )}
                </div>
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop Top Navigation */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-kairo-primary/80 backdrop-blur-xl border-b border-kairo-dark-gray shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <Logo />
              </div>
              <span className="font-bold text-2xl tracking-tight text-kairo-white">Kairo</span>
            </Link>

            <div className="flex items-center gap-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-all duration-300 relative py-2",
                      isActive ? "text-kairo-white" : "text-kairo-light-gray hover:text-kairo-white"
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-kairo-orange rounded-t-full" />
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
