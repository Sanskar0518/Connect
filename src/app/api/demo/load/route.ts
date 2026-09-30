import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureCommunitySeeded, awardBadge } from "@/lib/community";
import { computeReadinessScore, computeSkillCoverage } from "@/lib/scoring/readiness";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    let targetUserId = (session?.user as { id?: string })?.id;

    // If no active session, target the canonical demo user
    if (!targetUserId) {
      let demoUser = await db.user.findUnique({ where: { email: "demo@connect.dev" } });
      if (!demoUser) {
        const hashedPassword = await bcrypt.hash("Demo1234!", 10);
        demoUser = await db.user.create({
          data: {
            email: "demo@connect.dev",
            name: "Alex Rivera",
            password: hashedPassword,
            role: "STUDENT",
          },
        });
      }
      targetUserId = demoUser.id;
    }

    // Ensure base community is seeded
    await ensureCommunitySeeded();

    // ── F1, F2: Profile, Skills, Courses, Projects ──────────────────────
    const profile = await db.profile.upsert({
      where: { userId: targetUserId },
      update: {
        headline: "Aspiring Full Stack Engineer | CS Senior",
        bio: "Passionate about building intuitive, performant web applications and exploring distributed systems.",
        targetRole: "Full Stack Web Developer",
        college: "Metropolitan Institute of Technology",
        degree: "B.Tech Computer Science",
        graduationYear: 2026,
        gpa: 3.82,
        githubUrl: "https://github.com/alexrivera",
        linkedinUrl: "https://linkedin.com/in/alexrivera-demo",
        portfolioUrl: "https://alexrivera.dev",
        xp: 780,
        streak: 7,
        isAnonymous: false,
        optOutCommunity: false,
      },
      create: {
        userId: targetUserId,
        headline: "Aspiring Full Stack Engineer | CS Senior",
        bio: "Passionate about building intuitive, performant web applications and exploring distributed systems.",
        targetRole: "Full Stack Web Developer",
        college: "Metropolitan Institute of Technology",
        degree: "B.Tech Computer Science",
        graduationYear: 2026,
        gpa: 3.82,
        githubUrl: "https://github.com/alexrivera",
        linkedinUrl: "https://linkedin.com/in/alexrivera-demo",
        portfolioUrl: "https://alexrivera.dev",
        xp: 780,
        streak: 7,
        isAnonymous: false,
        optOutCommunity: false,
      },
    });

    // Populate Verified Transcript Skills
    const demoSkills = [
      { name: "JavaScript", category: "TECHNICAL", confidence: 0.95 },
      { name: "TypeScript", category: "TECHNICAL", confidence: 0.90 },
      { name: "React", category: "TECHNICAL", confidence: 0.92 },
      { name: "Node.js", category: "TECHNICAL", confidence: 0.86 },
      { name: "HTML5 & CSS3", category: "TECHNICAL", confidence: 0.95 },
      { name: "Git & GitHub", category: "TECHNICAL", confidence: 0.88 },
      { name: "Data Structures & Algorithms", category: "TECHNICAL", confidence: 0.84 },
      { name: "SQL & Relational Databases", category: "TECHNICAL", confidence: 0.82 },
      { name: "Problem Solving", category: "SOFT", confidence: 0.90 },
      { name: "Communication", category: "SOFT", confidence: 0.85 },
      { name: "Agile & Scrum", category: "DOMAIN", confidence: 0.80 },
    ];

    for (const s of demoSkills) {
      const skill = await db.skill.upsert({
        where: { name: s.name },
        update: { category: s.category },
        create: { name: s.name, category: s.category },
      });

      await db.profileSkill.upsert({
        where: {
          profileId_skillId: {
            profileId: profile.id,
            skillId: skill.id,
          },
        },
        update: { confidence: s.confidence, source: "TRANSCRIPT" },
        create: {
          profileId: profile.id,
          skillId: skill.id,
          confidence: s.confidence,
          source: "TRANSCRIPT",
        },
      });
    }

    // Courses & Projects
    const existingCourses = await db.course.count({ where: { profileId: profile.id } });
    if (existingCourses === 0) {
      await db.course.createMany({
        data: [
          { profileId: profile.id, name: "Advanced Data Structures & Algorithms", code: "CS301", grade: "A", credits: 4, term: "Fall 2025" },
          { profileId: profile.id, name: "Web Application Architecture", code: "CS340", grade: "A+", credits: 4, term: "Fall 2025" },
          { profileId: profile.id, name: "Database Management Systems", code: "CS220", grade: "A", credits: 3, term: "Spring 2025" },
          { profileId: profile.id, name: "Operating Systems & Networking", code: "CS230", grade: "B+", credits: 4, term: "Spring 2025" },
        ],
      });
    }

    const existingProjects = await db.project.count({ where: { profileId: profile.id } });
    if (existingProjects === 0) {
      await db.project.createMany({
        data: [
          {
            profileId: profile.id,
            title: "CloudVault – Distributed File Storage",
            description: "High-throughput S3-compatible chunked file upload service with Redis metadata caching and AES-256 chunk encryption.",
            technologies: JSON.stringify(["TypeScript", "Node.js", "Redis", "Docker", "AWS S3"]),
            url: "https://github.com/alexrivera/cloudvault",
            role: "Lead Architect",
          },
          {
            profileId: profile.id,
            title: "DevPulse – Developer Performance Dashboard",
            description: "Real-time GitHub activity aggregator with automated pull request velocity scoring and sprint burndown charts.",
            technologies: JSON.stringify(["React", "Next.js", "Tailwind CSS", "Prisma", "PostgreSQL"]),
            url: "https://github.com/alexrivera/devpulse",
            role: "Full Stack Developer",
          },
        ],
      });
    }

    // ── F2, F13: Gap Analysis & Company Radar ───────────────────────────
    const googleCompany = await db.company.findFirst({ where: { slug: "google" } });
    await db.gapAnalysis.upsert({
      where: { id: `gap-demo-${targetUserId}` },
      update: {
        targetRole: "Full Stack Web Developer",
        targetCompanyId: googleCompany?.id || null,
        matchedSkills: JSON.stringify([
          { skill: "JavaScript", confidence: 0.95 },
          { skill: "TypeScript", confidence: 0.90 },
          { skill: "React", confidence: 0.92 },
          { skill: "Node.js", confidence: 0.86 },
          { skill: "Data Structures & Algorithms", confidence: 0.84 },
        ]),
        missingSkills: JSON.stringify([
          { skill: "Distributed Systems", severity: "Critical", reason: "Mandatory for Google SWE L3 benchmark" },
          { skill: "System Design", severity: "Critical", reason: "Required in technical round 2" },
          { skill: "Docker & Kubernetes", severity: "Important", reason: "High-frequency deployment requirement" },
          { skill: "Redis Caching", severity: "Important", reason: "Essential for low-latency web tiers" },
        ]),
        readinessPct: 78.5,
      },
      create: {
        id: `gap-demo-${targetUserId}`,
        userId: targetUserId,
        targetRole: "Full Stack Web Developer",
        targetCompanyId: googleCompany?.id || null,
        matchedSkills: JSON.stringify([
          { skill: "JavaScript", confidence: 0.95 },
          { skill: "TypeScript", confidence: 0.90 },
          { skill: "React", confidence: 0.92 },
          { skill: "Node.js", confidence: 0.86 },
          { skill: "Data Structures & Algorithms", confidence: 0.84 },
        ]),
        missingSkills: JSON.stringify([
          { skill: "Distributed Systems", severity: "Critical", reason: "Mandatory for Google SWE L3 benchmark" },
          { skill: "System Design", severity: "Critical", reason: "Required in technical round 2" },
          { skill: "Docker & Kubernetes", severity: "Important", reason: "High-frequency deployment requirement" },
          { skill: "Redis Caching", severity: "Important", reason: "Essential for low-latency web tiers" },
        ]),
        readinessPct: 78.5,
      },
    });

    // ── F3, F4, F9: Career Roadmap & Progress ────────────────────────────
    const track = await db.careerTrack.findFirst({
      where: { slug: "full-stack-web-developer" },
    });

    if (track) {
      const roadmap = await db.roadmap.upsert({
        where: { id: `roadmap-demo-${targetUserId}` },
        update: {
          title: "Full Stack Web Developer Mastery",
          progress: 50.0,
        },
        create: {
          id: `roadmap-demo-${targetUserId}`,
          userId: targetUserId,
          trackId: track.id,
          title: "Full Stack Web Developer Mastery",
          progress: 50.0,
        },
      });

      // Roadmap Nodes
      const nodesData = [
        {
          id: `node-1-${roadmap.id}`,
          title: "Advanced TypeScript & State Architecture",
          description: "Master generics, utility types, conditional types, and decoupled state machines with Zustand and TanStack Query.",
          category: "Frontend Architecture",
          level: 2,
          estimatedHours: 8,
          order: 1,
          status: "COMPLETED",
        },
        {
          id: `node-2-${roadmap.id}`,
          title: "Next.js 14 App Router & Server Actions",
          description: "Implement RSC streaming, dynamic parallel routing, server action mutation pipelines, and cache revalidation.",
          category: "Full Stack Framework",
          level: 2,
          estimatedHours: 12,
          order: 2,
          status: "COMPLETED",
        },
        {
          id: `node-3-${roadmap.id}`,
          title: "High-Concurrency Distributed Caching (Redis)",
          description: "Design cache-aside, write-through, and distributed pub/sub locking patterns with Redis to handle 5k+ RPS.",
          category: "Backend & Systems",
          level: 3,
          estimatedHours: 10,
          order: 3,
          status: "IN_PROGRESS",
        },
        {
          id: `node-4-${roadmap.id}`,
          title: "System Design & Microservices Decomposition",
          description: "Architect horizontally scalable services with event-driven Kafka messaging, database sharding, and API gateways.",
          category: "System Design",
          level: 4,
          estimatedHours: 16,
          order: 4,
          status: "NOT_STARTED",
        },
        {
          id: `node-5-${roadmap.id}`,
          title: "Cloud Native Deployment with Docker & CI/CD",
          description: "Multi-stage Docker builds, Kubernetes manifests, automated GitHub Actions pipelines with zero-downtime rolling deploys.",
          category: "DevOps & Cloud",
          level: 3,
          estimatedHours: 10,
          order: 5,
          status: "NOT_STARTED",
        },
      ];

      for (const n of nodesData) {
        const node = await db.roadmapNode.upsert({
          where: { id: n.id },
          update: {
            title: n.title,
            description: n.description,
            category: n.category,
            level: n.level,
            estimatedHours: n.estimatedHours,
            order: n.order,
          },
          create: {
            id: n.id,
            roadmapId: roadmap.id,
            title: n.title,
            description: n.description,
            category: n.category,
            level: n.level,
            estimatedHours: n.estimatedHours,
            order: n.order,
          },
        });

        await db.nodeProgress.upsert({
          where: {
            userId_nodeId: {
              userId: targetUserId,
              nodeId: node.id,
            },
          },
          update: {
            status: n.status,
            completedAt: n.status === "COMPLETED" ? new Date() : null,
          },
          create: {
            userId: targetUserId,
            nodeId: node.id,
            status: n.status,
            completedAt: n.status === "COMPLETED" ? new Date() : null,
          },
        });
      }
    }

    // ── F5: Resume Optimizer & ATS Scanner ──────────────────────────────
    const resume = await db.resume.upsert({
      where: { id: `resume-demo-${targetUserId}` },
      update: {
        fileName: "Alex_Rivera_Resume_2026.pdf",
        fileUrl: "/resumes/demo_resume.pdf",
        fileSize: 245100,
      },
      create: {
        id: `resume-demo-${targetUserId}`,
        userId: targetUserId,
        fileName: "Alex_Rivera_Resume_2026.pdf",
        fileUrl: "/resumes/demo_resume.pdf",
        fileSize: 245100,
      },
    });

    await db.resumeAnalysis.upsert({
      where: { id: `analysis-demo-${targetUserId}` },
      update: {
        atsScore: 84.0,
        keywords: JSON.stringify(["TypeScript", "React", "Next.js", "Node.js", "Docker", "REST API", "Git", "SQL"]),
        missingKeywords: JSON.stringify(["Kafka", "Kubernetes", "GraphQL", "CI/CD", "Distributed Tracing"]),
        issues: JSON.stringify([
          "Action verbs could be stronger in project bullets.",
          "Add quantifiable business metrics (e.g. reduced latency by 35%).",
        ]),
        rewrites: JSON.stringify([
          {
            before: "Worked on frontend features using React and state management.",
            after: "Architected 14+ reusable React 18 components with Zustand, reducing frontend bundle size by 28% and boosting Lighthouse performance to 96/100.",
          },
          {
            before: "Helped build backend APIs with Node.js.",
            after: "Engineered 12 high-throughput REST API endpoints in TypeScript/Node.js with Redis caching, maintaining sub-30ms p95 latency under simulated 2,500 RPS load.",
          },
        ]),
      },
      create: {
        id: `analysis-demo-${targetUserId}`,
        resumeId: resume.id,
        atsScore: 84.0,
        keywords: JSON.stringify(["TypeScript", "React", "Next.js", "Node.js", "Docker", "REST API", "Git", "SQL"]),
        missingKeywords: JSON.stringify(["Kafka", "Kubernetes", "GraphQL", "CI/CD", "Distributed Tracing"]),
        issues: JSON.stringify([
          "Action verbs could be stronger in project bullets.",
          "Add quantifiable business metrics (e.g. reduced latency by 35%).",
        ]),
        rewrites: JSON.stringify([
          {
            before: "Worked on frontend features using React and state management.",
            after: "Architected 14+ reusable React 18 components with Zustand, reducing frontend bundle size by 28% and boosting Lighthouse performance to 96/100.",
          },
          {
            before: "Helped build backend APIs with Node.js.",
            after: "Engineered 12 high-throughput REST API endpoints in TypeScript/Node.js with Redis caching, maintaining sub-30ms p95 latency under simulated 2,500 RPS load.",
          },
        ]),
      },
    });

    // ── F6, F10: Mock Interview Session & Structured Feedback ──────────
    const interviewSession = await db.interviewSession.upsert({
      where: { id: `interview-demo-${targetUserId}` },
      update: {
        title: "Full Stack Engineer Technical & Behavioral Interview",
        type: "MIXED",
        status: "COMPLETED",
      },
      create: {
        id: `interview-demo-${targetUserId}`,
        userId: targetUserId,
        title: "Full Stack Engineer Technical & Behavioral Interview",
        type: "MIXED",
        status: "COMPLETED",
      },
    });

    const turnsData = [
      {
        turnNumber: 1,
        question: "Can you explain how the Virtual DOM diffing algorithm works in React and how key props prevent unnecessary re-renders?",
        answer: "React maintains an in-memory Virtual DOM tree representation. When state changes, a new tree is created and diffed against the previous tree using a heuristic O(n) algorithm. Key props provide persistent identity across renders, allowing React to match children across mutations without tearing down the DOM nodes.",
        feedback: "Excellent technical explanation. Clear articulation of the O(n) reconciliation heuristic.",
      },
      {
        turnNumber: 2,
        question: "Tell me about a time when you experienced a critical production outage or bug. How did you diagnose and resolve it?",
        answer: "In our CloudVault project, our chunked uploads were failing under concurrent load due to connection pool starvation in PostgreSQL. I inspected connection metrics, identified unreleased client instances, and implemented connection pooling with PgBouncer alongside exponential backoff retries. Outage resolved in 40 minutes.",
        feedback: "Strong STAR format structure. Quantified problem, diagnosis, and technical resolution.",
      },
    ];

    for (const t of turnsData) {
      const turnId = `turn-${t.turnNumber}-${interviewSession.id}`;
      await db.interviewTurn.upsert({
        where: { id: turnId },
        update: {
          question: t.question,
          answer: t.answer,
          feedback: t.feedback,
        },
        create: {
          id: turnId,
          sessionId: interviewSession.id,
          turnNumber: t.turnNumber,
          question: t.question,
          answer: t.answer,
          feedback: t.feedback,
        },
      });
    }

    await db.interviewFeedback.upsert({
      where: { sessionId: interviewSession.id },
      update: {
        overallScore: 85.0,
        contentScore: 88.0,
        clarityScore: 86.0,
        structureScore: 84.0,
        confidenceScore: 82.0,
        deliveryScore: 85.0,
        fillerWordCount: 3,
        strengths: JSON.stringify([
          "Precise explanation of reconciliation and Virtual DOM heuristics.",
          "Crisp STAR format when describing the database connection starvation incident.",
          "High delivery composure and fluent technical terminology.",
        ]),
        improvements: JSON.stringify([
          "Briefly mention trade-offs of synthetic events versus native browser event delegation.",
          "Add mention of post-mortem prevention alerts in monitoring tools like Datadog/Prometheus.",
        ]),
      },
      create: {
        sessionId: interviewSession.id,
        overallScore: 85.0,
        contentScore: 88.0,
        clarityScore: 86.0,
        structureScore: 84.0,
        confidenceScore: 82.0,
        deliveryScore: 85.0,
        fillerWordCount: 3,
        strengths: JSON.stringify([
          "Precise explanation of reconciliation and Virtual DOM heuristics.",
          "Crisp STAR format when describing the database connection starvation incident.",
          "High delivery composure and fluent technical terminology.",
        ]),
        improvements: JSON.stringify([
          "Briefly mention trade-offs of synthetic events versus native browser event delegation.",
          "Add mention of post-mortem prevention alerts in monitoring tools like Datadog/Prometheus.",
        ]),
      },
    });

    // ── F7, F8, F11: Kanban Applications (Jobs, Gov, Scholarships) ──────
    const sampleApplications = [
      {
        id: `app-demo-1-${targetUserId}`,
        title: "Software Engineering Intern (Cloud Platform)",
        organization: "Google",
        column: "INTERVIEWING",
        sourceType: "JOB",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        notes: "Round 1 Coding passed (Graphs & DP). Preparing System Design round for next Monday.",
      },
      {
        id: `app-demo-2-${targetUserId}`,
        title: "Full Stack Engineer – Early Career",
        organization: "Microsoft",
        column: "APPLIED",
        sourceType: "JOB",
        deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        notes: "Submitted tailored resume with 84% ATS match score.",
      },
      {
        id: `app-demo-3-${targetUserId}`,
        title: "PM Internship Scheme – Technology Track",
        organization: "Ministry of Corporate Affairs (Govt. of India)",
        column: "SAVED",
        sourceType: "GOV",
        sourceId: "gov-001",
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        notes: "Stipend ₹5,000/month + grant. Eligible under B.Tech CS criteria.",
      },
      {
        id: `app-demo-4-${targetUserId}`,
        title: "Reliance Foundation Undergraduate Scholarship",
        organization: "Reliance Foundation",
        column: "SAVED",
        sourceType: "SCHOLARSHIP",
        sourceId: "sch-001",
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        notes: "Grant up to ₹2,00,000. Need to upload recommendation letter.",
      },
    ];

    for (const app of sampleApplications) {
      await db.application.upsert({
        where: { id: app.id },
        update: {
          title: app.title,
          organization: app.organization,
          column: app.column,
          sourceType: app.sourceType,
          deadline: app.deadline,
          notes: app.notes,
        },
        create: {
          id: app.id,
          userId: targetUserId,
          title: app.title,
          organization: app.organization,
          column: app.column,
          sourceType: app.sourceType,
          deadline: app.deadline,
          notes: app.notes,
        },
      });
    }

    // Scholarship Checklist Progress for F11
    await db.scholarshipChecklistProgress.upsert({
      where: {
        userId_scholarshipId: {
          userId: targetUserId,
          scholarshipId: "sch-001",
        },
      },
      update: {
        completedItems: JSON.stringify([
          "Verify CGPA >= 7.5 on official transcript",
          "Family income certificate (< 15 LPA)",
        ]),
      },
      create: {
        userId: targetUserId,
        scholarshipId: "sch-001",
        completedItems: JSON.stringify([
          "Verify CGPA >= 7.5 on official transcript",
          "Family income certificate (< 15 LPA)",
        ]),
      },
    });

    // ── F12: Notifications & Reminders ─────────────────────────────────
    await db.notification.upsert({
      where: { id: `notif-1-${targetUserId}` },
      update: {
        title: "Interview Reminder: Google SWE Round 2",
        message: "Your Technical Interview is coming up in 5 days. Review STAR stories and caching notes.",
        type: "DEADLINE",
        read: false,
      },
      create: {
        id: `notif-1-${targetUserId}`,
        userId: targetUserId,
        title: "Interview Reminder: Google SWE Round 2",
        message: "Your Technical Interview is coming up in 5 days. Review STAR stories and caching notes.",
        type: "DEADLINE",
        read: false,
      },
    });

    // ── F14: Community Badges, Challenge Submission & Activity ──────────
    await awardBadge(targetUserId, "First Milestone");
    await awardBadge(targetUserId, "Consistency Champ");
    await awardBadge(targetUserId, "ATS Master");
    await awardBadge(targetUserId, "Interview Ace");
    await awardBadge(targetUserId, "Challenge Solver");

    // Submit peer challenge
    const nextjsChallenge = await db.challenge.findFirst({
      where: { id: "challenge-nextjs-api" },
    });
    if (nextjsChallenge) {
      await db.challengeSubmission.upsert({
        where: {
          challengeId_userId: {
            challengeId: nextjsChallenge.id,
            userId: targetUserId,
          },
        },
        update: {
          proofUrl: "https://github.com/alexrivera/rate-limited-api",
          notes: "Built token bucket rate limiting using sliding window in Redis with Next.js edge runtime middleware.",
          status: "APPROVED",
        },
        create: {
          challengeId: nextjsChallenge.id,
          userId: targetUserId,
          proofUrl: "https://github.com/alexrivera/rate-limited-api",
          notes: "Built token bucket rate limiting using sliding window in Redis with Next.js edge runtime middleware.",
          status: "APPROVED",
        },
      });
    }

    // Compute and persist real Readiness Score
    // Formula: 0.35 * skillCoverage + 0.30 * roadmapProgress + 0.20 * resumeScore + 0.15 * interviewScore
    const readiness = computeReadinessScore({
      skillCoverage: 82,
      roadmapProgress: 50,
      resumeScore: 84,
      interviewScore: 85,
    });

    await db.profile.update({
      where: { userId: targetUserId },
      data: { readinessScore: readiness },
    });

    const elapsedMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Demo student account successfully populated in ${elapsedMs}ms!`,
      elapsedMs,
      userId: targetUserId,
      readinessScore: readiness,
      featuresLoaded: 14,
      summary: {
        profileSkillsCount: demoSkills.length,
        roadmapNodes: 5,
        roadmapProgress: 50,
        atsScore: 84,
        interviewScore: 85,
        activeApplications: 4,
        badgesUnlocked: 5,
        xp: 780,
        streak: 7,
      },
    });
  } catch (err: any) {
    console.error("POST /api/demo/load error:", err);
    return NextResponse.json({ error: "Failed to load demo student data" }, { status: 500 });
  }
}
