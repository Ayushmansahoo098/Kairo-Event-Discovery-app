"use client";

import { CategoryInfo } from "@/lib/types";
import { categories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Code2, BookOpen, Music, PartyPopper, Users, Gamepad2, Rocket, LayoutGrid } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  hackathon: <Code2 className="w-4 h-4" />,
  workshop: <BookOpen className="w-4 h-4" />,
  concert: <Music className="w-4 h-4" />,
  festival: <PartyPopper className="w-4 h-4" />,
  meetup: <Users className="w-4 h-4" />,
  gaming: <Gamepad2 className="w-4 h-4" />,
  startup: <Rocket className="w-4 h-4" />,
};

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="relative w-full">
      {/* Fade edges for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0b] to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0b] to-transparent pointer-events-none z-10" />
      
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-4 md:px-0">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
            selectedCategory === null
              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          All Events
        </button>

        {categories.map((cat: CategoryInfo) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
              selectedCategory === cat.id
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5"
            )}
          >
            {iconMap[cat.id]}
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
