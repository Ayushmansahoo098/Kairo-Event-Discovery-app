"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/auth-context";
import { useBookmarkContext } from "@/context/bookmark-context";
import {
  LogOut, Ticket, Heart, Clock, ChevronRight, MapPin, Bell,
  Calendar, Share2, Star, Shield, Edit3, Loader2, CheckCircle2,
  X, User, FileText, Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getEvents } from "@/lib/mock-data";
import { Event } from "@/lib/types";
import Link from "next/link";

/* ── Geo helpers (unchanged) ─────────────────────────────────────── */
const CITIES = ["Bangalore", "Hyderabad", "Mumbai", "Delhi", "Chennai", "Pune", "Kolkata", "Ahmedabad"];
const INTERESTS_LIST = ["AI", "Hackathons", "Startups", "Meetups", "Concerts", "Workshops", "Gaming", "Festivals"];

/* ── Sub-components ──────────────────────────────────────────────── */
function SectionCard({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-kairo-dark-gray/30 border border-kairo-orange/10 overflow-hidden"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-kairo-orange/10 bg-kairo-dark-gray/50">
        <Icon className="w-4 h-4 text-kairo-orange shrink-0" />
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-kairo-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

function RowItem({
  icon: Icon,
  label,
  sublabel,
  onClick,
  href,
  danger = false,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  badge?: string | number;
}) {
  const cls = cn(
    "w-full flex items-center gap-4 py-3.5 px-1 border-b border-kairo-orange/5 last:border-0 transition-all duration-200 group cursor-pointer",
    danger
      ? "hover:text-red-400"
      : "hover:text-kairo-orange"
  );

  const inner = (
    <>
      <div className={cn("w-8 h-8 flex items-center justify-center border border-kairo-orange/10 shrink-0 transition-colors duration-200",
        danger ? "group-hover:border-red-400/30" : "group-hover:border-kairo-orange/30")}>
        <Icon className={cn("w-4 h-4 transition-colors duration-200",
          danger ? "text-red-400/60 group-hover:text-red-400" : "text-kairo-light-gray group-hover:text-kairo-orange")} />
      </div>
      <div className="flex-1 text-left">
        <p className={cn("text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-200",
          danger ? "text-red-400/80 group-hover:text-red-400" : "text-kairo-white/80 group-hover:text-kairo-white")}>{label}</p>
        {sublabel && <p className="text-[10px] text-kairo-light-gray/50 mt-0.5 tracking-wide">{sublabel}</p>}
      </div>
      {badge !== undefined && (
        <span className="text-[10px] font-bold tracking-wider bg-kairo-orange/10 text-kairo-orange border border-kairo-orange/20 px-2.5 py-0.5 shrink-0">
          {badge}
        </span>
      )}
      {!danger && <ChevronRight className="w-3.5 h-3.5 text-kairo-light-gray/30 group-hover:text-kairo-orange transition-all duration-200 group-hover:translate-x-0.5 shrink-0" />}
    </>
  );

  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <button onClick={onClick} className={cls}>{inner}</button>;
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  sublabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-kairo-orange/5 last:border-0">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-kairo-white/80">{label}</p>
        {sublabel && <p className="text-[10px] text-kairo-light-gray/50 mt-0.5">{sublabel}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 transition-colors duration-300 border shrink-0",
          checked ? "bg-kairo-orange border-kairo-orange" : "bg-kairo-dark-gray border-kairo-gray/40"
        )}
      >
        <span className={cn(
          "absolute top-0.5 w-5 h-5 bg-kairo-primary transition-all duration-300",
          checked ? "left-[22px]" : "left-0.5"
        )} />
      </button>
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer",
        selected
          ? "bg-kairo-orange text-kairo-primary border border-kairo-orange"
          : "bg-transparent border border-kairo-gray/30 text-kairo-light-gray hover:border-kairo-orange/50 hover:text-kairo-white"
      )}
    >
      {label}
    </button>
  );
}

