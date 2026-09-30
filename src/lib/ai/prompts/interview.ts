// ── F10: JD Intelligence prompt ────────────────────────────────────────────
export function buildJDIntelligencePrompt(params: {
  jdText: string;
  userSkills: string[];
  targetRole?: string;
}): string {
  const { jdText, userSkills, targetRole } = params;
  return `You are an expert technical recruiter and interview coach.

Analyze the following Job Description and extract deep intelligence to help a candidate prepare.

**Candidate's Current Skills:** ${userSkills.length ? userSkills.join(", ") : "Not specified"}
**Candidate's Target Role:** ${targetRole || "Not specified"}

**Job Description:**
---
${jdText.slice(0, 5000)}
---

Extract:
1. The role title and company name
2. All technical stack items (languages, frameworks, tools, cloud, databases)
3. Soft skills and cultural values the company emphasizes
4. Required experience level
5. Key themes that define what this company values most
6. Generate 5–8 highly likely interview questions (mix of TECHNICAL, BEHAVIORAL, SITUATIONAL) with "why asked" and a hint
7. A 5-item actionable prep checklist specific to this role

Be specific and opinionated. Predict questions that are genuinely likely based on the JD signals.`;
}

// ── F6: Question generation prompt ─────────────────────────────────────────
export function buildQuestionGenerationPrompt(params: {
  role: string;
  company: string;
  interviewType: "TECHNICAL" | "BEHAVIORAL" | "MIXED";
  techStack: string[];
  userSkills: string[];
  jdSummary?: string;
}): string {
  const { role, company, interviewType, techStack, userSkills, jdSummary } = params;
  return `You are a senior interviewer at ${company || "a top tech company"}.

Generate 8–10 interview questions for a ${interviewType} interview for the role of "${role}".

**Tech Stack Focus:** ${techStack.length ? techStack.join(", ") : "General CS"}
**Candidate Skills:** ${userSkills.join(", ") || "General"}
${jdSummary ? `**JD Context:** ${jdSummary}` : ""}

Requirements:
- ${interviewType === "TECHNICAL" ? "Focus on coding, system design, and CS fundamentals" : ""}
- ${interviewType === "BEHAVIORAL" ? "Focus on STAR-method situations, leadership, conflict, growth" : ""}
- ${interviewType === "MIXED" ? "Mix of technical (4–5) and behavioral/situational (3–4)" : ""}
- Each question must have 2–3 follow-up probes and clear evaluation criteria
- Questions should be progressively challenging
- Generate unique IDs (q1, q2, ...) for each

Return realistic questions that would genuinely appear in a ${company || "FAANG-level"} interview.`;
}

// ── F6: Answer evaluation prompt ────────────────────────────────────────────
export function buildAnswerEvaluationPrompt(params: {
  question: string;
  questionType: string;
  answer: string;
  role: string;
  turnNumber: number;
}): string {
  const { question, questionType, answer, role, turnNumber } = params;
  return `You are an expert interviewer evaluating a candidate's answer for a ${role} interview.

**Question ${turnNumber} (${questionType}):** ${question}

**Candidate's Answer:**
---
${answer}
---

Evaluate the answer on these dimensions (0–10 each):
- **Content**: Technical correctness, depth, relevance
- **Clarity**: Clear communication, logical flow, no rambling
- **Structure**: Use of STAR method or clear framework (especially for behavioral)
- **Confidence**: Assertive tone, no excessive hedging

Then provide:
1. Specific actionable feedback (not generic)
2. What they did well (2–3 concrete strengths)
3. What they should improve (2–3 specific gaps)
4. A model answer outline / key points they missed
5. A natural follow-up question to probe deeper

Be honest but constructive. For technical questions, point out any factual errors.`;
}

// ── F6: Session feedback prompt ─────────────────────────────────────────────
export function buildSessionFeedbackPrompt(params: {
  role: string;
  company: string;
  interviewType: string;
  turns: Array<{
    question: string;
    answer: string;
    type: string;
    feedback?: string;
  }>;
}): string {
  const { role, company, interviewType, turns } = params;
  const turnSummary = turns
    .map(
      (t, i) =>
        `Q${i + 1} [${t.type}]: ${t.question.slice(0, 100)}\nAnswer: ${t.answer.slice(0, 200)}\n${t.feedback ? `Per-question feedback: ${t.feedback.slice(0, 100)}` : ""}`
    )
    .join("\n\n");

  return `You are a senior interview coach reviewing a complete mock interview session.

**Role:** ${role} ${company ? `at ${company}` : ""}
**Interview Type:** ${interviewType}
**Number of Questions:** ${turns.length}

**Interview Transcript:**
---
${turnSummary.slice(0, 6000)}
---

Provide holistic end-of-session feedback:
1. Overall score out of 100 (honest, not inflated)
2. Scores for: content, clarity, structure, confidence, delivery (0–10 each)
3. Estimated filler word count (um, uh, like, basically, you know)
4. Top 3 overall strengths (based on the full session)
5. Top 3 improvement areas (the most impactful ones)
6. A narrative summary paragraph (3–4 sentences, coach-style)
7. 3 concrete next steps to improve before a real interview

Be realistic. If the performance was weak, say so constructively.`;
}
