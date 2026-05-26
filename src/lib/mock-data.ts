import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { Category, CategoryInfo, Event } from "./types";
import { dedupeEvents } from "./feed/dedupe";
import { rankEvents } from "./feed/ranking";
import { updateTrendingEvents } from "./feed/trending";

// Keeping static mock events for seeding and initial guest fallback
export const staticEvents: Event[] = [
  // Hackathons
  {
    id: "hack-01",
    title: "HackBangalore 2026",
    description:
      "A 48-hour hackathon bringing together 1,500+ developers to build solutions for smart city challenges. Compete for ₹10L in prizes with mentorship from top tech leaders.",
    bannerImage: "/images/hackathon.png",
    date: "2026-06-14",
    time: "09:00 AM",
    location: "Bangalore International Exhibition Centre",
    city: "Bangalore",
    isOnline: false,
    category: "hackathon",
    organizer: "Devfolio India",
    registrationUrl: "https://hackbangalore2026.devfolio.co",
    tags: ["web3", "AI", "smart-city", "open-source"],
    isTrending: true,
  },
  {
    id: "hack-02",
    title: "ETHMumbai Blockchain Hack",
    description:
      "India's premier Ethereum hackathon with tracks for DeFi, NFTs, and on-chain governance. Build on Ethereum L2s and compete for bounties worth $50K.",
    bannerImage: "/images/hackathon.png",
    date: "2026-07-04",
    time: "10:00 AM",
    location: "IIT Bombay, Powai",
    city: "Mumbai",
    isOnline: false,
    category: "hackathon",
    organizer: "ETHIndia Foundation",
    registrationUrl: "https://ethmumbai.devfolio.co",
    tags: ["blockchain", "ethereum", "DeFi", "web3"],
    isTrending: false,
  },
  {
    id: "hack-03",
    title: "GenAI Buildathon",
    description:
      "A fully virtual hackathon focused on generative AI applications. Ship a working prototype in 36 hours using any LLM API and win cloud credits plus cash prizes.",
    bannerImage: "/images/hackathon.png",
    date: "2026-08-09",
    time: "11:00 AM",
    location: "Online Event",
    city: "Online",
    isOnline: true,
    category: "hackathon",
    organizer: "MLH India",
    registrationUrl: "https://mlh.io/genai-buildathon",
    tags: ["generative-AI", "LLM", "ML", "virtual"],
    isTrending: false,
  },

  // Workshops
  {
    id: "work-01",
    title: "Full-Stack Next.js Masterclass",
    description:
      "An intensive 2-day workshop covering Next.js App Router, Server Actions, and deployment on Vercel. Ideal for developers looking to level up from React to production-grade full-stack apps.",
    bannerImage: "/images/workshop.png",
    date: "2026-06-21",
    time: "10:00 AM",
    location: "91springboard, Koramangala",
    city: "Bangalore",
    isOnline: false,
    category: "workshop",
    organizer: "ReactPlay Community",
    registrationUrl: "https://reactplay.io/nextjs-masterclass",
    tags: ["next.js", "react", "full-stack", "typescript"],
    isTrending: true,
  },
  {
    id: "work-02",
    title: "Figma to Code: Design Systems Workshop",
    description:
      "Learn to translate Figma components into production-ready React components with Tailwind CSS. Hands-on session covering tokens, variants, and automated documentation.",
    bannerImage: "/images/workshop.png",
    date: "2026-07-11",
    time: "02:00 PM",
    location: "T-Hub 2.0, Raidurg",
    city: "Hyderabad",
    isOnline: false,
    category: "workshop",
    organizer: "Design Systems India",
    registrationUrl: "https://dsind.io/figma-to-code",
    tags: ["design-systems", "figma", "tailwind", "UI"],
    isTrending: false,
  },
  {
    id: "work-03",
    title: "Rust for Backend Engineers",
    description:
      "A weekend workshop introducing Rust for building high-performance APIs. Covers ownership, async runtimes with Tokio, and deploying Rust services on AWS Lambda.",
    bannerImage: "/images/workshop.png",
    date: "2026-08-01",
    time: "10:00 AM",
    location: "Online Event",
    city: "Online",
    isOnline: true,
    category: "workshop",
    organizer: "RustLang India",
    registrationUrl: "https://rustlang.in/workshop-backend",
    tags: ["rust", "backend", "systems", "AWS"],
    isTrending: false,
  },

  // Concerts
  {
    id: "conc-01",
    title: "Prateek Kuhad Live — The Way That Lovers Do Tour",
    description:
      "Prateek Kuhad returns to Mumbai with his soulful indie-folk sound for an intimate open-air evening. Expect fan favorites alongside unreleased tracks from his upcoming album.",
    bannerImage: "/images/concert.png",
    date: "2026-06-28",
    time: "07:00 PM",
    location: "Mahalaxmi Race Course",
    city: "Mumbai",
    isOnline: false,
    category: "concert",
    organizer: "BookMyShow Live",
    registrationUrl: "https://bookmyshow.com/prateek-kuhad-mumbai",
    tags: ["indie", "folk", "live-music", "outdoor"],
    isTrending: true,
  },
  {
    id: "conc-02",
    title: "Nucleya Bass Drop Arena",
    description:
      "Nucleya brings his bone-rattling bass to Delhi in a massive arena show. Featuring a 360° stage, immersive LED visuals, and support acts from India's hottest EDM producers.",
    bannerImage: "/images/concert.png",
    date: "2026-07-18",
    time: "06:00 PM",
    location: "Jawaharlal Nehru Stadium",
    city: "Delhi",
    isOnline: false,
    category: "concert",
    organizer: "Paytm Insider",
    registrationUrl: "https://insider.in/nucleya-delhi",
    tags: ["EDM", "bass", "electronic", "arena"],
    isTrending: false,
  },
  {
    id: "conc-03",
    title: "When Chai Met Toast — Indie Night",
    description:
      "Kerala's beloved indie band performs their feel-good anthems live in Pune. A perfect monsoon evening with acoustic sets, chai stalls, and good vibes.",
    bannerImage: "/images/concert.png",
    date: "2026-08-08",
    time: "06:30 PM",
    location: "High Spirits Cafe, Koregaon Park",
    city: "Pune",
    isOnline: false,
    category: "concert",
    organizer: "OML Entertainment",
    registrationUrl: "https://insider.in/wcmt-pune",
    tags: ["indie", "acoustic", "live-music", "monsoon"],
    isTrending: false,
  },

  // Festivals
  {
    id: "fest-01",
    title: "NH7 Weekender Pune",
    description:
      "India's happiest music festival returns with 50+ artists across 5 stages over 3 days. From hip-hop to Carnatic fusion, NH7 has something for every music lover.",
    bannerImage: "/images/festival.png",
    date: "2026-07-24",
    time: "12:00 PM",
    location: "Mahalaxmi Lawns, Kharadi",
    city: "Pune",
    isOnline: false,
    category: "festival",
    organizer: "OML Entertainment",
    registrationUrl: "https://nh7.in/weekender",
    tags: ["music-festival", "multi-genre", "outdoor", "camping"],
    isTrending: true,
  },
  {
    id: "fest-02",
    title: "Comic Con India — Hyderabad",
    description:
      "The ultimate pop-culture festival featuring cosplay competitions, artist alleys, gaming zones, and celebrity panels. Three days of fandom celebration under one roof.",
    bannerImage: "/images/festival.png",
    date: "2026-08-14",
    time: "10:00 AM",
    location: "HITEX Exhibition Centre",
    city: "Hyderabad",
    isOnline: false,
    category: "festival",
    organizer: "Comic Con India",
    registrationUrl: "https://comicconindia.com/hyderabad",
    tags: ["pop-culture", "cosplay", "comics", "fandom"],
    isTrending: false,
  },
  {
    id: "fest-03",
    title: "Bangalore Tech Summit 2026",
    description:
      "Karnataka's flagship technology festival showcasing deep-tech demos, startup pavilions, and policy roundtables. Attracts 30K+ visitors and 500+ exhibitors annually.",
    bannerImage: "/images/festival.png",
    date: "2026-06-19",
    time: "09:30 AM",
    location: "Palace Grounds, Sadashivanagar",
    city: "Bangalore",
    isOnline: false,
    category: "festival",
    organizer: "Govt. of Karnataka IT/BT Dept.",
    registrationUrl: "https://bengalurutechsummit.com",
    tags: ["deep-tech", "startup", "policy", "exhibition"],
    isTrending: false,
  },

  // Meetups
  {
    id: "meet-01",
    title: "React Delhi — Server Components Deep Dive",
    description:
      "Monthly meetup exploring React Server Components patterns, streaming SSR, and migration strategies. Lightning talks followed by networking over pizza and chai.",
    bannerImage: "/images/meetup.png",
    date: "2026-06-07",
    time: "11:00 AM",
    location: "Google Office, Gurugram",
    city: "Delhi",
    isOnline: false,
    category: "meetup",
    organizer: "React Delhi",
    registrationUrl: "https://meetup.com/react-delhi/rsc-deep-dive",
    tags: ["react", "server-components", "frontend", "community"],
    isTrending: false,
  },
  {
    id: "meet-02",
    title: "Women Who Code — Pune Chapter Kickoff",
    description:
      "Inaugural meetup of the Pune chapter focusing on career growth for women in tech. Panel discussion with engineering leaders from Thoughtworks, Persistent, and Cred.",
    bannerImage: "/images/meetup.png",
    date: "2026-07-05",
    time: "03:00 PM",
    location: "Cummins College of Engineering",
    city: "Pune",
    isOnline: false,
    category: "meetup",
    organizer: "Women Who Code",
    registrationUrl: "https://womenwhocode.com/pune-kickoff",
    tags: ["women-in-tech", "diversity", "career", "networking"],
    isTrending: false,
  },
  {
    id: "meet-03",
    title: "GDG Mumbai — Flutter Forward Extended",
    description:
      "Google Developer Group Mumbai hosts an extended viewing party for Flutter Forward with live coding demos. Build a cross-platform app in real-time with the community.",
    bannerImage: "/images/meetup.png",
    date: "2026-08-02",
    time: "10:30 AM",
    location: "WeWork BKC, Bandra",
    city: "Mumbai",
    isOnline: false,
    category: "meetup",
    organizer: "GDG Mumbai",
    registrationUrl: "https://gdg.community.dev/mumbai/flutter-forward",
    tags: ["flutter", "dart", "mobile", "google"],
    isTrending: false,
  },

  // Gaming
  {
    id: "game-01",
    title: "BGMI Pro Series — Season 5 Finals",
    description:
      "The grand finale of Battlegrounds Mobile India Pro Series with 16 top teams competing for a ₹2 Crore prize pool. Watch the action live on the big screen or stream online.",
    bannerImage: "/images/gaming.png",
    date: "2026-07-12",
    time: "04:00 PM",
    location: "Thyagaraj Sports Complex",
    city: "Delhi",
    isOnline: false,
    category: "gaming",
    organizer: "Krafton India",
    registrationUrl: "https://battlegroundsmobileindia.com/pro-series",
    tags: ["BGMI", "esports", "battle-royale", "mobile-gaming"],
    isTrending: true,
  },
  {
    id: "game-02",
    title: "India Gaming Expo 2026",
    description:
      "A two-day expo celebrating Indian game development with playable demos, indie showcases, and talks from studios behind Raji and Mighty Little Bheem. Retro arcade zone included.",
    bannerImage: "/images/gaming.png",
    date: "2026-08-22",
    time: "10:00 AM",
    location: "Bombay Exhibition Centre, Goregaon",
    city: "Mumbai",
    isOnline: false,
    category: "gaming",
    organizer: "NASSCOM Gaming Forum",
    registrationUrl: "https://indiagamingexpo.com",
    tags: ["indie-games", "game-dev", "expo", "retro"],
    isTrending: false,
  },
  {
    id: "game-03",
    title: "Valorant Community Cup — Online",
    description:
      "Open-entry Valorant tournament for amateur and semi-pro teams across India. Round-robin format with Bo3 playoffs and streaming on YouTube Gaming.",
    bannerImage: "/images/gaming.png",
    date: "2026-06-28",
    time: "02:00 PM",
    location: "Online Event",
    city: "Online",
    isOnline: true,
    category: "gaming",
    organizer: "Skyesports",
    registrationUrl: "https://skyesports.in/valorant-cup",
    tags: ["valorant", "FPS", "tournament", "online"],
    isTrending: false,
  },

  // Startup
  {
    id: "start-01",
    title: "YC India Demo Day Watch Party",
    description:
      "Watch Y Combinator's Demo Day live with India's startup community. Post-stream panel discussion with YC alumni founders building from India.",
    bannerImage: "/images/startup.png",
    date: "2026-06-15",
    time: "08:00 PM",
    location: "Online Event",
    city: "Online",
    isOnline: true,
    category: "startup",
    organizer: "YC India Alumni Network",
    registrationUrl: "https://ycindiademoday.com",
    tags: ["YC", "demo-day", "VC", "fundraising"],
    isTrending: false,
  },
  {
    id: "start-02",
    title: "Pitch Night Bangalore — Climate Tech Edition",
    description:
      "Six early-stage climate-tech startups pitch to a panel of investors from Blume Ventures, Omnivore, and Speciale Invest. Open to founders and investors.",
    bannerImage: "/images/startup.png",
    date: "2026-07-19",
    time: "06:00 PM",
    location: "HSR Layout, WeWork Galaxy",
    city: "Bangalore",
    isOnline: false,
    category: "startup",
    organizer: "Headstart Network",
    registrationUrl: "https://headstart.in/pitch-night-climate",
    tags: ["climate-tech", "pitch", "VC", "seed-stage"],
    isTrending: false,
  },
  {
    id: "start-03",
    title: "TiE Global Summit India",
    description:
      "Asia's largest entrepreneurship conference with 200+ speakers, startup expos, and investor connect sessions. Three days of masterclasses on scaling, fundraising, and exits.",
    bannerImage: "/images/startup.png",
    date: "2026-08-27",
    time: "09:00 AM",
    location: "Jio World Convention Centre, BKC",
    city: "Mumbai",
    isOnline: false,
    category: "startup",
    organizer: "TiE Mumbai",
    registrationUrl: "https://tieglobalsummit.org",
    tags: ["entrepreneurship", "scaling", "conference", "networking"],
    isTrending: false,
  },
];

