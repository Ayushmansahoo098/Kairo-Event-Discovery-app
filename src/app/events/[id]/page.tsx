"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  ExternalLink,
  Globe,
  Tag,
  Loader2,
} from "lucide-react";
import { getEventById } from "@/lib/mock-data";
import { BookmarkButton } from "@/components/bookmark-button";
import { Event } from "@/lib/types";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventById(eventId);
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch event:", err);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-kairo-primary">
        <Loader2 className="w-8 h-8 animate-spin text-kairo-orange" />
        <p className="mt-4 text-kairo-light-gray font-bold tracking-widest text-xs uppercase">Decoding Event...</p>
      </div>
    );
  }

  /* ── Not Found ── */
  if (!event) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-kairo-dark-gray border border-kairo-gray shadow-sm">
          <Calendar className="h-10 w-10 text-kairo-gray" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-kairo-white">Event Not Found</h1>
        <p className="mb-8 max-w-sm text-kairo-light-gray">
          The event you&apos;re looking for doesn&apos;t exist or may have been
          removed.
        </p>
        <button
          onClick={() => router.push("/feed")}
          className="inline-flex items-center gap-2 rounded-full bg-kairo-orange px-8 py-4 text-sm font-bold text-kairo-white shadow-lg shadow-kairo-orange/20 transition-all hover:scale-105"
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
    <div className="relative pb-36 md:pb-28 bg-kairo-primary min-h-screen">
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

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-kairo-primary/90 via-kairo-primary/40 to-transparent" />

        {/* Top controls */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-kairo-dark-gray/90 shadow-sm backdrop-blur-xl transition-all hover:bg-kairo-gray text-kairo-light-gray hover:text-kairo-white hover:scale-105"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <BookmarkButton eventId={event.id} className="bg-kairo-dark-gray/90 shadow-sm h-12 w-12 flex items-center justify-center hover:bg-kairo-gray" />
        </div>

        {/* Online/Offline badge on banner */}
        <div className="absolute bottom-6 left-4 md:left-6">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold backdrop-blur-md shadow-lg text-kairo-white ${
              event.isOnline
                ? "bg-kairo-orange"
                : "bg-kairo-grad-2"
            }`}
          >
            <Globe className="h-4 w-4" />
            {event.isOnline ? "Online" : "In Person"}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mt-8">
        {/* Title */}
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl text-kairo-white">
          {event.title}
        </h1>

        {/* Meta row */}
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
          <div className="flex items-center gap-3 text-kairo-light-gray font-medium">
            <div className="w-10 h-10 rounded-full bg-kairo-dark-gray flex items-center justify-center text-kairo-orange">
              <Calendar className="h-5 w-5" />
            </div>
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-3 text-kairo-light-gray font-medium">
            <div className="w-10 h-10 rounded-full bg-kairo-dark-gray flex items-center justify-center text-kairo-grad-4">
              <MapPin className="h-5 w-5" />
            </div>
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-3 text-kairo-light-gray font-medium">
            <div className="w-10 h-10 rounded-full bg-kairo-dark-gray flex items-center justify-center text-kairo-orange">
              <User className="h-5 w-5" />
            </div>
            <span>{event.organizer}</span>
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-kairo-dark-gray border border-kairo-gray px-4 py-1.5 text-sm font-semibold text-kairo-light-gray shadow-sm"
              >
                <Tag className="h-3.5 w-3.5 text-kairo-orange" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="my-10 h-px bg-kairo-gray/50" />

        {/* Description */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-kairo-white">About This Event</h2>
          <p className="whitespace-pre-line leading-relaxed text-lg text-kairo-light-gray">
            {event.description}
          </p>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-kairo-gray/50" />

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Organizer Card */}
          <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray p-6 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-kairo-gray">
              Organized by
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-kairo-primary border border-kairo-gray">
                <User className="h-6 w-6 text-kairo-orange" />
              </div>
              <div>
                <p className="font-bold text-kairo-white text-lg">{event.organizer}</p>
                <p className="text-sm font-medium text-kairo-light-gray">Event Organizer</p>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="rounded-2xl border border-kairo-gray bg-kairo-dark-gray p-6 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-kairo-gray">
              Location
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-kairo-primary border border-kairo-gray">
                <MapPin className="h-6 w-6 text-kairo-grad-4" />
              </div>
              <div>
                <p className="font-bold text-kairo-white text-lg">{event.location}</p>
                <p className="text-sm font-medium text-kairo-light-gray">
                  {event.city}
                  {event.isOnline ? " • Virtual" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed Bottom CTA ── */}
      <div className="fixed inset-x-0 bottom-[60px] md:bottom-0 z-50 border-t border-kairo-dark-gray bg-kairo-primary/80 px-4 py-4 backdrop-blur-xl md:px-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]">
        <div className="mx-auto max-w-3xl">
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-kairo-grad-2 via-kairo-orange to-kairo-grad-4 px-6 py-4 text-lg font-bold text-kairo-white shadow-lg shadow-kairo-orange/25 transition-all duration-300 hover:shadow-xl hover:shadow-kairo-orange/40 hover:scale-[1.02]"
          >
            Register Now
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
