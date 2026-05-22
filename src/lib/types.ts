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
}

export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
  color: string;
  count: number;
}
