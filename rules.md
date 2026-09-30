# Rules: Agent Operating Rules

> These rules are mandatory for every task. If a rule conflicts with a request, stop and ask.

## 1. Workflow Rules
1. **Read first.** At the start of every session, read `prd.md`, `architecture.md`, `design.md`, `phases.md`, and `memory.md`.
2. **Plan before code.** For each phase, produce a short plan (files to touch, risks) and wait for approval on Phase 1. For later phases, post the plan and proceed unless told otherwise.
3. **One phase at a time.** Do not start a phase until the previous phase's exit criteria in `phases.md` are met and approved.
4. **Verify in the browser.** After each feature, run the app and test the happy path and one failure path. Capture a screenshot or short recording as evidence.
5. **Update memory.** At the end of every task, update `memory.md` (status, decisions, known issues, changelog).
6. **Stay in scope.** No features outside `prd.md`. Suggest additions in `memory.md` under Ideas instead of building them.
7. **Ask when ambiguous.** If a requirement is unclear or two docs conflict, ask one concise question rather than guessing.

## 2. Code Standards
- TypeScript strict mode. No `any` without a comment explaining why.
- Validate all API inputs and AI outputs with zod.
- Small, single-purpose modules. Business logic in `lib/services` and `lib/scoring`, never inside components.
- Server components by default; client components only for interactivity.
- No dead code, commented-out blocks, or unexplained TODOs. Use `// TODO(phase-N): ...` only when tracked in `memory.md`.
- Consistent naming: `camelCase` variables, `PascalCase` components/types, `kebab-case` files for routes and utilities.
- Use ESLint and Prettier; run `lint`, `typecheck`, and `test` before marking a task done.
- Commit messages: `feat(module): summary`, `fix(module): summary`, `chore: summary`.

## 3. AI Rules
- All AI calls go through `lib/ai`. Never call the Gemini SDK from routes or components.
- Prompts live in `lib/ai/prompts`; each has a paired zod schema in `lib/ai/schemas`.
- **Never fabricate** URLs, courses, jobs, scholarships, companies, or statistics. Only reference seeded or adapter-provided records by ID.
- Every AI feature needs a deterministic fallback so the demo never shows a blank screen.
- Show a confidence indicator or "AI-generated" label where output is a judgment (skills, matches, feedback).
- Do not log raw resumes, transcripts, or personal data.

## 4. Data and Privacy Rules
- Never commit secrets. Keep `.env` out of git; maintain `.env.example`.
- Scope every query by `userId`. No cross-user reads except in the community module and only for fields the user chose to share.
- Uploaded files are encrypted, size-limited (10 MB), and type-checked (PDF, DOCX, TXT).
- Consent must exist before any upload is processed.
- Respect anonymous mode and opt-out in all community queries.
- Scraping: check robots.txt, identify the user agent, rate limit, and fall back to pasted text on any failure.

## 5. UX Rules
- Every screen has loading (skeleton), empty, error, and success states.
- Every destructive action requires confirmation.
- Forms show inline validation and preserve input on error.
- Follow `design.md` tokens and components. Do not invent new visual styles.
- Recommendations screens include the bias-awareness note.

## 6. Testing Rules
- Unit tests required for: readiness score, ATS score, job matching, scholarship eligibility, reminder scheduling, XP/streak logic.
- Smoke test (Playwright) for the demo journey: demo login, profile, gap analysis, roadmap node complete, save to tracker, mock interview.
- A task is not done if tests, lint, or typecheck fail.

## 7. Seed and Demo Rules
- Seed data lives in `prisma/seed-data/*.json` and must be realistic, diverse, and internally consistent (IDs referenced across files must exist).
- Minimum seeds: 10 companies with benchmarks, 8 career tracks, 60+ skills, 40+ learning resources, 30+ jobs, 20+ gov opportunities, 20+ scholarships, 2 sample transcripts, 2 sample resumes, sample community data.
- "Load demo student" must be idempotent and complete in under 5 seconds.

## 8. Do / Don't
| Do | Don't |
|---|---|
| Use adapters for external data | Hardcode data in components |
| Return typed, validated responses | Trust raw model text |
| Keep components accessible (labels, focus, contrast) | Rely on color alone to convey state |
| Log decisions in `memory.md` | Change architecture silently |
| Ask before adding dependencies outside the stack | Install packages casually |

## 9. Definition of Done (per task)
- [ ] Meets the relevant `prd.md` acceptance criteria
- [ ] Follows `design.md`
- [ ] Loading, empty, and error states handled
- [ ] Types, lint, and tests pass
- [ ] Verified in the browser
- [ ] `memory.md` updated
