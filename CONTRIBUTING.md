# Contributing to Kairo Event Discovery

First off, thank you for taking the time to contribute! 🎉 

Kairo is built to consolidate and simplify the event-discovery experience. To maintain clean architecture, consistency, and stability, please review and adhere to these guidelines.

---

## 🗺️ Codebase Overview

Before writing code, familiarize yourself with the project structure:
*   `src/app/` - Next.js App Router pages, layouts, and API routes.
*   `src/components/` - Shared UI elements (buttons, cards, dashboard containers).
*   `src/context/` - React Context providers (Auth, Profile, Theme).
*   `src/lib/` - Shared utilities, helper functions, and database connectors.
*   `scripts/` - Scraper prototypes, cron triggers, and sync scripts.

---

## 🌿 Git Branching Convention

We enforce a clean git hierarchy. Always create a branch off of `main` using the following naming syntax:

*   `feat/your-feature-name` - For new features or enhancements (e.g. `feat/calendar-sync`).
*   `fix/bug-description` - For bug fixes (e.g. `fix/devfolio-date-parsing`).
*   `docs/update-area` - For documentation updates (e.g. `docs/add-api-endpoints`).
*   `refactor/module-name` - For cleanups and structural improvements (e.g. `refactor/deduplication-logic`).
*   `chore/update-deps` - For build scripts, configuration changes, or dependencies.

---

## ✍️ Commit Message Guidelines

We use **Conventional Commits** to keep git history readable and automatically generate changelogs. Format your commit messages as:

```
<type>(<scope>): <short description>
```

### Supported Types:
*   `feat`: A new feature (e.g. `feat(auth): add GitHub sign-in support`)
*   `fix`: A bug fix (e.g. `fix(scrapers): handle empty category fields in Unstop`)
*   `docs`: Documentation changes only (e.g. `docs(readme): document render deployment steps`)
*   `style`: Changes that do not affect the meaning of the code (formatting, missing semi-colons)
*   `refactor`: A code change that neither fixes a bug nor adds a feature
*   `test`: Adding missing tests or correcting existing tests
*   `chore`: Changes to the build process, environment variables, or tool configuration

---

## 🛠️ Local Development Setup

To configure Kairo locally, follow the step-by-step instructions:

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/Ayushmansahoo098/Kairo-Event-Discovery-app.git
   cd Kairo-Event-Discovery-app
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and fill in your Firebase configuration and API keys.
4. **Install Headless Browsers (Playwright)**:
   ```bash
   npx playwright install chromium
   ```
5. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing Scrapers Locally

Kairo uses **Playwright Chromium** to execute headful or headless browser crawling. 

*   To run the scraper test suite:
    ```bash
    node scripts/test_bms_scraper.mjs
    ```
*   Ensure that changes to scraper files (`src/app/api/scrape/...`) are audited using sandbox settings to prevent bot detection blocks.

---

## 🎨 Code Style & Standards

To keep the codebase clean, we enforce the following rules:

### TypeScript
*   Avoid using `any`. Write explicit type definitions and interfaces for all models (e.g. `Event`, `User`, `ScrapeLog`).
*   Keep helper utilities isolated in `src/lib/` and write pure functions where possible.

### CSS & Styling
*   We use **Tailwind CSS v4** combined with vanilla CSS classes where needed.
*   Stick to the design tokens declared in `src/app/globals.css`.
*   Maintain the **Glassmorphic Theme**: use semi-transparent background colors, backdrop filters (`backdrop-blur-md`), and gold/sand border gradients (`border-[#b8a88a]/15`).

### Quality Check
Before committing, verify code quality by running the linter:
```bash
npm run lint
```
PRs that fail the linter will block the merging pipeline.

---

## 🚀 Submitting a Pull Request

1. Push your branch to GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request from your branch to `main`.
3. Fill out the Pull Request template completely.
4. Request reviews from the main maintainer.
5. Address any review comments and ensure all checks (linting, build verification) pass.
