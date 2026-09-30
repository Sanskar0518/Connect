import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/ai/client";
import {
  RoadmapGenerationResultSchema,
  RoadmapGenerationResult,
} from "@/lib/ai/schemas/roadmap";
import { buildRoadmapGenerationPrompt } from "@/lib/ai/prompts/roadmap";

// Default fallback roadmap generator grounded in track competencies
function buildFallbackRoadmap(track: {
  title: string;
  slug: string;
  requiredSkills: string[];
}): RoadmapGenerationResult {
  return {
    trackSlug: track.slug,
    trackTitle: track.title,
    summary: `Structured mastery pathway for ${track.title}, taking you from modern core fundamentals to scalable production systems.`,
    totalEstimatedHours: 120,
    milestones: [
      {
        level: 1,
        milestoneTitle: "Phase 1: Modern Foundations & Core Syntax",
        milestoneGoal: "Solidify core programming language fundamentals, typing, and modern development toolchains.",
        nodes: [
          {
            key: "p1-core-lang",
            title: "Advanced Core Programming & Types",
            description: "Deep dive into language mechanics, strict typing, asynchronous execution models, and clean code practices.",
            category: "TECHNICAL",
            level: 1,
            estimatedHours: 20,
            dependsOn: [],
            targetSkills: track.requiredSkills.slice(0, 2),
            keyTakeaways: ["Strict typing patterns", "Async/await event loops", "Modern build toolchains"],
            suggestedTopics: ["Type systems & generics", "Memory lifecycle", "Functional programming concepts"],
          },
          {
            key: "p1-tooling-git",
            title: "Professional Developer Workflow & Git",
            description: "Master Git branching models, interactive rebasing, pull request reviews, and automated linting/formatting.",
            category: "TECHNICAL",
            level: 1,
            estimatedHours: 10,
            dependsOn: [],
            targetSkills: ["Git & GitHub"],
            keyTakeaways: ["Clean commit hygiene", "Conflict resolution", "Semantic versioning"],
            suggestedTopics: ["Git flow vs trunk-based", "Pre-commit hooks", "Conventional commits"],
          },
        ],
      },
      {
        level: 2,
        milestoneTitle: "Phase 2: Architecture & Scalable Patterns",
        milestoneGoal: "Construct modular, maintainable applications using industry-standard design patterns and frameworks.",
        nodes: [
          {
            key: "p2-framework-arch",
            title: "Enterprise Framework & State Patterns",
            description: "Build robust component architectures, state hydration pipelines, and optimized client/server boundaries.",
            category: "TECHNICAL",
            level: 2,
            estimatedHours: 25,
            dependsOn: ["p1-core-lang"],
            targetSkills: track.requiredSkills.slice(2, 4),
            keyTakeaways: ["Server vs Client components", "Predictable state machines", "Virtual DOM optimization"],
            suggestedTopics: ["Hydration boundaries", "Global state libraries", "Custom hooks & middleware"],
          },
          {
            key: "p2-api-db-design",
            title: "Relational Modeling & API Specifications",
            description: "Design relational database schemas, index strategies, transaction isolation levels, and REST/GraphQL interfaces.",
            category: "SYSTEM_DESIGN",
            level: 2,
            estimatedHours: 25,
            dependsOn: ["p1-core-lang"],
            targetSkills: track.requiredSkills.slice(4, 6),
            keyTakeaways: ["Database normalization & indexes", "RESTful contract design", "ORM migrations"],
            suggestedTopics: ["ACID transactions", "Query optimization & EXPLAIN", "Pagination & rate limiting"],
          },
        ],
      },
      {
        level: 3,
        milestoneTitle: "Phase 3: Cloud, Scale & Reliability",
        milestoneGoal: "Deploy containerized services, configure CI/CD automations, and implement monitoring.",
        nodes: [
          {
            key: "p3-container-cloud",
            title: "Containerization & Cloud Infrastructure",
            description: "Package services into minimal Docker images, orchestrate containers, and configure managed cloud services.",
            category: "SYSTEM_DESIGN",
            level: 3,
            estimatedHours: 20,
            dependsOn: ["p2-api-db-design"],
            targetSkills: ["Docker", "AWS"],
            keyTakeaways: ["Multi-stage Docker builds", "Cloud IAM & secret security", "Networking fundamentals"],
            suggestedTopics: ["Docker Compose", "Reverse proxies (Nginx/Caddy)", "Cloud storage & buckets"],
          },
          {
            key: "p3-testing-cicd",
            title: "Automated Testing & CI/CD Pipelines",
            description: "Implement unit, integration, and E2E testing suites connected to automated GitHub Actions workflows.",
            category: "PROJECT",
            level: 3,
            estimatedHours: 15,
            dependsOn: ["p2-framework-arch"],
            targetSkills: ["CI/CD Pipelines", "Unit & Integration Testing"],
            keyTakeaways: ["TDD & mocking best practices", "Continuous deployment automation", "Coverage benchmarking"],
            suggestedTopics: ["Vitest/Jest", "Playwright E2E", "GitHub Actions workflows"],
          },
        ],
      },
      {
        level: 4,
        milestoneTitle: "Phase 4: Capstone Project & Interview Readiness",
        milestoneGoal: "Deliver a production-grade portfolio project and prepare for technical system design interviews.",
        nodes: [
          {
            key: "p4-capstone-prod",
            title: "Production Capstone System",
            description: "Build, test, and ship an end-to-end full-stack application featuring authentication, caching, and analytics.",
            category: "PROJECT",
            level: 4,
            estimatedHours: 30,
            dependsOn: ["p3-container-cloud", "p3-testing-cicd"],
            targetSkills: track.requiredSkills,
            keyTakeaways: ["Full project lifecycle delivery", "Performance profiling", "Live demo deployment"],
            suggestedTopics: ["Zero-downtime deploys", "Redis caching layer", "Error monitoring (Sentry)"],
          },
        ],
      },
    ],
  };
}

