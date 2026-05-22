"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(10,10,11,1)_70%)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-400 mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4" />
          <span>The new way to discover events</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          <span className="block text-white">Discover What&apos;s</span>
          <span className="block mt-2 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent pb-2">
            Happening Around You
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl leading-relaxed">
          Find hackathons, concerts, workshops, and more — all in one place. Your personalized guide to the best experiences.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/feed"
            className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
          >
            Explore Events
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-lg text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
          >
            Learn More
          </a>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-8 md:gap-16 pt-8 border-t border-white/10">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">500+</span>
            <span className="text-sm text-white/50">Active Events</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">50+</span>
            <span className="text-sm text-white/50">Cities Covered</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">10K+</span>
            <span className="text-sm text-white/50">Discoveries</span>
          </div>
        </div>
      </div>
    </div>
  );
}
