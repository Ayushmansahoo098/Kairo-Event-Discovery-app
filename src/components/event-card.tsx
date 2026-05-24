"use client";

import { Event } from "@/lib/types";
import { Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookmarkButton } from "./bookmark-button";

export function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      <div className="relative flex flex-col h-[420px] rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl hover:shadow-kairo-orange/20">
        
        {/* Full Bleed Banner Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={event.bannerImage}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-kairo-dark-gray/90 backdrop-blur-md text-kairo-orange shadow-sm uppercase tracking-wider">
            {event.category}
          </span>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <BookmarkButton eventId={event.id} className="bg-kairo-dark-gray/90 backdrop-blur-md shadow-sm border border-kairo-gray/50" />
        </div>

        {/* Bottom Frosted Glass Content */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-kairo-primary/85 backdrop-blur-xl border border-kairo-dark-gray p-5 rounded-2xl flex flex-col shadow-lg transition-all duration-300 group-hover:bg-kairo-primary/95">
            <h3 className="font-extrabold text-xl text-kairo-white line-clamp-2 mb-3 leading-tight">
              {event.title}
            </h3>
            
            <div className="space-y-2.5">
              <div className="flex items-center text-sm font-semibold text-kairo-light-gray">
                <Calendar className="w-4 h-4 mr-2.5 flex-shrink-0 text-kairo-orange" />
                <span className="truncate">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.time}</span>
              </div>
              
              <div className="flex items-center text-sm font-semibold text-kairo-light-gray">
                <MapPin className="w-4 h-4 mr-2.5 flex-shrink-0 text-kairo-orange" />
                <span className="truncate">{event.isOnline ? "Online Event" : `${event.location}, ${event.city}`}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-kairo-dark-gray flex items-center justify-between">
              <span className="text-sm font-bold text-kairo-gray truncate uppercase tracking-widest">
                By {event.organizer}
              </span>
            </div>
          </div>
        </div>
        
      </div>
    </Link>
  );
}