/* ── Star Rating Modal ──────────────────────────────────────────── */
function RateModal({ onClose }: { onClose: () => void }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === 0) return;
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-kairo-primary/80 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-kairo-primary border border-kairo-orange/20 p-8 w-full max-w-sm text-center"
      >
        {submitted ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-kairo-orange mx-auto mb-4" />
            <p className="font-serif text-2xl text-kairo-white uppercase tracking-widest">Thank You!</p>
            <p className="text-xs text-kairo-light-gray mt-2 tracking-wide">Your feedback means everything to us.</p>
          </>
        ) : (
          <>
            <button onClick={onClose} className="absolute top-4 right-4 text-kairo-light-gray hover:text-kairo-white"><X className="w-4 h-4" /></button>
            <Star className="w-8 h-8 text-kairo-orange mx-auto mb-4" />
            <p className="font-serif text-2xl text-kairo-white uppercase tracking-widest mb-2">Rate Kairo</p>
            <p className="text-xs text-kairo-light-gray tracking-wide mb-6">How would you rate your experience?</p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer transition-transform duration-150 hover:scale-110"
                >
                  <Star className={cn("w-8 h-8 transition-colors duration-150",
                    s <= (hovered || selected) ? "text-kairo-orange fill-kairo-orange" : "text-kairo-gray/40")} />
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={selected === 0}
              className="w-full py-3 bg-kairo-orange text-kairo-primary text-xs font-bold uppercase tracking-[0.3em] disabled:opacity-40 transition-opacity"
            >
              Submit Rating
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Edit Profile Modal ─────────────────────────────────────────── */
function EditProfileModal({
  user,
  currentCity,
  onClose,
  onSave,
}: {
  user: { name: string; email: string; avatar: string };
  currentCity: string;
  onClose: () => void;
  onSave: (name: string, city: string) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [city, setCity] = useState(currentCity);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(name.trim() || user.name, city);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-kairo-primary/80 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-kairo-primary border border-kairo-orange/20 p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-xl text-kairo-white uppercase tracking-widest">Edit Profile</h3>
          <button onClick={onClose} className="text-kairo-light-gray hover:text-kairo-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-kairo-light-gray/60 mb-2">Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-kairo-dark-gray/50 border border-kairo-gray/30 focus:border-kairo-orange px-4 py-3 text-sm text-kairo-white placeholder-kairo-gray/40 outline-none transition-colors tracking-wide"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-kairo-light-gray/60 mb-2">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-kairo-dark-gray/50 border border-kairo-gray/30 focus:border-kairo-orange px-4 py-3 text-sm text-kairo-white outline-none transition-colors tracking-wide appearance-none cursor-pointer"
            >
              <option value="">Select city...</option>
              {CITIES.map((c) => (
                <option key={c} value={c} className="bg-kairo-primary">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-kairo-light-gray/60 mb-2">Email</label>
            <input
              value={user.email}
              disabled
              className="w-full bg-kairo-dark-gray/20 border border-kairo-gray/20 px-4 py-3 text-sm text-kairo-light-gray/50 tracking-wide cursor-not-allowed"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full py-4 bg-kairo-orange text-kairo-primary text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── Calendar Sync Modal ─────────────────────────────────────────── */
function CalendarModal({ bookmarkCount, onClose }: { bookmarkCount: number; onClose: () => void }) {
  const handleGoogleSync = () => {
    // Open Google Calendar to add KAIRO as a reminder
    const url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=KAIRO+Event+Reminder&details=Check+your+saved+events+on+Kairo&location=localhost:3000/saved`;
    window.open(url, "_blank");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-kairo-primary/80 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-kairo-primary border border-kairo-orange/20 p-8 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-xl text-kairo-white uppercase tracking-widest">Calendar Sync</h3>
          <button onClick={onClose} className="text-kairo-light-gray hover:text-kairo-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-kairo-light-gray/70 leading-relaxed mb-6 tracking-wide">
          You have <span className="text-kairo-orange font-bold">{bookmarkCount} saved events</span>. Sync them to your calendar to never miss a deadline.
        </p>
        <button
          onClick={handleGoogleSync}
          className="w-full py-4 bg-kairo-orange text-kairo-primary text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 mb-3 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          Open Google Calendar
        </button>
        <p className="text-[10px] text-center text-kairo-light-gray/40 tracking-wide">More calendar integrations coming soon</p>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, logout, isLoading } = useAuthContext();
  const { bookmarks } = useBookmarkContext();
  const router = useRouter();

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [userCity, setUserCity] = useState("");

  // Preferences state
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Recent events state
  const [recentlyViewed, setRecentlyViewed] = useState<Event[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  // Load user data from Firestore
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.name);
    const fetchPrefs = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPreferredCities(data.preferredCities || []);
          setInterests(data.interests || []);
          setEmailNotif(data.notificationPreferences?.email ?? true);
          setPushNotif(data.notificationPreferences?.push ?? true);
          if (data.lastLocation?.city) setUserCity(data.lastLocation.city);
          if (data.city) setUserCity(data.city);
        }
      } catch (err) {
        console.error("Failed to load prefs:", err);
      }
    };
    fetchPrefs();
  }, [user]);

  // Load recently viewed from localStorage
  useEffect(() => {
    const fetch = async () => {
      const raw = localStorage.getItem("kairo-recently-viewed");
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (ids.length > 0) {
        const all = await getEvents();
        const items = ids.map((id) => all.find((e) => e.id === id)).filter(Boolean) as Event[];
        setRecentlyViewed(items);
      }
    };
    fetch();
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-kairo-orange" />
      </div>
    );
  }

  const name = displayName || user.name;

  // Edit profile → save to Firestore
  const handleEditSave = async (newName: string, newCity: string) => {
    try {
      await updateDoc(doc(db, "users", user.id), { name: newName, city: newCity });
      setDisplayName(newName);
      setUserCity(newCity);
    } catch (err) {
      console.error("Edit profile error:", err);
    }
  };

  // Save preferences to Firestore
  const handleSavePrefs = async () => {
    setIsSavingPrefs(true);
    try {
      await updateDoc(doc(db, "users", user.id), {
        preferredCities,
        interests,
        notificationPreferences: { email: emailNotif, push: pushNotif },
      });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2500);
    } catch (err) {
      console.error("Save prefs error:", err);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Share KAIRO
  const handleShare = async () => {
    const shareData = {
      title: "Kairo — Event Discovery",
      text: "Discover underground concerts, hackathons, and exclusive tech events near you.",
      url: "https://kairo.app",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      }
    } catch {
      // user cancelled
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Avatar initials fallback
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pb-24">

      {/* ── Profile Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative border border-kairo-orange/10 bg-kairo-dark-gray/30 overflow-hidden mb-8"
      >
        {/* Gold gradient banner */}
        <div className="h-28 w-full bg-gradient-to-r from-kairo-primary via-kairo-orange/20 to-kairo-primary" />

        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="absolute -top-14 left-6 w-28 h-28 border-2 border-kairo-orange/40 bg-kairo-primary overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-3xl text-kairo-orange font-light">{initials}</span>
            )}
          </div>

          {/* Edit button */}
          <div className="flex justify-end pt-3">
            <button
              onClick={() => setShowEditProfile(true)}
              className="inline-flex items-center gap-2 border border-kairo-orange/20 bg-transparent hover:border-kairo-orange hover:text-kairo-orange px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-kairo-light-gray transition-all duration-300 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              Edit Profile
            </button>
          </div>

          <div className="mt-6">
            <h1 className="font-serif text-3xl font-light tracking-[0.12em] uppercase text-kairo-white">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {userCity && (
                <span className="flex items-center gap-1.5 text-[11px] text-kairo-light-gray/70 tracking-wide">
                  <MapPin className="w-3 h-3 text-kairo-orange/60" /> {userCity}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[11px] text-kairo-light-gray/70 tracking-wide">
                <span className="text-kairo-orange/60">@</span> {user.email}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4 Cards Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Card 1: My Events ───────────────────────────────────── */}
        <SectionCard title="My Events" icon={Ticket} delay={0.05}>
          <RowItem
            icon={Heart}
            label="Saved Events"
            sublabel="Events you bookmarked"
            href="/saved"
            badge={bookmarks.length}
          />
          <RowItem
            icon={Ticket}
            label="Registered Events"
            sublabel="Events you signed up for"
            onClick={() => {}}
            badge={3}
          />
          <RowItem
            icon={Clock}
            label="Recently Viewed"
            sublabel={recentlyViewed.length > 0 ? `${recentlyViewed.length} events` : "None yet"}
            onClick={() => setShowRecent((v) => !v)}
          />

          {/* Recently viewed inline expand */}
          <AnimatePresence>
            {showRecent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-kairo-orange/10 space-y-2">
                  {recentlyViewed.length > 0 ? (
                    recentlyViewed.slice(0, 4).map((ev) => (
                      <Link
                        key={ev.id}
                        href={`/event/${ev.id}`}
                        className="flex items-center gap-3 p-2 hover:bg-kairo-orange/5 transition-colors group"
                      >
                        <div className="w-8 h-8 bg-kairo-dark-gray border border-kairo-orange/10 shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ev.bannerImage} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-kairo-white font-bold truncate tracking-wide group-hover:text-kairo-orange transition-colors">{ev.title}</p>
                          <p className="text-[10px] text-kairo-light-gray/50">{ev.city}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-[11px] text-kairo-light-gray/40 tracking-wide py-2">No recently viewed events yet.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SectionCard>

        {/* ── Card 2: Preferences ─────────────────────────────────── */}
        <SectionCard title="Preferences" icon={Settings} delay={0.1}>
          {/* Preferred Cities */}
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-kairo-light-gray/50 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Preferred Cities
            </p>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <Chip key={c} label={c} selected={preferredCities.includes(c)}
                  onClick={() => setPreferredCities((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])} />
              ))}
            </div>
            {preferredCities.length > 0 && (
              <p className="text-[10px] text-kairo-orange/60 mt-2 tracking-wide">{preferredCities.join(", ")}</p>
            )}
          </div>

          {/* Interests */}
          <div className="mb-5 pt-4 border-t border-kairo-orange/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-kairo-light-gray/50 mb-3 flex items-center gap-1.5">
              🎯 Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS_LIST.map((i) => (
                <Chip key={i} label={i}
                  selected={interests.some((x) => x.toLowerCase() === i.toLowerCase())}
                  onClick={() => setInterests((p) => p.some((x) => x.toLowerCase() === i.toLowerCase())
                    ? p.filter((x) => x.toLowerCase() !== i.toLowerCase())
                    : [...p, i.toLowerCase()])} />
              ))}
            </div>
            {interests.length > 0 && (
              <p className="text-[10px] text-kairo-orange/60 mt-2 tracking-wide capitalize">{interests.join(", ")}</p>
            )}
          </div>

          {/* Notifications */}
          <div className="pt-4 border-t border-kairo-orange/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-kairo-light-gray/50 mb-3 flex items-center gap-1.5">
              <Bell className="w-3 h-3" /> Notifications
            </p>
            <ToggleSwitch checked={emailNotif} onChange={setEmailNotif} label="Email Alerts" sublabel="Registration deadlines & new events" />
            <ToggleSwitch checked={pushNotif} onChange={setPushNotif} label="Push Notifications" sublabel="Browser notifications for saved events" />
          </div>

          {/* Save button */}
          <button
            onClick={handleSavePrefs}
            disabled={isSavingPrefs}
            className="mt-5 w-full py-3 bg-kairo-orange text-kairo-primary text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all"
          >
            {isSavingPrefs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
              prefsSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
            {isSavingPrefs ? "Saving..." : prefsSaved ? "Saved!" : "Save Preferences"}
          </button>
        </SectionCard>

        {/* ── Card 3: Tools ───────────────────────────────────────── */}
        <SectionCard title="Tools" icon={Calendar} delay={0.15}>
          <RowItem
            icon={Calendar}
            label="Calendar Sync"
            sublabel="Add saved events to your calendar"
            onClick={() => setShowCalendar(true)}
          />
          <RowItem
            icon={Share2}
            label="Share KAIRO"
            sublabel="Invite friends to the enclave"
            onClick={handleShare}
          />
          <RowItem
            icon={Star}
            label="Rate App"
            sublabel="Tell us what you think"
            onClick={() => setShowRate(true)}
          />
        </SectionCard>

        {/* ── Card 4: Account ─────────────────────────────────────── */}
        <SectionCard title="Account" icon={User} delay={0.2}>
          <RowItem
            icon={Settings}
            label="Settings"
            sublabel="App settings & preferences"
            onClick={() => setShowEditProfile(true)}
          />
          <RowItem
            icon={FileText}
            label="Privacy Policy"
            sublabel="How we handle your data"
            onClick={() => window.open("https://kairo.app/privacy", "_blank")}
          />
          <RowItem
            icon={Shield}
            label="Terms of Service"
            sublabel="Usage terms & conditions"
            onClick={() => window.open("https://kairo.app/terms", "_blank")}
          />
          <RowItem
            icon={LogOut}
            label="Logout"
            sublabel="Sign out of your account"
            onClick={handleLogout}
            danger
          />
        </SectionCard>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditProfile && (
          <EditProfileModal
            user={user}
            currentCity={userCity}
            onClose={() => setShowEditProfile(false)}
            onSave={handleEditSave}
          />
        )}
        {showRate && <RateModal onClose={() => setShowRate(false)} />}
        {showCalendar && (
          <CalendarModal bookmarkCount={bookmarks.length} onClose={() => setShowCalendar(false)} />
        )}
      </AnimatePresence>

      {/* Share toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-kairo-dark-gray border border-kairo-orange/30 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-kairo-orange flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
