import { db } from "@/lib/db";

export interface DefaultBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "MILESTONE" | "STREAK" | "CHALLENGE" | "INTERVIEW" | "APPLICATION";
}

export const DEFAULT_BADGES: DefaultBadge[] = [
  {
    id: "badge-first-milestone",
    name: "First Milestone",
    description: "Shared your first learning milestone with the student community.",
    icon: "Rocket",
    category: "MILESTONE",
  },
  {
    id: "badge-consistency-champ",
    name: "Consistency Champ",
    description: "Maintained a 5+ day active learning streak on Connect.",
    icon: "Flame",
    category: "STREAK",
  },
  {
    id: "badge-ats-master",
    name: "ATS Master",
    description: "Achieved an ATS score of 80% or higher on your resume.",
    icon: "FileCheck",
    category: "APPLICATION",
  },
  {
    id: "badge-interview-ace",
    name: "Interview Ace",
    description: "Scored 80% or higher in an AI-powered mock interview.",
    icon: "Award",
    category: "INTERVIEW",
  },
  {
    id: "badge-roadmap-pioneer",
    name: "Roadmap Pioneer",
    description: "Completed 3 or more skill nodes on your career roadmap.",
    icon: "Compass",
    category: "MILESTONE",
  },
  {
    id: "badge-challenge-champ",
    name: "Challenge Solver",
    description: "Submitted and verified a peer coding or system challenge.",
    icon: "Trophy",
    category: "CHALLENGE",
  },
  {
    id: "badge-opportunity-hunter",
    name: "Opportunity Hunter",
    description: "Saved and tracked 3 or more job or scholarship opportunities.",
    icon: "Target",
    category: "APPLICATION",
  },
];

export const DEFAULT_CHALLENGES = [
  {
    id: "challenge-nextjs-api",
    title: "Build a Rate-Limited REST API in Next.js 14",
    description:
      "Design an authenticated route handler with sliding-window rate limiting (e.g., using Redis or in-memory token bucket) and write unit tests.",
    category: "Web Development",
    xpReward: 150,
    daysValid: 7,
  },
  {
    id: "challenge-system-design-url",
    title: "System Design: Scalable URL Shortener",
    description:
      "Submit an architecture diagram or markdown RFC detailing base62 encoding, caching topology, database sharding, and latency estimates for 10k QPS.",
    category: "System Design",
    xpReward: 200,
    daysValid: 10,
  },
  {
    id: "challenge-star-interview",
    title: "STAR Technique Mastery: Resolving Team Conflict",
    description:
      "Record or type a STAR response to: 'Describe a situation where you had a fundamental technical disagreement with a team member.'",
    category: "Behavioral & Soft Skills",
    xpReward: 100,
    daysValid: 5,
  },
  {
    id: "challenge-sql-aggregation",
    title: "Advanced SQL: Cohort Retention Analytics",
    description:
      "Write a PostgreSQL/BigQuery query calculating monthly user retention cohorts with window functions and unnested arrays.",
    category: "Data & Backend",
    xpReward: 120,
    daysValid: 8,
  },
];

export const SEED_COHORT_STUDENTS = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@student.iitb.ac.in",
    college: "IIT Bombay",
    targetRole: "Full Stack Web Developer",
    degree: "B.Tech Computer Science",
    graduationYear: 2026,
    xp: 1420,
    streak: 21,
    readinessScore: 88,
  },
  {
    name: "Rahul Verma",
    email: "rahul.v@nitt.edu",
    college: "NIT Trichy",
    targetRole: "Cloud / DevOps Engineer",
    degree: "B.Tech Information Technology",
    graduationYear: 2026,
    xp: 1180,
    streak: 14,
    readinessScore: 82,
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@pilani.bits-pilani.ac.in",
    college: "BITS Pilani",
    targetRole: "AI / Machine Learning Engineer",
    degree: "B.E. Computer Science",
    graduationYear: 2026,
    xp: 950,
    streak: 9,
    readinessScore: 78,
  },
  {
    name: "Arjun Nair",
    email: "arjun.nair@dtu.ac.in",
    college: "Delhi Technological University",
    targetRole: "Full Stack Web Developer",
    degree: "B.Tech Software Engineering",
    graduationYear: 2026,
    xp: 820,
    streak: 11,
    readinessScore: 75,
  },
  {
    name: "Ananya Patel",
    email: "ananya.p@iiit.ac.in",
    college: "IIIT Hyderabad",
    targetRole: "Full Stack Web Developer",
    degree: "B.Tech CSE",
    graduationYear: 2026,
    xp: 760,
    streak: 8,
    readinessScore: 74,
  },
  {
    name: "Karan Singhania",
    email: "karan.s@mitindia.edu",
    college: "Metropolitan Institute of Technology",
    targetRole: "Cybersecurity Analyst",
    degree: "B.Tech Information Security",
    graduationYear: 2026,
    xp: 680,
    streak: 6,
    readinessScore: 70,
  },
  {
    name: "Meera Krishnan",
    email: "meera.k@mitindia.edu",
    college: "Metropolitan Institute of Technology",
    targetRole: "Full Stack Web Developer",
    degree: "B.Tech Computer Science",
    graduationYear: 2026,
    xp: 590,
    streak: 7,
    readinessScore: 69,
  },
  {
    name: "Rohan Gupta",
    email: "rohan.g@vit.ac.in",
    college: "VIT Vellore",
    targetRole: "Data Scientist",
    degree: "B.Tech Data Analytics",
    graduationYear: 2026,
    xp: 510,
    streak: 4,
    readinessScore: 66,
  },
];

