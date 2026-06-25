"use client";

import dynamic from "next/dynamic";
import { useChat } from "@/context/chat-context";
import { AnimatePresence, motion } from "framer-motion";

// Dynamically import the heavy drawer component (containing react-markdown, remark-gfm)
// It only downloads and evaluates when the drawer is actually opened, saving bundle size on initial loads.
const AIAssistantDrawer = dynamic(
  () => import("./ai-assistant-drawer").then((mod) => mod.AIAssistantDrawer),
  { ssr: false }
);

export function AIAssistantDrawerContainer() {
  const { isOpen, setIsOpen } = useChat();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark blur backdrop overlay at z-[60] (above mobile bottom nav z-50, below drawer z-[65]) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs cursor-pointer"
          />
          <AIAssistantDrawer />
        </>
      )}
    </AnimatePresence>
  );
}
