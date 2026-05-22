import Link from "next/link";
import { Search, Heart, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { HeroSection } from "@/components/hero-section";
import { TrendingSection } from "@/components/trending-section";
import { FeaturedCategories } from "@/components/featured-categories";

const steps = [
  {
    icon: Search,
    title: "Discover",
    description:
      "Browse curated events tailored to your interests, location, and vibe. From tech talks to rooftop parties.",
  },
  {
    icon: Heart,
    title: "Save",
    description:
      "Bookmark events that catch your eye. Build your personal collection and never miss what matters.",
  },
  {
    icon: Calendar,
    title: "Attend",
    description:
      "Register seamlessly and show up. Connect with your community and create unforgettable memories.",
  },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* ── Hero ── */}
      <HeroSection />

      {/* ── Trending Events ── */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TrendingSection />
        </div>
      </section>

      {/* ── Featured Categories ── */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FeaturedCategories />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative py-20">
        {/* Subtle ambient glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/60 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              Simple &amp; Seamless
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/50">
              Three simple steps to your next great experience
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="group relative">
                {/* Connector line between cards (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-white/20 to-transparent md:block" />
                )}

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06]">
                  {/* Step number */}
                  <div className="absolute right-6 top-6 text-5xl font-black text-white/[0.03]">
                    0{i + 1}
                  </div>

                  {/* Icon */}
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 ring-1 ring-white/10">
                    <step.icon className="h-6 w-6 text-purple-400" />
                  </div>

                  <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                  <p className="leading-relaxed text-white/50">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[800px] rounded-full bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to{" "}
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Discover?
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/50">
            Start exploring events happening around you. Your next unforgettable
            experience is just a tap away.
          </p>

          <div className="mt-10">
            <Link
              href="/feed"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:brightness-110"
            >
              Explore Events
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8">
        <p className="text-center text-sm text-white/30">
          &copy; 2026 Kairo. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
