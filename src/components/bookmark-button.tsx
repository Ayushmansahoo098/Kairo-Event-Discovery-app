"use client";

import { useBookmarkContext } from "@/context/bookmark-context";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";


interface BookmarkButtonProps {
  eventId: string;
  className?: string;
}

export function BookmarkButton({ eventId, className }: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarkContext();
  const bookmarked = isBookmarked(eventId);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(eventId);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-2 rounded-full transition-all duration-300",
        "hover:scale-110 active:scale-95",
        bookmarked ? "text-kairo-grad-2 hover:text-kairo-grad-2/80" : "text-kairo-gray hover:text-kairo-grad-2",
        isAnimating && "animate-ping-once",
        className
      )}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-all duration-300",
          bookmarked ? "fill-current" : ""
        )}
      />
    </button>
  );
}
