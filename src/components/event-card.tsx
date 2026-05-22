"use client";

import { Event } from "@/lib/types";
import { Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookmarkButton } from "./bookmark-button";

export function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      <div className="flex flex-col h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 hover:border-white/20">
        
        {/* Banner Image Container */}
        <div className="relative w-full h-48 sm:h-52 overflow-hidden">
          <Image
            src={event.bannerImage}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-md border border-white/10 text-white capitalize">
              {event.category}
            </span>
          </div>
          
          <div className="absolute top-2 right-2">
            <BookmarkButton eventId={event.id} className="bg-black/20 backdrop-blur-md border border-white/10" />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="font-semibold text-lg text-white line-clamp-2 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all">
            {event.title}
          </h3>
          
          <div className="mt-auto space-y-2">
            <div className="flex items-center text-sm text-white/60">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.time}</span>
            </div>
            
            <div className="flex items-center text-sm text-white/60">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{event.isOnline ? "Online Event" : `${event.location}, ${event.city}`}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium text-white/50 truncate">
              By {event.organizer}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
