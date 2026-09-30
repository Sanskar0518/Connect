# Architecture: PathFinder AI

> Defines **how** the system is built. Product intent lives in `prd.md`.
> Any deviation from this document must be logged in `memory.md` under Decisions.

## 1. Tech Stack
| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | Full-stack monolith for hackathon speed |
| Styling | Tailwind CSS + shadcn/ui | See `design.md` |
| Charts | Recharts | Radar, trend, progress charts |
| Roadmap graph | React Flow | Node-based learning tree |
| Kanban | dnd-kit | Application tracker |
| Database | SQLite via Prisma | Schema must stay Postgres-compatible |
| Auth | NextAuth (credentials + Google) | Student role only |
| AI | Gemini API via `lib/ai` | Single abstraction, provider swappable |
| Validation | zod | All API input and AI output |
| File parsing | pdf-parse, mammoth | PDF and DOCX |
| Speech | Web Speech API | STT and TTS in the browser |
| Email | Resend or Nodemailer | Reminders |
| Push | Service worker + web-push | PWA notifications |
| Scheduler | node-cron (or Next route + external cron) | Reminder jobs |
| Testing | Vitest (unit), Playwright (smoke) | |

If a different backend (e.g. FastAPI) is chosen, justify it in `memory.md` before implementing.

## 2. High-Level Diagram
```
Browser (Next.js UI, PWA, Web Speech)
        |
Next.js API Routes / Server Actions  --- zod validation
        |
  Service Layer (per module)
   |         |            |
 Prisma    lib/ai      Provider Adapters
 (SQLite)  (Gemini)    (skills, jobs, gov, scholarships, scraper)
        |
 Scheduler (cron) --> Notification Service --> in-app / email / push / .ics
```

## 3. Folder Structure
```
/docs                      prd.md architecture.md rules.md phases.md design.md memory.md
/prisma                    schema.prisma, seed.ts, seed-data/*.json
/src
  /app
    /(auth)                login, register, consent
    /(app)
      dashboard/
      profile/             (F1, F2, F13)
      roadmap/             (F3, F4, F9)
      applications/        (F5, F7, F12)
      interview/           (F6, F10)
      opportunities/       (F8, F11)
      community/           (F14)
    /api                   route handlers per module
  /components
    /ui                    shadcn primitives
    /charts /roadmap /kanban /interview /common
  /lib
    ai/                    client.ts, prompts/, schemas/, retry.ts
    adapters/              skills, jobs, gov, scholarships, scraper (interface + seed impl)
    services/              one file per domain
    scoring/               readiness.ts, ats.ts, matching.ts, eligibility.ts
    notifications/         email.ts, push.ts, ics.ts, scheduler.ts
    parsing/               pdf.ts, docx.ts, text.ts
    security/              crypto.ts, consent.ts
    db.ts  auth.ts  env.ts
  /tests
/public                    sw.js, manifest.json
```

## 4. Data Model (Prisma entities)
Users, Profiles, Skills, ProfileSkills (confidence), Courses (academic), Projects, GapAnalyses, CareerTracks, Roadmaps, RoadmapNodes, NodeProgress, LearningResources, Resumes, ResumeAnalyses, Jobs, Applications (kanban items, polymorphic source), InterviewSessions, InterviewTurns, InterviewFeedback, Companies, CompanyBenchmarks, Scholarships, ScholarshipChecklistProgress, GovOpportunities, Posts, Reactions, Comments, Challenges, ChallengeSubmissions, Badges, UserBadges, XPEvents, Notifications, Consents, PushSubscriptions.

Key relationships:
- User 1:1 Profile; Profile M:N Skills via ProfileSkills(confidence, source).
- Roadmap 1:N RoadmapNodes (with `dependsOn` edges); NodeProgress per user per node.
- Application references `sourceType` (JOB | SCHOLARSHIP | GOV) plus `sourceId`.
- InterviewSession 1:N InterviewTurns; 1:1 InterviewFeedback.