/**
 * Ensure badges, challenges, cohort peers, and initial sample posts exist.
 * Idempotent: safe to run on every request or cold-start.
 */
export async function ensureCommunitySeeded() {
  // 1. Seed Badges
  for (const b of DEFAULT_BADGES) {
    await db.badge.upsert({
      where: { name: b.name },
      update: {
        description: b.description,
        icon: b.icon,
        category: b.category,
      },
      create: {
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        category: b.category,
      },
    });
  }

  // 2. Seed Challenges
  for (const c of DEFAULT_CHALLENGES) {
    const existing = await db.challenge.findFirst({ where: { title: c.title } });
    if (!existing) {
      await db.challenge.create({
        data: {
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          xpReward: c.xpReward,
          startDate: new Date(),
          endDate: new Date(Date.now() + c.daysValid * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // 3. Seed Cohort Peers (if not already present)
  for (const student of SEED_COHORT_STUDENTS) {
    const existingUser = await db.user.findUnique({ where: { email: student.email } });
    if (!existingUser) {
      const user = await db.user.create({
        data: {
          email: student.email,
          name: student.name,
          role: "STUDENT",
        },
      });

      await db.profile.create({
        data: {
          userId: user.id,
          college: student.college,
          degree: student.degree,
          graduationYear: student.graduationYear,
          targetRole: student.targetRole,
          xp: student.xp,
          streak: student.streak,
          readinessScore: student.readinessScore,
        },
      });
    }
  }

  // 4. Seed Starter Community Posts if feed is empty
  const postCount = await db.post.count();
  if (postCount === 0) {
    const sarahUser = await db.user.findUnique({ where: { email: "sarah.chen@student.iitb.ac.in" } });
    const rahulUser = await db.user.findUnique({ where: { email: "rahul.v@nitt.edu" } });
    const priyaUser = await db.user.findUnique({ where: { email: "priya.sharma@pilani.bits-pilani.ac.in" } });

    if (sarahUser) {
      const post1 = await db.post.create({
        data: {
          userId: sarahUser.id,
          type: "MILESTONE",
          content: "Just completed the High-Concurrency Distributed Caching roadmap node! Implemented Redis LRU caching in Next.js and saw API response times drop from 180ms to 12ms. 🚀",
          milestoneData: JSON.stringify({
            title: "Roadmap Node Completed",
            nodeName: "High-Concurrency Distributed Caching",
            track: "Full Stack Web Developer",
            xpEarned: 100,
          }),
          likesCount: 14,
        },
      });

      if (rahulUser) {
        await db.comment.create({
          data: {
            postId: post1.id,
            userId: rahulUser.id,
            content: "Incredible benchmark Sarah! Are you using Upstash or self-hosted Redis cluster?",
          },
        });
        await db.reaction.create({
          data: {
            postId: post1.id,
            userId: rahulUser.id,
            type: "CELEBRATE",
          },
        });
      }
    }

    if (priyaUser) {
      await db.post.create({
        data: {
          userId: priyaUser.id,
          type: "MILESTONE",
          content: "Nailed an 86% in the AI Mock Interview for ML Engineer! The feedback highlighted my STAR responses on gradient descent debugging. Highly recommend practicing the behavioral turns too!",
          milestoneData: JSON.stringify({
            title: "Mock Interview Completed",
            score: 86,
            company: "Google",
            role: "Machine Learning Engineer",
          }),
          likesCount: 9,
        },
      });
    }

    if (rahulUser) {
      await db.post.create({
        data: {
          userId: rahulUser.id,
          type: "QUESTION",
          content: "Has anyone applied for the Reliance Foundation Postgraduate Scholarship? Any tips on what reviewers look for in the leadership essay?",
          likesCount: 5,
        },
      });
    }
  }
}

/**
 * Award XP to a user and update their profile total
 */
export async function awardXP(userId: string, amount: number, reason: string, source: string) {
  await db.xPEvent.create({
    data: {
      userId,
      amount,
      reason,
      source,
    },
  });

  const profile = await db.profile.findUnique({ where: { userId } });
  if (profile) {
    const updatedXP = profile.xp + amount;
    await db.profile.update({
      where: { userId },
      data: { xp: updatedXP },
    });
    return updatedXP;
  }
  return 0;
}

/**
 * Award a badge to a user if not already earned
 */
export async function awardBadge(userId: string, badgeName: string) {
  const badge = await db.badge.findUnique({ where: { name: badgeName } });
  if (!badge) return null;

  const existing = await db.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId: badge.id,
      },
    },
  });

  if (!existing) {
    return await db.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
      },
      include: { badge: true },
    });
  }
  return null;
}
