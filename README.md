<div align="center">

<img src="public/banner.png" alt="Kairo — Event Discovery Platform" width="100%" />

# 🔥 KAIRO

### *Discover the Future of Events.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-12.13-orange?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Playwright](https://img.shields.io/badge/Playwright-1.60-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)

**Kairo** is a real-time event discovery platform that aggregates hackathons, workshops, competitions, and startup events from **Devfolio**, **Unstop**, **HackerEarth**, and **Eventbrite** — all in one beautifully designed, intelligent feed.

[Live Demo](#) · [Report Bug](https://github.com/Ayushmansahoo098/Kairo-Event-Discovery-app/issues) · [Request Feature](https://github.com/Ayushmansahoo098/Kairo-Event-Discovery-app/issues)

</div>

---

## ⚡ Why Kairo?

Finding the right hackathon or tech event means checking **4+ platforms daily**. Kairo solves this by:

- 🕷️ **Scraping live data** from Devfolio, Unstop, HackerEarth & Eventbrite automatically
- 🧠 **Deduplicating** events across sources using SHA-256 hashing + Jaro-Winkler fuzzy matching
- 📊 **Ranking** events by freshness, deadline urgency, source priority & category relevance
- 🔥 **Trending detection** that dynamically surfaces the most popular events
- 🔒 **Admin-protected** operational dashboards with real-time scraper telemetry

> **No more tab-hopping.** One feed. All events. Always fresh.

---

## 🏗️ Architecture

```
                          ┌─────────────────────────┐
                          │    Kairo Frontend        │
                          │    (Next.js 16 + React)  │
                          └────────────┬────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                   │
              ┌─────▼─────┐    ┌──────▼──────┐    ┌──────▼──────┐
              │  Landing   │    │  Discovery  │    │   Admin     │
              │  + Auth    │    │  Feed       │    │  Dashboard  │
              │  Modal     │    │  + Search   │    │  + Telemetry│
              └────────────┘    └──────┬──────┘    └─────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │   Intelligence Layer     │
                          ├──────────────────────────┤
                          │ • Deduplication Engine   │
                          │ • Relevance Ranking      │
                          │ • Trending Calculator    │
                          │ • Fuzzy Search           │
                          │ • Interaction Analytics  │
                          └────────────┬────────────┘
                                       │
              ┌────────────────────────▼────────────────────────┐
              │             Firestore Database                  │
              │  events │ users │ scrape_logs │ analytics_events│
              └────────────────────────┬────────────────────────┘
                                       │
              ┌────────────────────────▼────────────────────────┐
              │          Scraper Orchestrator                    │
              │              /api/sync/all                       │
              │  ┌──────────┬───────────┬──────────┬──────────┐ │
              │  │ Devfolio │  Unstop   │HackerEarth│Eventbrite│ │
              │  │(Playwright)│(Playwright)│(Playwright)│ (API) │ │
              │  └──────────┴───────────┴──────────┴──────────┘ │
              │         + Concurrency Lock + Batch Writes       │
              └─────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🎯 Core

| Feature | Description |
|---------|-------------|
| **Multi-Source Aggregation** | Scrapes Devfolio, Unstop, HackerEarth + polls Eventbrite API |
| **Smart Deduplication** | SHA-256 content hashing + Jaro-Winkler title similarity matching |
| **Relevance Ranking** | HSL-weighted scoring based on freshness, deadline, source priority |
| **Dynamic Trending** | Auto-flags top 15% events based on engagement + recency signals |
| **Fuzzy Search** | Client-side multi-field search with 300ms debouncing |
| **Infinite Scroll** | Paginated lazy-loading with smooth spring animations |

### 🎨 User Experience

| Feature | Description |
|---------|-------------|
| **Glassmorphic Design** | Frosted glass cards, premium dark theme, vibrant orange accents |
| **Urgency Badges** | 🚨 Closes today · ⏳ Tomorrow · ⚠️ 3 days left — dynamic deadline alerts |
| **Source Branding Pills** | Color-coded platform badges (Devfolio=blue, Unstop=amber, etc.) |
| **Category Theming** | Hackathon=violet, Workshop=sky, Startup=teal visual systems |
| **Skeleton Loaders** | Staggered shimmer animations matching card layout |
| **Custom Cursor** | Premium cursor experience on desktop |
| **PWA Support** | Installable as a native app with service worker caching |

### 🔒 Security & Operations

| Feature | Description |
|---------|-------------|
| **Proxy Guard** | Route protection for `/admin/*` and `/api/sync/*` endpoints |
| **Admin Whitelist** | Email-based access control via session cookies |
| **Cron Authorization** | Secret header support for automated sync triggers |
| **Concurrency Lock** | Firestore-based mutex prevents overlapping scraper runs |
| **Observability Dashboard** | Real-time telemetry panel with scraper health monitoring |
| **Batched Writes** | Atomic Firestore transactions for efficient bulk ingestion |
| **Interaction Analytics** | Click/bookmark tracking powering feed learning algorithms |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.0
- **npm** ≥ 9.0
- A **Firebase** project with Firestore & Authentication enabled

### 1. Clone & Install

```bash
git clone https://github.com/Ayushmansahoo098/Kairo-Event-Discovery-app.git
cd Kairo-Event-Discovery-app
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the root directory:

```env
# Firebase Client SDK (from Firebase Console → Project Settings → Web App)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (from Firebase Console → Service Accounts → Generate Private Key)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin Access Control
ADMIN_EMAIL=your_admin@email.com

# Cron Sync Secret (use a strong random string)
CRON_SECRET=your_cron_secret_here
```

### 3. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Kairo landing page.

### 5. Trigger Event Sync

Send a POST request to sync all events from all sources:

```bash
curl -X POST http://localhost:3000/api/sync/all \
  -H "x-kairo-sync-key: your_cron_secret_here"
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/observability/    # 📊 Ops telemetry dashboard
│   ├── api/
│   │   ├── ingest/             # Event ingest endpoint
│   │   ├── scrape/             # Individual scraper routes
│   │   │   ├── devfolio/
│   │   │   ├── unstop/
│   │   │   └── hackerearth/
│   │   └── sync/all/           # 🔄 Unified sync orchestrator
│   ├── events/[id]/            # Dynamic event detail page
│   ├── feed/                   # 🔍 Discovery feed with search
│   ├── login/                  # Auth page
│   ├── profile/                # User profile
│   └── saved/                  # Bookmarked events
├── components/
│   ├── event-card.tsx          # 🎴 Rich event card with urgency/source badges
│   ├── bookmark-button.tsx     # ❤️ Animated bookmark toggle
│   ├── hero-section.tsx        # 🏠 Landing page with auth modal
│   ├── search-bar.tsx          # 🔎 Search + city filter
│   ├── trending-section.tsx    # 🔥 Trending carousel
│   ├── navbar.tsx              # Navigation bar
│   └── category-filter.tsx     # Category pills
├── context/
│   ├── auth-context.tsx        # 🔐 Firebase Auth + session cookies
│   └── bookmark-context.tsx    # Bookmark state management
├── lib/
│   ├── analytics.ts            # 📈 Interaction telemetry engine
│   ├── firebase.ts             # Firebase client SDK
│   ├── firebase-admin.ts       # Firebase Admin SDK (build-safe)
│   ├── mock-data.ts            # Firestore data fetcher + pipeline
│   ├── feed/
│   │   ├── dedupe.ts           # 🧹 SHA-256 + Jaro-Winkler dedup
│   │   ├── ranking.ts          # 📊 HSL relevance scoring
│   │   └── trending.ts         # 🔥 Dynamic trending calculator
│   ├── scrapers/
│   │   ├── devfolio.ts         # Playwright → Devfolio
│   │   ├── unstop.ts           # Playwright → Unstop
│   │   ├── hackerearth.ts      # Playwright → HackerEarth
│   │   ├── eventbrite.ts       # REST API → Eventbrite
│   │   └── normalize.ts        # Schema normalizer + expired pruner
│   └── search/
│       └── search.ts           # Fuzzy search + filters
└── proxy.ts                    # 🛡️ Route protection
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + Glassmorphism |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Auth** | Firebase Authentication |
| **Database** | Cloud Firestore |
| **Server SDK** | Firebase Admin SDK |
| **Scraping** | Playwright (Headless Chromium) |
| **API Polling** | Eventbrite Destination Search API |
| **PWA** | Serwist (Service Worker) |
| **Font** | Plus Jakarta Sans (Google Fonts) |

---

## 📡 API Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/sync/all` | Run all scrapers sequentially | Cron secret or admin |
| `POST` | `/api/scrape/devfolio` | Scrape Devfolio only | Cron secret or admin |
| `POST` | `/api/scrape/unstop` | Scrape Unstop only | Cron secret or admin |
| `POST` | `/api/scrape/hackerearth` | Scrape HackerEarth only | Cron secret or admin |
| `POST` | `/api/ingest` | Manual event ingest | Cron secret or admin |

**Authentication:** Include `x-kairo-sync-key: YOUR_CRON_SECRET` header, or be logged in as an admin user.

---

## 🔄 Data Pipeline

```
  Devfolio ──┐
  Unstop   ──┤  Playwright / API
  HackerEarth┤  Headless Scraping
  Eventbrite ┘
       │
       ▼
  [ Normalization ]  →  Consistent schema, date parsing, category mapping
       │
       ▼
  [ Batch Write ]    →  Firestore atomic transactions (500 docs/batch)
       │
       ▼
  [ Deduplication ]  →  SHA-256 hash + Jaro-Winkler fuzzy matching
       │
       ▼
  [ Ranking ]        →  Source priority + freshness + deadline urgency
       │
       ▼
  [ Trending ]       →  Top 15% by engagement score → isTrending flag
       │
       ▼
  [ Client Feed ]    →  Search, filter, infinite scroll, skeleton loading
```

---

## 🔐 Security Model

| Protection | Mechanism |
|-----------|-----------|
| **Admin Routes** | Proxy reads `kairo_user_email` cookie → checks against `ADMIN_EMAIL` whitelist |
| **Sync API** | Validates `x-kairo-sync-key` header against `CRON_SECRET` env var |
| **Session Management** | Cookie set on Firebase Auth login, cleared on logout (7-day TTL) |
| **Concurrency** | Firestore document lock (`/locks/sync`) with 20-min stale threshold |
| **Build Safety** | Firebase Admin uses Proxy fallback when credentials are unconfigured |

---

## 📊 Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `events` | Normalized event documents from all sources |
| `users` | User profiles (auto-created on first login) |
| `scrape_logs` | Scraper telemetry and operational audit trail |
| `analytics_events` | User interaction records (clicks, bookmarks) |
| `trending_tags` | Tag popularity counters for trending algorithm |
| `source_popularity` | Source engagement counters |
| `locks` | Concurrency lock documents for sync orchestration |

---

## 🚢 Deployment

### Docker / Node Server (Recommended)

This app is best deployed as a containerized Node server because the scrapers use Playwright.

1. Build locally with Docker:

```bash
docker build -t kairo .
```

2. Run it locally with your environment variables:

```bash
docker run --rm -p 3000:3000 --env-file .env.local kairo
```

3. Deploy the same `Dockerfile` to Railway, Render, Cloud Run, Fly.io, or any host that supports Docker.

4. Set the same environment variables from `.env.local` in the platform dashboard.

5. Trigger sync jobs with your platform scheduler or an external cron service:

```bash
curl -X POST https://your-domain.com/api/sync/all \
  -H "x-kairo-sync-key: your_cron_secret_here"
```

If you want a scheduled sync, run that request every 6 hours from your host's scheduler, GitHub Actions, or an external cron service.

---

## 🗺️ Roadmap

- [x] Multi-source event scraping (Devfolio, Unstop, HackerEarth, Eventbrite)
- [x] Deduplication + ranking + trending engine
- [x] Firebase Auth with glassmorphic login modal
- [x] Admin observability dashboard
- [x] Proxy route protection
- [x] Concurrency lock for sync jobs
- [x] Mobile UX with urgency badges & source pills
- [x] Interaction analytics telemetry
- [x] Batched Firestore writes
- [ ] Push notifications for bookmarked event deadlines
- [ ] AI-powered event recommendations
- [ ] Calendar integration (Google Calendar, Apple Calendar)
- [ ] Event comparison tool
- [ ] Community reviews & ratings

---

## 🤝 Contributing

Contributions make the open-source community amazing. Any contributions are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the Branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Ayushman Sahoo**

[![GitHub](https://img.shields.io/badge/GitHub-Ayushmansahoo098-181717?style=for-the-badge&logo=github)](https://github.com/Ayushmansahoo098)

---

<div align="center">

**Built with 🔥 and way too much caffeine.**

*If Kairo helped you find your next hackathon, consider giving it a ⭐*

</div>
