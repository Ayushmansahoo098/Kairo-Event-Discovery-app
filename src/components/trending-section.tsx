"use client";

import { getTrendingEvents } from "@/lib/mock-data";
import Link from "next/link";
import Image from "next/image";
import { Flame, MapPin, Calendar } from "lucide-react";

export function TrendingSection() {
  const trendingEvents = getTrendingEvents();

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 mb-8 flex items-center justify-between">
        <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          <Flame className="w-8 h-8 text-orange-500" />
          <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Trending Now</span>
        </h2>
        <Link href="/feed" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
          View all
        </Link>
      </div>

      <div className="w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8">
        <div className="flex gap-6 px-4 md:px-safe max-w-7xl mx-auto">
          {trendingEvents.map((event) => (
            <Link 
              key={event.id} 
              href={`/events/${event.id}`}
              className="snap-start shrink-0 w-[300px] sm:w-[400px] group block relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20"
            >
              <div className="relative h-[250px] w-full">
                <Image
                  src={event.bannerImage}
                  alt={event.title}
                  fill
                  sizes="(max-width: 640px) 300px, 400px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-lg">
                    HOT
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.isOnline ? "Online" : event.city}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
