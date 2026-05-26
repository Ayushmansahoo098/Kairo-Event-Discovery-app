"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthContext } from "@/context/auth-context";
import { useBookmarkContext } from "@/context/bookmark-context";
import {
  LogOut,
  Settings,
  Ticket,
  Heart,
  CalendarCheck,
  Loader2,
  Edit3,
  RefreshCw,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuthContext();
  const { bookmarks } = useBookmarkContext();
  const router = useRouter();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isScrapingUnstop, setIsScrapingUnstop] = useState(false);
  const [isScrapingHackerEarth, setIsScrapingHackerEarth] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-kairo-orange" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSyncEventbrite = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Eventbrite events synced successfully!");
      } else {
        alert("Sync failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Sync failed. Please verify your internet connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const { seedDatabase } = await import("@/lib/seed");
      const res = await seedDatabase();
      if (res.success) {
        alert(`Database successfully seeded with ${res.count} events!`);
      } else {
        alert("Seeding failed: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Seeding failed. Please verify your Firestore credentials.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleScrapeDevfolio = async () => {
    setIsScraping(true);
    try {
      const res = await fetch("/api/scrape/devfolio", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `Successfully synced ${data.count} hackathons from Devfolio!`);
      } else {
        alert("Scrape failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Scrape failed. Please verify your connection.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleScrapeUnstop = async () => {
    setIsScrapingUnstop(true);
    try {
      const res = await fetch("/api/scrape/unstop", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `Successfully synced ${data.count} events from Unstop!`);
      } else {
        alert("Scrape failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Scrape failed. Please verify your connection.");
    } finally {
      setIsScrapingUnstop(false);
    }
  };

  const handleScrapeHackerEarth = async () => {
    setIsScrapingHackerEarth(true);
    try {
      const res = await fetch("/api/scrape/hackerearth", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `Successfully synced ${data.count} events from HackerEarth!`);
      } else {
        alert("Scrape failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Scrape failed. Please verify your connection.");
    } finally {
      setIsScrapingHackerEarth(false);
    }
  };

  const stats = [
    { label: "Saved Events", value: bookmarks.length, icon: Heart, color: "text-kairo-grad-2", bg: "bg-kairo-dark-gray" },
    { label: "Tickets", value: 3, icon: Ticket, color: "text-kairo-orange", bg: "bg-kairo-dark-gray" },
    { label: "Past Events", value: 12, icon: CalendarCheck, color: "text-kairo-grad-4", bg: "bg-kairo-dark-gray" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header / Profile Card ── */}
      <div className="relative rounded-3xl bg-kairo-dark-gray border border-kairo-gray overflow-hidden shadow-lg">
        {/* Banner */}
        <div className="h-32 w-full bg-gradient-to-r from-kairo-grad-2 via-kairo-orange to-kairo-grad-4"></div>
        
        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="absolute -top-16 left-6 rounded-full border-4 border-kairo-dark-gray bg-kairo-primary h-32 w-32 overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Edit Profile Button */}
          <div className="flex justify-end pt-4">
            <button className="inline-flex items-center gap-2 rounded-full border border-kairo-gray bg-kairo-primary px-4 py-2 text-sm font-semibold text-kairo-light-gray shadow-sm transition-colors hover:border-kairo-orange hover:text-kairo-orange hover:bg-kairo-gray">
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
          </div>

          <div className="mt-8">
            <h1 className="text-3xl font-extrabold text-kairo-white">{user.name}</h1>
            <p className="text-kairo-light-gray font-medium mt-1">{user.email}</p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray p-6 flex items-center gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray", stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-kairo-gray">{stat.label}</p>
              <p className="text-2xl font-bold text-kairo-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Settings & Actions ── */}
      <div className="mt-8 rounded-2xl border border-kairo-gray bg-kairo-dark-gray overflow-hidden">
        <div className="p-4 border-b border-kairo-gray">
          <h2 className="text-lg font-bold text-kairo-white">Dashboard & Actions</h2>
        </div>
        
        <div className="divide-y divide-kairo-gray">
          {/* Sync Eventbrite */}
          <button
            onClick={handleSyncEventbrite}
            disabled={isSyncing}
            className="w-full flex items-center justify-between p-4 hover:bg-kairo-primary transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3 text-kairo-white group-hover:text-kairo-orange transition-colors">
              {isSyncing ? (
                <Loader2 className="w-5 h-5 animate-spin text-kairo-orange" />
              ) : (
                <RefreshCw className="w-5 h-5 text-kairo-light-gray group-hover:text-kairo-orange" />
              )}
              <span className="font-medium">
                {isSyncing ? "Syncing Eventbrite..." : "Sync Live Eventbrite Catalog"}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-kairo-orange bg-kairo-orange/10 px-2.5 py-1 rounded-full">
              Real-time Ingest
            </span>
          </button>

          {/* Seed Database */}
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="w-full flex items-center justify-between p-4 hover:bg-kairo-primary transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3 text-kairo-white group-hover:text-kairo-orange transition-colors">
              {isSeeding ? (
                <Loader2 className="w-5 h-5 animate-spin text-kairo-orange" />
              ) : (
                <Database className="w-5 h-5 text-kairo-light-gray group-hover:text-kairo-orange" />
              )}
              <span className="font-medium">
                {isSeeding ? "Seeding Database..." : "Seed Local Mock Database"}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-kairo-light-gray bg-white/5 px-2.5 py-1 rounded-full">
              Demo Sandbox
            </span>
          </button>

          {/* Sync Devfolio */}
          <button
            onClick={handleScrapeDevfolio}
            disabled={isScraping}
            className="w-full flex items-center justify-between p-4 hover:bg-kairo-primary transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3 text-kairo-white group-hover:text-kairo-orange transition-colors">
              {isScraping ? (
                <Loader2 className="w-5 h-5 animate-spin text-kairo-orange" />
              ) : (
                <RefreshCw className="w-5 h-5 text-kairo-light-gray group-hover:text-kairo-orange" />
              )}
              <span className="font-medium">
                {isScraping ? "Syncing Devfolio..." : "Sync Live Devfolio Hackathons"}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-kairo-orange bg-kairo-orange/10 px-2.5 py-1 rounded-full">
              Playwright Crawl
            </span>
          </button>

          {/* Sync Unstop */}
          <button
            onClick={handleScrapeUnstop}
            disabled={isScrapingUnstop}
            className="w-full flex items-center justify-between p-4 hover:bg-kairo-primary transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3 text-kairo-white group-hover:text-kairo-orange transition-colors">
              {isScrapingUnstop ? (
                <Loader2 className="w-5 h-5 animate-spin text-kairo-orange" />
              ) : (
                <RefreshCw className="w-5 h-5 text-kairo-light-gray group-hover:text-kairo-orange" />
              )}
              <span className="font-medium">
                {isScrapingUnstop ? "Syncing Unstop..." : "Sync Live Unstop Events"}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-kairo-orange bg-kairo-orange/10 px-2.5 py-1 rounded-full">
              Playwright Crawl
            </span>
          </button>

          {/* Sync HackerEarth */}
          <button
            onClick={handleScrapeHackerEarth}
            disabled={isScrapingHackerEarth}
            className="w-full flex items-center justify-between p-4 hover:bg-kairo-primary transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3 text-kairo-white group-hover:text-kairo-orange transition-colors">
              {isScrapingHackerEarth ? (
                <Loader2 className="w-5 h-5 animate-spin text-kairo-orange" />
              ) : (
                <RefreshCw className="w-5 h-5 text-kairo-light-gray group-hover:text-kairo-orange" />
              )}
              <span className="font-medium">
                {isScrapingHackerEarth ? "Syncing HackerEarth..." : "Sync Live HackerEarth Challenges"}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-kairo-orange bg-kairo-orange/10 px-2.5 py-1 rounded-full">
              Playwright Crawl
            </span>
          </button>

          {/* Preferences */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-kairo-primary transition-colors text-left group">
            <div className="flex items-center gap-3 text-kairo-white group-hover:text-kairo-orange transition-colors">
              <Settings className="w-5 h-5 text-kairo-light-gray group-hover:text-kairo-orange" />
              <span className="font-medium">Preferences</span>
            </div>
          </button>
          
          {/* Sign Out */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-kairo-primary transition-colors text-left group"
          >
            <div className="flex items-center gap-3 text-kairo-grad-2">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
