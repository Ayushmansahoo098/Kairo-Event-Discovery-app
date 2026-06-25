"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Sparkles,
  Calendar,
  MapPin,
  Trash2,
  Zap,
  ArrowRight,
  Sparkle
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuthContext } from "@/context/auth-context";
import { useChat } from "@/context/chat-context";
import { logInteractionEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Event } from "@/lib/types";
import { getRecommendationApiBase } from "@/lib/api-config";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  events?: Event[];
  suggestions?: string[];
  isStreaming?: boolean;
  isError?: boolean;
}

const welcomeMarkdown = `👋 Hi, I'm Kairo AI.

I can help you find:
• Hackathons
• Workshops
• Concerts
• Festivals
• Startup Events

Try asking:
"Find AI workshops in Bengaluru"`;

const initialWelcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  text: welcomeMarkdown,
  timestamp: new Date().toISOString(),
  suggestions: [
    "Find hackathons this weekend",
    "Free AI workshops",
    "Startup networking events",
    "Concerts in Mumbai",
    "Online events today"
  ],
};

const starterPrompts = [
  {
    title: "Find hackathons this weekend",
    query: "Find hackathons this weekend",
    icon: Zap,
  },
  {
    title: "Free AI workshops",
    query: "Free AI workshops",
    icon: Sparkles,
  },
  {
    title: "Startup networking events",
    query: "Startup networking events",
    icon: Sparkle,
  },
  {
    title: "Concerts in Mumbai",
    query: "Concerts in Mumbai",
    icon: Calendar,
  },
  {
    title: "Online events today",
    query: "Online events today",
    icon: MapPin,
  },
];

