# Memory: Living Project State

> The agent's persistent memory across sessions. **Read at the start of every session. Update at the end of every task.**
> Keep entries short, dated, and factual. Never store secrets or personal data here.

---

## 1. Project Snapshot
```
Session summary:
- Done: Phase 2 Module 1 (Skill & Career Profile - F1, F2, F13) built and verified end-to-end.
  - AES-256-GCM encrypted file storage & multi-format parsers (PDF, DOCX, TXT).
  - AI transcript/project extraction to editable Talent Profile with confidence scores.
  - Skill framework adapter with seeded competency benchmarks.
  - AI gap analysis per target role and company with severity badges (Critical, Important, Nice-to-have).
  - Target Company Alignment interactive radar chart (Recharts: student vs company benchmark, category toggles, PNG export).
  - Complete tabbed profile UI at /profile (Talent Profile, Skill Gaps, Target Radar).
  - 14 unit tests passing, typecheck passing, Next.js dev server running on port 3000.
- In progress: Ready for Phase 3 (Module 2: AI Career Roadmap).
- Blocked: None.
- Next steps (ordered):
  1. Begin Phase 3: Module 2 (F3 Career Pathway Recommendation, F4 Learning & Certification Recommender, F9 Interactive AI Roadmap Guide).
  2. Install React Flow (`@xyflow/react` or `reactflow`).
- Files touched in Phase 2:
  - src/lib/security/crypto.ts
  - src/lib/parsing/pdf.ts, src/lib/parsing/docx.ts, src/lib/parsing/text.ts, src/lib/parsing/index.ts
  - src/lib/ai/schemas/transcript.ts, src/lib/ai/schemas/gap-analysis.ts
  - src/lib/ai/prompts/transcript.ts, src/lib/ai/prompts/gap-analysis.ts
  - src/lib/scoring/readiness.ts
  - src/app/api/profile/upload/route.ts, src/app/api/profile/gap-analysis/route.ts, src/app/api/profile/route.ts
  - src/components/charts/skill-radar-chart.tsx, src/components/common/upload-dropzone.tsx, src/components/common/gap-analysis-panel.tsx
  - src/app/(app)/profile/profile-client.tsx, src/app/(app)/profile/page.tsx
  - src/tests/unit/scoring.test.ts, prisma/seed-data/sample-documents/sample_transcript.txt
  - phases.md, memory.md
- Tests/lint/typecheck status: All 14 unit tests PASS; 0 type errors. Dev server running on port 3000.
```

- **Project:** Connect (formerly PathFinder AI)
- **Current phase:** Phase 2 (Module 1, Skill & Career Profile)
- **Phase status:** Built & Verified
- **Last updated:** 2026-09-30
- **Last task completed:** Phase 2 Module 1 built and verified; transcript upload, AES-256 encryption, AI parsing, gap analysis, radar chart, 14 unit tests pass, dev server active.
- **Next task:** Begin Phase 3: Module 2 (F3, F4, F9)

## 2. Phase Tracker
| Phase | Scope | Status | Approved |
|---|---|---|---|
| 1 | Foundation | Built & Verified | Yes |
| 2 | Module 1 (F1, F2, F13) | Built & Verified | Yes |
| 3 | Module 2 (F3, F4, F9) | Not started | No |
| 4 | Module 3 (F5, F7, F12) | Not started | No |
| 5 | Module 4 (F6, F10) | Not started | No |
| 6 | Module 5 (F8, F11) | Not started | No |
| 7 | Module 6 (F14) + Dashboard + Demo | Not started | No |
| 8 | Polish and Ship | Not started | No |

## 3. Feature Status
| # | Feature | Status | Notes |
|---|---|---|---|
| F1 | Profile & Transcript Parsing | Built | Phase 2 |
| F2 | Skill Gap Identification | Built | Phase 2 |
| F3 | Career Pathway Recommendation | Todo | Phase 3 |
| F4 | Learning & Certification Recommender | Todo | Phase 3 |
| F5 | AI Resume Optimizer | Todo | Phase 4 |
| F6 | AI Mock Interview Simulator | Todo | Phase 5 |
| F7 | Internship & Job Matching | Todo | Phase 4 |
| F8 | Government Employment Integrator | Todo | Phase 6 |
| F9 | Interactive AI Roadmap Guide | Todo | Phase 3 |
| F10 | Company & JD Interview Intelligence | Todo | Phase 5 |
| F11 | Scholarship & Financial Aid Finder | Todo | Phase 6 |
| F12 | Deadline Reminder & Tracker | Todo | Phase 4 |
| F13 | Target Company Alignment Infographic | Built | Phase 2 |
| F14 | Peer Progress & Benchmarking Hub | Todo | Phase 7 |