// Deprecated exported events array (retained for types & fallback)
export const events: Event[] = staticEvents;

export const categories: CategoryInfo[] = [
  { id: "hackathon", name: "Hackathons", icon: "Code", color: "text-violet-500", count: 3 },
  { id: "workshop", name: "Workshops", icon: "GraduationCap", color: "text-blue-500", count: 3 },
  { id: "concert", name: "Concerts", icon: "Music", color: "text-pink-500", count: 3 },
  { id: "festival", name: "Festivals", icon: "PartyPopper", color: "text-amber-500", count: 3 },
  { id: "meetup", name: "Meetups", icon: "Users", color: "text-green-500", count: 3 },
  { id: "gaming", name: "Gaming", icon: "Gamepad2", color: "text-red-500", count: 3 },
  { id: "startup", name: "Startups", icon: "Rocket", color: "text-cyan-500", count: 3 },
];

/**
 * Helper to check if client Firestore config is loaded and valid.
 */
function isFirebaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "YOUR_API_KEY_HERE";
}

/**
 * Fetches all events from Cloud Firestore with staticEvents fallback.
 */
export async function getEvents(): Promise<Event[]> {
  let list: Event[] = [];
  if (!isFirebaseConfigured()) {
    list = staticEvents;
  } else {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      if (querySnapshot.empty) {
        list = []; // NO demo fallback, return empty representing uncompleted scrapes
      } else {
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Event);
        });
      }
    } catch (error) {
      console.error("Firestore getEvents error:", error);
      list = []; // Return empty on DB error
    }
  }

  // Execute Ingestion & Intelligence Feed Pipeline
  try {
    const cleanList = dedupeEvents(list);
    const trendingList = updateTrendingEvents(cleanList);
    const rankedList = rankEvents(trendingList);
    return rankedList;
  } catch (pipeErr) {
    console.error("Feed Pipeline execution failed, returning raw list:", pipeErr);
    return list;
  }
}

