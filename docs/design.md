# Design: UI/UX System

> All UI must follow this document. Do not introduce new styles without logging a decision in `memory.md`.

## 1. Design Principles
1. **Clarity over cleverness.** Students should know their next step at a glance.
2. **Progress is visible.** Scores, percentages, and streaks appear wherever relevant.
3. **Friendly, not childish.** Modern, calm, encouraging tone.
4. **Trust.** Label AI output, show confidence, explain matches.
5. **Mobile-first.** Every screen works at 360px width.

## 2. Design Tokens
Implement as CSS variables and Tailwind theme extensions; support light and dark.

**Color (semantic)**
| Token | Light | Dark | Use |
|---|---|---|---|
| `--primary` | Indigo 600 | Indigo 400 | Main actions, active nav |
| `--secondary` | Teal 500 | Teal 400 | Progress, success accents |
| `--accent` | Amber 500 | Amber 400 | XP, streaks, highlights |
| `--success` / `--warning` / `--danger` | Green / Amber / Red 600 | 400 shades | Status, severity |
| `--bg` / `--surface` / `--border` | Slate 50 / white / Slate 200 | Slate 950 / 900 / 800 | Layout |
| `--text` / `--muted` | Slate 900 / 600 | Slate 100 / 400 | Copy |

Severity mapping: Critical = danger, Important = warning, Nice-to-have = secondary.

**Typography:** Inter (UI), JetBrains Mono (code/keywords). Scale: 12, 14, 16, 18, 24, 30, 36. Body 16px on mobile, 14-16px on desktop.

**Spacing and shape:** 4px base grid; radius 8px (inputs), 12px (cards), 9999px (pills). Soft shadows in light mode; borders instead of shadows in dark mode.

**Motion:** 150-250ms ease-out. Respect `prefers-reduced-motion`. Celebrate milestones (node complete, badge earned) with a subtle confetti or pulse only.

## 3. Layout
- **Desktop:** fixed left sidebar (240px, collapsible to icons), top bar with search, notifications bell, theme toggle, profile menu. Content max width 1280px.
- **Tablet:** collapsible sidebar as overlay.
- **Mobile:** bottom tab bar (Dashboard, Profile, Roadmap, Apply, More) plus "More" sheet for remaining modules.
- **Sidebar groups (in order):** Dashboard; Profile & Skills; Career Roadmap; Applications; Interview Prep; Opportunities; Community.

## 4. Core Components
Use shadcn/ui primitives. Custom components:
- `ReadinessRing`: circular 0-100 score with breakdown tooltip
- `SkillChip`: name, category color, confidence dot; editable
- `SeverityBadge`: Critical / Important / Nice-to-have
- `MatchBadge`: percentage plus "why" popover
- `StatCard`: value, label, trend
- `EmptyState`: illustration, one-line explanation, primary action
- `AIBadge`: small "AI-generated" tag with info popover
- `ProgressBar` and `StreakFlame`
- `ConfirmDialog` for destructive actions

## 5. Screen Specs

**Dashboard**
Top row: ReadinessRing, XP/streak, peer rank. Middle: "Next step" card (next roadmap node), upcoming deadlines list. Bottom: recommended jobs, recent community activity.

**Profile & Skills (F1, F2, F13)**
Tabs: Profile, Gap Analysis, Company Alignment. Upload dropzone with parsing progress. Skills as editable chips grouped by category. Gap analysis as a sortable table with severity badges. Radar chart with company dropdown, category toggle chips, legend, and "Download PNG" button. Student series = primary color; company series = accent color; both with semi-transparent fill.

**Career Roadmap (F3, F4, F9)**
Pathway cards (primary highlighted, two alternatives). Roadmap canvas (React Flow): left-to-right or top-to-bottom tree, nodes colored by state (grey = not started, indigo = in progress, green = done), minimap, zoom controls, sticky overall progress bar. Node click opens right-side drawer with description, resources, estimated time, "Mark complete". Recommender is a filterable card grid (free/paid, duration, level).

**Applications (F5, F7, F12)**
Resume optimizer: two-column layout, left = upload/JD, right = score gauge, keyword table, issues list, before/after diff view. Jobs: filter sidebar plus cards with MatchBadge and "Save to tracker". Tracker: Kanban with five columns, card shows title, org, deadline chip (red under 3 days), source tag; card modal for notes and reminder settings.

**Interview Prep (F6, F10)**
Company/JD intelligence: input on top; results as tabs (Tech Stack, Culture, Requirements, Questions, Checklist). Mock interview: chat-style, large mic button with waveform/recording state, live transcript, question TTS toggle, timer. Feedback: score radar or bars for five dimensions, transcript highlights (filler words marked), improvement tips, trend chart across sessions.

**Opportunities (F8, F11)**
Tabs: Government, Scholarships. Filter bar, result cards with deadline chips, eligibility fit meter for scholarships, expandable checklist with progress bar.

**Community (F14)**
Tabs: Feed, Leaderboard, Challenges. Post composer that auto-suggests milestone shares. Leaderboard table with filters (weekly/all-time, college/track) and highlighted "You" row. Challenge cards with join and submit flows. Anonymous mode toggle in settings and on the composer.

## 6. Content and Tone
- Direct, encouraging, plain language. Example: "You're 3 skills away from Data Analyst readiness."
- Explain every score: what it means and how to improve it.
- Bias note (recommendation screens): "Suggestions are based on your data and market trends and may not reflect every opportunity. Use them as a starting point."

## 7. States
Every data view defines: **loading** (skeleton matching layout), **empty** (guidance plus CTA), **error** (message plus retry), **success** (toast where an action occurred).

## 8. Accessibility (WCAG AA)
- Contrast at least 4.5:1 for text, 3:1 for UI components.
- Full keyboard support, visible focus rings, logical tab order.
- Charts have text alternatives (data table toggle) and do not rely on color alone.
- Kanban supports keyboard moves (dnd-kit keyboard sensor) and announces moves via aria-live.
- Roadmap nodes are focusable with accessible names including state.
- Voice features always have a text alternative.
- Form fields have labels, error text tied via `aria-describedby`.

## 9. Responsive Rules
- Breakpoints: 360 (mobile), 768 (tablet), 1024 (desktop), 1280 (wide).
- Tables become stacked cards under 768px.
- Kanban scrolls horizontally with snap on mobile.
- Roadmap canvas supports pinch zoom and offers a list-view fallback on mobile.