export function AIAssistantDrawer() {
  const { user } = useAuthContext();
  const { isOpen, setIsOpen } = useChat();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize and load state from localStorage safely
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    try {
      const savedMessages = localStorage.getItem("kairo_chat_messages");
      const savedConvId = localStorage.getItem("kairo_chat_conversation_id");

      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([initialWelcomeMessage]);
      }

      if (savedConvId) {
        setConversationId(savedConvId);
      } else {
        const newId = crypto.randomUUID();
        setConversationId(newId);
        localStorage.setItem("kairo_chat_conversation_id", newId);
      }
    } catch (e) {
      console.error("Failed to load chat from localStorage", e);
      setMessages([initialWelcomeMessage]);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem("kairo_chat_messages", JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save messages", e);
    }
  }, [messages, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    try {
      if (conversationId) {
        localStorage.setItem("kairo_chat_conversation_id", conversationId);
      } else {
        localStorage.removeItem("kairo_chat_conversation_id");
      }
    } catch (e) {
      console.error("Failed to save conversation ID", e);
    }
  }, [conversationId, isMounted]);

  // Auto-focus input when drawer opens or isMounted changes
  useEffect(() => {
    if (isMounted && isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 350); // slight buffer to let the slide-in animation settle
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMounted]);

  // Smooth scroll to bottom on message list updates or typing state
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (text: string, sourceAction: "chat_message_sent" | "chat_suggestion_click" = "chat_message_sent") => {
    if (!text.trim() || isLoading) return;

    const userMessageText = text.trim();
    const userMsg: Message = {
      // eslint-disable-next-line react-hooks/purity
      id: `user-${Date.now()}`,
      role: "user",
      text: userMessageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    // Track sending event in analytics
    logInteractionEvent({
      action: sourceAction,
      userId: user?.id,
      query: userMessageText,
    });

    // Setup streaming placeholder (future-proofing streaming SSE/WebSockets)
    // eslint-disable-next-line react-hooks/purity
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "assistant",
      text: "",
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const apiBase = getRecommendationApiBase();
      
      /*
       * STREAMING PREPARATION:
       * To implement real-time SSE token streaming later, replace this POST block with:
       * 
       * const response = await fetch(`${apiBase}/chat/stream`, { ... });
       * const reader = response.body.getReader();
       * const decoder = new TextDecoder();
       * while (true) {
       *   const { value, done } = await reader.read();
       *   if (done) break;
       *   const chunk = decoder.decode(value);
       *   // Append chunk to the message state
       *   setMessages(prev => prev.map(msg => msg.id === assistantMsgId ? { ...msg, text: msg.text + chunk } : msg));
       * }
       */
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id || null,
          conversationId: conversationId || null,
          message: userMessageText,
        }),
      });

      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("AI Assistant is temporarily unavailable.");
        }
        throw new Error("Failed to get response from AI assistant.");
      }

      const data = await res.json();

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }

      // Populate events and suggestions directly from API response fields
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: data.reply || "",
                events: data.events || [], // Uses events array directly from backend without re-fetching
                suggestions: data.suggestions || [],
                isStreaming: false,
              }
            : msg
        )
      );
    } catch (err) {
      console.error("AI Assistant Chat Error:", err);
      let errMsg = err instanceof Error ? err.message : "Something went wrong. Please check your connection.";
      if (errMsg === "Failed to fetch") {
        errMsg = "Failed to connect to Kairo AI. The recommendation service may be offline or the API URL is unconfigured.";
      }
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: errMsg,
                isStreaming: false,
                isError: true,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm("Are you sure you want to reset this conversation history?")) {
      const newId = crypto.randomUUID();
      setConversationId(newId);
      setMessages([initialWelcomeMessage]);
      try {
        localStorage.setItem("kairo_chat_conversation_id", newId);
        localStorage.setItem("kairo_chat_messages", JSON.stringify([initialWelcomeMessage]));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Custom components for react-markdown rendering tailored to Kairo dark gold design system
  const markdownComponents = {
    p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0 leading-relaxed text-kairo-white/90">{children}</p>,
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="text-kairo-orange font-semibold">{children}</strong>,
    em: ({ children }: { children?: React.ReactNode }) => <em className="italic text-kairo-light-gray">{children}</em>,
    h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-base font-serif font-bold uppercase tracking-wider text-kairo-orange mt-4 mb-2 border-b border-kairo-orange/10 pb-1">{children}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-serif font-bold uppercase tracking-wider text-kairo-orange mt-3 mb-1">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-kairo-orange mt-2 mb-1">{children}</h3>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-4 mb-3 space-y-1 text-kairo-white/80">{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-4 mb-3 space-y-1 text-kairo-white/80">{children}</ol>,
    li: ({ children }: { children?: React.ReactNode }) => <li className="text-xs sm:text-sm pl-0.5">{children}</li>,
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-kairo-orange underline hover:text-kairo-white transition-colors duration-200">
        {children}
      </a>
    ),
    code: ({ children }: { children?: React.ReactNode }) => <code className="bg-kairo-dark-gray/60 px-1.5 py-0.5 border border-kairo-orange/15 font-mono text-[11px] text-kairo-orange rounded-none">{children}</code>,
    pre: ({ children }: { children?: React.ReactNode }) => <pre className="bg-kairo-dark-gray/60 p-3 border border-kairo-orange/15 font-mono text-[11px] text-kairo-orange rounded-none overflow-x-auto my-3 scrollbar-thin scrollbar-thumb-kairo-orange/10 scrollbar-track-transparent">{children}</pre>,
  };

  const trackEventClick = (action: "chat_details_click" | "chat_register_click", event: Event) => {
    logInteractionEvent({
      action,
      userId: user?.id,
      eventId: event.id,
      category: event.category,
      source: event.source,
      tags: event.tags,
    });
  };

  if (!isMounted) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 220 }}
      className="fixed right-0 top-0 bottom-0 z-[65] flex h-full w-full sm:w-[450px] flex-col border-l border-kairo-orange/15 bg-kairo-primary/95 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-kairo-orange/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-none border border-kairo-orange/20 bg-kairo-primary">
            <Sparkles className="h-4.5 w-4.5 text-kairo-orange animate-pulse" />
          </div>
          <div>
            <h2 className="font-serif text-sm font-medium uppercase tracking-widest text-kairo-white">
              Kairo AI Assistant
            </h2>
            <p className="text-[9px] uppercase tracking-wider text-kairo-light-gray font-light">
              Personal Event Concierge
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              onClick={handleResetChat}
              title="Reset chat history"
              className="flex h-8 w-8 items-center justify-center text-kairo-light-gray hover:text-red-400 transition-colors duration-200 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center text-kairo-light-gray hover:text-kairo-white transition-colors duration-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Chat messages history flow */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scrollbar-thin scrollbar-thumb-kairo-orange/15 scrollbar-track-transparent">
        {messages.length <= 1 && (
          /* Premium Welcome Empty State UI */
          <div className="flex flex-col items-center justify-center text-center py-4 px-2 space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-none border border-kairo-orange/20 bg-kairo-primary shadow-inner">
              <Sparkles className="h-8 w-8 text-kairo-orange" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-serif text-base uppercase tracking-wider text-kairo-white">
                Explore with Kairo AI
              </h3>
              <p className="text-xs text-kairo-light-gray font-light max-w-xs leading-relaxed">
                I can help you filter, search, compare, and recommend the best events matching your vibe.
              </p>
            </div>

            {/* Standard Welcome message displayed in bubble */}
            <div className="w-full bg-kairo-dark-gray/20 border border-kairo-orange/10 p-4 text-left rounded-none shadow-md">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {welcomeMarkdown}
              </ReactMarkdown>
            </div>

            {/* Starter Prompts Grid */}
            <div className="w-full space-y-2.5 pt-2 text-left">
              <p className="text-[9px] font-bold uppercase tracking-widest text-kairo-light-gray">
                Suggested Questions
              </p>
              <div className="grid grid-cols-1 gap-2">
                {starterPrompts.map((starter, i) => {
                  const Icon = starter.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(starter.query, "chat_suggestion_click")}
                      className="group flex items-start gap-3 border border-kairo-orange/10 hover:border-kairo-orange/30 bg-kairo-dark-gray/10 hover:bg-kairo-dark-gray/30 p-3 transition-all duration-300 text-left rounded-none cursor-pointer"
                    >
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center border border-kairo-orange/20 bg-kairo-primary text-kairo-orange group-hover:bg-kairo-orange group-hover:text-kairo-primary transition-colors duration-300">
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 self-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-kairo-white group-hover:text-kairo-orange transition-colors duration-300">
                          {starter.title}
                        </h4>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 self-center text-kairo-light-gray group-hover:text-kairo-orange group-hover:translate-x-1 transition-all duration-300" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* If conversation started, display standard messages */}
        {messages.length > 1 &&
          messages.map((message) => {
            const isUser = message.role === "user";
            const isError = message.isError;
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                  isUser ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {/* Sender Label */}
                <span className="text-[9px] uppercase tracking-widest text-kairo-light-gray font-semibold mb-1">
                  {isUser ? "You" : "Kairo AI"}
                </span>

                {/* Bubble */}
                <div
                  className={cn(
                    "p-3.5 rounded-none text-xs sm:text-sm font-sans shadow-md border leading-relaxed",
                    isUser
                      ? "bg-kairo-orange/10 border-kairo-orange/20 text-kairo-white"
                      : isError
                      ? "bg-red-950/20 border-red-500/20 text-red-400"
                      : "bg-kairo-dark-gray/30 border-kairo-orange/5 text-kairo-white"
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  ) : message.isStreaming && !message.text ? (
                    /* Streaming / Loading Dots with ChatGPT style */
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <span className="text-[10px] text-kairo-light-gray font-light uppercase tracking-wider animate-pulse">
                        Kairo AI is searching events...
                      </span>
                      <div className="flex space-x-1.5 items-center py-1">
                        <div className="w-1.5 h-1.5 bg-kairo-orange rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 bg-kairo-orange rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 bg-kairo-orange rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {message.text}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Event Cards inside Assistant Responses */}
                {!isUser && message.events && message.events.length > 0 && (
                  <div className="w-full mt-3.5 space-y-3">
                    {message.events.map((event) => (
                      <div
                        key={event.id}
                        className="flex flex-col border border-kairo-orange/15 bg-kairo-primary hover:border-kairo-orange/30 transition-all duration-300 shadow-lg w-full max-w-full overflow-hidden group"
                      >
                        {/* Banner Image */}
                        {event.bannerImage && (
                          <div className="h-28 relative w-full bg-black">
                            <Image
                              src={event.bannerImage}
                              alt={event.title}
                              fill
                              sizes="(max-width: 450px) 100vw, 400px"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                            {event.category && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 bg-kairo-primary/95 text-[8px] font-bold text-kairo-white border border-kairo-orange/20 uppercase tracking-widest">
                                {event.category}
                              </span>
                            )}
                            {event.matchScore !== undefined && (
                              <span className="absolute top-2 right-2 px-2 py-0.5 bg-kairo-primary/95 text-[8px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                🎯 {event.matchScore}% Match
                              </span>
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-3 space-y-2">
                          <h3 className="font-serif text-xs sm:text-sm uppercase tracking-wide text-kairo-white line-clamp-1 group-hover:text-kairo-orange transition-colors duration-300 leading-tight">
                            {event.title}
                          </h3>

                          <div className="space-y-1 text-[10px] text-kairo-light-gray font-light leading-normal">
                            <div className="flex items-center gap-1.5 truncate">
                              <Calendar className="w-3.5 h-3.5 text-kairo-orange flex-shrink-0" />
                              <span>
                                {new Date(event.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                • {event.time || "TBA"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-kairo-orange flex-shrink-0" />
                              <span>
                                {event.isOnline
                                  ? "Online"
                                  : `${event.location || ""}, ${event.city}`}
                              </span>
                            </div>
                          </div>

                          {/* Recommendation Reason */}
                          {event.reason && (
                            <div className="bg-kairo-orange/5 border-l-2 border-kairo-orange/40 px-2 py-1 text-[9px] font-bold text-kairo-orange/90 uppercase tracking-widest truncate">
                              {event.reason}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-1.5 border-t border-kairo-orange/10">
                            <Link
                              href={`/events/${event.id}`}
                              onClick={() => trackEventClick("chat_details_click", event)}
                              className="flex-1 text-center py-1.5 px-2 border border-kairo-orange/30 hover:border-kairo-orange text-[9px] uppercase tracking-widest font-bold text-kairo-white hover:bg-kairo-orange hover:text-kairo-primary transition-all duration-300 rounded-none cursor-pointer"
                            >
                              Details
                            </Link>
                            {event.registrationUrl && (
                              <a
                                href={event.registrationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackEventClick("chat_register_click", event)}
                                className="flex-1 text-center py-1.5 px-2 bg-kairo-orange hover:bg-kairo-orange/80 text-[9px] uppercase tracking-widest font-bold text-kairo-primary transition-all duration-300 rounded-none cursor-pointer"
                              >
                                Register
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        <div ref={messagesEndRef} />
      </div>

      {/* Drawer Footer input + Suggestions chips */}
      <div className="border-t border-kairo-orange/10 p-4 bg-kairo-primary/95 space-y-3">
        {/* Interactive Suggestion Chips (Dynamically load chips from last AI message or defaults) */}
        {(() => {
          let chips = [
            "Find hackathons this weekend",
            "Free AI workshops",
            "Startup networking events",
            "Concerts in Mumbai",
            "Online events today"
          ];
          
          const assistantMessages = messages.filter((m) => m.role === "assistant");
          if (assistantMessages.length > 0) {
            const lastAssistant = assistantMessages[assistantMessages.length - 1];
            if (lastAssistant.suggestions && lastAssistant.suggestions.length > 0) {
              chips = lastAssistant.suggestions.slice(0, 4); // Show top 4 chips
            }
          }

          return (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2">
              {chips.map((chip, idx) => (
                <button
                  key={idx}
                  disabled={isLoading}
                  onClick={() => handleSendMessage(chip, "chat_suggestion_click")}
                  className="px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest border border-kairo-orange/15 hover:border-kairo-orange/40 bg-kairo-dark-gray/10 hover:bg-kairo-dark-gray/35 text-kairo-orange hover:text-kairo-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shrink-0 rounded-none cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          );
        })()}

        {/* Form Input message */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputText.trim() && !isLoading) {
              handleSendMessage(inputText, "chat_message_sent");
            }
          }}
          className="flex items-center border border-kairo-orange/15 focus-within:border-kairo-orange transition-all duration-300"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "Kairo AI is searching events..." : "Ask Kairo AI to discover events..."}
            className="flex-1 bg-transparent py-3 px-4 text-xs text-kairo-white placeholder:text-kairo-light-gray/60 focus:outline-none disabled:opacity-75"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center text-kairo-orange hover:text-kairo-white disabled:text-kairo-orange/30 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
