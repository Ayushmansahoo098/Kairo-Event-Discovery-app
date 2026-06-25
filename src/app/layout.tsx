import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { BookmarkProvider } from "@/context/bookmark-context";
import { AuthProvider } from "@/context/auth-context";
import { Navbar } from "@/components/navbar";
import { InitialLoader } from "@/components/initial-loader";
import { VisualGrid } from "@/components/visual-grid";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { AIAssistant } from "@/components/ai-assistant";
import { ChatProvider } from "@/context/chat-context";
import { AIAssistantDrawerContainer } from "@/components/ai-assistant-drawer-container";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Kairo — Discover Events",
  description:
    "Discover trending events, meetups, and experiences happening around you. Your personal event discovery companion.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#b8a88a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(plusJakarta.variable, cormorantGaramond.variable, "font-sans")}>
      <body className="min-h-screen bg-kairo-primary font-sans text-kairo-white antialiased cursor-default relative overflow-x-hidden">
        <InitialLoader />
        <VisualGrid />
        <AuthProvider>
          <BookmarkProvider>
            <ChatProvider>
              <Navbar />
              <main className="pb-20 md:pb-0 md:pt-16 relative z-10">{children}</main>
              <AIAssistant />
              <AIAssistantDrawerContainer />
            </ChatProvider>
          </BookmarkProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
