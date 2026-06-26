"use client";

import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-kairo-primary border-t border-kairo-orange/10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-64 bg-kairo-orange/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto px-6 py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Column 1: Brand, Company Info & Newsletter */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col space-y-4">
              <div className="w-16 h-16">
                <Logo />
              </div>
              <h2 className="text-3xl font-serif font-light tracking-widest uppercase text-kairo-white">Kairo</h2>
              
              <div className="space-y-3 text-sm text-kairo-light-gray/70 leading-relaxed max-w-md tracking-wide">
                <p className="font-bold text-kairo-white">Company Name: KAIRO EVENTS PRIVATE LIMITED</p>
                <p>CIN: U74999MH2026PTC123456</p>
                <p>
                  Corporate office Address: A Wing, 14th Flr, Unit No 1/4/5, A Block Tradelink, Kamala Mills Compound, Senapati Bapat Marg, Lower Parel(W), Mumbai, Maharashtra, India, 400012.
                </p>
                <p>
                  Email: <a href="mailto:ayushmansahoo614@gmail.com" className="text-kairo-orange hover:underline">ayushmansahoo614@gmail.com</a>
                </p>
              </div>
            </div>

            {/* Socials */}
            <div className="flex gap-4 text-sm font-bold tracking-widest pt-2">
              {["IG", "TW", "IN", "FB"].map((social, idx) => (
                <a key={idx} href="#" className="w-12 h-12 rounded-full bg-kairo-white/[0.03] border border-kairo-white/10 flex items-center justify-center text-kairo-light-gray hover:text-kairo-orange hover:bg-kairo-orange/10 hover:border-kairo-orange/30 transition-all duration-300">
                  {social}
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div className="pt-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-kairo-white mb-4">Stay in the loop</h3>
              <form onSubmit={handleSubscribe} className="relative max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-kairo-gray">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-kairo-white/[0.03] border border-kairo-white/10 rounded-xl py-4 pl-12 pr-24 text-sm text-kairo-white placeholder-kairo-light-gray/40 focus:outline-none focus:border-kairo-orange focus:bg-kairo-white/[0.05] transition-all"
                />
                <button
                  type="submit"
                  className="absolute inset-y-1.5 right-1.5 px-5 bg-kairo-orange hover:bg-kairo-orange/90 text-kairo-primary rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  {subscribed ? "Done" : "Join"}
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-6 lg:pl-8">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-kairo-white">Company</h3>
            <ul className="space-y-5">
              {["About Us", "Our Story", "Careers", "Press", "Contact"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-kairo-light-gray/80 hover:text-kairo-orange transition-colors tracking-wide block">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Account */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-kairo-white">Legal & Account</h3>
            <ul className="space-y-5">
              <li>
                <Link href="/privacy" className="text-sm text-kairo-light-gray/80 hover:text-kairo-orange transition-colors tracking-wide block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-kairo-light-gray/80 hover:text-kairo-orange transition-colors tracking-wide block">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-sm text-kairo-light-gray/80 hover:text-kairo-orange transition-colors tracking-wide flex items-center gap-2">
                  My Profile <ArrowRight className="w-4 h-4" />
                </Link>
              </li>
              <li className="pt-6 mt-6 border-t border-kairo-white/10">
                <span className="block text-xs text-kairo-light-gray/50 tracking-wider">Email Us:</span>
                <a href="mailto:ayushmansahoo614@gmail.com" className="text-sm font-bold text-kairo-orange hover:text-kairo-white transition-colors mt-2 block tracking-wide">
                  ayushmansahoo614@gmail.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-20 pt-8 border-t border-kairo-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-kairo-light-gray/50 tracking-widest uppercase">
            © {new Date().getFullYear()} Kairo Events. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-kairo-light-gray/50 tracking-widest uppercase">
            <span>Made for Creators</span>
            <span className="hidden md:inline">•</span>
            <span>Based in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
