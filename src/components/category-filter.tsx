"use client";

import { CategoryInfo } from "@/lib/types";
import { categories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Code2, BookOpen, Music, PartyPopper, Users, Gamepad2, Rocket, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";

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
      {/* Fade edges for scroll indication on dark background */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-kairo-primary to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-kairo-primary to-transparent pointer-events-none z-10" />
      
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-4 md:px-0">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "relative px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300",
            selectedCategory === null
              ? "text-kairo-white"
              : "text-kairo-light-gray hover:text-kairo-white"
          )}
        >
          {selectedCategory === null && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-kairo-orange rounded-full shadow-md shadow-kairo-orange/30"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
            <LayoutGrid className="w-4 h-4" />
            All Events
          </span>
        </button>

        {categories.map((cat: CategoryInfo) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              "relative px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300",
              selectedCategory === cat.id
                ? "text-kairo-white"
                : "text-kairo-light-gray hover:text-kairo-white"
            )}
          >
            {selectedCategory === cat.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-kairo-orange rounded-full shadow-md shadow-kairo-orange/30"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
              {iconMap[cat.id]}
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
