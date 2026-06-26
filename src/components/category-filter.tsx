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
  hackathon: <Code2 className="w-[16px] h-[16px]" />,
  workshop: <BookOpen className="w-[16px] h-[16px]" />,
  meetup: <Users className="w-[16px] h-[16px]" />,
  startup: <Rocket className="w-[16px] h-[16px]" />,
  conference: <Presentation className="w-[16px] h-[16px]" />,
  concert: <Music className="w-[16px] h-[16px]" />,
  comedy: <Laugh className="w-[16px] h-[16px]" />,
  "food-festival": <Utensils className="w-[16px] h-[16px]" />,
  party: <Sparkles className="w-[16px] h-[16px]" />,
  networking: <Share2 className="w-[16px] h-[16px]" />,
  "tech-talk": <MessageSquare className="w-[16px] h-[16px]" />,
  "ai-ml": <Brain className="w-[16px] h-[16px]" />,
  gaming: <Gamepad2 className="w-[16px] h-[16px]" />,
};

const categoryGroups = [
  {
    name: "Tech & Professional",
    ids: ["hackathon", "tech-talk", "ai-ml", "startup", "conference", "workshop"],
  },
  {
    name: "Social & Lifestyle",
    ids: ["meetup", "networking", "party", "gaming", "concert", "comedy", "food-festival"],
  }
];

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="relative w-full py-8 max-w-5xl mx-auto flex flex-col gap-8">
      {/* ALL EVENTS Top Bar */}
      <div className="flex justify-center">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "relative group flex items-center gap-2.5 px-8 py-3 rounded-full transition-all duration-500 font-medium text-[13px] tracking-wide uppercase shrink-0 outline-none",
            selectedCategory === null
              ? "text-kairo-primary"
              : "text-kairo-light-gray hover:text-kairo-white"
          )}
        >
          {selectedCategory === null ? (
            <motion.div
              layoutId="activeFilterBubble"
              className="absolute inset-0 bg-gradient-to-r from-kairo-white to-white/90 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          ) : (
            <div className="absolute inset-0 bg-kairo-white/5 rounded-full border border-kairo-white/10 group-hover:bg-kairo-white/10 group-hover:border-kairo-white/20 transition-all duration-300" />
          )}
          
          <span className="relative z-10 flex items-center gap-2">
            <LayoutGrid className={cn("w-[16px] h-[16px] transition-transform duration-300", selectedCategory === null ? "scale-110 text-kairo-primary" : "group-hover:scale-110 group-hover:text-kairo-orange")} />
            All Events
          </span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 justify-center w-full">
        {categoryGroups.map((group, i) => (
          <div key={group.name} className="flex flex-col items-center gap-4 flex-1">
            <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-kairo-gray/60 px-4">
              {group.name}
            </h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {group.ids.map((id) => {
                const cat = categories.find((c) => c.id === id);
                if (!cat) return null;
                const isSelected = selectedCategory === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={cn(
                      "relative group flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-500 font-medium text-xs tracking-wide shrink-0 outline-none",
                      isSelected
                        ? "text-kairo-primary"
                        : "text-kairo-light-gray hover:text-kairo-white"
                    )}
                  >
                    {isSelected ? (
                      <motion.div
                        layoutId="activeFilterBubble"
                        className="absolute inset-0 bg-gradient-to-r from-kairo-white to-white/90 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-kairo-white/5 rounded-full border border-kairo-white/10 group-hover:bg-kairo-white/10 group-hover:border-kairo-white/20 transition-all duration-300" />
                    )}

                    <span className="relative z-10 flex items-center gap-2">
                      <span className={cn(
                        "transition-all duration-300",
                        isSelected ? "scale-110 text-kairo-primary" : `group-hover:scale-110 ${cat.color}`
                      )}>
                        {iconMap[cat.id]}
                      </span>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
