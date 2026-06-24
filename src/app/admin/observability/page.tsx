"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  where,
  getDocs,
  getCountFromServer
} from "firebase/firestore";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  Trash2, 
  AlertTriangle,
  Users,
  Bookmark,
  Compass,
  MapPin,
  TrendingUp,
  Brain,
  Server,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrapeLog {
  id: string;
  source: string;
  startedAt: string;
  completedAt: string;
  successCount: number;
  failureCount: number;
  cleanupCount: number;
  duration: number;
  status: string;
  error?: string;
  details?: Record<string, { success: boolean; count: number; error?: string }>;
}

export default function ObservabilityDashboard() {
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"observability" | "analytics">("analytics");
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analytics, setAnalytics] = useState<{
    totalEvents: number;
    activeEvents: number;
    expiredEvents: number;
    eventsAddedToday: number;
    eventsUpdatedToday: number;
    sourceCounts: Record<string, { active: number; expired: number }>;
    totalUsers: number;
    totalSaves: number;
    totalRegistrations: number;
    topCategories: { category: string; count: number }[];
    topCities: { city: string; count: number }[];
  } | null>(null);

  const [recommendationStats, setRecommendationStats] = useState<{
    status: string;
    firebaseConnected: boolean;
    transformerLoaded: boolean;
    totalCachedEvents: number;
    totalCachedUserProfiles: number;
    averageRecommendationScore: number;
    topCategories: Record<string, number>;
  } | null>(null);
  const [loadingRecommender, setLoadingRecommender] = useState(true);

  // Fetch platform analytics from Firestore
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const eventsCol = collection(db, "events");
        const usersCol = collection(db, "users");
        const analyticsCol = collection(db, "analytics_events");

        const [eventsCountSnap, usersCountSnap, savesCountSnap, regsCountSnap, eventsSnap] = await Promise.all([
          getCountFromServer(eventsCol),
          getCountFromServer(usersCol),
          getCountFromServer(query(analyticsCol, where("action", "==", "save"))),
          getCountFromServer(query(analyticsCol, where("action", "==", "register"))),
          getDocs(eventsCol),
        ]);

        const totalEvents = eventsCountSnap.data().count;
        const totalUsers = usersCountSnap.data().count;
        const totalSaves = savesCountSnap.data().count;
        const totalRegistrations = regsCountSnap.data().count;

        // Aggregate in-memory stats from active event docs
        const categoryMap: Record<string, number> = {};
        const cityMap: Record<string, number> = {};
        let activeEvents = 0;
        let expiredEvents = 0;
        let eventsAddedToday = 0;
        let eventsUpdatedToday = 0;
        const sourceCounts: Record<string, { active: number; expired: number }> = {};

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayTime = startOfToday.getTime();

        eventsSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const category = data.category || "unknown";
          const city = data.city || "unknown";
          const score = data.popularityScore || 0;
          const status = data.status || "active";
          
          let source = data.source || "Unknown";
          // Normalize source string
          const srcLower = source.toLowerCase();
          if (srcLower.includes("devfolio")) source = "Devfolio";
          else if (srcLower.includes("mlh")) source = "MLH";
          else if (srcLower.includes("gdg")) source = "GDG";
          else if (srcLower.includes("unstop")) source = "Unstop";
          else if (srcLower.includes("hackerearth")) source = "HackerEarth";
          else if (srcLower.includes("luma")) source = "Luma";
          else if (srcLower.includes("meetup")) source = "Meetup";
          else if (srcLower.includes("eventbrite")) source = "Eventbrite";
          else if (srcLower.includes("bookmyshow")) source = "BookMyShow";

          if (!sourceCounts[source]) {
            sourceCounts[source] = { active: 0, expired: 0 };
          }

          if (status === "active") {
            activeEvents++;
            sourceCounts[source].active++;
          } else if (status === "expired") {
            expiredEvents++;
            sourceCounts[source].expired++;
          }

          // Compute Added/Updated today
          const lastUpdatedTime = data.lastUpdated ? new Date(data.lastUpdated).getTime() : 0;
          const createdAtTime = data.createdAt ? new Date(data.createdAt).getTime() : 0;

          if (lastUpdatedTime >= startOfTodayTime) {
            if (createdAtTime >= startOfTodayTime) {
              eventsAddedToday++;
            } else {
              eventsUpdatedToday++;
            }
          }

          categoryMap[category] = (categoryMap[category] || 0) + score + 1;
          cityMap[city] = (cityMap[city] || 0) + score + 1;
        });

        const topCategories = Object.entries(categoryMap)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const topCities = Object.entries(cityMap)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setAnalytics({
          totalEvents,
          activeEvents,
          expiredEvents,
          eventsAddedToday,
          eventsUpdatedToday,
          sourceCounts,
          totalUsers,
          totalSaves,
          totalRegistrations,
          topCategories,
          topCities,
        });
      } catch (err) {
        console.error("Failed to fetch admin dashboard analytics:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Fetch recommendation stats from FastAPI backend
  useEffect(() => {
    const fetchRecommenderStats = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/health`);
        if (res.ok) {
          const data = await res.json();
          setRecommendationStats(data);
        } else {
          setRecommendationStats(null);
        }
      } catch (err) {
        console.error("Failed to fetch recommender health:", err);
        setRecommendationStats(null);
      } finally {
        setLoadingRecommender(false);
      }
    };
    fetchRecommenderStats();
  }, []);

  // Set up real-time listener for scrape logs
  useEffect(() => {
    const q = query(
      collection(db, "scrape_logs"),
      orderBy("completedAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ScrapeLog[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ScrapeLog);
      });
      setLogs(list);
      setLoading(false);
    }, (error) => {
      console.error("Observability listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute Aggregates for Observability Logs
  const totalSyncs = logs.reduce((acc, log) => acc + (log.successCount || 0), 0);
  const totalCleanups = logs.reduce((acc, log) => acc + (log.cleanupCount || 0), 0);
  const averageDuration = logs.length > 0 
    ? Math.round(logs.reduce((acc, log) => acc + (log.duration || 0), 0) / logs.length) 
    : 0;

  const successfulRuns = logs.filter(log => log.status === "success" || log.status === "partial_success").length;
  const uptimePercentage = logs.length > 0 
    ? Math.round((successfulRuns / logs.length) * 100) 
    : 100;

  // Source-wise health status lookup
  const getLatestSourceStatus = (source: string) => {
    const sourceLogs = logs.filter(log => 
      log.source === source || 
      (log.source === "Unified Sync All" && log.details?.[source])
    );
    if (sourceLogs.length === 0) return { status: "unknown", lastSync: "Never", count: 0 };
    
    const latest = sourceLogs[0];
    let success = latest.status === "success" || latest.status === "partial_success";
    let count = latest.successCount || 0;
    let error = latest.error;
    
    if (latest.source === "Unified Sync All" && latest.details?.[source]) {
      success = latest.details[source].success;
      count = latest.details[source].count || 0;
      error = latest.details[source].error;
    }

    let status = "unknown";
    if (success) {
      if (count > 0) {
        status = "healthy";
      } else {
        status = "warning";
      }
    } else {
      status = "failed";
    }

    return {
      status,
      count,
      error,
      lastSync: new Date(latest.completedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      date: new Date(latest.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    };
  };

  const sources = [
    { name: "Devfolio", label: "Devfolio Scraper" },
    { name: "MLH", label: "MLH Scraper" },
    { name: "GDG", label: "GDG Scraper" },
    { name: "Unstop", label: "Unstop Scraper" },
    { name: "HackerEarth", label: "HackerEarth Scraper" },
    { name: "Luma", label: "Luma Scraper" },
    { name: "Meetup", label: "Meetup Scraper" },
    { name: "Eventbrite", label: "Eventbrite API" },
    { name: "BookMyShow", label: "BookMyShow Scraper" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-kairo-primary min-h-screen text-kairo-white">
      {/* ── Title ── */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-kairo-dark-gray border border-kairo-gray shadow-md">
            <Activity className="h-6 w-6 text-kairo-orange animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-kairo-white">
              System Admin & AI Observability
            </h1>
            <p className="text-sm text-kairo-light-gray font-semibold">
              Platform event analytics, crawler telemetry, and recommendation health
            </p>
          </div>
        </div>
        
        {/* Connection Pulse */}
        <div className="flex items-center gap-2 bg-kairo-dark-gray/50 border border-kairo-gray px-4 py-2 rounded-full self-start md:self-auto">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
            Live Listeners Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-kairo-gray/30 pb-px">
        <button
          onClick={() => setActiveTab("analytics")}
          className={cn(
            "pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
            activeTab === "analytics"
              ? "text-kairo-orange border-kairo-orange font-black"
              : "text-kairo-light-gray border-transparent hover:text-kairo-white"
          )}
        >
          📈 Platform Analytics
        </button>
        <button
          onClick={() => setActiveTab("observability")}
          className={cn(
            "pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
            activeTab === "observability"
              ? "text-kairo-orange border-kairo-orange font-black"
              : "text-kairo-light-gray border-transparent hover:text-kairo-white"
          )}
        >
          ⚙️ Crawler Telemetry
        </button>
      </div>

      {activeTab === "analytics" ? (
        loadingAnalytics ? (
          <div className="flex flex-col items-center justify-center py-48 bg-kairo-dark-gray/20 border border-kairo-gray rounded-3xl">
            <RefreshCw className="w-10 h-10 animate-spin text-kairo-orange" />
            <p className="mt-4 text-kairo-light-gray font-bold tracking-widest text-xs uppercase">
              Aggregating Platform Metrics...
            </p>
          </div>
        ) : analytics ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Active Events */}
              <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 flex items-center gap-4 hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Active Events</p>
                  <p className="text-2xl font-black text-kairo-white">{analytics.activeEvents}</p>
                </div>
              </div>

              {/* Expired Events */}
              <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 flex items-center gap-4 hover:border-rose-500/30 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-rose-400">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Expired Events</p>
                  <p className="text-2xl font-black text-kairo-white">{analytics.expiredEvents}</p>
                </div>
              </div>

              {/* Added Today */}
              <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 flex items-center gap-4 hover:border-kairo-orange/30 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-kairo-orange">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Added Today</p>
                  <p className="text-2xl font-black text-kairo-white">+{analytics.eventsAddedToday}</p>
                </div>
              </div>

              {/* Updated Today */}
              <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 flex items-center gap-4 hover:border-sky-500/30 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-sky-400">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Updated Today</p>
                  <p className="text-2xl font-black text-kairo-white">~{analytics.eventsUpdatedToday}</p>
                </div>
              </div>
            </div>

            {/* Split Middle Row: Source distribution & Recommender Engine */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Source Distribution */}
              <div className="rounded-3xl border border-kairo-gray bg-kairo-dark-gray/50 p-6 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-kairo-gray/60">
                  <Database className="w-5 h-5 text-sky-400" />
                  <h3 className="font-extrabold text-lg text-kairo-white">Event Source Distribution</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-kairo-gray/40 text-xs font-black uppercase tracking-widest text-kairo-light-gray bg-kairo-primary/20 [&>th]:p-3">
                        <th>Source</th>
                        <th className="text-center">Active</th>
                        <th className="text-center">Expired</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-kairo-gray/30 text-sm">
                      {sources.map((src) => {
                        const counts = analytics.sourceCounts[src.name] || { active: 0, expired: 0 };
                        const total = counts.active + counts.expired;
                        return (
                          <tr key={src.name} className="hover:bg-kairo-primary/10 transition-colors [&>td]:p-3">
                            <td className="font-extrabold text-kairo-white">{src.name}</td>
                            <td className="text-center text-emerald-400 font-bold">{counts.active}</td>
                            <td className="text-center text-kairo-light-gray">{counts.expired}</td>
                            <td className="text-right text-kairo-white font-bold">{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendation Model Stats */}
              <div className="rounded-3xl border border-kairo-gray bg-kairo-dark-gray/50 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-kairo-gray/60">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-kairo-orange" />
                    <h3 className="font-extrabold text-lg text-kairo-white">AI Recommendation Engine</h3>
                  </div>
                  {loadingRecommender ? (
                    <span className="text-xs bg-kairo-gray text-kairo-light-gray px-2.5 py-1 rounded-full font-bold">Connecting...</span>
                  ) : recommendationStats ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Online
                    </span>
                  ) : (
                    <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-bold">Offline</span>
                  )}
                </div>
                
                {recommendationStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-kairo-primary/40 border border-kairo-gray/50 p-4 rounded-2xl">
                        <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-wider">Cached Profiles</p>
                        <p className="text-2xl font-black text-kairo-white mt-1">
                          {recommendationStats.totalCachedUserProfiles}
                        </p>
                      </div>
                      <div className="bg-kairo-primary/40 border border-kairo-gray/50 p-4 rounded-2xl">
                        <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-wider">Avg Rec. Score</p>
                        <p className="text-2xl font-black text-kairo-orange mt-1">
                          {(recommendationStats.averageRecommendationScore * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-wider">Embedding Sync Status</p>
                      <div className="flex items-center gap-2 text-sm font-semibold text-kairo-white">
                        <Server className="w-4 h-4 text-emerald-400" />
                        <span>{recommendationStats.totalCachedEvents} events embedded & synchronized</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-wider mb-3">Recommender Top Categories</p>
                      <div className="space-y-3">
                        {Object.entries(recommendationStats.topCategories || {}).length > 0 ? (
                          Object.entries(recommendationStats.topCategories)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([cat, count]) => (
                              <div key={cat} className="flex items-center justify-between text-sm">
                                <span className="capitalize text-kairo-white font-medium">{cat}</span>
                                <span className="text-kairo-light-gray font-bold">{count} events</span>
                              </div>
                            ))
                        ) : (
                          <p className="text-xs text-kairo-light-gray">No categories currently cached.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertTriangle className="w-8 h-8 text-rose-400 mb-2 animate-bounce" />
                    <p className="text-sm font-semibold text-kairo-white">Recommender Service Unreachable</p>
                    <p className="text-xs text-kairo-light-gray max-w-[280px] mt-1">
                      Ensure the FastAPI backend is running at <code className="text-kairo-orange font-bold font-mono">localhost:8000</code>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Engagement Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Most Popular Categories */}
              <div className="rounded-3xl border border-kairo-gray bg-kairo-dark-gray/50 p-6 backdrop-blur-md col-span-1">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-kairo-gray/60">
                  <TrendingUp className="w-5 h-5 text-kairo-orange" />
                  <h3 className="font-extrabold text-lg text-kairo-white">Top Categories</h3>
                </div>
                <div className="space-y-5">
                  {analytics.topCategories.length > 0 ? (
                    analytics.topCategories.map((cat, idx) => {
                      const maxVal = analytics.topCategories[0]?.count || 1;
                      const percent = Math.round((cat.count / maxVal) * 100);
                      return (
                        <div key={cat.category} className="space-y-1.5">
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="capitalize text-kairo-white flex items-center gap-2">
                              <span className="text-xs text-kairo-light-gray font-bold">#{idx + 1}</span>
                              {cat.category}
                            </span>
                            <span className="text-kairo-light-gray font-bold">{cat.count} pts</span>
                          </div>
                          <div className="h-2 w-full bg-kairo-primary rounded-full overflow-hidden border border-kairo-gray/30">
                            <div 
                              className="h-full bg-gradient-to-r from-kairo-orange to-kairo-grad-2 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm font-medium text-kairo-light-gray py-6 text-center">No categories data available.</p>
                  )}
                </div>
              </div>

              {/* Most Popular Cities */}
              <div className="rounded-3xl border border-kairo-gray bg-kairo-dark-gray/50 p-6 backdrop-blur-md col-span-1">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-kairo-gray/60">
                  <MapPin className="w-5 h-5 text-sky-400" />
                  <h3 className="font-extrabold text-lg text-kairo-white">Top Cities</h3>
                </div>
                <div className="space-y-5">
                  {analytics.topCities.length > 0 ? (
                    analytics.topCities.map((city, idx) => {
                      const maxVal = analytics.topCities[0]?.count || 1;
                      const percent = Math.round((city.count / maxVal) * 100);
                      return (
                        <div key={city.city} className="space-y-1.5">
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="text-kairo-white flex items-center gap-2">
                              <span className="text-xs text-kairo-light-gray font-bold">#{idx + 1}</span>
                              {city.city}
                            </span>
                            <span className="text-kairo-light-gray font-bold">{city.count} pts</span>
                          </div>
                          <div className="h-2 w-full bg-kairo-primary rounded-full overflow-hidden border border-kairo-gray/30">
                            <div 
                              className="h-full bg-gradient-to-r from-sky-400 to-kairo-orange rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm font-medium text-kairo-light-gray py-6 text-center">No location data available.</p>
                  )}
                </div>
              </div>

              {/* Platform Activity Engagement */}
              <div className="rounded-3xl border border-kairo-gray bg-kairo-dark-gray/50 p-6 backdrop-blur-md col-span-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-kairo-gray/60">
                    <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="font-extrabold text-lg text-kairo-white">Platform Engagement</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-kairo-light-gray font-medium">
                        <Users className="w-4 h-4 text-sky-400" />
                        <span>Registered Users</span>
                      </div>
                      <span className="font-black text-kairo-white">{analytics.totalUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-kairo-light-gray font-medium">
                        <Bookmark className="w-4 h-4 text-kairo-orange" />
                        <span>Saved Events</span>
                      </div>
                      <span className="font-black text-kairo-white">{analytics.totalSaves}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-kairo-light-gray font-medium">
                        <Compass className="w-4 h-4 text-emerald-400" />
                        <span>Event Registrations</span>
                      </div>
                      <span className="font-black text-kairo-white">{analytics.totalRegistrations}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-kairo-gray/40 pt-4 text-[10px] uppercase font-black tracking-wider text-kairo-light-gray text-center">
                  Stats compiled from live firestore analytics
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-48 bg-kairo-dark-gray/20 border border-kairo-gray rounded-3xl">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
            <p className="mt-4 text-kairo-light-gray font-bold tracking-widest text-xs uppercase">
              Failed to load analytics dashboard data.
            </p>
          </div>
        )
      ) : (
        loading ? (
          <div className="flex flex-col items-center justify-center py-48 bg-kairo-dark-gray/20 border border-kairo-gray rounded-3xl">
            <RefreshCw className="w-10 h-10 animate-spin text-kairo-orange" />
            <p className="mt-4 text-kairo-light-gray font-bold tracking-widest text-xs uppercase">
              Loading System Logs...
            </p>
          </div>
        ) : (
          <>
            {/* ── Stats Overview ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Sync Card */}
              <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-kairo-orange">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Ingested Events</p>
                  <p className="text-2xl font-black text-kairo-white">{totalSyncs}</p>
                </div>
              </div>

              {/* Uptime Card */}
              <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray",
                  uptimePercentage > 90 ? "text-emerald-400" : "text-amber-400"
                )}>
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">System Success Rate</p>
                  <p className="text-2xl font-black text-kairo-white">{uptimePercentage}%</p>
                </div>
              </div>

              {/* Sweep Cleanups */}
              <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-rose-400">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Stale Prunes</p>
                  <p className="text-2xl font-black text-kairo-white">{totalCleanups}</p>
                </div>
              </div>

              {/* Duration */}
              <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-sky-400">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Avg Runtime</p>
                  <p className="text-2xl font-black text-kairo-white">{averageDuration}s</p>
                </div>
              </div>
            </div>

            {/* ── Active Ingestion Sources ── */}
            <div className="mb-8">
              <h2 className="text-lg font-black uppercase tracking-widest text-kairo-light-gray mb-4">
                Scraper Health Directory
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sources.map((src) => {
                  const health = getLatestSourceStatus(src.name);
                  const isOnline = health.status === "healthy";
                  const isWarning = health.status === "warning";
                  const isFailed = health.status === "failed";
                  
                  return (
                    <div key={src.name} className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 relative overflow-hidden group hover:border-kairo-orange/30 transition-all duration-300">
                      <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-transparent to-kairo-orange/20"></div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-extrabold text-kairo-white">{src.label}</h3>
                          <p className="text-xs text-kairo-light-gray font-semibold mt-1">
                            Last: {health.lastSync === "Never" ? "Never" : `${health.date} @ ${health.lastSync}`}
                          </p>
                        </div>
                        
                        <span className={cn(
                          "h-3 w-3 rounded-full flex shrink-0 mt-1",
                          isOnline 
                            ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" 
                            : isWarning
                              ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)] animate-pulse"
                              : isFailed
                                ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                                : "bg-kairo-gray"
                        )}></span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-kairo-light-gray border-t border-kairo-gray pt-4">
                        <div className="flex items-center gap-1.5">
                          <span>Status:</span>
                          <span className={cn(
                            "font-extrabold",
                            isOnline ? "text-emerald-400" : isWarning ? "text-amber-400" : isFailed ? "text-rose-500" : "text-kairo-light-gray"
                          )}>
                            {isOnline ? "Healthy" : isWarning ? "Warning (0)" : isFailed ? "Failed" : "Unknown"}
                          </span>
                        </div>
                        {isOnline || isWarning ? (
                          <span className="text-kairo-white font-bold">{health.count} events</span>
                        ) : null}
                      </div>

                      {health.error && (
                        <div className="mt-3 text-[10px] text-rose-400 font-mono bg-rose-950/30 border border-rose-900/50 p-2 rounded overflow-x-auto max-h-20 whitespace-pre-wrap">
                          {health.error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Scraper Run Logs Audit Trail ── */}
            <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 overflow-hidden backdrop-blur-md">
              <div className="p-5 border-b border-kairo-gray flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-widest text-kairo-white">
                  Scraper Logs Audit Trail
                </h2>
                <span className="text-xs bg-kairo-gray px-3 py-1.5 rounded-full font-bold text-kairo-light-gray">
                  Showing last {logs.length} runs
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-kairo-gray text-xs font-black uppercase tracking-widest text-kairo-light-gray bg-kairo-primary/20 [&>th]:p-4">
                      <th>Source Sync</th>
                      <th>Execution Timestamp</th>
                      <th>Runtime</th>
                      <th>Synced Events</th>
                      <th>Stale Pruned</th>
                      <th>Status Badge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-kairo-gray text-sm">
                    {logs.map((log) => {
                      const isSuccess = log.status === "success";
                      const isPartial = log.status === "partial_success";

                      return (
                        <tr key={log.id} className="hover:bg-kairo-primary/10 transition-colors [&>td]:p-4 group">
                          <td>
                            <span className="font-extrabold text-kairo-white group-hover:text-kairo-orange transition-colors">
                              {log.source}
                            </span>
                          </td>
                          <td className="text-kairo-light-gray font-medium">
                            {new Date(log.completedAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="font-bold text-kairo-light-gray flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-kairo-orange" />
                            {log.duration}s
                          </td>
                          <td className="font-bold text-kairo-white">
                            +{log.successCount}
                          </td>
                          <td className="font-bold text-kairo-grad-2">
                            -{log.cleanupCount}
                          </td>
                          <td>
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest",
                              isSuccess
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isPartial
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            )}>
                              {isSuccess ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : isPartial ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {log.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-kairo-light-gray font-bold uppercase tracking-widest text-xs">
                          No telemetry logs available. Run sync scripts to populate.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
