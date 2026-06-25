"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { logInteractionEvent } from "@/lib/analytics";
import { useAuthContext } from "@/context/auth-context";

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthContext();

  // Initialize and load drawer state from localStorage on client mount
  useEffect(() => {
    try {
      const savedIsOpen = localStorage.getItem("kairo_chat_drawer_open");
      if (savedIsOpen === "true") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpen(true);
      }
    } catch (e) {
      console.error("Failed to load drawer state from localStorage", e);
    }
  }, []);

  // Save changes to localStorage and log analytics safely
  const handleSetIsOpen = (open: boolean) => {
    setIsOpen(open);
    try {
      localStorage.setItem("kairo_chat_drawer_open", open ? "true" : "false");
    } catch (e) {
      console.error("Failed to save drawer state to localStorage", e);
    }

    if (open) {
      logInteractionEvent({
        action: "chat_open",
        userId: user?.id,
      });
    }
  };

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen: handleSetIsOpen }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