/**
 * Fetches a single event document by ID.
 */
export async function getEventById(id: string): Promise<Event | undefined> {
  if (!isFirebaseConfigured()) {
    return staticEvents.find((e) => e.id === id);
  }
  try {
    const docSnap = await getDoc(doc(db, "events", id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Event;
    }
    return undefined; // Only display scraped events
  } catch (error) {
    console.error(`Firestore getEventById(${id}) error:`, error);
    return undefined;
  }
}

/**
 * Fetches events filtered by category using the ranked/deduped pipeline.
 */
export async function getEventsByCategory(category: Category): Promise<Event[]> {
  try {
    const all = await getEvents();
    return all.filter((e) => e.category === category);
  } catch (error) {
    console.error("getEventsByCategory error, falling back:", error);
    return staticEvents.filter((e) => e.category === category);
  }
}

/**
 * Fetches trending events dynamically determined by the pipeline.
 */
export async function getTrendingEvents(): Promise<Event[]> {
  try {
    const all = await getEvents();
    return all.filter((e) => e.isTrending);
  } catch (error) {
    console.error("getTrendingEvents error, falling back:", error);
    return staticEvents.filter((e) => e.isTrending);
  }
}

/**
 * Fetches events in a given city using the ranked/deduped pipeline.
 */
export async function getEventsByCity(city: string): Promise<Event[]> {
  try {
    const all = await getEvents();
    return all.filter((e) => e.city.toLowerCase() === city.toLowerCase());
  } catch (error) {
    console.error("Firestore getEventsByCity error, falling back:", error);
    return staticEvents.filter((e) => e.city.toLowerCase() === city.toLowerCase());
  }
}

/**
 * Performs client-side filtering over retrieved database events.
 */
export async function searchEvents(queryStr: string): Promise<Event[]> {
  const q = queryStr.toLowerCase();
  const all = await getEvents();
  return all.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)) ||
      e.category.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q)
  );
}

/**
 * Gets unique cities represented in the database.
 */
export async function getCities(): Promise<string[]> {
  const all = await getEvents();
  return [...new Set(all.map((e) => e.city))];
}
