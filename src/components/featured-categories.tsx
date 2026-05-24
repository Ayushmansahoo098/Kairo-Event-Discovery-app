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
    <section className="py-20 bg-kairo-primary">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-kairo-white mb-4">Explore Categories</h2>
          <p className="text-lg text-kairo-light-gray max-w-2xl mx-auto">Find the perfect event matching your interests and passions.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/feed?category=${cat.id}`}
              className="group flex flex-col items-center justify-center p-6 bg-kairo-dark-gray border border-kairo-gray rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-kairo-orange/50 hover:shadow-xl hover:shadow-kairo-orange/10 hover:bg-kairo-gray"
            >
              <div className={`w-14 h-14 mb-4 rounded-full flex items-center justify-center bg-kairo-primary text-kairo-orange shadow-sm transition-transform group-hover:scale-110`}>
                {iconMap[cat.id]}
              </div>
              <h3 className="font-semibold text-kairo-white mb-1">{cat.name}</h3>
              <p className="text-sm text-kairo-light-gray font-medium">{cat.count} Events</p>
            </Link>
          ))}
          
          <Link
            href="/feed"
            className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-kairo-dark-gray to-kairo-gray border border-kairo-gray rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-kairo-orange/50 hover:shadow-xl hover:shadow-kairo-orange/15"
          >
            <div className="w-14 h-14 mb-4 rounded-full flex items-center justify-center bg-kairo-primary text-kairo-orange shadow-sm transition-transform group-hover:scale-110">
              <ArrowRight className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-kairo-white">View All</h3>
          </Link>
        </div>
      </div>
    </section>
  );
}
