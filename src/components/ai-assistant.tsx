"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/context/chat-context";
import { useEffect, useState } from "react";

export function AIAssistant() {
  const pathname = usePathname();
  const { setIsOpen } = useChat();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const isExplorePage = pathname === "/feed";

  if (!isMounted || !isExplorePage) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-6 md:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-kairo-orange to-kairo-gray text-kairo-primary shadow-[0_4px_20px_rgba(184,168,138,0.3)] border border-kairo-orange/20 cursor-pointer group"
      >
        <div className="absolute inset-0 rounded-full border border-kairo-orange animate-ping opacity-25 group-hover:animate-none" />
        <Sparkles className="h-6 w-6 text-kairo-primary group-hover:rotate-12 transition-transform duration-300" />
      </motion.button>
    </AnimatePresence>
  );
}
