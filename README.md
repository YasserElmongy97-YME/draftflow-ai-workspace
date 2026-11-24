# DraftFlow — AI Content Workspace

An editorial content workspace built with Next.js 16 (App Router), React 19, TypeScript, PostgreSQL (Neon), Drizzle ORM, and the Google Gemini API. Built for content teams to draft, revise, version, import, and export articles without losing history.

## Live Demo

- **Live Application:** Not deployed yet; Vercel environment setup and production verification are pending.
- **Demo Walkthrough:** See `docs/DEMO-SCRIPT.md`
- **Sample Outputs:** See `/samples` (`.md` and `.html`)
- **Internship reviewer access password:** `DraftFlow-Reviewers-2026`
- This reviewer password is intentionally public for easy demo access; it is not a private credential.

## Capabilities

- **Prompt Templates (Built-in + Custom):** Ships with 6 structured editorial templates and full CRUD (create, edit, delete) for custom team templates stored in PostgreSQL.
- **Tone & Length Controls:** Configure tone (`Direct`, `Editorial`, `Technical`, `Conversational`, `Executive`, `Persuasive`), length (`Short`, `Medium`, `Long`), target audience, and focus keywords.
- **Beyond a Simple API Wrapper:** Server-side prompt orchestration, streaming output with cancellation, targeted inline revisions (`Tighten`, `Clarify`, `Expand`, `Fix flow`, and `Shift tone`), undo/redo editing, and live document telemetry.
- **Immutable Version History:** Every generation, AI revision, import, and manual save appends a numbered snapshot (`v1`, `v2`, `v3`). Restoring an older version creates a new snapshot so history is never overwritten.
- **Seamless Export & Import:** Export as Markdown (`.md` with YAML frontmatter), standalone HTML (`.html`), Plain Text (`.txt`), or copy to clipboard — and re-import `.md`, `.html`, or `.txt` files back into the workspace (either as a new draft or as a new version snapshot on the active draft).
- **Shared-Password Access Gate:** A server-only `DEMO_ACCESS_PASSWORD` protects every page and app API. Login issues a signed, HttpOnly cookie that expires after 12 hours; `/api/health` remains public.
- **Rate Limiting & Secret Protection:** Sliding-window rate limiter on `/api/ai/*` returning HTTP `429` with `Retry-After` and `X-RateLimit-*` headers. Provider keys remain strictly server-side.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS (dark editorial design system)
- **Database:** PostgreSQL (Neon-ready) + Drizzle ORM
- **AI:** `@google/genai` (`gemini-2.5-flash`) with an automatic Offline/Demo Mode fallback when `GEMINI_API_KEY` is unset
- **Validation & Testing:** Zod 4, Vitest 5, ESLint

## Setup Guide

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Set:
- `DATABASE_URL`: Your Neon PostgreSQL connection string (`?sslmode=require`).
- `GEMINI_API_KEY`: Your server-side key from Google AI Studio (optional for local UI testing; if omitted, the app runs in Demo Mode).
- `DEMO_ACCESS_PASSWORD`: For the public reviewer demo, use `DraftFlow-Reviewers-2026` (also listed above). This is intentionally public; do not reuse it for private services or confidential data. Never prefix it with `NEXT_PUBLIC_`.

### 3. Push schema & seed initial data
```bash
npm run db:push
npm run db:seed
```

### 4. Run locally
```bash
npm run dev
```

### 5. Lint, verify types, tests, and production build
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Known Limitations

- The password gate is shared by all demo viewers, not per-user authentication or content isolation. The reviewer password is intentionally public, so the gate is a convenience screen, not a privacy boundary. Treat workspace content as shared demo data; do not enter confidential or customer information.
- Login and AI rate limits use in-memory process state. For broader multi-instance traffic, replace them with a shared store and add individual authentication/authorization.
- Rotate `DEMO_ACCESS_PASSWORD` to revoke all existing sessions; signed sessions expire within 12 hours.
