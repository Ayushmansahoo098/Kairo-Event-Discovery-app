"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  Trash2, 
  AlertTriangle,
  ArrowRight
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
  details?: Record<string, any>;
}

export default function ObservabilityDashboard() {
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Compute Aggregates
  const totalSyncs = logs.reduce((acc, log) => acc + (log.successCount || 0), 0);
  const totalCleanups = logs.reduce((acc, log) => acc + (log.cleanupCount || 0), 0);
  const averageDuration = logs.length > 0 
    ? Math.round(logs.reduce((acc, log) => acc + (log.duration || 0), 0) / logs.length) 
    : 0;

  const successfulRuns = logs.filter(log => log.status === "success" || log.status === "partial_success").length;
  const uptimePercentage = logs.length > 0 
    ? Math.round((successfulRuns / logs.length) * 100) 
    : 100;

  // Source-wise status lookup
  const getLatestSourceStatus = (source: string) => {
    const sourceLogs = logs.filter(log => 
      log.source === source || 
      (log.source === "Unified Sync All" && log.details?.[source])
    );
    if (sourceLogs.length === 0) return { status: "unknown", lastSync: "Never" };
    
    const latest = sourceLogs[0];
    let status = latest.status;
    
    if (latest.source === "Unified Sync All" && latest.details?.[source]) {
      status = latest.details[source].success ? "success" : "failed";
    }

    return {
      status,
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
    { name: "Unstop", label: "Unstop Scraper" },
    { name: "HackerEarth", label: "HackerEarth Scraper" },
    { name: "Eventbrite", label: "Eventbrite API" },
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
              System Observability
            </h1>
            <p className="text-sm text-kairo-light-gray font-semibold">
              Live database ingestion and Playwright crawler telemetry
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

      {loading ? (
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
                <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">System Uptime</p>
                <p className="text-2xl font-black text-kairo-white">{uptimePercentage}%</p>
              </div>
            </div>

            {/* Sweep Cleanups */}
            <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-kairo-grad-2">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-kairo-light-gray uppercase tracking-widest">Stale Prunes</p>
                <p className="text-2xl font-black text-kairo-white">{totalCleanups}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kairo-primary border border-kairo-gray text-kairo-grad-4">
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
                const isOnline = health.status === "success" || health.status === "partial_success";
                
                return (
                  <div key={src.name} className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray/50 backdrop-blur-md p-6 relative overflow-hidden group hover:border-kairo-orange/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-transparent to-kairo-orange/20"></div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-extrabold text-kairo-white">{src.label}</h3>
                        <p className="text-xs text-kairo-light-gray font-semibold mt-1">
                          Last sync: {health.lastSync === "Never" ? "Never" : `${health.date} @ ${health.lastSync}`}
                        </p>
                      </div>
                      
                      <span className={cn(
                        "h-3 w-3 rounded-full flex shrink-0 mt-1",
                        isOnline 
                          ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" 
                          : health.status === "failed"
                            ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                            : "bg-kairo-gray"
                      )}></span>
                    </div>

                    <div className="flex items-center gap-2 mt-4 text-[10px] uppercase font-black tracking-widest text-kairo-light-gray border-t border-kairo-gray pt-4">
                      <span>Status:</span>
                      <span className={cn(
                        "font-extrabold",
                        isOnline ? "text-emerald-400" : health.status === "failed" ? "text-rose-500" : "text-kairo-light-gray"
                      )}>
                        {health.status === "success" ? "Healthy" : health.status === "failed" ? "Offline/Error" : "Unknown"}
                      </span>
                    </div>
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
                    const isFailed = log.status === "failed";
                    
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
      )}
    </div>
  );
}
