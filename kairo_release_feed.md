# ⚡ Kairo Event Discovery — Release Feed

**Ayushmansahoo098** merged 30 commits into `main` 🚀

## Title: `feat: live countdown, premium profile customizer, AI recommendation feed, and UX optimizations`

---

### 📱 Live Countdown & Event Details
* **Real-time Countdown Timer:** Displays ticking Days : Hours : Min : Sec until the event starts, featuring smooth slide-digit transitions powered by Framer Motion.
* **CTA Shimmer Sweep:** Adds a diagonal light gradient sweep to the "Register Now" button on hover for a tactile, responsive feel.
* **Staggered Entry Transitions:** Implements smooth fade-up animations on page elements (title, date/time cards, description) using custom cubic-bezier easing.
* **Similar Events Carousel:** Recommends alternative events based on shared tags and category tags.

### 👤 Profile Image Customizer
* **Direct Storage Integration:** Implements profile image uploads directly into Firebase Storage.
* **Camera Overlay & Crop:** Includes an interactive web camera capture modal alongside a standard file picker.
* **State Syncing:** Instantly updates local profile context and visual avatar upon success.

### 🧠 Personalized AI Recommendation Engine
* **Matching Scores & Explanations:** Displays custom match percentages (e.g. "94% Match") and reasons (e.g. "Matches your interest in Hackathons") computed from user preferences.
* **Advanced Feed Sorting:** Tabs for Recommended, Trending, Near You, Upcoming, and Saved-similar events.
* **Unified Ingest:** Combines Devfolio, HackerEarth, Unstop, and Eventbrite scrapers into a single Jaccard-deduplicated sync pipeline.

### 🛠️ Production Hardening & Polish
* **SSR Safety:** Ensured Firebase initialization runs correctly in Server-Side Rendering environments.
* **Linter Compliance:** Resolved all TypeScript type mismatches, missing dependencies, and React key warnings.
* **Mobile UX Adjustments:** Cleaned up bottom navigation bar padding, aligned profile menus, and removed redundant spacing.
