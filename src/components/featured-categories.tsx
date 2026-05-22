"use client";

import { categories } from "@/lib/mock-data";
import Link from "next/link";
import { Code2, BookOpen, Music, PartyPopper, Users, Gamepad2, Rocket, ArrowRight } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  hackathon: <Code2 className="w-6 h-6" />,
  workshop: <BookOpen className="w-6 h-6" />,
  concert: <Music className="w-6 h-6" />,
  festival: <PartyPopper className="w-6 h-6" />,
  meetup: <Users className="w-6 h-6" />,
  gaming: <Gamepad2 className="w-6 h-6" />,
  startup: <Rocket className="w-6 h-6" />,
};

export function FeaturedCategories() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Explore Categories</h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">Find the perfect event matching your interests and passions.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/feed?category=${cat.id}`}
              className="group flex flex-col items-center justify-center p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className={`w-14 h-14 mb-4 rounded-full flex items-center justify-center ${cat.color} text-white shadow-lg`}>
                {iconMap[cat.id]}
              </div>
              <h3 className="font-semibold text-white mb-1">{cat.name}</h3>
              <p className="text-sm text-white/50">{cat.count} Events</p>
            </Link>
          ))}
          
          <Link
            href="/feed"
            className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-md border border-purple-500/20 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10"
          >
            <div className="w-14 h-14 mb-4 rounded-full flex items-center justify-center bg-white/10 text-white">
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            </div>
            <h3 className="font-semibold text-white">View All</h3>
          </Link>
        </div>
      </div>
    </section>
  );
}
