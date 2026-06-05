export type Category =
  | "hackathon"
  | "workshop"
  | "concert"
  | "festival"
  | "meetup"
  | "gaming"
  | "startup";

export interface Event {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  date: string;
  time: string;
  location: string;
  city: string;
  isOnline: boolean;
  category: Category;
  organizer: string;
  registrationUrl: string;
  tags: string[];
  isTrending: boolean;
  source?: string;
  expiresAt?: string;
  contentHash?: string;
  lastUpdated?: string;
  trendingScore?: number;
  sourceId?: string;
  isExpired?: boolean;
  image?: string;
  popularityScore?: number;
  matchScore?: number;
  viewsCount?: number;
  savesCount?: number;
  registrationsCount?: number;
  embedding?: number[];
  status?: "active" | "expired" | "archived";
  expiredAt?: string;
  sources?: string[];
  sourceUrls?: Record<string, string>;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
  color: string;
  count: number;
}
