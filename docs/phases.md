# Phases: Build Plan

> Build in order. Stop at the end of each phase for review. Track status in `memory.md`.
> Legend: `[ ]` todo, `[~]` in progress, `[x]` done.

---

## Phase 1: Foundation
**Goal:** A running, authenticated shell with data layer and AI abstraction.

- [x] Initialize Next.js 14 + TS + Tailwind + shadcn/ui; ESLint, Prettier, Vitest
- [x] Prisma schema for all entities in `architecture.md`; migrations
- [x] Seed script and `prisma/seed-data/*.json` skeletons (skills, companies, tracks, resources)
- [x] NextAuth (credentials + Google), middleware protecting `(app)` routes
- [x] Consent screen and `Consents` storage
- [x] App layout: sidebar (6 modules), top bar, theme toggle, toasts
- [x] `lib/ai` client with zod validation, retry, fallback, caching
- [x] Adapter interfaces plus seed implementations (stubs)
- [x] `.env.example`, README skeleton

**Exit criteria:** Register, log in, see empty dashboard and all sidebar routes; one sample AI call returns validated JSON; `lint`, `typecheck`, and `test` pass.

---

## Phase 2: Module 1, Skill & Career Profile
**Features:** F1, F2, F13

- [x] File upload (encrypted storage) plus PDF/DOCX/TXT parsing
- [x] AI transcript/project extraction to editable Talent Profile with confidence scores
- [x] Skill framework adapter and seeded competency data (technical, soft, domain)
- [x] Gap analysis per target role with severity badges
- [x] Radar chart (student vs. company benchmark), category toggles, tooltips, PNG export
- [x] Company selector with 10+ seeded companies

**Exit criteria:** Upload sample transcript, see profile, gaps, and radar chart in under 60s.

---

## Phase 3: Module 2, AI Career Roadmap
**Features:** F3, F4, F9

- [x] Pathway recommendation (primary + 2 alternatives) with match %, salary, trend
- [x] Learning resource catalog, mapped to gaps, with filters
- [x] AI roadmap generation to React Flow graph (nodes, edges, dependencies)
- [x] Node drawer: details, resources, estimate, "Mark complete"
- [x] Persisted progress and overall percentage; XP awarded on completion

**Exit criteria:** Choose a track, generate a roadmap, complete nodes, refresh, and progress persists.

---

## Phase 4: Module 3, Career Application Assistant
**Features:** F5, F7, F12

- [x] Resume upload and ATS analysis, keyword table, diff view for rewrites
- [x] Job provider (seed) with match % and explainability; filters
- [x] Kanban tracker (5 columns) with dnd-kit, deadlines, notes
- [x] Notification service: in-app, email, push, `.ics`
- [x] Scheduler creating reminders at T-7, T-3, T-1

**Exit criteria:** Save a job to the tracker, drag across columns, and see a reminder fire for a near deadline.

---

## Phase 5: Module 4, AI Interview Preparation
**Features:** F6, F10

- [x] JD/company intelligence: paste JD or pick company, extract stack/culture/requirements
- [x] Question generator (technical, behavioral, situational) plus prep checklist
- [x] Mock interview UI: text plus voice (STT/TTS), streaming AI replies, follow-ups
- [x] Structured feedback (content, clarity, STAR structure, filler words, delivery)
- [x] Session history and trend chart; "Practice these" link from F10

**Exit criteria:** Run a full mock interview and view scored feedback.

---

## Phase 6: Module 5, Opportunities & Financial Aid
**Features:** F8, F11

- [x] Government opportunity provider (seeded NCS, Apprenticeship India, state notices) with filters
- [x] Scholarship provider, eligibility engine (rules first, AI explanation second)
- [x] Per-scholarship checklist with progress
- [x] "Save to tracker" for both

**Exit criteria:** Filter gov jobs by state and deadline; find scholarships matched to the demo student and tick a checklist.

---

## Phase 7: Module 6 + Dashboard + Demo Mode
**Feature:** F14 plus cross-cutting

- [x] Community feed with milestone sharing, reactions, comments
- [x] XP, streaks, badges; leaderboards (weekly/all-time, by college/track)
- [x] Peer challenges (create, join, submit, leaderboard)
- [x] Privacy controls: anonymous mode, opt-out
- [x] Dashboard: Readiness Score, next roadmap step, upcoming deadlines, peer rank
- [x] "Load demo student" (idempotent, under 5s) covering all 14 features

**Exit criteria:** Demo button yields a fully populated account; every feature is reachable.

---

## Phase 8: Polish and Ship
- [ ] Responsive pass (mobile, tablet, desktop)
- [ ] Accessibility pass (keyboard, focus, contrast, ARIA)
- [ ] Error boundaries and 404/500 pages
- [ ] Unit tests complete; Playwright smoke test of the demo journey
- [ ] README: setup, env vars, architecture diagram, demo script
- [ ] Browser-recorded walkthrough of the primary journey
- [ ] Final review against `prd.md` release-gate checklist

**Exit criteria:** All acceptance criteria in `prd.md` section 8 are checked.

---

## Suggested 5-Minute Demo Script
1. Load demo student, then dashboard and Readiness Score
2. Profile, then gap analysis and company radar
3. Roadmap, then complete a node
4. Resume optimizer, then save a job to the tracker
5. Mock interview (short), then feedback
6. Scholarships and government jobs
7. Community leaderboard and challenge
