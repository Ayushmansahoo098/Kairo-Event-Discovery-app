"use client";

import { useAuthContext } from "@/context/auth-context";
import { getRecommendationApiBase } from "@/lib/api-config";
import { useBookmarkContext } from "@/context/bookmark-context";
import { db, storage } from "@/lib/firebase";
import { getEvents } from "@/lib/mock-data";
import { Event } from "@/lib/types";
import { cn } from "@/lib/utils";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bell,
    Calendar,
    Camera,
    CheckCircle2,
    ChevronRight,
    Clock,
    Edit3,
    FileText,
    Heart,
    Loader2,
    LogOut,
    MapPin,
    Settings,
    Share2,
    Shield,
    Star,
    Ticket,
    User,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* ── Geo helpers (unchanged) ─────────────────────────────────────── */
const CITIES = ["Bangalore", "Hyderabad", "Mumbai", "Delhi", "Chennai", "Pune", "Kolkata", "Ahmedabad"];
const INTERESTS_LIST = ["AI", "Hackathons", "Startups", "Meetups", "Concerts", "Workshops", "Gaming", "Festivals"];

/* ── Sub-components ──────────────────────────────────────────────── */
function BentoCard({
  title,
  icon: Icon,
  children,
  delay = 0,
  className,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex flex-col bg-kairo-white/[0.02] border border-kairo-white/[0.05] rounded-3xl overflow-hidden backdrop-blur-md group hover:bg-kairo-white/[0.04] transition-colors duration-500",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="flex items-center gap-3 px-6 py-5 border-b border-kairo-white/[0.05]">
        <div className="w-8 h-8 rounded-full bg-kairo-white/[0.05] flex items-center justify-center">
          <Icon className="w-4 h-4 text-kairo-orange" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-kairo-white">{title}</h2>
      </div>
      <div className="p-6 flex-1 flex flex-col">{children}</div>
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
  const cls = "w-full flex items-center gap-4 py-4 px-3 -mx-3 rounded-2xl transition-all duration-300 group cursor-pointer relative overflow-hidden";

  const inner = (
    <>
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        danger ? "bg-red-500/10" : "bg-kairo-white/5"
      )} />
      
      <div className={cn(
        "relative w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-all duration-300",
        danger ? "bg-red-500/10 group-hover:bg-red-500/20" : "bg-kairo-white/5 group-hover:bg-kairo-orange/10"
      )}>
        <Icon className={cn(
          "w-5 h-5 transition-colors duration-300",
          danger ? "text-red-400" : "text-kairo-light-gray group-hover:text-kairo-orange"
        )} />
      </div>

      <div className="relative flex-1 text-left">
        <p className={cn(
          "text-sm font-bold tracking-wide transition-colors duration-300",
          danger ? "text-red-400" : "text-kairo-white"
        )}>
          {label}
        </p>
        {sublabel && <p className="text-xs text-kairo-light-gray/60 mt-0.5">{sublabel}</p>}
      </div>

      {badge !== undefined && (
        <span className="relative text-xs font-bold bg-kairo-orange/20 text-kairo-orange px-3 py-1 rounded-full shrink-0">
          {badge}
        </span>
      )}
      
      {!danger && (
        <div className="relative w-6 h-6 flex items-center justify-center rounded-full bg-kairo-white/5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0">
          <ChevronRight className="w-3.5 h-3.5 text-kairo-orange" />
        </div>
      )}
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
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-sm font-bold tracking-wide text-kairo-white">{label}</p>
        {sublabel && <p className="text-xs text-kairo-light-gray/60 mt-0.5">{sublabel}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0",
          checked ? "bg-kairo-orange" : "bg-kairo-white/10"
        )}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "absolute top-1 w-5 h-5 rounded-full shadow-md bg-kairo-primary",
            checked ? "left-[26px]" : "left-1"
          )}
        />
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
        "relative px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 outline-none shrink-0",
        selected ? "text-kairo-primary" : "text-kairo-light-gray hover:text-kairo-white"
      )}
    >
      {selected ? (
        <motion.div
          layoutId={`chip-${label}`}
          className="absolute inset-0 bg-kairo-orange rounded-full shadow-[0_0_15px_rgba(184,168,138,0.4)]"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      ) : (
        <div className="absolute inset-0 bg-kairo-white/5 border border-kairo-white/10 rounded-full hover:bg-kairo-white/10 transition-colors duration-300" />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

/* ── Star Rating Modal ──────────────────────────────────────────── */
function RateModal({ forceOnboard = false, onClose }: { forceOnboard?: boolean; onClose: () => void }) {
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
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-kairo-primary/40 backdrop-blur-2xl p-4 sm:p-0"
      onClick={() => {
        if (!forceOnboard) onClose();
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-kairo-white/[0.03] border border-kairo-white/[0.08] shadow-2xl p-8 rounded-[2rem] w-full max-w-sm text-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
        
        {submitted ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-16 h-16 rounded-full bg-kairo-orange/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-kairo-orange" />
            </div>
            <p className="font-serif text-2xl text-kairo-white tracking-wide">Thank You!</p>
            <p className="text-sm text-kairo-light-gray/60 mt-2">Your feedback means everything to us.</p>
          </motion.div>
        ) : (
          <>
            <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-kairo-white/5 flex items-center justify-center text-kairo-light-gray hover:text-kairo-white hover:bg-kairo-white/10 transition-colors z-10"><X className="w-4 h-4" /></button>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kairo-white/10 to-transparent flex items-center justify-center mx-auto mb-6 border border-kairo-white/5">
              <Star className="w-8 h-8 text-kairo-orange" />
            </div>
            <p className="font-serif text-2xl text-kairo-white tracking-wide mb-2">Rate Kairo</p>
            <p className="text-sm text-kairo-light-gray/60 mb-8">How would you rate your experience?</p>
            <div className="flex justify-center gap-3 mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer transition-transform duration-300 hover:scale-125"
                >
                  <Star className={cn("w-8 h-8 transition-all duration-300",
                    s <= (hovered || selected) ? "text-kairo-orange fill-kairo-orange drop-shadow-[0_0_10px_rgba(184,168,138,0.5)]" : "text-kairo-white/20")} />
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={selected === 0}
              className="relative overflow-hidden w-full py-4 rounded-xl bg-kairo-orange text-kairo-primary font-bold tracking-widest disabled:opacity-50 transition-opacity"
            >
              <span className="relative z-10">Submit Rating</span>
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
  forceOnboard = false,
  onSave,
}: {
  user: { id: string; name: string; email: string; avatar: string };
  currentCity: string;
  onClose: () => void;
  forceOnboard?: boolean;
  onSave: (name: string, city: string, avatar?: string, interests?: string[]) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [city, setCity] = useState(currentCity);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    let newAvatarUrl: string | undefined;

    if (avatarFile) {
      setUploading(true);
      try {
        const storageRef = ref(storage, `avatars/${user.id}/${Date.now()}_${avatarFile.name}`);
        const snapshot = await uploadBytes(storageRef, avatarFile);
        newAvatarUrl = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error("Avatar upload failed:", err);
      } finally {
        setUploading(false);
      }
    }

    await onSave(name.trim() || user.name, city, newAvatarUrl, selectedInterests.length > 0 ? selectedInterests : undefined);
    setSaving(false);
    onClose();
  };

  const toggleInterest = (i: string) => {
    setSelectedInterests((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  };

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-kairo-primary/40 backdrop-blur-2xl p-4 sm:p-0"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#151517]/90 border border-kairo-white/[0.08] shadow-2xl p-8 rounded-[2rem] w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h3 className="font-serif text-2xl text-kairo-white tracking-wide">{forceOnboard ? "Complete Profile" : "Edit Profile"}</h3>
          {!forceOnboard && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-kairo-white/5 flex items-center justify-center text-kairo-light-gray hover:text-kairo-white hover:bg-kairo-white/10 transition-colors"><X className="w-4 h-4" /></button>
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center mb-8">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer"
          >
            <div className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-br from-kairo-orange/60 to-kairo-orange/10 group-hover:from-kairo-orange group-hover:to-kairo-orange/40 transition-all duration-300">
              <div className="w-full h-full rounded-full bg-kairo-dark-gray overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif text-3xl text-kairo-orange font-light">{initials}</span>
                )}
              </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-kairo-primary/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
              <Camera className="w-8 h-8 text-kairo-orange" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        <div className="space-y-6 relative z-10">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-kairo-light-gray/60 mb-3 ml-1">Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-kairo-white/[0.03] border border-kairo-white/10 rounded-xl focus:border-kairo-orange focus:bg-kairo-white/[0.05] px-4 py-4 text-sm text-kairo-white outline-none transition-all shadow-inner"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-kairo-light-gray/60 mb-3 ml-1">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-kairo-white/[0.03] border border-kairo-white/10 rounded-xl focus:border-kairo-orange focus:bg-kairo-white/[0.05] px-4 py-4 text-sm text-kairo-white outline-none transition-all shadow-inner appearance-none cursor-pointer"
            >
              <option value="">Select city...</option>
              {CITIES.map((c) => (
                <option key={c} value={c} className="bg-kairo-primary text-kairo-white">{c}</option>
              ))}
            </select>
          </div>
          
          {forceOnboard && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-kairo-light-gray/60 mb-3 ml-1">Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS_LIST.map((i) => (
                  <Chip key={i} label={i} selected={selectedInterests.includes(i)} onClick={() => toggleInterest(i)} />
                ))}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-kairo-light-gray/60 mb-3 ml-1">Email</label>
            <input
              value={user.email}
              disabled
              className="w-full bg-kairo-white/[0.01] border border-kairo-white/5 rounded-xl px-4 py-4 text-sm text-kairo-light-gray/40 cursor-not-allowed"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || uploading || (forceOnboard && (!city || selectedInterests.length === 0))}
          className="mt-8 w-full py-4 rounded-xl bg-kairo-orange text-kairo-primary font-bold tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all relative z-10 shadow-[0_0_20px_rgba(184,168,138,0.2)] hover:shadow-[0_0_30px_rgba(184,168,138,0.4)]"
        >
          {(saving || uploading) ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {uploading ? "Uploading..." : saving ? "Saving..." : forceOnboard ? "Complete Onboarding" : "Save Changes"}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── Calendar Sync Modal ─────────────────────────────────────────── */
function CalendarModal({ bookmarkCount, onClose }: { bookmarkCount: number; onClose: () => void }) {
  const handleGoogleSync = () => {
    const url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=KAIRO+Event+Reminder&details=Check+your+saved+events+on+Kairo&location=localhost:3000/saved`;
    window.open(url, "_blank");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-kairo-primary/40 backdrop-blur-2xl p-4 sm:p-0"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-kairo-white/[0.03] border border-kairo-white/[0.08] shadow-2xl p-8 rounded-[2rem] w-full max-w-sm overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
        
        <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-kairo-white/5 flex items-center justify-center text-kairo-light-gray hover:text-kairo-white hover:bg-kairo-white/10 transition-colors z-10"><X className="w-4 h-4" /></button>
        
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kairo-white/10 to-transparent flex items-center justify-center mb-6 border border-kairo-white/5 relative z-10">
          <Calendar className="w-8 h-8 text-kairo-orange" />
        </div>
        
        <h3 className="font-serif text-2xl text-kairo-white tracking-wide mb-3 relative z-10">Calendar Sync</h3>
        <p className="text-sm text-kairo-light-gray/70 leading-relaxed mb-8 relative z-10">
          You have <span className="text-kairo-orange font-bold px-1">{bookmarkCount} saved events</span>. Sync them to your calendar to never miss a deadline.
        </p>
        
        <button
          onClick={handleGoogleSync}
          className="w-full py-4 rounded-xl bg-kairo-orange text-kairo-primary font-bold tracking-widest flex items-center justify-center gap-3 relative z-10 shadow-[0_0_20px_rgba(184,168,138,0.2)]"
        >
          <Calendar className="w-5 h-5" />
          Open Google Calendar
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Profile Page ────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuthContext();
  const { bookmarks } = useBookmarkContext();
  
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [userCity, setUserCity] = useState<string>("");

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [forceOnboard, setForceOnboard] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [savedEvents, setSavedEvents] = useState<Event[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadUserData() {
      if (!user?.id) return;
      try {
        const docRef = doc(db, "users", user.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.city) setUserCity(data.city);
          if (data.interests) setInterests(data.interests);
          if (data.emailNotif !== undefined) setEmailNotif(data.emailNotif);
          if (data.pushNotif !== undefined) setPushNotif(data.pushNotif);
          
          if (!data.city || !data.interests || data.interests.length === 0) {
            setForceOnboard(true);
            setShowEditProfile(true);
          }
        } else {
          setForceOnboard(true);
          setShowEditProfile(true);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      }
    }
    loadUserData();
  }, [user?.id]);

  useEffect(() => {
    async function loadSavedEvents() {
      if (bookmarks.length === 0) {
        setSavedEvents([]);
        return;
      }
      try {
        const events = await getEvents();
        const filtered = events.filter((e) => bookmarks.includes(e.id));
        setSavedEvents(filtered);
      } catch (err) {
        console.error("Failed to load saved events for profile", err);
      }
    }
    loadSavedEvents();
  }, [bookmarks]);

  if (authLoading || !isMounted) {
    return (
      <div className="min-h-screen pt-32 pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-kairo-orange animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async (name: string, city: string, avatarUrl?: string) => {
    try {
      if (!user?.id) return;
      const updates: any = { name, city };
      if (avatarUrl) updates.avatar = avatarUrl;
      await updateDoc(doc(db, "users", user.id), updates);
      setUserCity(city);
      if (forceOnboard) {
        setForceOnboard(false);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleSavePrefs = async () => {
    if (!user?.id) return;
    setIsSavingPrefs(true);
    try {
      await updateDoc(doc(db, "users", user.id), { emailNotif, pushNotif });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText("https://kairo.events/invite/ayushman");
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
  };

  const initials = user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen pt-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* ── Floating Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full rounded-[2rem] sm:rounded-[3rem] overflow-hidden mb-8"
      >
        <div className="absolute inset-0 bg-kairo-white/[0.02] backdrop-blur-2xl border border-kairo-white/[0.08]" />
        
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-kairo-orange/20 blur-[120px] rounded-full animate-blob mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[120%] bg-blue-500/10 blur-[120px] rounded-full animate-blob animation-delay-2000 mix-blend-screen" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 py-10 sm:py-16 flex flex-col sm:flex-row items-center sm:items-start gap-8">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="absolute inset-0 bg-kairo-orange/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-br from-kairo-orange/50 via-kairo-orange/20 to-transparent relative z-10">
              <div className="w-full h-full rounded-full bg-kairo-dark-gray overflow-hidden border-2 border-kairo-primary">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-serif text-4xl text-kairo-orange">{initials}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => { setForceOnboard(false); setShowEditProfile(true); }}
              className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-kairo-primary border border-kairo-white/10 flex items-center justify-center text-kairo-white hover:bg-kairo-orange hover:border-kairo-orange transition-all shadow-xl z-20 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left flex flex-col justify-center pt-2">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-kairo-white mb-2">{user.name}</h1>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-sm text-kairo-light-gray font-mono">
              <span>{user.email}</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-kairo-white/20" />
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-kairo-orange" /> {userCity || "Location not set"}</span>
            </div>
            
            {interests.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-2">
                {interests.map((interest) => (
                  <span key={interest} className="px-3 py-1 rounded-full border border-kairo-orange/30 bg-kairo-orange/10 text-kairo-orange text-xs font-bold tracking-wider">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Bento Box Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: My Events (Hero Card) */}
        <BentoCard title="My Events" icon={Ticket} className="md:col-span-2 min-h-[400px]">
          <div className="flex gap-4 mb-8">
            {["upcoming", "past"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "relative px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
                  activeTab === tab ? "text-kairo-primary" : "text-kairo-light-gray hover:text-kairo-white"
                )}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="eventTab"
                    className="absolute inset-0 bg-kairo-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-x-auto pb-6 scrollbar-hide -mx-6 px-6">
            <div className="flex gap-4 w-max">
              {savedEvents.length === 0 ? (
                <div className="w-[300px] h-[200px] rounded-2xl border border-dashed border-kairo-white/20 flex flex-col items-center justify-center text-kairo-light-gray/60">
                  <Ticket className="w-8 h-8 mb-3 opacity-50" />
                  <p className="text-sm font-bold tracking-widest uppercase">No events saved yet</p>
                </div>
              ) : (
                <AnimatePresence>
                  {savedEvents.map((event, idx) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      key={event.id}
                      onClick={() => router.push(`/event/${event.id}`)}
                      className="w-[280px] shrink-0 rounded-2xl bg-kairo-white/5 border border-kairo-white/10 overflow-hidden cursor-pointer group"
                    >
                      <div className="relative h-32 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary/90 to-transparent" />
                        <div className="absolute bottom-3 left-4 text-xs font-bold text-kairo-white tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-kairo-orange" /> {event.date}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-kairo-white line-clamp-1 mb-1">{event.title}</h3>
                        <p className="text-xs text-kairo-light-gray line-clamp-1">{event.location}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </BentoCard>

        {/* Column 3: Tools */}
        <BentoCard title="Tools" icon={MapPin} delay={0.1}>
          <div className="space-y-1">
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
          </div>
        </BentoCard>

        {/* Column 1: Preferences */}
        <BentoCard title="Preferences" icon={Settings} delay={0.15}>
          <div className="space-y-1 mb-6">
            <ToggleSwitch checked={emailNotif} onChange={setEmailNotif} label="Email Alerts" sublabel="Registration deadlines & new events" />
            <ToggleSwitch checked={pushNotif} onChange={setPushNotif} label="Push Notifications" sublabel="Browser notifications for saved events" />
          </div>
          <div className="mt-auto">
            <button
              onClick={handleSavePrefs}
              disabled={isSavingPrefs}
              className="w-full py-4 rounded-xl bg-kairo-white/5 border border-kairo-white/10 hover:bg-kairo-orange/10 hover:border-kairo-orange/30 hover:text-kairo-orange text-kairo-white font-bold tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSavingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> :
                prefsSaved ? <CheckCircle2 className="w-4 h-4" /> : null}
              {isSavingPrefs ? "Saving..." : prefsSaved ? "Saved!" : "Save Preferences"}
            </button>
          </div>
        </BentoCard>

        {/* Column 2 & 3: Account */}
        <BentoCard title="Account" icon={User} delay={0.2} className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            <RowItem
              icon={Edit3}
              label="Edit Profile"
              sublabel="Update your info and avatar"
              onClick={() => {
                setForceOnboard(false);
                setShowEditProfile(true);
              }}
            />
            <RowItem
              icon={FileText}
              label="Privacy Policy"
              sublabel="How we handle your data"
              onClick={() => router.push("/privacy")}
            />
            <RowItem
              icon={Shield}
              label="Terms of Service"
              sublabel="Usage terms & conditions"
              onClick={() => router.push("/terms")}
            />
            <RowItem
              icon={LogOut}
              label="Logout"
              sublabel="Sign out of your account"
              onClick={handleLogout}
              danger
            />
          </div>
        </BentoCard>

      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditProfile && (
          <EditProfileModal
            user={user}
            currentCity={userCity}
            forceOnboard={forceOnboard}
            onClose={() => {
              setForceOnboard(false);
              setShowEditProfile(false);
            }}
            onSave={async (name, city, avatar, interestsFromModal) => {
              // Save interests as well when onboarding
              if (interestsFromModal && interestsFromModal.length > 0) {
                await updateDoc(doc(db, "users", user.id), { interests: interestsFromModal });
                setInterests(interestsFromModal);
              }
              await handleEditSave(name, city, avatar);
            }}
          />
        )}
        {showRate && <RateModal forceOnboard={forceOnboard} onClose={() => setShowRate(false)} />}
        {showCalendar && (
          <CalendarModal bookmarkCount={bookmarks.length} onClose={() => setShowCalendar(false)} />
        )}
      </AnimatePresence>

      {/* Share toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-kairo-white/10 backdrop-blur-md border border-kairo-orange/30 shadow-2xl px-6 py-4 rounded-2xl text-xs font-bold tracking-widest text-kairo-white flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-kairo-orange/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-kairo-orange" />
            </div>
            Link copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