Rules: every table has `id`, `createdAt`, `updatedAt`; user-owned rows have `userId` and are always queried scoped to the session user.

## 5. AI Layer (`lib/ai`)
- Single entry: `generateStructured<T>({ prompt, schema, system, temperature })`.
- Flow: build prompt, call Gemini in JSON mode, parse, validate with zod, retry up to 2 times with the validation error appended, then fall back to a deterministic or cached result.
- Prompts live in `lib/ai/prompts/*.ts` as typed functions. No inline prompt strings in routes.
- Streaming is used for mock interview replies and long generations.
- Grounding: any URL, course, job, or scholarship must originate from seed data or adapters. The model selects and ranks; it does not invent records.
- Cost control: cache by content hash (e.g. parsed transcript, JD analysis) in the DB.

### AI tasks and outputs
| Task | Output schema |
|---|---|
| Transcript parse | courses[], projects[], skills[{name, category, confidence}] |
| Gap analysis | gaps[{skill, severity, reason}] |
| Pathway recommendation | tracks[{name, matchPct, reasoning, salary, trend}] |
| Roadmap generation | nodes[], edges[] with estimates and resource IDs |
| Resume analysis | atsScore, keywords, issues[], rewrites[{before, after}] |
| Interview turn | nextQuestion, followUp?, signals |
| Interview feedback | scores{content, clarity, structure, confidence, delivery}, tips[] |
| JD intelligence | techStack[], culture[], requirements[], questions[] |
| Scholarship fit | eligibility, reasons[] |

## 6. Adapter Interfaces
Each external source is behind an interface with a seed implementation now and a real one later.
```ts
interface SkillFrameworkProvider { getRoleCompetencies(role: string): Promise<Competency[]> }
interface JobProvider            { search(q: JobQuery): Promise<Job[]> }
interface GovFeedProvider        { list(f: GovFilter): Promise<GovOpportunity[]> }
interface ScholarshipProvider    { list(f: ScholarshipFilter): Promise<Scholarship[]> }
interface PageScraper            { fetchText(url: string): Promise<string | null> }  // robots.txt aware
```
Provider selection via env flags (`PROVIDER_SKILLS=seed|onet`, etc.).

## 7. Scoring Logic (pure, unit-tested)
- `readiness.ts`: score = 0.35 * skillCoverage + 0.30 * roadmapProgress + 0.20 * resumeScore + 0.15 * interviewScore.
- `matching.ts`: weighted Jaccard-style overlap of profile skills vs. requirements, with matched/missing lists.
- `ats.ts`: keyword coverage, section presence, formatting heuristics.
- `eligibility.ts`: rule-based scholarship filter first, AI explanation second.

## 8. Notifications
- Scheduler runs daily and hourly checks; creates `Notification` rows at T-7, T-3, T-1 days.
- Channels: in-app (always), email, web push (opt-in), `.ics` download per deadline.
- Dedupe key: `(applicationId, offsetDays, channel)`.

## 9. Security and Privacy
- Auth on all `(app)` routes via middleware; row-level scoping by `userId`.
- Uploaded files encrypted at rest (AES-256-GCM, key from env); stored outside `/public`.
- Consent screen before first upload; stored in `Consents`.
- Data export and delete endpoints (hard delete cascades).
- Rate limit AI endpoints; sanitize file names; cap upload size (10 MB) and types.
- Secrets only in `.env`; provide `.env.example`.
- Bias note displayed on recommendation screens.

## 10. Environment Variables
`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`, `ENCRYPTION_KEY`, `RESEND_API_KEY` (or SMTP vars), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `PROVIDER_*` flags.

## 11. Performance Targets
- Transcript to gap analysis under 60s.
- Page interactions under 200ms after data load; skeletons for anything slower.
- Roadmap graph handles 60+ nodes smoothly.
