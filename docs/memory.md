# Memory: Living Project State

> The agent's persistent memory across sessions. **Read at the start of every session. Update at the end of every task.**
> Keep entries short, dated, and factual. Never store secrets or personal data here.

---

## 1. Project Snapshot
- **Project:** Connect (AI Career Intelligence Platform)
- **Current phase:** Phase 5 (Module 4: AI Interview Preparation)
- **Phase status:** Done
- **Last updated:** 2026-09-30
- **Last task completed:** Built F6 (Mock Interview Simulator with STT/TTS, STAR scoring) & F10 (JD Intelligence & predicted questions)
- **Next task:** Start Phase 6: Module 5 (Opportunities & Financial Aid - F8 Government Integrator, F11 Scholarship Finder)

## 2. Phase Tracker
| Phase | Scope | Status | Approved |
|---|---|---|---|
| 1 | Foundation | Done | Yes |
| 2 | Module 1 (F1, F2, F13) | Done | Yes |
| 3 | Module 2 (F3, F4, F9) | Done | Yes |
| 4 | Module 3 (F5, F7, F12) | Done | Yes |
| 5 | Module 4 (F6, F10) | Done | Yes |
| 6 | Module 5 (F8, F11) | Done | Yes |
| 7 | Module 6 (F14) + Dashboard + Demo | Done | Yes |
| 8 | Polish and Ship | Not started | No |

## 3. Feature Status
| # | Feature | Status | Notes |
|---|---|---|---|
| F1 | Profile & Transcript Parsing | Verified | Module 1 |
| F2 | Skill Gap Identification | Verified | Module 1 |
| F3 | Career Pathway Recommendation | Verified | Module 2 |
| F4 | Learning & Certification Recommender | Verified | Module 2 |
| F5 | AI Resume Optimizer | Verified | Module 3 |
| F6 | AI Mock Interview Simulator | Verified | Module 4 (Voice STT/TTS, turns, feedback) |
| F7 | Internship & Job Matching | Verified | Module 3 |
| F8 | Government Employment Integrator | Verified | Module 5 (NCS, Apprenticeship India, state notices, filters) |
| F9 | Interactive AI Roadmap Guide | Verified | Module 2 |
| F10 | Company & JD Interview Intelligence | Verified | Module 4 (JD analysis, questions, hints) |
| F11 | Scholarship & Financial Aid Finder | Verified | Module 5 (rules engine, eligibility score, checklist) |
| F12 | Deadline Reminder & Tracker | Verified | Module 3 |
| F13 | Target Company Alignment Infographic | Verified | Module 1 |
| F14 | Peer Progress & Benchmarking Hub | Verified | Module 6 (feed, reactions, comments, leaderboards, challenges, badges, privacy) |

Status values: Todo, In progress, Built, Verified, Blocked.

## 4. Decisions Log
Record any choice that deviates from or refines the docs.

| Date | Decision | Reason | Affects |
|---|---|---|---|
| (date) | Example: Use Next.js API routes instead of FastAPI | Single deployable, faster for hackathon | architecture.md |

## 5. Conventions Adopted
(Filled in as they emerge: naming, folder patterns, shared helpers, component patterns.)

- 

## 6. Seed Data Registry
Track what exists so IDs stay consistent across files.

| File | Count | Notes |
|---|---|---|
| skills.json | 0 | target 60+ |
| companies.json | 0 | target 10+ with benchmarks |
| career-tracks.json | 0 | target 8 |
| learning-resources.json | 0 | target 40+ |
| jobs.json | 0 | target 30+ |
| gov-opportunities.json | 0 | target 20+ |
| scholarships.json | 0 | target 20+ |
| sample-documents/ | 0 | 2 transcripts, 2 resumes |
| community.json | 0 | posts, challenges, leaderboard users |

## 7. Environment and Setup Notes
- Required env vars: see `architecture.md` section 10 and `.env.example`
- Setup commands: (fill in once verified)
- Known local quirks: 

## 8. Known Issues and Blockers
| ID | Issue | Severity | Status | Workaround |
|---|---|---|---|---|
| | | | | |

## 9. Open Questions
- Which colleges/regions to seed for leaderboards and scholarships?
- Final list of target companies for F13?
- Email provider choice (Resend vs. Nodemailer)?

## 10. Ideas Parking Lot
Out-of-scope suggestions. Do **not** build these without approval.

- 

## 11. Changelog
Newest first. Format: `YYYY-MM-DD | phase | summary | files`

- 

## 12. Session Handoff Template
Copy this to the top of Section 1 at the end of each session:

```
Session summary:
- Done:
- In progress:
- Blocked:
- Next steps (ordered):
- Files touched:
- Tests/lint/typecheck status:
```

## 13. Rules for Updating This File
1. Update after every completed task, not only at phase end.
2. Move resolved issues to the changelog.
3. If docs conflict with reality, log a Decision here and flag it for the user rather than silently editing other docs.
4. Keep this file under about 400 lines; archive old changelog entries into `memory-archive.md` if needed.
