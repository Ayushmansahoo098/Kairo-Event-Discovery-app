"use client";

import { CategoryInfo } from "@/lib/types";
import { categories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Code2, BookOpen, Users, Rocket, Presentation, Music, Laugh, Utensils, Sparkles, Share2, MessageSquare, Brain, Gamepad2, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  hackathon: <Code2 className="w-4 h-4" />,
  workshop: <BookOpen className="w-4 h-4" />,
  meetup: <Users className="w-4 h-4" />,
  startup: <Rocket className="w-4 h-4" />,
  conference: <Presentation className="w-4 h-4" />,
  concert: <Music className="w-4 h-4" />,
  comedy: <Laugh className="w-4 h-4" />,
  "food-festival": <Utensils className="w-4 h-4" />,
  party: <Sparkles className="w-4 h-4" />,
  networking: <Share2 className="w-4 h-4" />,
  "tech-talk": <MessageSquare className="w-4 h-4" />,
  "ai-ml": <Brain className="w-4 h-4" />,
  gaming: <Gamepad2 className="w-4 h-4" />,
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
            "relative px-4.5 py-2 border transition-all duration-300 text-xs font-bold uppercase tracking-wider rounded-none",
            selectedCategory === null
              ? "text-kairo-primary border-kairo-orange"
              : "text-kairo-light-gray border-kairo-orange/10 hover:border-kairo-orange/30 hover:text-kairo-white"
          )}
        >
          {selectedCategory === null && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-kairo-orange -z-10 rounded-none"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2.5 whitespace-nowrap">
            <LayoutGrid className="w-3.5 h-3.5" />
            All Events
          </span>
        </button>

        {categories.map((cat: CategoryInfo) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              "relative px-4.5 py-2 border transition-all duration-300 text-xs font-bold uppercase tracking-wider rounded-none",
              selectedCategory === cat.id
                ? "text-kairo-primary border-kairo-orange"
                : "text-kairo-light-gray border-kairo-orange/10 hover:border-kairo-orange/30 hover:text-kairo-white"
            )}
          >
            {selectedCategory === cat.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-kairo-orange -z-10 rounded-none"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2.5 whitespace-nowrap">
              {iconMap[cat.id]}
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
