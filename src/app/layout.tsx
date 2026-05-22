import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { BookmarkProvider } from "@/context/bookmark-context";
import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", inter.variable, "font-sans", geist.variable)}>
      <body className="min-h-screen bg-[#0a0a0b] font-sans text-white antialiased">
        <BookmarkProvider>
          <Navbar />
          <main className="pb-20 md:pb-0">{children}</main>
        </BookmarkProvider>
      </body>
    </html>
  );
}