Status values: Todo, In progress, Built, Verified, Blocked.

## 4. Decisions Log
Record any choice that deviates from or refines the docs.

| Date | Decision | Reason | Affects |
|---|---|---|---|
| 2026-09-30 | Official project name is "Connect" | Official name specified by user; replacing working name "PathFinder AI" across UI, page titles, metadata, README, package name, emails, and code comments | All UI, metadata, docs, and codebase |
| 2026-09-30 | Build Phase 1 first before Phase 2 | Confirmed with user: Phase 1 provides the foundational architecture (Next.js, database, auth, layout, AI abstraction) required for all subsequent modules | Phases 1 & 2 |
| 2026-09-30 | Cache fallback responses in AI client | Ensures consistent and predictable deterministic outputs across identical calls | `src/lib/ai/client.ts` |

## 5. Conventions Adopted
- Module components placed under `src/components/layout` and `src/components/common`.
- Centralized Prisma singleton in `src/lib/db.ts`.
- Adapter pattern in `src/lib/adapters/` with DB lookup and fallback seed data.
- Typed AI prompts with Zod schema validation in `src/lib/ai/`.

## 6. Seed Data Registry
Track what exists so IDs stay consistent across files.

| File | Count | Notes |
|---|---|---|
| skills.json | 60 | Technical, Soft, and Domain competencies |
| companies.json | 10 | Google, Microsoft, Amazon, Meta, TCS, Infosys, Deloitte, Stripe, Netflix, OpenAI |
| career-tracks.json | 8 | Full Stack, Backend, Frontend, Data Science, ML, DevOps, Cybersecurity, Consultant |
| learning-resources.json | 40 | Coursera, edX, NPTEL, AWS, Google, MIT, Fast.ai, etc. |
| jobs.json | 3 (seeded in adapter) | Full-time and internship listings |
| gov-opportunities.json | 2 (seeded in adapter) | NATS apprenticeships, NIC scientist |
| scholarships.json | 2 (seeded in adapter) | Reliance, Generation Google |
| sample-documents/ | 0 | Will populate in Phase 2 |
| community.json | 4 | Demo leaderboard entries |

## 7. Environment and Setup Notes
- Node.js runtime located at: `C:\Users\shank\AppData\Roaming\October\runtime\node-v24.19.0-win-x64\node.exe`.
- Required env vars: see `architecture.md` section 10 and `.env.example`.
- Setup commands: `npx prisma db push`, `npx tsx prisma/seed.ts`, `npm run dev`.

## 8. Known Issues and Blockers
| ID | Issue | Severity | Status | Workaround |
|---|---|---|---|---|
| 1 | Playwright browser runner download failed with 404 from upstream Azure CDN for v1.57.0 | Low | Open | Dev server runs on port 3000; all routes verified via HTTP/curl and direct compilation |

## 9. Open Questions
- Final confirmation to proceed with Phase 2 (Module 1: F1, F2, F13).

## 10. Ideas Parking Lot
- 

## 11. Changelog
- 2026-09-30 | Phase 1 | Completed Foundation phase: Next.js 14 shell, Prisma schema with SQLite, seed data, NextAuth, consent screen, full layout (sidebar, topbar, mobile nav), AI structured generation client with fallback & caching, adapter interfaces, 6 unit tests passing, typecheck & lint passing.
- 2026-09-30 | Phase 2 | Completed Module 1 (Skill & Career Profile): AES-256-GCM file encryption, multi-format parsing (PDF, DOCX, TXT), AI transcript/project extraction to Talent Profile, skill framework adapter, target role & company gap analysis with severity badges, Recharts company radar benchmark with PNG export, tabbed profile UI at /profile, 14 unit tests passing, typecheck passing, dev server active.

---
