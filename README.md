<div align="center">

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" width="100%" height="auto" style="border: 1px solid rgba(184, 168, 138, 0.15); border-radius: 4px;">
  <!-- Background Gradient matching Kairo Theme -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c0c0d"/>
      <stop offset="50%" stop-color="#1c1c1e"/>
      <stop offset="100%" stop-color="#0c0c0d"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8c775d"/>
      <stop offset="50%" stop-color="#b8a88a"/>
      <stop offset="100%" stop-color="#e8e2d5"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  
  <!-- Abstract network patterns -->
  <circle cx="150" cy="150" r="120" fill="#b8a88a" opacity="0.02" filter="url(#glow)"/>
  <circle cx="1050" cy="270" r="160" fill="#8c775d" opacity="0.03" filter="url(#glow)"/>
  
  <line x1="80" y1="210" x2="1120" y2="210" stroke="#b8a88a" stroke-width="0.5" opacity="0.15"/>
  <line x1="350" y1="80" x2="850" y2="340" stroke="#8c775d" stroke-width="0.5" opacity="0.1"/>

  <!-- Glowing Sparkle Logo -->
  <g transform="translate(600, 140) scale(1.6)">
    <path d="M0,-30 L8,-8 L30,0 L8,8 L0,30 L-8,8 L-30,0 L-8,-8 Z" fill="url(#textGrad)" filter="url(#glow)"/>
    <circle cx="0" cy="0" r="4" fill="#0c0c0d"/>
  </g>

  <!-- Title -->
  <text x="600" y="275" text-anchor="middle" font-family="'Times New Roman', Times, serif" font-weight="300" font-size="80" fill="url(#textGrad)" letter-spacing="20" filter="url(#glow)">KAIRO</text>
  
  <!-- Subtitle -->
  <text x="600" y="335" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-weight="bold" font-size="14" fill="#a08a75" letter-spacing="10">AI-POWERED EVENT DISCOVERY</text>
</svg>

<br />

### *Discover the Future of Events.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-12.13-orange?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Playwright](https://img.shields.io/badge/Playwright-1.60-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Kairo** is an AI-powered, real-time event discovery platform that aggregates hackathons, workshops, conferences, and meetups from **Devfolio**, **Unstop**, **HackerEarth**, **Eventbrite**, **Meetup.com**, and **Paytm Insider (District by Zomato)** into a single, beautifully personalized glassmorphic dashboard.