/**
 * GET /api/roadmap?trackSlug=...
 * Returns the active roadmap for the specified track (or latest user roadmap),
 * including all nodes, user progress status, and mapped resources.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const trackSlug = req.nextUrl.searchParams.get("trackSlug") || "full-stack-web-developer";

  // Find the career track
  const track = await db.careerTrack.findUnique({
    where: { slug: trackSlug },
  });

  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // Find existing roadmap for this user and track
  const roadmap = await db.roadmap.findFirst({
    where: {
      userId,
      trackId: track.id,
    },
    include: {
      track: true,
      nodes: {
        orderBy: [{ level: "asc" }, { order: "asc" }],
      },
    },
  });

  if (!roadmap) {
    return NextResponse.json({
      exists: false,
      track: {
        ...track,
        requiredSkills:
          typeof track.requiredSkills === "string"
            ? JSON.parse(track.requiredSkills)
            : track.requiredSkills,
      },
    });
  }

  // Fetch node progress for all nodes in this roadmap
  const nodeProgressList = await db.nodeProgress.findMany({
    where: {
      userId,
      nodeId: { in: roadmap.nodes.map((n) => n.id) },
    },
  });

  const progressMap = new Map(nodeProgressList.map((p) => [p.nodeId, p]));

  // Fetch all learning resources to populate node recommendations
  const allResources = await db.learningResource.findMany();
  const resourceMap = new Map(allResources.map((r) => [r.id, r]));

  // Format nodes
  const formattedNodes = roadmap.nodes.map((node) => {
    const nodeProg = progressMap.get(node.id);
    const status = nodeProg?.status || "NOT_STARTED";
    const completedAt = nodeProg?.completedAt || null;

    let resIds: string[] = [];
    try {
      resIds = typeof node.resourceIds === "string" ? JSON.parse(node.resourceIds) : node.resourceIds;
    } catch {
      resIds = [];
    }

    const linkedResources = resIds
      .map((id) => resourceMap.get(id))
      .filter(Boolean)
      .map((r) => ({
        ...r!,
        skills: typeof r!.skills === "string" ? JSON.parse(r!.skills) : r!.skills,
      }));

    let dependsOn: string[] = [];
    try {
      dependsOn = typeof node.dependsOn === "string" ? JSON.parse(node.dependsOn) : node.dependsOn;
    } catch {
      dependsOn = [];
    }

    return {
      id: node.id,
      roadmapId: node.roadmapId,
      title: node.title,
      description: node.description,
      category: node.category,
      level: node.level,
      estimatedHours: node.estimatedHours,
      order: node.order,
      dependsOn,
      status,
      completedAt,
      resources: linkedResources,
    };
  });

  // Calculate live progress percentage
  const totalNodes = formattedNodes.length;
  const completedNodes = formattedNodes.filter((n) => n.status === "COMPLETED").length;
  const progressPct = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  return NextResponse.json({
    exists: true,
    roadmap: {
      id: roadmap.id,
      title: roadmap.title,
      progress: progressPct,
      completedNodes,
      totalNodes,
      track: {
        ...roadmap.track,
        requiredSkills:
          typeof roadmap.track.requiredSkills === "string"
            ? JSON.parse(roadmap.track.requiredSkills)
            : roadmap.track.requiredSkills,
      },
      nodes: formattedNodes,
    },
  });
}

/**
 * POST /api/roadmap
 * Generates or retrieves an adaptive AI roadmap for a student on a specific track.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json().catch(() => ({}));
  const trackSlug = body.trackSlug || "full-stack-web-developer";
  const forceRegenerate = body.forceRegenerate === true;

  // 1. Fetch Track
  const track = await db.careerTrack.findUnique({
    where: { slug: trackSlug },
  });

  if (!track) {
    return NextResponse.json({ error: "Career track not found" }, { status: 404 });
  }

  const requiredSkills: string[] =
    typeof track.requiredSkills === "string"
      ? JSON.parse(track.requiredSkills)
      : track.requiredSkills;

  // 2. Check if roadmap exists and not force-regenerating
  const existingRoadmap = await db.roadmap.findFirst({
    where: { userId, trackId: track.id },
    include: { nodes: true },
  });

  if (existingRoadmap && !forceRegenerate && existingRoadmap.nodes.length > 0) {
    return GET(new NextRequest(`${req.url}?trackSlug=${trackSlug}`));
  }

  // 3. Fetch student skills and gaps
  const profile = await db.profile.findUnique({
    where: { userId },
    include: { skills: { include: { skill: true } } },
  });

  const latestGap = await db.gapAnalysis.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const studentSkills = (profile?.skills || []).map((s) => s.skill.name);
  let missingSkills: string[] = [];
  if (latestGap?.missingSkills) {
    try {
      missingSkills = (JSON.parse(latestGap.missingSkills) as { skill: string }[]).map((m) => m.skill);
    } catch {
      missingSkills = [];
    }
  }

  // 4. Fetch available catalog resources for mapping
  const catalogResources = await db.learningResource.findMany({
    select: { id: true, title: true, skills: true },
  });

  const parsedCatalog = catalogResources.map((c) => ({
    id: c.id,
    title: c.title,
    skills: (typeof c.skills === "string" ? JSON.parse(c.skills) : c.skills) as string[],
  }));

  // 5. Generate AI Roadmap
  const fallback = buildFallbackRoadmap({
    title: track.title,
    slug: track.slug,
    requiredSkills,
  });

  const prompt = buildRoadmapGenerationPrompt({
    track: {
      title: track.title,
      slug: track.slug,
      description: track.description,
      requiredSkills,
    },
    studentSkills,
    missingSkills,
    catalogResources: parsedCatalog,
  });

  const aiResult = await generateStructured({
    prompt,
    schema: RoadmapGenerationResultSchema,
    system:
      "You are Connect's Adaptive Curriculum Architect. Generate a multi-level sequential learning roadmap customized to the student's skills and gaps.",
    temperature: 0.3,
    fallback: () => fallback,
  });

  const generated = aiResult.data;

  // 6. Delete old roadmap for this track if force-regenerating
  if (existingRoadmap) {
    await db.roadmap.delete({ where: { id: existingRoadmap.id } });
  }

  // 7. Persist new Roadmap
  const newRoadmap = await db.roadmap.create({
    data: {
      userId,
      trackId: track.id,
      title: `${track.title} Roadmap`,
      progress: 0,
    },
  });

  // Map generated node keys to database IDs for dependencies
  const keyToIdMap = new Map<string, string>();
  const nodesToCreate: {
    key: string;
    roadmapId: string;
    title: string;
    description: string;
    category: string;
    level: number;
    estimatedHours: number;
    order: number;
    rawDependsOn: string[];
    targetSkills: string[];
    resourceIds: string[];
  }[] = [];

  let globalOrder = 0;
  for (const milestone of generated.milestones) {
    for (const node of milestone.nodes) {
      // Find matching catalog resources for this node based on targetSkills
      const matchedResourceIds = parsedCatalog
        .filter((res) =>
          res.skills.some((s) =>
            node.targetSkills.some(
              (ts) => ts.toLowerCase().trim() === s.toLowerCase().trim()
            )
          )
        )
        .slice(0, 3)
        .map((r) => r.id);

      nodesToCreate.push({
        key: node.key,
        roadmapId: newRoadmap.id,
        title: node.title,
        description: node.description,
        category: node.category,
        level: node.level,
        estimatedHours: node.estimatedHours,
        order: globalOrder++,
        rawDependsOn: node.dependsOn,
        targetSkills: node.targetSkills,
        resourceIds: matchedResourceIds,
      });
    }
  }

  // Insert nodes in sequential order
  for (const n of nodesToCreate) {
    const created = await db.roadmapNode.create({
      data: {
        roadmapId: n.roadmapId,
        title: n.title,
        description: n.description,
        category: n.category,
        level: n.level,
        estimatedHours: n.estimatedHours,
        order: n.order,
        dependsOn: JSON.stringify(n.rawDependsOn),
        resourceIds: JSON.stringify(n.resourceIds),
      },
    });

    keyToIdMap.set(n.key, created.id);

    // Initialize progress record
    await db.nodeProgress.create({
      data: {
        userId,
        nodeId: created.id,
        status: "NOT_STARTED",
      },
    });
  }

  // Update dependencies with actual database node IDs
  const allCreatedNodes = await db.roadmapNode.findMany({
    where: { roadmapId: newRoadmap.id },
  });

  for (const dbNode of allCreatedNodes) {
    let rawDeps: string[] = [];
    try {
      rawDeps = JSON.parse(dbNode.dependsOn);
    } catch {
      rawDeps = [];
    }

    const resolvedIds = rawDeps
      .map((k) => keyToIdMap.get(k))
      .filter((id): id is string => Boolean(id));

    if (resolvedIds.length > 0) {
      await db.roadmapNode.update({
        where: { id: dbNode.id },
        data: { dependsOn: JSON.stringify(resolvedIds) },
      });
    }
  }

  return GET(new NextRequest(`${req.url}?trackSlug=${trackSlug}`));
}
