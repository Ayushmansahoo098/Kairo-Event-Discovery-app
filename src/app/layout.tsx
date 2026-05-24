import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BookmarkProvider } from "@/context/bookmark-context";
import { AuthProvider } from "@/context/auth-context";
import { Navbar } from "@/components/navbar";
import { CustomCursor } from "@/components/custom-cursor";
import { InitialLoader } from "@/components/initial-loader";
import { cn } from "@/lib/utils";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
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
    <html lang="en" className={cn(plusJakarta.variable, "font-sans")}>
      <body className="min-h-screen bg-kairo-primary font-sans text-kairo-white antialiased cursor-default">
        <InitialLoader />
        <CustomCursor />
        <AuthProvider>
          <BookmarkProvider>
            <Navbar />
            <main className="pb-20 md:pb-0 md:pt-16">{children}</main>
          </BookmarkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
