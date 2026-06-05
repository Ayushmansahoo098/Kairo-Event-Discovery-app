<div align="center">

<img src="public/banner.png" alt="Kairo — Event Discovery Platform" width="100%" />

# 🔥 KAIRO

### *Discover the Future of Events.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-12.13-orange?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Playwright](https://img.shields.io/badge/Playwright-1.60-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)

**Kairo** is an AI-powered, real-time event discovery platform that aggregates hackathons, workshops, conferences, and meetups from **Devfolio**, **Unstop**, **HackerEarth**, **Eventbrite**, and **Meetup.com** into a single, beautifully personalized glassmorphic dashboard.

[Live Demo](#) · [Report Bug](https://github.com/Ayushmansahoo098/Kairo-Event-Discovery-app/issues) · [Request Feature](https://github.com/Ayushmansahoo098/Kairo-Event-Discovery-app/issues)

</div>

---

## ⚡ Core Architectural Innovation

Finding the right tech event means hopping across 5+ fragmented directories daily. Kairo resolves this through a highly optimized, production-ready backend sync architecture:

*   🕷️ **Multi-Source Crawling**: In-memory scrapers execute headless browser crawls using **Playwright Chromium** to harvest events from Devfolio, Unstop, HackerEarth, and Meetup, while querying the Eventbrite API.
*   🧹 **Jaccard Fuzzy Deduplication**: Merges events in-memory using **Jaccard Title Token overlap index ($\ge$ 70%)** combined with matching calendar dates or exact registration links.
*   💾 **Content-Hash Skip Writes**: Computes a SHA-256 `contentHash` on merged schemas and compares it to database values to **skip redundant writes**, reducing Firestore write costs to near-zero.
*   🔄 **Soft-Expiry Archiving**: Instead of deleting expired events (which breaks historical analytics and recommendations), stale documents are soft-expired (`status: "expired"`) and automatically pruned after **30 days**.
*   🔒 **Distributed Concurrency Lock**: A Firestore-based mutex prevents race conditions or overlapping scraper schedules.

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
        S["Sentence-Transformers (all-MiniLM-L6-v2)"]
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
    R -->|Caches Embeddings| N
    B <-->|Similarity Vectors| R
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
*   **Match Badges**: Displays custom matching percentages (e.g. `95% Match`) powered by AI profile weights.
*   **Urgency Badges**: Dynamic indicators notify users of immediate actions (🚨 `Closes Today` · ⏳ `Tomorrow` · ⚠️ `3 Days Left`).
*   **Recently Viewed Carousels**: Locally cached browsing histories let users resume search runs.
*   **PWA Ready**: Offline caching, install banners, and application manifests powered by Serwist.

### 🔒 Operational Analytics & Telemetry

*   **Observability Dashboard**: Access restricted admin routes showing scrapers' success rates, durations, and logs.
*   **Interactive Charts**: Interactive charts displaying active counts for categories and geographic target markets.
*   **Unified scrape log table**: Real-time log entries with detail summaries and failure traceback audits.

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

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth Requirement |
|:---|:---|:---|:---|
| `POST` | `/api/sync/all` | Runs all scrapers in-memory, deduplicates, and commits canonical outputs | `x-kairo-sync-key` or Session cookie |
| `POST` | `/api/scrape/devfolio` | Scrape Devfolio directory only | `x-kairo-sync-key` or Session cookie |
| `POST` | `/api/scrape/unstop` | Scrape Unstop directory only | `x-kairo-sync-key` or Session cookie |
| `POST` | `/api/scrape/hackerearth` | Scrape HackerEarth directory only | `x-kairo-sync-key` or Session cookie |
| `POST` | `/api/ingest` | Raw manual event ingestion and ingestion | `x-kairo-sync-key` or Session cookie |

---

## 🔐 Security & Lock Model

*   **Concurrency locking**: The orchestrator writes to `/locks/sync` prior to scraping to prevent duplicate overlapping runs. If another sync task is triggered while active, a `409 Conflict` is returned.
*   **Whitelisted Admin Guards**: Whitelisted email routes are validated at edge proxy routes, checking against admin profile permissions.
*   **Telemetry tracking**: Every unified run logs detailed performance telemetry directly to the `scrape_logs` collection.

---

## 👨‍💻 Author

**Ayushman Sahoo**

[![GitHub](https://img.shields.io/badge/GitHub-Ayushmansahoo098-181717?style=for-the-badge&logo=github)](https://github.com/Ayushmansahoo098)

---

<div align="center">

**Built with 🔥, TypeScript, and extreme optimization.**

*If Kairo helped you find your next hackathon or meetup, consider giving it a ⭐*

</div>
