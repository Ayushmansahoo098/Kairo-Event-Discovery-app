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
  hackathon: <Code2 className="w-3.5 h-3.5" />,
  workshop: <BookOpen className="w-3.5 h-3.5" />,
  meetup: <Users className="w-3.5 h-3.5" />,
  startup: <Rocket className="w-3.5 h-3.5" />,
  conference: <Presentation className="w-3.5 h-3.5" />,
  concert: <Music className="w-3.5 h-3.5" />,
  comedy: <Laugh className="w-3.5 h-3.5" />,
  "food-festival": <Utensils className="w-3.5 h-3.5" />,
  party: <Sparkles className="w-3.5 h-3.5" />,
  networking: <Share2 className="w-3.5 h-3.5" />,
  "tech-talk": <MessageSquare className="w-3.5 h-3.5" />,
  "ai-ml": <Brain className="w-3.5 h-3.5" />,
  gaming: <Gamepad2 className="w-3.5 h-3.5" />,
};

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="relative w-full flex justify-center py-4">
      {/* Premium fade edge mask for mobile horizontal scrolling */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-kairo-primary via-kairo-primary/70 to-transparent pointer-events-none z-10 md:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-kairo-primary via-kairo-primary/70 to-transparent pointer-events-none z-10 md:hidden" />

      {/* Main Glassmorphic Capsule Container */}
      <div className="flex items-center gap-1.5 bg-kairo-dark-gray/40 border border-kairo-gray/10 rounded-full p-1.5 overflow-x-auto scrollbar-hide max-w-full mx-4 md:mx-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md">
        {/* ALL EVENTS Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelectCategory(null)}
          className={cn(
            "relative px-4 py-2 transition-all duration-300 text-[10.5px] font-bold uppercase tracking-wider rounded-full cursor-pointer select-none",
            selectedCategory === null
              ? "text-kairo-primary"
              : "text-kairo-light-gray hover:text-kairo-white hover:bg-white/5"
          )}
        >
          {selectedCategory === null && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-kairo-orange rounded-full shadow-[0_2px_12px_rgba(184,168,138,0.3)]"
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
            <LayoutGrid className="w-3.5 h-3.5" />
            All Events
          </span>
        </motion.button>

        {/* Dynamic Category Buttons */}
        {categories.map((cat: CategoryInfo) => (
          <motion.button
            whileTap={{ scale: 0.96 }}
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              "relative px-4 py-2 transition-all duration-300 text-[10.5px] font-bold uppercase tracking-wider rounded-full cursor-pointer select-none",
              selectedCategory === cat.id
                ? "text-kairo-primary"
                : "text-kairo-light-gray hover:text-kairo-white hover:bg-white/5"
            )}
          >
            {selectedCategory === cat.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-kairo-orange rounded-full shadow-[0_2px_12px_rgba(184,168,138,0.3)]"
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
              {iconMap[cat.id]}
              {cat.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
