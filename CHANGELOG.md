# Changelog

All notable changes to the Kairo Event Discovery platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-06-11

### Added
*   **Live Countdown Timer**: Displays ticking Days:Hours:Min:Sec until event starts on details page, with smooth sliding-digit transitions powered by Framer Motion.
*   **Profile Image Customizer**: Direct integration with Firebase Storage, featuring a custom web camera overlay and crop tool.
*   **AI Recommendation Feed**: Displays custom match percentages (e.g. `94% Match`) and natural language explanations (e.g. `Matches your interest in Hackathons`).
*   **Similar Events Carousel**: Displays horizontal scroll alternative cards based on shared categorization tags.
*   **Analytics Funnel Dashboard (`/admin/analytics`)**: Track user onboarding completion times, click-through-rates (CTR), and view-to-register conversion metrics.
*   **Admin Observability Control**: Restricted admin routes showing scraper run times, execution success rates, and live server logs.
*   **Advanced Feed Tabs**: Filtering for Recommended, Trending, Near You, Upcoming, and Saved events.

### Changed
*   **Unified Synchronization**: Integrated Devfolio, HackerEarth, Unstop, and Eventbrite scrapers into a single Jaccard-deduplicated sync pipeline.
*   **Memory Footprint Optimization**: Refined FastAPI TF-IDF vectorizer model cache, dropping microservice RAM requirements from 800MB to <60MB.
*   **Next.js SSR Hardening**: Safe guard checks ensuring Firebase client initializes only in browser contexts during Next.js server-side renders.
*   **CSS & Transitions**: Standardized glassmorphic container gradients and added diagonal shimmer sweeps on action CTAs.

### Fixed
*   Resolved all TypeScript compile-time warnings, dependency warnings, and missing React map key indicators.
*   Fixed bottom navigation bar padding and profile menu alignments for mobile viewports.

---

## [0.1.0] - 2026-05-15

### Added
*   **Core Aggregator Framework**: Next.js 16 App Router scaffolding using React 19.
*   **Crawler Suite**: Playwright in-memory crawlers for Devfolio, HackerEarth, and Unstop.
*   **Deduplication Engine**: Title Jaccard overlap index check ($\ge$ 70%) for grouping duplicate listings across sources.
*   **Skip Write Cache**: SHA-256 content hashes compared against Firestore documents to skip redundant database write updates.
*   **Distributed Mutex**: Firestore-based concurrency locking for sync routes.
*   **PWA Shell**: Serwist-powered Progressive Web App setup with manifest assets and offline shell layouts.
*   **Database Schema**: Firestore collections design for `events`, `users`, and `scrape_logs`.

---

## [Future Roadmap / Upcoming]

See [`README.md`](file:///Users/ayushmansahoo/Documents/GitHub/Kairo-Event-Discovery-app/README.md#%EF%B8%8F-future-roadmap) for full descriptions of upcoming features like Gemini dense vector embeddings, Luma connectors, hackathon team matching, map views, and calendar synchronizations.
