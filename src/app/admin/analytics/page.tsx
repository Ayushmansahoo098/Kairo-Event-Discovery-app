"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  getCountFromServer 
} from "firebase/firestore";
import { 
  Activity, 
  Users, 
  Bookmark, 
  TrendingUp, 
  Brain, 
  Zap, 
  Eye, 
  Award, 
  Clock, 
  CheckCircle2, 
  Filter, 
  BarChart3, 
  ArrowRight,
  RefreshCw,
  GitBranch,
  Search,
  Compass
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TopEvent {
  id: string;
  title: string;
  category: string;
  organizer: string;
  city: string;
  count: number;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  
  // Acquisition metrics
  const [acquisition, setAcquisition] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    providers: { google: 0, github: 0, password: 0, other: 0 }
  });

  // Onboarding metrics
  const [onboarding, setOnboarding] = useState({
    onboardedCount: 0,
    completionRate: 0,
    avgCompletionTimeStr: "N/A"
  });

  // Engagement metrics
  const [engagement, setEngagement] = useState({
    eventViews: 0,
    uniqueViewers: 0,
    saves: 0,
    registrations: 0,
    recommendationClicks: 0
  });

  // Funnel rates
  const [funnel, setFunnel] = useState({
    viewToSaveRate: 0,
    saveToRegisterRate: 0,
    viewToRegisterRate: 0
  });

  // Recommendations performance
  const [recommendationStats, setRecommendationStats] = useState({
    servedCount: 0,
    clickCount: 0,
    saveCount: 0,
    registerCount: 0,
    ctr: 0,
    saveRate: 0,
    registerRate: 0,
    topRecommendedCategories: [] as { category: string; count: number }[],
    topSavedCategories: [] as { category: string; count: number }[]
  });

  // Top content
  const [topContent, setTopContent] = useState({
    mostViewed: [] as TopEvent[],
    mostSaved: [] as TopEvent[],
    mostRegistered: [] as TopEvent[]
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const usersCol = collection(db, "users");
      const eventsCol = collection(db, "events");
      const analyticsCol = collection(db, "analytics_events");

      // ────────────────────────────────────────────────────────
      // 1. ACQUISITION STATS
      // ────────────────────────────────────────────────────────
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const [
        totalUsersCount,
        newUsersTodayCount,
        newUsersWeekCount,
        googleCount,
        githubCount,
        emailCount,
        onboardedCountSnap
      ] = await Promise.all([
        getCountFromServer(usersCol),
        getCountFromServer(query(usersCol, where("createdAt", ">=", startOfToday))),
        getCountFromServer(query(usersCol, where("createdAt", ">=", startOfWeek))),
        getCountFromServer(query(usersCol, where("provider", "==", "google.com"))),
        getCountFromServer(query(usersCol, where("provider", "==", "github.com"))),
        getCountFromServer(query(usersCol, where("provider", "==", "password"))),
        getCountFromServer(query(usersCol, where("onboarded", "==", true)))
      ]);

      const totalUsersVal = totalUsersCount.data().count;
      const onboardedVal = onboardedCountSnap.data().count;

      const providerGoogle = googleCount.data().count;
      const providerGithub = githubCount.data().count;
      const providerPassword = emailCount.data().count;
      const providerOther = Math.max(0, totalUsersVal - (providerGoogle + providerGithub + providerPassword));

      setAcquisition({
        totalUsers: totalUsersVal,
        newUsersToday: newUsersTodayCount.data().count,
        newUsersThisWeek: newUsersWeekCount.data().count,
        providers: {
          google: providerGoogle,
          github: providerGithub,
          password: providerPassword,
          other: providerOther
        }
      });

      // ────────────────────────────────────────────────────────
      // 2. ONBOARDING & TIME CALCULATION
      // ────────────────────────────────────────────────────────
      let completionRate = totalUsersVal > 0 ? (onboardedVal / totalUsersVal) * 100 : 0;
      let avgCompletionTimeStr = "N/A";

      // Fetch onboarded users to compute average onboarding time in-memory
      const onboardedUsersQuery = query(usersCol, where("onboarded", "==", true));
      const onboardedUsersSnap = await getDocs(onboardedUsersQuery);
      
      let totalTimeDiffMs = 0;
      let validUsersForTime = 0;

      onboardedUsersSnap.forEach(docSnap => {
        const uData = docSnap.data();
        if (uData.createdAt && uData.onboardedAt) {
          const createdTime = uData.createdAt.toDate ? uData.createdAt.toDate().getTime() : new Date(uData.createdAt).getTime();
          const onboardedTime = uData.onboardedAt.toDate ? uData.onboardedAt.toDate().getTime() : new Date(uData.onboardedAt).getTime();
          const diff = onboardedTime - createdTime;
          if (diff >= 0) {
            totalTimeDiffMs += diff;
            validUsersForTime++;
          }
        }
      });

      if (validUsersForTime > 0) {
        const avgMs = totalTimeDiffMs / validUsersForTime;
        const avgSeconds = Math.round(avgMs / 1000);
        
        if (avgSeconds < 60) {
          avgCompletionTimeStr = `${avgSeconds} seconds`;
        } else if (avgSeconds < 3600) {
          avgCompletionTimeStr = `${Math.round(avgSeconds / 60)} minutes`;
        } else if (avgSeconds < 86400) {
          avgCompletionTimeStr = `${(avgSeconds / 3600).toFixed(1)} hours`;
        } else {
          avgCompletionTimeStr = `${(avgSeconds / 86400).toFixed(1)} days`;
        }
      }

      setOnboarding({
        onboardedCount: onboardedVal,
        completionRate,
        avgCompletionTimeStr
      });

      // ────────────────────────────────────────────────────────
      // 3. ENGAGEMENT AGGREGATIONS
      // ────────────────────────────────────────────────────────
      const [
        totalViewsSnap,
        totalSavesSnap,
        totalRegsSnap,
        totalRecClicksSnap
      ] = await Promise.all([
        getCountFromServer(query(analyticsCol, where("action", "in", ["view", "recommendation_click"]))),
        getCountFromServer(query(analyticsCol, where("action", "in", ["save", "recommendation_save"]))),
        getCountFromServer(query(analyticsCol, where("action", "in", ["register", "recommendation_register"]))),
        getCountFromServer(query(analyticsCol, where("action", "==", "recommendation_click")))
      ]);

      const viewsCount = totalViewsSnap.data().count;
      const savesCount = totalSavesSnap.data().count;
      const regsCount = totalRegsSnap.data().count;
      const recClicksCount = totalRecClicksSnap.data().count;

      // Extract unique viewers in memory from view events
      const viewEventsQuery = query(analyticsCol, where("action", "in", ["view", "recommendation_click"]));
      const viewEventsSnap = await getDocs(viewEventsQuery);
      const uniqueViewerIds = new Set<string>();
      viewEventsSnap.forEach(docSnap => {
        uniqueViewerIds.add(docSnap.data().userId || "anonymous");
      });

      setEngagement({
        eventViews: viewsCount,
        uniqueViewers: uniqueViewerIds.size,
        saves: savesCount,
        registrations: regsCount,
        recommendationClicks: recClicksCount
      });

      // ────────────────────────────────────────────────────────
      // 4. CONVERSION FUNNEL METRICS
      // ────────────────────────────────────────────────────────
      setFunnel({
        viewToSaveRate: viewsCount > 0 ? (savesCount / viewsCount) * 100 : 0,
        saveToRegisterRate: savesCount > 0 ? (regsCount / savesCount) * 100 : 0,
        viewToRegisterRate: viewsCount > 0 ? (regsCount / viewsCount) * 100 : 0
      });

      // ────────────────────────────────────────────────────────
      // 5. RECOMMENDATIONS PERFORMANCE & SERVED STATS
      // ────────────────────────────────────────────────────────
      const [
        recSavesSnap,
        recRegsSnap,
        recsServedEventsSnap
      ] = await Promise.all([
        getCountFromServer(query(analyticsCol, where("action", "==", "recommendation_save"))),
        getCountFromServer(query(analyticsCol, where("action", "==", "recommendation_register"))),
        getDocs(query(analyticsCol, where("action", "==", "recommendations_served")))
      ]);

      const recSavesCount = recSavesSnap.data().count;
      const recRegsCount = recRegsSnap.data().count;

      // Sum recommendations served in-memory and tally recommended categories
      let totalRecommendationsServed = 0;
      const recommendedCategoryMap: Record<string, number> = {};

      recsServedEventsSnap.forEach(docSnap => {
        const data = docSnap.data();
        const evs = data.recommendedEvents || [];
        totalRecommendationsServed += evs.length;

        evs.forEach((ev: any) => {
          const cat = ev.category || "unknown";
          recommendedCategoryMap[cat] = (recommendedCategoryMap[cat] || 0) + 1;
        });
      });

      const topRecommendedCategories = Object.entries(recommendedCategoryMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Tally saved categories from bookmark events
      const savedEventsQuery = query(analyticsCol, where("action", "in", ["save", "recommendation_save"]));
      const savedEventsSnap = await getDocs(savedEventsQuery);
      const savedCategoryMap: Record<string, number> = {};
      savedEventsSnap.forEach(docSnap => {
        const cat = docSnap.data().category || "unknown";
        savedCategoryMap[cat] = (savedCategoryMap[cat] || 0) + 1;
      });

      const topSavedCategories = Object.entries(savedCategoryMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setRecommendationStats({
        servedCount: totalRecommendationsServed,
        clickCount: recClicksCount,
        saveCount: recSavesCount,
        registerCount: recRegsCount,
        ctr: totalRecommendationsServed > 0 ? (recClicksCount / totalRecommendationsServed) * 100 : 0,
        saveRate: totalRecommendationsServed > 0 ? (recSavesCount / totalRecommendationsServed) * 100 : 0,
        registerRate: totalRecommendationsServed > 0 ? (recRegsCount / totalRecommendationsServed) * 100 : 0,
        topRecommendedCategories,
        topSavedCategories
      });

      // ────────────────────────────────────────────────────────
      // 6. TOP CONTENT LEADERBOARDS (using event document fields)
      // ────────────────────────────────────────────────────────
      const [
        topViewedSnap,
        topSavedSnap,
        topRegisteredSnap
      ] = await Promise.all([
        getDocs(query(eventsCol, orderBy("viewsCount", "desc"), limit(5))),
        getDocs(query(eventsCol, orderBy("savesCount", "desc"), limit(5))),
        getDocs(query(eventsCol, orderBy("registrationsCount", "desc"), limit(5)))
      ]);

      const mapDocToTopEvent = (docSnap: any, countField: string): TopEvent => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || "Untitled",
          category: data.category || "unknown",
          organizer: data.organizer || "Unknown",
          city: data.city || "unknown",
          count: data[countField] || 0
        };
      };

      setTopContent({
        mostViewed: topViewedSnap.docs.map(doc => mapDocToTopEvent(doc, "viewsCount")),
        mostSaved: topSavedSnap.docs.map(doc => mapDocToTopEvent(doc, "savesCount")),
        mostRegistered: topRegisteredSnap.docs.map(doc => mapDocToTopEvent(doc, "registrationsCount"))
      });

    } catch (err) {
      console.error("Failed to fetch admin analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-kairo-primary min-h-screen text-kairo-white">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-kairo-dark-gray border border-kairo-gray shadow-md">
            <BarChart3 className="h-6 w-6 text-kairo-orange" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-kairo-white">
              Platform Analytics & Funnel
            </h1>
            <p className="text-sm text-kairo-light-gray font-semibold">
              Track acquisition, onboarding cycles, user engagement, and recommendation metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 border border-kairo-orange/20 hover:border-kairo-orange bg-kairo-dark-gray/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-kairo-white hover:text-kairo-orange transition-all cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>

          <Link
            href="/admin/observability"
            className="flex items-center gap-2 border border-kairo-gray hover:border-kairo-orange bg-kairo-dark-gray/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-kairo-light-gray hover:text-kairo-white transition-all"
          >
            <Activity className="w-3.5 h-3.5" />
            Crawler Telemetry
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-48 bg-kairo-dark-gray/20 border border-kairo-gray rounded-3xl">
          <RefreshCw className="w-10 h-10 animate-spin text-kairo-orange" />
          <p className="mt-4 text-kairo-light-gray font-bold tracking-widest text-xs uppercase">
            Calculating funnel aggregations...
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Row 1: KPI Grid for Acquisition & Onboarding */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Total Users */}
            <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 relative overflow-hidden group hover:border-kairo-orange/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-sky-400">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Total Users</p>
                  <p className="text-3xl font-black text-kairo-white">{acquisition.totalUsers}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-[10px] text-kairo-light-gray uppercase font-bold tracking-wider pt-3 border-t border-kairo-gray/30">
                <span>Today: +{acquisition.newUsersToday}</span>
                <span>This Week: +{acquisition.newUsersThisWeek}</span>
              </div>
            </div>

            {/* Users Onboarded */}
            <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 relative overflow-hidden group hover:border-kairo-orange/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Users Onboarded</p>
                  <p className="text-3xl font-black text-kairo-white">{onboarding.onboardedCount}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-[10px] text-kairo-light-gray uppercase font-bold tracking-wider pt-3 border-t border-kairo-gray/30">
                <span>Completion: {onboarding.completionRate.toFixed(1)}%</span>
                <span className="text-emerald-400 font-extrabold">Active</span>
              </div>
            </div>

            {/* Onboarding Cycle Time */}
            <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 relative overflow-hidden group hover:border-kairo-orange/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-amber-400">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Avg Cycle Time</p>
                  <p className="text-2xl font-black text-kairo-white">{onboarding.avgCompletionTimeStr}</p>
                </div>
              </div>
              <div className="mt-4 text-[10px] text-kairo-light-gray uppercase font-bold tracking-wider pt-3 border-t border-kairo-gray/30">
                <span>Time from registration to setup</span>
              </div>
            </div>

            {/* Recommendation CTR */}
            <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 relative overflow-hidden group hover:border-kairo-orange/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-kairo-orange">
                  <Brain className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Recommendation CTR</p>
                  <p className="text-3xl font-black text-kairo-orange">{recommendationStats.ctr.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-[10px] text-kairo-light-gray uppercase font-bold tracking-wider pt-3 border-t border-kairo-gray/30">
                <span>Clicks: {recommendationStats.clickCount}</span>
                <span>Served: {recommendationStats.servedCount}</span>
              </div>
            </div>

          </div>

          {/* Row 2: Split columns - Conversion Funnel & OAuth Provider Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Conversion Funnel Widget */}
            <div className="rounded-3xl border border-kairo-gray bg-kairo-dark-gray/50 p-6 backdrop-blur-md lg:col-span-2">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-kairo-gray/60">
                <Filter className="w-5 h-5 text-kairo-orange" />
                <h3 className="font-extrabold text-lg text-kairo-white">Platform Conversion Funnel</h3>
              </div>
              
              <div className="space-y-6">
                
                {/* Views */}
                <div className="relative">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-bold uppercase tracking-wider text-kairo-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                      1. Event Views
                    </span>
                    <span className="font-black text-kairo-white">{engagement.eventViews} views</span>
                  </div>
                  <div className="h-4 w-full bg-kairo-primary border border-kairo-gray/30 overflow-hidden">
                    <div className="h-full bg-sky-500 w-full" />
                  </div>
                </div>

                {/* Saves */}
                <div className="relative">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-bold uppercase tracking-wider text-kairo-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-kairo-orange"></span>
                      2. Saved Bookmarks
                    </span>
                    <span className="font-black text-kairo-white">{engagement.saves} saves ({funnel.viewToSaveRate.toFixed(1)}% of views)</span>
                  </div>
                  <div className="h-4 w-full bg-kairo-primary border border-kairo-gray/30 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 to-kairo-orange transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(1, funnel.viewToSaveRate))}%` }}
                    />
                  </div>
                </div>

                {/* Registrations */}
                <div className="relative">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-bold uppercase tracking-wider text-kairo-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      3. Event Registrations
                    </span>
                    <span className="font-black text-kairo-white">{engagement.registrations} registers ({funnel.viewToRegisterRate.toFixed(1)}% total)</span>
                  </div>
                  <div className="h-4 w-full bg-kairo-primary border border-kairo-gray/30 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-kairo-orange to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(1, funnel.viewToRegisterRate))}%` }}
                    />
                  </div>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-kairo-gray/30 flex justify-around text-xs text-kairo-light-gray font-bold uppercase tracking-wider">
                <div className="text-center">
                  <p className="text-sky-400">View → Save</p>
                  <p className="text-base text-kairo-white mt-0.5">{funnel.viewToSaveRate.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-kairo-orange">Save → Register</p>
                  <p className="text-base text-kairo-white mt-0.5">{funnel.saveToRegisterRate.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-emerald-400">View → Register</p>
                  <p className="text-base text-kairo-white mt-0.5">{funnel.viewToRegisterRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* OAuth Provider Breakdown */}
            <div className="rounded-3xl border border-kairo-gray bg-kairo-dark-gray/50 p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-kairo-gray/60">
                  <GitBranch className="w-5 h-5 text-sky-400" />
                  <h3 className="font-extrabold text-lg text-kairo-white">OAuth Providers</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: "Google Authentication", count: acquisition.providers.google, percent: acquisition.totalUsers > 0 ? (acquisition.providers.google / acquisition.totalUsers) * 100 : 0, colorClass: "bg-red-500" },
                    { label: "GitHub Authentication", count: acquisition.providers.github, percent: acquisition.totalUsers > 0 ? (acquisition.providers.github / acquisition.totalUsers) * 100 : 0, colorClass: "bg-kairo-orange" },
                    { label: "Email / Password", count: acquisition.providers.password, percent: acquisition.totalUsers > 0 ? (acquisition.providers.password / acquisition.totalUsers) * 100 : 0, colorClass: "bg-sky-500" },
                    { label: "Guest / Anonymous", count: acquisition.providers.other, percent: acquisition.totalUsers > 0 ? (acquisition.providers.other / acquisition.totalUsers) * 100 : 0, colorClass: "bg-kairo-gray" }
                  ].map(provider => (
                    <div key={provider.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold uppercase text-kairo-light-gray">
                        <span>{provider.label}</span>
                        <span className="text-kairo-white">{provider.count} ({provider.percent.toFixed(0)}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-kairo-primary overflow-hidden border border-kairo-gray/10">
                        <div className={cn("h-full", provider.colorClass)} style={{ width: `${provider.percent}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-center uppercase tracking-widest text-kairo-light-gray/40 mt-6 pt-3 border-t border-kairo-gray/30 font-bold">
                OAuth providers resolved from login sessions
              </p>
            </div>

          </div>

          {/* Row 3: Recommendations Performance & Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recommendations Detailed Metrics */}
            <div className="rounded-3xl border border-kairo-gray bg-kairo-dark-gray/50 p-6 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-kairo-gray/60">
                <Brain className="w-5 h-5 text-kairo-orange" />
                <h3 className="font-extrabold text-lg text-kairo-white">AI Recommendation Funnel</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-kairo-primary/40 border border-kairo-gray/50 p-4 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-kairo-light-gray uppercase tracking-wider">Served</p>
                  <p className="text-xl font-black text-kairo-white mt-1">{recommendationStats.servedCount}</p>
                </div>
                <div className="bg-kairo-primary/40 border border-kairo-gray/50 p-4 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-kairo-light-gray uppercase tracking-wider">Clicks</p>
                  <p className="text-xl font-black text-kairo-orange mt-1">{recommendationStats.clickCount}</p>
                </div>
                <div className="bg-kairo-primary/40 border border-kairo-gray/50 p-4 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-kairo-light-gray uppercase tracking-wider">Registers</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{recommendationStats.registerCount}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* CTR */}
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase text-kairo-light-gray mb-1">
                    <span>Click-Through Rate (CTR)</span>
                    <span className="text-kairo-orange">{recommendationStats.ctr.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-kairo-primary overflow-hidden border border-kairo-gray/10">
                    <div className="h-full bg-kairo-orange" style={{ width: `${Math.min(100, recommendationStats.ctr)}%` }}></div>
                  </div>
                </div>

                {/* Save Rate */}
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase text-kairo-light-gray mb-1">
                    <span>Recommendation Save Rate</span>
                    <span className="text-rose-400">{recommendationStats.saveRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-kairo-primary overflow-hidden border border-kairo-gray/10">
                    <div className="h-full bg-rose-400" style={{ width: `${Math.min(100, recommendationStats.saveRate)}%` }}></div>
                  </div>
                </div>

                {/* Registration Rate */}
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase text-kairo-light-gray mb-1">
                    <span>Recommendation Register Rate</span>
                    <span className="text-emerald-400">{recommendationStats.registerRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-kairo-primary overflow-hidden border border-kairo-gray/10">
                    <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, recommendationStats.registerRate)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation Category Distribution */}
            <div className="rounded-3xl border border-kairo-gray bg-kairo-dark-gray/50 p-6 backdrop-blur-md grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Most Recommended Categories */}
              <div>
                <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-kairo-gray/30 text-xs font-bold uppercase tracking-wider text-kairo-light-gray">
                  <Compass className="w-4 h-4 text-kairo-orange" />
                  <span>Served Categories</span>
                </div>
                <div className="space-y-3">
                  {recommendationStats.topRecommendedCategories.length > 0 ? (
                    recommendationStats.topRecommendedCategories.map((c, idx) => (
                      <div key={c.category} className="flex justify-between text-xs items-center">
                        <span className="capitalize font-semibold text-kairo-white flex gap-1.5">
                          <span className="text-kairo-light-gray/40">#{idx + 1}</span>
                          {c.category}
                        </span>
                        <span className="text-kairo-light-gray font-bold font-mono">{c.count} items</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-kairo-light-gray/50 py-4">No categories recommended yet.</p>
                  )}
                </div>
              </div>

              {/* Most Saved Categories */}
              <div>
                <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-kairo-gray/30 text-xs font-bold uppercase tracking-wider text-kairo-light-gray">
                  <Bookmark className="w-4 h-4 text-sky-400" />
                  <span>Saved Categories</span>
                </div>
                <div className="space-y-3">
                  {recommendationStats.topSavedCategories.length > 0 ? (
                    recommendationStats.topSavedCategories.map((c, idx) => (
                      <div key={c.category} className="flex justify-between text-xs items-center">
                        <span className="capitalize font-semibold text-kairo-white flex gap-1.5">
                          <span className="text-kairo-light-gray/40">#{idx + 1}</span>
                          {c.category}
                        </span>
                        <span className="text-kairo-light-gray font-bold font-mono">{c.count} saves</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-kairo-light-gray/50 py-4">No categories bookmarked yet.</p>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Row 4: Top Content Leaderboards (from Event Document Fields) */}
          <div className="rounded-3xl border border-kairo-gray bg-kairo-dark-gray/50 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-kairo-gray/60">
              <Award className="w-5 h-5 text-kairo-orange" />
              <h3 className="font-extrabold text-lg text-kairo-white">Platform Content Leaderboard</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Most Viewed */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-sky-400 flex items-center gap-1.5 mb-3">
                  <Eye className="w-3.5 h-3.5" /> Most Viewed Events
                </h4>
                <div className="divide-y divide-kairo-gray/20">
                  {topContent.mostViewed.map((item, idx) => (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <span className="text-kairo-light-gray/30 font-black mt-0.5 font-mono">#{idx+1}</span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/events/${item.id}`} className="font-bold text-kairo-white hover:text-kairo-orange transition-colors line-clamp-1">
                          {item.title}
                        </Link>
                        <p className="text-[10px] text-kairo-light-gray/50 capitalize mt-0.5">{item.category} • {item.city}</p>
                      </div>
                      <span className="font-black text-kairo-white shrink-0 font-mono bg-kairo-primary border border-kairo-gray/30 px-2 py-0.5">{item.count} views</span>
                    </div>
                  ))}
                  {topContent.mostViewed.length === 0 && (
                    <p className="text-xs text-kairo-light-gray/50 text-center py-6">No view stats recorded.</p>
                  )}
                </div>
              </div>

              {/* Most Saved */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5 mb-3">
                  <Bookmark className="w-3.5 h-3.5" /> Most Saved Events
                </h4>
                <div className="divide-y divide-kairo-gray/20">
                  {topContent.mostSaved.map((item, idx) => (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <span className="text-kairo-light-gray/30 font-black mt-0.5 font-mono">#{idx+1}</span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/events/${item.id}`} className="font-bold text-kairo-white hover:text-kairo-orange transition-colors line-clamp-1">
                          {item.title}
                        </Link>
                        <p className="text-[10px] text-kairo-light-gray/50 capitalize mt-0.5">{item.category} • {item.city}</p>
                      </div>
                      <span className="font-black text-kairo-white shrink-0 font-mono bg-kairo-primary border border-kairo-gray/30 px-2 py-0.5">{item.count} saves</span>
                    </div>
                  ))}
                  {topContent.mostSaved.length === 0 && (
                    <p className="text-xs text-kairo-light-gray/50 text-center py-6">No save stats recorded.</p>
                  )}
                </div>
              </div>

              {/* Most Registered */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 mb-3">
                  <Zap className="w-3.5 h-3.5" /> Most Registered Events
                </h4>
                <div className="divide-y divide-kairo-gray/20">
                  {topContent.mostRegistered.map((item, idx) => (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <span className="text-kairo-light-gray/30 font-black mt-0.5 font-mono">#{idx+1}</span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/events/${item.id}`} className="font-bold text-kairo-white hover:text-kairo-orange transition-colors line-clamp-1">
                          {item.title}
                        </Link>
                        <p className="text-[10px] text-kairo-light-gray/50 capitalize mt-0.5">{item.category} • {item.city}</p>
                      </div>
                      <span className="font-black text-kairo-white shrink-0 font-mono bg-kairo-primary border border-kairo-gray/30 px-2 py-0.5">{item.count} signups</span>
                    </div>
                  ))}
                  {topContent.mostRegistered.length === 0 && (
                    <p className="text-xs text-kairo-light-gray/50 text-center py-6">No registration stats recorded.</p>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
