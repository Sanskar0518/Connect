export interface RoadmapPromptInput {
  track: {
    title: string;
    slug: string;
    description: string;
    requiredSkills: string[];
  };
  studentSkills: string[];
  missingSkills: string[];
  catalogResources?: { id: string; title: string; skills: string[] }[];
}

export function buildRoadmapGenerationPrompt(input: RoadmapPromptInput): string {
  const { track, studentSkills, missingSkills } = input;

  return `You are Connect's Adaptive Curriculum Architect.
Generate a structured, progressive learning roadmap for a student pursuing the career track: "${track.title}".

CAREER TRACK CONTEXT:
- Track: ${track.title} (${track.slug})
- Description: ${track.description}
- Core Track Skills: ${track.requiredSkills.join(", ")}

STUDENT SKILL STATUS:
- Student Verified Strengths: ${studentSkills.join(", ") || "None yet"}
- Priority Gaps to Bridge: ${missingSkills.join(", ") || "Foundations needed"}

REQUIREMENTS FOR ROADMAP GENERATION:
1. Divide the learning journey into 3 to 4 sequential Milestones / Levels (Level 1: Core Foundations, Level 2: Advanced Architecture & Patterns, Level 3: Cloud, Scale & Systems, Level 4: Production Capstone & Interview Preparation).
2. Each milestone must contain 2 to 3 distinct, high-impact learning nodes.
3. Every node must have:
   - "key": Unique alphanumeric ID string (e.g. "n1-ts-core", "n2-react-patterns", "n3-api-perf", etc.)
   - "title": Action-oriented title (e.g. "TypeScript Strictness & State Architectures")
   - "description": Concrete learning objectives and syllabus summary
   - "category": TECHNICAL | SYSTEM_DESIGN | PROJECT | SOFT_SKILL
   - "level": 1, 2, 3, or 4
   - "estimatedHours": Realistic study hours (between 8 and 35 hours)
   - "dependsOn": List of keys of prerequisites this node depends on (Level 1 nodes have empty dependsOn: [])
   - "targetSkills": List of 1-3 specific skills addressed
   - "keyTakeaways": 2-3 key concepts or skills the learner will master
   - "suggestedTopics": 3-4 specific topic bullets to study
4. Provide a total estimated time commitment and a motivational summary.`;
}