[Live Demo](#) · [Report Bug](https://github.com/Ayushmansahoo098/Kairo-Event-Discovery-app/issues) · [Request Feature](https://github.com/Ayushmansahoo098/Kairo-Event-Discovery-app/issues)

</div>

---

## ⚡ Core Architectural Innovation

Finding the right tech event means hopping across 5+ fragmented directories daily. Kairo resolves this through a highly optimized, production-ready backend sync architecture:

*   🕷️ **Multi-Source Crawling**: In-memory scrapers execute headless browser crawls using **Playwright Chromium** to harvest events from Devfolio, Unstop, HackerEarth, Meetup, and Paytm Insider (District), while querying the Eventbrite API.
*   🧹 **Jaccard Fuzzy Deduplication**: Merges events in-memory using **Jaccard Title Token overlap index ($\ge$ 70%)** combined with matching calendar dates or exact registration links.
*   💾 **Content-Hash Skip Writes**: Computes a SHA-256 `contentHash` on merged schemas and compares it to database values to **skip redundant writes**, reducing Firestore write costs to near-zero.
*   🔄 **Soft-Expiry Archiving**: Instead of deleting expired events (which breaks historical analytics and recommendations), stale documents are soft-expired (`status: "expired"`) and automatically pruned after **30 days**.
*   🔒 **Distributed Concurrency Lock**: A Firestore-based mutex prevents race conditions or overlapping scraper schedules.
*   🧠 **AI Event Recommendation Engine**: Integrates an optimized **FastAPI microservice** utilizing **Scikit-Learn TF-IDF vectorization** to construct lightweight and high-speed term-frequency representations of event attributes (Title, Description, Category, Tags), reducing RAM requirements from 800MB to <60MB.
*   👥 **Centroid-Based Behavioral User Profiles**: Dynamically weights and combines user interactions from Firestore (Explicit Interests: 4.0, Searches: 2.0, Views: 3.0, Bookmarks: 7.0, Registrations: 10.0) into a user profile centroid vector within the TF-IDF feature space.
*   ⚡ **Two-Tier Caching & Invalidation**: Accelerates recommendation loads with in-memory user profile centroid caching (30-minute TTL). Fires a completely non-blocking, fire-and-forget `POST /recommendations/invalidate` request on any user activity to keep listings fresh.
*   🎯 **Four-Factor Scoring Formula**: Ranks recommendations via a weighted score combining TF-IDF Cosine Similarity (70%), Popularity (15%), Event Proximity/Recency (10%), and Location Match (5%).
*   💬 **Kairo AI Event Assistant**: Floating glassmorphic chat drawer mounted globally and lazy-loaded dynamically to conserve client-side performance. Includes auto-focus inputs, double-submit protection, smooth scroll, and ChatGPT-style typing status animations.
*   🛡️ **Connection-Safe Client Routing**: Integrates a Next.js runtime API rewrite proxy (`/api/recommendation-proxy/*`) to route chat/recommendation requests. Resolves CORS issues and avoids build-time environment variable compilation conflicts.


---

## 🏗️ Architecture

The platform follows a layered microservices and serverless database architecture designed for scaling, reliability, and real-time processing:

```mermaid
graph TD
    %% Define Styles
    classDef client fill:#1E293B,stroke:#38BDF8,stroke-width:2px,color:#fff;
    classDef server fill:#0F172A,stroke:#F97316,stroke-width:2px,color:#fff;
    classDef database fill:#022C22,stroke:#10B981,stroke-width:2px,color:#fff;
    classDef scrapers fill:#3B0764,stroke:#A855F7,stroke-width:2px,color:#fff;
    classDef external fill:#1C1917,stroke:#A8A29E,stroke-width:2px,color:#fff;

    %% Frontend Layer
    subgraph UI_Layer [Client Application - Next.js 16 App Router]
        A["Dashboard & Landing Page (Framer Motion)"]
        B["Personalized Feeds (Trending, Near You, Recommended)"]
        C["Admin Observability Panel (Telemetry Dashboard)"]
    end
    class UI_Layer,A,B,C client;

    %% Backend Layer
    subgraph Ingestion_Layer [Serverless Backend Orchestrator]
        D["Unified Ingest API (/api/sync/all)"]
        E["Distributed Concurrency Lock (Firestore Mutex)"]
        F["Fuzzy Jaccard Deduplication Engine (>=70% Overlap)"]
        G["Content Hash Change-Detection (SHA-256)"]
        H["Soft-Expiry Lifecycle Manager (30-day Retention)"]
    end
    class Ingestion_Layer,D,E,F,G,H server;

    %% Scrapers Layer
    subgraph Crawler_Layer [Headless Scrapers & APIs]
        I["Devfolio Crawler (Playwright)"]
        J["Unstop Crawler (Playwright)"]
        K["HackerEarth Crawler (Playwright)"]
        L["Meetup.com Crawler (Playwright)"]
        M["Eventbrite Poller (REST API)"]
    end
    class Crawler_Layer,I,J,K,L,M scrapers;

    %% Storage Layer
    subgraph Storage_Layer [Cloud Firestore Database]
        N[("events (Canonical Events)")]
        O[("users (Profiles & Preferences)")]
        P[("scrape_logs (Crawler Telemetry)")]
        Q[("analytics_events (Dwell Time & Interactions)")]
    end
    class Storage_Layer,N,O,P,Q database;

    %% External Recommendation System
    subgraph AI_Layer [External Recommendation Engine]
        R["FastAPI Recommendation Microservice"]
        S["TF-IDF Vectorizer (Scikit-Learn)"]
    end
    class AI_Layer,R,S external;

    %% Connections
    A & B & C <-->|Firebase Client SDK / REST API| Storage_Layer
    D -->|Firestore Transaction| E
    D -->|Executes In-Memory| Crawler_Layer
    Crawler_Layer -->|Returns Event Array| F
    F -->|Computes Hashes| G
    G -->|Compares & Writes Changes| N
    H -->|Flags Stale Events & Prunes| N
    R <-->|Fetches Telemetry & Events| N & Q
    R -->|Builds TF-IDF Feature Profiles| N
    B <-->|Cosine Similarity Match| R
```

---

## 📂 Directory Layout

Below is a map of the repository's file structure to help navigate the codebase:

```text
├── .github/                  # GitHub Issue & Pull Request Templates
├── public/                   # Static assets, PWA icons, and offline fallback
├── scripts/                  # Scraper testing & telemetry validation scripts
│   ├── test_bms_scraper.mjs  # Playwright scraper with anti-bot evasion checks
│   ├── audit_bms.mjs         # Deduplication & schema validator for scraper payloads
│   └── render-sync.mjs       # Render Cron task trigger script
├── src/
│   ├── app/                  # Next.js App Router root
│   │   ├── admin/            # Observability & Conversion Analytics dashboards
│   │   ├── api/              # Scraper endpoints (/scrape) & sync triggers (/sync)
│   │   ├── events/           # Event Details pages with Framer Motion countdowns
│   │   ├── feed/             # Tabbed event discovery feed (trending, near you)
│   │   ├── globals.css       # Core Tailwind CSS rules & Glassmorphic variables
│   │   └── sw.ts             # Serwist Service Worker handler
│   ├── components/           # Reusable UI component cards and layouts
│   ├── context/              # Authentication & User Profile contexts
│   ├── hooks/                # Custom React hooks (useAuth, useScrapers)
│   └── lib/                  # Firestore db drivers & recommendation sync triggers
├── worker/                   # Scraper edge execution workers scaffolding
├── Dockerfile                # Deployment dockerfile on Playwright-supported OS
└── render.yaml               # Infrastructure-as-code spec for Render deployments
```

---

## ✨ Features

### 🎯 Core Aggregator & Deduplication Pipeline

```mermaid
flowchart TD
    A[Scrape Event Data] --> B(Devfolio, Unstop, HackerEarth, Eventbrite, Meetup)
    B --> C[Unified Sync In-Memory Ingestion]
    C --> D{Fuzzy Deduplication}
    D -- "Title Jaccard Index >= 70% & Date Match OR URL Match" --> E[Canonical Grouping & Merging]
    D -- "No Match" --> F[New Canonical Event]
    E --> G[Resolve Details by Source Priority]
    F --> H[Calculate SHA-256 contentHash]
    G --> H
    H --> I{Compare with DB hash}
    I -- "Hash Unchanged" --> J[Skip Firestore Write]
    I -- "Hash Changed / New" --> K[Batch Write to Firestore status: active]
    C --> L[Soft-Expiration Lifecycle]
    L --> M[Flag unvisited active DB events as expired]
    M --> N[Prune expired events older than 30 days]
```

### 🎨 Premium User Experience

*   **Glassmorphic Design**: Sleek dark theme with frosted-glass containers, harmonic gradients, and neon action states.
*   **AI "Recommended For You" Feed**: Renders custom matching scores (e.g. `95% Match`) and dynamic natural language explanations (e.g. `Matches your interest in AI`) based on user profile weights.
*   **"Similar Events" Carousel**: Renders a horizontal scrolling panel on the event details page querying `GET /similar` to display matching alternatives.
*   **Urgency Badges**: Dynamic indicators notify users of immediate actions (🚨 `Closes Today` · ⏳ `Tomorrow` · ⚠️ `3 Days Left`).
*   **Recently Viewed Carousels**: Locally cached browsing histories let users resume search runs.
*   **PWA Ready**: Offline caching, install banners, and application manifests powered by Serwist.


### 🔒 Operational Analytics & Telemetry

*   **Observability Dashboard**: Access restricted admin routes showing scrapers' success rates, durations, and logs.
*   **Interactive Charts**: Interactive charts displaying active counts for categories and geographic target markets.
*   **Unified scrape log table**: Real-time log entries with detail summaries and failure traceback audits.
*   **Analytics Funnel Dashboard (`/admin/analytics`)**: A premium Glassmorphic dashboard tracking user acquisition rates, onboarding completion statistics (including average completion times), view-to-register funnel conversion metrics, and detailed recommendation CTR, save, and registration performance. Includes optimized, non-scanning event leaderboards.

---

## 🚀 Quick Start

### Prerequisites
*   **Node.js** $\ge$ 18.0
*   **npm** $\ge$ 9.0
*   A **Firebase** web application project

### 1. Clone & Install
```bash
git clone https://github.com/Ayushmansahoo098/Kairo-Event-Discovery-app.git
cd Kairo-Event-Discovery-app
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root folder:
```env
# Firebase Client SDK credentials
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin whitelist emails
ADMIN_EMAIL=your_admin@email.com

# Cron synchronization secret key
CRON_SECRET=your_cron_secret_here
```

> [!IMPORTANT]
> **Firebase Authentication Configuration**:
> 1. **Sign-In Providers**: Enable **Google** and **GitHub** providers in your Firebase Console under **Authentication > Sign-in method**. For GitHub, register an OAuth application and copy/paste its client credentials, using `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler` as the callback URL.
> 2. **Authorized Domains**: Add your local host and production deployment domains (e.g. `localhost`, `kairo-events.vercel.app`) to your authorized domains whitelist in the Firebase Console under **Authentication > Settings > Authorized domains** to prevent OAuth origin rejections.

### 3. Install Playwright Browsers
```bash
npx playwright install chromium
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your local deployment.

### 5. Trigger Ingestion Synchronization
You can trigger the in-memory scraper queue and database update pipeline manually by making a post call:
```bash
curl -X POST http://localhost:3000/api/sync/all \
  -H "x-kairo-sync-key: your_cron_secret_here"
```

### 6. Setup FastAPI Recommendation Engine (Python)
Kairo requires the FastAPI recommendation microservice to compute personalized event rankings.

1. **Navigate to the recommendation engine directory**:
   ```bash
   cd recommendation-service
   ```
2. **Create and activate a Python virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. **Install dependencies**:
   ```bash
   pip install fastapi uvicorn scikit-learn pydantic firebase-admin
   ```
4. **Configure FastAPI Environment**:
   Ensure your local Python environment has the `google-services.json` or necessary environment variables matching your Firestore instance.
5. **Run the FastAPI server**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
6. **Add the environment variable** to your `.env.local` in the Next.js root folder:
   ```env
   NEXT_PUBLIC_RECOMMENDATION_API_URL=http://localhost:8000
   ```
   > [!NOTE]
   > **Production Deployments**: In production (e.g. on Render/Vercel), Kairo client calls are proxied dynamically via the relative path `/api/recommendation-proxy/*` to bypass CORS and avoid build-time inlining. You can configure the target URL dynamically in your deployment settings by setting the environment variable `RECOMMENDATION_API_URL` (or `NEXT_PUBLIC_RECOMMENDATION_API_URL`) at runtime without needing to rebuild the Next.js Docker image.


### 7. Run Scraper Integration Tests
To test browser scraping anti-bot evasion and Jaccard deduplication logic before scheduling cron triggers:

*   **Test Playwright browser scraping (BookMyShow prototype)**:
    ```bash
    node scripts/test_bms_scraper.mjs
    ```
*   **Run Jaccard index check audits on events metadata**:
    ```bash
    node scripts/audit_bms.mjs
    ```

---

## 📡 API Endpoints Reference

### 🌐 Next.js Gateway Endpoints

| Method | Endpoint | Description | Auth Requirement |
|:---|:---|:---|:---|
| `POST` | `/api/sync/all` | Runs all scrapers in-memory, deduplicates, and commits canonical outputs | `x-kairo-sync-key` or Session cookie |
| `POST` | `/api/scrape/devfolio` | Scrape Devfolio directory only | `x-kairo-sync-key` or Session cookie |
| `POST` | `/api/scrape/unstop` | Scrape Unstop directory only | `x-kairo-sync-key` or Session cookie |
| `POST` | `/api/scrape/hackerearth` | Scrape HackerEarth directory only | `x-kairo-sync-key` or Session cookie |
| `POST` | `/api/ingest` | Raw manual event ingestion and ingestion | `x-kairo-sync-key` or Session cookie |

### 🧠 AI Recommendation Service Endpoints (FastAPI)

| Method | Endpoint | Description | Parameters |
|:---|:---|:---|:---|
| `GET` | `/recommendations` | Computes personalized event recommendations for a user | `userId` (query), `limit` (query, default 20) |
| `GET` | `/similar` | Finds structurally similar events using Cosine Similarity | `eventId` (query), `limit` (query, default 10) |
| `POST` | `/recommendations/invalidate` | Invalidates the user profile cache for fresh personalization | `userId` (query) |
| `POST` | `/embeddings/sync` | Re-syncs Firestore events and rebuilds vocabulary and TF-IDF matrix | None |


---

## 🔐 Security & Lock Model

*   **Concurrency locking**: The orchestrator writes to `/locks/sync` prior to scraping to prevent duplicate overlapping runs. If another sync task is triggered while active, a `409 Conflict` is returned.
*   **Whitelisted Admin Guards**: Whitelisted email routes are validated at edge proxy routes, checking against admin profile permissions.
*   **Telemetry tracking**: Every unified run logs detailed performance telemetry directly to the `scrape_logs` collection.

---

## 🗺️ Future Roadmap

Kairo is designed to grow into a comprehensive event discovery and collaboration ecosystem. Future plans include:

*   🔌 **Expanded Event Catalog**:
    *   Deploying the **BookMyShow** crawler (currently prototyping at [test_bms_scraper.mjs](file:///Users/ayushmansahoo/Documents/GitHub/Kairo-Event-Discovery-app/scripts/test_bms_scraper.mjs)) to harvest local cultural, social, and tech-entertainment experiences.
    *   Adding connectors for **Luma** and **Partiful** to capture private community-driven gatherings and local tech meetups.
*   🧠 **Semantic AI Embeddings**:
    *   Transitioning from TF-IDF vector matching to dense vector embeddings using **Gemini API** (via Firebase AI Logic) for richer, context-aware semantic matching.
    *   Implementing LLM-powered categorization to auto-tag event themes and generate concise one-sentence TL;DR summaries.
*   👥 **Social Hub & Team Formation**:
    *   **Hackathon Team Matcher**: An opt-in portal connecting developers, designers, and managers attending the same hackathon based on complementary skills.
    *   **Attending Feeds**: Seeing which of your GitHub connections or peers are RSVPing to specific events.
*   🗺️ **Geospatial Map View**:
    *   Integrating interactive maps (via **Mapbox** or **Leaflet**) so users can browse workshops, meetups, and local events geographically.
*   📅 **Calendar Integration & Alerts**:
    *   One-click exporting to **Google Calendar**, **Outlook**, and **Apple Calendar** (`.ics`).
    *   Automated notification alerts (Email, Discord webhooks, or Telegram) when a newly scraped event scores above an 85% match for your profile.

---

## 👨‍💻 Author

**Ayushman Sahoo**

[![GitHub](https://img.shields.io/badge/GitHub-Ayushmansahoo098-181717?style=for-the-badge&logo=github)](https://github.com/Ayushmansahoo098)

---

<div align="center">

**Built with 🔥, TypeScript, and extreme optimization.**

*If Kairo helped you find your next hackathon or meetup, consider giving it a ⭐*

</div>
