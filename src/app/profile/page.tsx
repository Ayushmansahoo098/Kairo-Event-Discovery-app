"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  MapPin,
  Bell,
  CheckCircle2,
  Bookmark,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getEvents } from "@/lib/mock-data";
import { Event } from "@/lib/types";
import { EventCard } from "@/components/event-card";

interface CityCoord {
  name: string;
  lat: number;
  lng: number;
}

const SUPPORTED_CITIES: CityCoord[] = [
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findClosestCity(lat: number, lng: number): string {
  let closestCity = SUPPORTED_CITIES[0].name;
  let minDistance = getDistance(lat, lng, SUPPORTED_CITIES[0].lat, SUPPORTED_CITIES[0].lng);

  for (let i = 1; i < SUPPORTED_CITIES.length; i++) {
    const dist = getDistance(lat, lng, SUPPORTED_CITIES[i].lat, SUPPORTED_CITIES[i].lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestCity = SUPPORTED_CITIES[i].name;
    }
  }
  return closestCity;
}

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuthContext();
  const { bookmarks } = useBookmarkContext();
  const router = useRouter();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isScrapingUnstop, setIsScrapingUnstop] = useState(false);
  const [isScrapingHackerEarth, setIsScrapingHackerEarth] = useState(false);

  // Recently Viewed states
  const [recentlyViewed, setRecentlyViewed] = useState<Event[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Preferred Location & Preferences States
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [geoCity, setGeoCity] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [userLocationCoord, setUserLocationCoord] = useState<{ lat: number; lng: number } | null>(null);

  // Load preferences from Firestore on mount
  useEffect(() => {
    if (!user) return;
    const fetchPrefs = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPreferredCities(data.preferredCities || []);
          setInterests(data.interests || []);
          setEmailNotifications(data.notificationPreferences?.email ?? true);
          setPushNotifications(data.notificationPreferences?.push ?? true);
          if (data.lastLocation?.city) {
            setGeoCity(data.lastLocation.city);
          }
        }
      } catch (err) {
        console.error("Error fetching user preferences:", err);
      }
    };
    fetchPrefs();
  }, [user]);

  // Load recently viewed events from LocalStorage
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const raw = localStorage.getItem("kairo-recently-viewed");
        const recentIds: string[] = raw ? JSON.parse(raw) : [];
        if (recentIds.length > 0) {
          const all = await getEvents();
          // Maintain the order of recentIds
          const filtered = recentIds
            .map((id) => all.find((e) => e.id === id))
            .filter(Boolean) as Event[];
          setRecentlyViewed(filtered);
        } else {
          setRecentlyViewed([]);
        }
      } catch (err) {
        console.error("Failed to load recently viewed events:", err);
      } finally {
        setLoadingRecent(false);
      }
    };
    fetchRecent();
  }, []);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocationCoord({ lat: latitude, lng: longitude });
        const closestCity = findClosestCity(latitude, longitude);
        setGeoCity(closestCity);
        // Add to preferred cities if not already there
        if (!preferredCities.includes(closestCity)) {
          setPreferredCities((prev) => [...prev, closestCity]);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(`Failed to get location: ${error.message}`);
        setIsLocating(false);
      }
    );
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSavingPrefs(true);
    try {
      const payload: any = {
        preferredCities,
        interests,
        notificationPreferences: {
          email: emailNotifications,
          push: pushNotifications,
        },
      };
      if (geoCity && userLocationCoord) {
        payload.lastLocation = {
          latitude: userLocationCoord.lat,
          longitude: userLocationCoord.lng,
          city: geoCity,
        };
      }
      await updateDoc(doc(db, "users", user.id), payload);
      alert("Preferences saved successfully!");
    } catch (err) {
      console.error("Failed to save preferences:", err);
      alert("Failed to save preferences.");
    } finally {
      setIsSavingPrefs(false);
    }
  };

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

      {/* ── Recently Viewed Section ── */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-kairo-white mb-4">Recently Viewed Events</h2>
        {loadingRecent ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50">
            <Loader2 className="w-6 h-6 animate-spin text-kairo-orange" />
            <span className="ml-3 text-sm font-medium text-kairo-light-gray">Loading history...</span>
          </div>
        ) : recentlyViewed.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recentlyViewed.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 p-8 text-center">
            <p className="text-sm font-medium text-kairo-light-gray">No recently viewed events.</p>
            <button
              onClick={() => router.push("/feed")}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/5 border border-kairo-gray hover:border-kairo-orange px-4 py-2 text-xs font-bold text-kairo-light-gray hover:text-kairo-white transition-all cursor-pointer"
            >
              Browse Events
            </button>
          </div>
        )}
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

          {/* Admin Dashboard */}
          <button
            onClick={() => router.push("/admin/observability")}
            className="w-full flex items-center justify-between p-4 hover:bg-kairo-primary transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3 text-kairo-white group-hover:text-kairo-orange transition-colors">
              <Activity className="w-5 h-5 text-kairo-light-gray group-hover:text-kairo-orange" />
              <span className="font-semibold">Admin Observability & AI Analytics Dashboard</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
              System Admin
            </span>
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

      {/* ── Preferences Panel ── */}
      <div className="mt-8 rounded-3xl border border-kairo-gray bg-kairo-dark-gray p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-kairo-gray">
          <Settings className="w-5 h-5 text-kairo-orange" />
          <h2 className="text-lg font-bold text-kairo-white">Preferences & AI Recommendations Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Geolocation Section */}
          <div className="p-4 bg-kairo-primary border border-kairo-gray rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-kairo-grad-4" />
              <div>
                <p className="text-sm font-bold text-kairo-white">Location Intelligence</p>
                <p className="text-xs text-kairo-light-gray mt-0.5">
                  Closest matching city: <span className="font-extrabold text-kairo-orange">{geoCity || "None (Please locate)"}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleUseLocation}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-kairo-gray hover:border-kairo-orange px-4 py-2.5 text-xs font-bold text-kairo-light-gray hover:text-kairo-white transition-all cursor-pointer disabled:opacity-50"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-kairo-orange" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-kairo-orange" />
              )}
              {isLocating ? "Locating..." : "Use Current Location"}
            </button>
          </div>

          {/* Preferred Cities */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-kairo-light-gray mb-3">
              Preferred Cities (Multi-City Tracking)
            </label>
            <div className="flex flex-wrap gap-2">
              {["Bangalore", "Hyderabad", "Mumbai", "Delhi", "Chennai", "Pune"].map((city) => {
                const isSelected = preferredCities.includes(city);
                return (
                  <button
                    key={city}
                    onClick={() => {
                      setPreferredCities((prev) =>
                        isSelected ? prev.filter((c) => c !== city) : [...prev, city]
                      );
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider",
                      isSelected
                        ? "bg-kairo-orange text-kairo-white shadow-md shadow-kairo-orange/20 border border-transparent"
                        : "bg-kairo-primary border border-kairo-gray text-kairo-light-gray hover:text-kairo-white hover:border-white/20"
                    )}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-kairo-light-gray mb-3">
              Interests & Subcultures (AI Personalization)
            </label>
            <div className="flex flex-wrap gap-2">
              {["AI", "Hackathons", "Startups", "Meetups", "Concerts", "Workshops", "Gaming", "Festivals"].map((interest) => {
                const isSelected = interests.some(
                  (i) => i.toLowerCase() === interest.toLowerCase()
                );
                return (
                  <button
                    key={interest}
                    onClick={() => {
                      setInterests((prev) => {
                        const exists = prev.some((i) => i.toLowerCase() === interest.toLowerCase());
                        return exists
                          ? prev.filter((i) => i.toLowerCase() !== interest.toLowerCase())
                          : [...prev, interest.toLowerCase()];
                      });
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider",
                      isSelected
                        ? "bg-kairo-grad-2 text-kairo-white shadow-md shadow-kairo-grad-2/20 border border-transparent"
                        : "bg-kairo-primary border border-kairo-gray text-kairo-light-gray hover:text-kairo-white hover:border-white/20"
                    )}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-kairo-light-gray mb-3">
              Notification Preferences
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="h-4 w-4 rounded border-kairo-gray bg-kairo-primary text-kairo-orange focus:ring-kairo-orange/50"
                />
                <span className="text-sm font-semibold text-kairo-light-gray group-hover:text-kairo-white transition-colors">
                  Receive email alerts for registration deadlines
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  className="h-4 w-4 rounded border-kairo-gray bg-kairo-primary text-kairo-orange focus:ring-kairo-orange/50"
                />
                <span className="text-sm font-semibold text-kairo-light-gray group-hover:text-kairo-white transition-colors">
                  Enable browser push notifications for saved watchlists
                </span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-kairo-gray flex justify-end">
            <button
              onClick={handleSavePreferences}
              disabled={isSavingPrefs}
              className="inline-flex items-center gap-2 rounded-xl bg-kairo-orange hover:bg-kairo-grad-2 hover:shadow-lg hover:shadow-kairo-orange/20 px-6 py-3 text-sm font-bold text-kairo-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSavingPrefs ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {isSavingPrefs ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
