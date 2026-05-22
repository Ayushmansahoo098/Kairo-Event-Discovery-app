"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  ExternalLink,
  Globe,
  Tag,
} from "lucide-react";
import { getEventById } from "@/lib/mock-data";
import { BookmarkButton } from "@/components/bookmark-button";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const event = getEventById(eventId);

  /* ── Not Found ── */
  if (!event) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Calendar className="h-12 w-12 text-white/20" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Event Not Found</h1>
        <p className="mb-8 max-w-sm text-white/50">
          The event you&apos;re looking for doesn&apos;t exist or may have been
          removed.
        </p>
        <button
          onClick={() => router.push("/feed")}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:brightness-110"
        >
          Browse Events
        </button>
      </div>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative pb-28">
      {/* ── Banner ── */}
      <div className="relative h-[300px] w-full md:h-[400px]">
        <Image
          src={event.bannerImage}
          alt={event.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />

        {/* Top controls */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-xl transition-all hover:border-white/30 hover:bg-black/60"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <BookmarkButton eventId={event.id} />
        </div>

        {/* Online/Offline badge on banner */}
        <div className="absolute bottom-6 left-4 md:left-6">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md ${
              event.isOnline
                ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                : "border border-blue-500/30 bg-blue-500/20 text-blue-300"
            }`}
          >
            <Globe className="h-3 w-3" />
            {event.isOnline ? "Online" : "In Person"}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          {event.title}
        </h1>

        {/* Meta row */}
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          <div className="flex items-center gap-2 text-white/60">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <MapPin className="h-4 w-4 text-blue-400" />
            <span className="text-sm">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <User className="h-4 w-4 text-cyan-400" />
            <span className="text-sm">{event.organizer}</span>
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Description */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">About This Event</h2>
          <p className="whitespace-pre-line leading-relaxed text-white/70">
            {event.description}
          </p>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Organizer Card */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/40">
            Organized by
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">{event.organizer}</p>
              <p className="text-sm text-white/40">Event Organizer</p>
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/40">
            Location
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">{event.location}</p>
              <p className="text-sm text-white/40">
                {event.city}
                {event.isOnline ? " • Virtual Event" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed Bottom CTA ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a0a0b]/80 px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="mx-auto max-w-3xl">
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:brightness-110"
          >
            Register Now
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
