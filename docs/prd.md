# PRD: PathFinder AI

> Source of truth for **what** we are building and **why**.
> For *how*, see `architecture.md`. For *order of work*, see `phases.md`.

## 1. Product Summary
PathFinder AI is an AI-powered career readiness platform for students. It takes a student from an unclear profile to job-ready by profiling their skills, identifying gaps against industry benchmarks, generating a personalized learning roadmap, optimizing applications, preparing for interviews, surfacing opportunities and financial aid, and enabling peer learning.

## 2. Goals
1. Build a unified, editable talent profile from transcripts, projects, and interests.
2. Show exactly which skills a student lacks for a target role or company.
3. Turn gaps into an interactive, trackable learning roadmap.
4. Help students apply (resume, job matching, tracking) and interview (mock + company intel).
5. Surface government opportunities and scholarships students would otherwise miss.
6. Sustain motivation via peer benchmarking and gamification.

## 3. Non-Goals
- No real payments or course enrollment (link out only).
- No employer-side portal.
- No native mobile apps (responsive web + PWA push only).
- No scraping that violates robots.txt or site ToS.

## 4. Target Users
| Persona | Description | Key Need |
|---|---|---|
| Final-year student | Preparing for placements | Fast gap analysis, resume + interview prep |
| Early-year student | Exploring careers | Pathway recommendation, roadmap |
| Financially constrained student | Needs aid | Scholarship and government job discovery |
| Peer learner | Motivated by community | Leaderboards, challenges |

## 5. Modules and Features (14 total)

### Module 1: Student Skill & Career Profile
**F1. Student Profile & Transcript Parsing**
- Upload transcripts, syllabi, project descriptions (PDF/DOCX/TXT); add interests and GitHub/portfolio link.
- AI extracts courses, grades, projects, skills into a structured Talent Profile.
- Each skill has a confidence score; the student can edit, add, or remove skills.
- *Accept:* Upload to populated profile in under 60 seconds with demo files.

**F2. Skill Gap Identification**
- Map profile skills against a competency framework (technical, soft, domain), modeled on O*NET/Lightcast via a pluggable adapter.
- Per target role output: matched skills, missing skills, severity (Critical / Important / Nice-to-have).
- *Accept:* Gap list renders for any seeded role with severity badges.

**F13. Target Company Skill Alignment Infographic**
- Interactive radar chart: student skills vs. selected company benchmark (10+ seeded companies).
- Category toggles, hover tooltips, downloadable PNG.
- *Accept:* Switching company updates the chart without page reload.

### Module 2: AI Career Roadmap
**F3. Career Pathway Recommendation**
- One primary and two alternative tracks with match %, reasoning, salary range, demand trend.

**F4. Learning & Certification Recommender**
- Courses, micro-credentials, certifications mapped to each gap (Coursera, edX, NPTEL, Google, AWS, etc.).
- Shows cost, duration, level, link. Filters: free/paid, duration, level.
- Links come only from the seeded catalog. Never invented.

**F9. Interactive AI Roadmap Guide**
- roadmap.sh-style node-based tree generated per career track.
- Node states: Not started / In progress / Done. Each node has resources and estimated time.
- Clicking a node opens a side drawer with details and "Mark complete".
- Progress persists and rolls up to an overall percentage.
- *Accept:* Progress survives logout/login.

### Module 3: Career Application Assistant
**F5. AI Resume Optimizer**
- Upload resume plus optional job description.
- Output: ATS score, keyword match/density, missing keywords, formatting issues, before/after bullet rewrites (diff view).

**F7. Internship & Job Matching Engine**
- Match profile to seeded listings via a provider interface.
- Match % with explanation ("matched: React, SQL; missing: Docker"). Filters. One-click "Save to tracker".

**F12. Deadline Reminder & Application Tracker**
- Kanban: Saved, Applied, Interviewing, Accepted, Rejected. Drag and drop.
- Fields: deadline, notes, link, source (job, scholarship, gov).
- Reminders at 7, 3, and 1 day before deadline via in-app, email, web push, and `.ics` export.
- *Accept:* A saved item with a near deadline triggers a visible reminder.

### Module 4: AI Interview Preparation
**F6. AI Mock Interview Simulator**
- Technical and behavioral modes; voice (Web Speech API) or text input; TTS for questions.
- AI asks follow-ups; final structured feedback scored on content, clarity, structure (STAR), confidence/filler words, delivery.
- Session history and improvement trend chart.
- *Accept:* Complete a session end to end and view feedback.

**F10. Company & JD-Specific Interview Intelligence**
- Paste a JD or select a company. Extract tech stack, culture signals, key requirements.
- Generate technical, behavioral, situational questions and a prep checklist.
- One-click "Practice these" launches F6 preloaded.
- Scraping is optional, must respect robots.txt, and must fall back gracefully to pasted text.

### Module 5: Opportunities & Financial Aid
**F8. Government Employment Integrator**
- Aggregated feed of public-sector jobs, apprenticeships, national/state schemes (seed with NCS, Apprenticeship India, state PSC-style notices).
- Filters: state, qualification, deadline. Structured for later RSS/API sources.

**F11. Scholarship & Financial Aid Finder**
- Match by demographics, academic record, course, income bracket.
- Shows eligibility fit, amount, deadline, and a per-scholarship checklist with progress. Save to tracker.

### Module 6: Peer & Social Learning
**F14. Peer Progress Sharing & Social Benchmarking Hub**
- Share roadmap milestones to a feed with reactions and comments.
- Leaderboards (weekly/all-time, by college/track) driven by XP and streaks. Badges.
- Peer skill challenges: create, join, submit, leaderboard.
- Privacy: anonymous mode and opt-out.

## 6. Cross-Cutting Requirements
- **Readiness Score (0-100):** weighted blend of skill coverage, roadmap progress, resume score, interview score.
- **Gamification:** XP, streaks, badges.
- **Demo Mode:** "Load demo student" populates realistic data for all 14 features.
- **Privacy:** consent screen, encrypted uploads, data export/delete, bias-awareness note on recommendations.
- **Reliability:** every AI output schema-validated with retry and fallback.

## 7. Success Metrics (Hackathon)
- All 14 features reachable from the sidebar and working on demo data.
- Full user journey demoable in under 5 minutes.
- Zero unhandled errors during the demo path.

## 8. Acceptance Criteria (Release Gate)
- [ ] New user uploads a transcript and sees gap analysis plus radar chart within 1 minute.
- [ ] Roadmap is interactive and progress persists across sessions.
- [ ] A job or scholarship can be saved to the tracker and triggers a reminder.
- [ ] A mock interview completes end to end with structured feedback.
- [ ] All 14 features work with seeded demo data.

## 9. Open Questions
- Which colleges/regions to seed for leaderboards and scholarships?
- Final list of target companies for F13 (default: 10 well-known tech and consulting firms).
