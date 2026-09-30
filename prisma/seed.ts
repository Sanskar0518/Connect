import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Connect database seed...");

  // Load Seed JSON files
  const seedDir = path.join(__dirname, "seed-data");
  const skillsData = JSON.parse(fs.readFileSync(path.join(seedDir, "skills.json"), "utf8"));
  const companiesData = JSON.parse(fs.readFileSync(path.join(seedDir, "companies.json"), "utf8"));
  const tracksData = JSON.parse(fs.readFileSync(path.join(seedDir, "career-tracks.json"), "utf8"));
  const resourcesData = JSON.parse(fs.readFileSync(path.join(seedDir, "learning-resources.json"), "utf8"));
  const govData = JSON.parse(fs.readFileSync(path.join(seedDir, "gov-opportunities.json"), "utf8"));
  const scholarshipsData = JSON.parse(fs.readFileSync(path.join(seedDir, "scholarships.json"), "utf8"));

  // 1. Seed Skills
  console.log(`Seeding ${skillsData.length} skills...`);
  for (const item of skillsData) {
    await prisma.skill.upsert({
      where: { name: item.name },
      update: {
        category: item.category,
        description: item.description,
      },
      create: {
        name: item.name,
        category: item.category,
        description: item.description,
      },
    });
  }

  // 2. Seed Companies & Benchmarks
  console.log(`Seeding ${companiesData.length} companies & benchmarks...`);
  for (const item of companiesData) {
    const company = await prisma.company.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        industry: item.industry,
        description: item.description,
        culture: item.culture,
        techStack: JSON.stringify(item.techStack),
      },
      create: {
        name: item.name,
        slug: item.slug,
        industry: item.industry,
        description: item.description,
        culture: item.culture,
        techStack: JSON.stringify(item.techStack),
      },
    });

    if (item.benchmarks && Array.isArray(item.benchmarks)) {
      for (const b of item.benchmarks) {
        await prisma.companyBenchmark.upsert({
          where: {
            companyId_role: {
              companyId: company.id,
              role: b.role,
            },
          },
          update: {
            minReadiness: b.minReadiness,
            skillWeights: JSON.stringify(b.skillWeights),
          },
          create: {
            companyId: company.id,
            role: b.role,
            minReadiness: b.minReadiness,
            skillWeights: JSON.stringify(b.skillWeights),
          },
        });
      }
    }
  }

  // 3. Seed Career Tracks
  console.log(`Seeding ${tracksData.length} career tracks...`);
  for (const item of tracksData) {
    await prisma.careerTrack.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        avgSalary: item.avgSalary,
        demandTrend: item.demandTrend,
        category: item.category,
        requiredSkills: JSON.stringify(item.requiredSkills),
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        avgSalary: item.avgSalary,
        demandTrend: item.demandTrend,
        category: item.category,
        requiredSkills: JSON.stringify(item.requiredSkills),
      },
    });
  }

  // 4. Seed Learning Resources
  console.log(`Seeding ${resourcesData.length} learning resources...`);
  for (const item of resourcesData) {
    const existing = await prisma.learningResource.findFirst({
      where: { title: item.title, provider: item.provider },
    });
    if (existing) {
      await prisma.learningResource.update({
        where: { id: existing.id },
        data: {
          url: item.url,
          type: item.type,
          cost: item.cost,
          price: item.price,
          durationHours: item.durationHours,
          level: item.level,
          skills: JSON.stringify(item.skills),
        },
      });
    } else {
      await prisma.learningResource.create({
        data: {
          title: item.title,
          provider: item.provider,
          url: item.url,
          type: item.type,
          cost: item.cost,
          price: item.price,
          durationHours: item.durationHours,
          level: item.level,
          skills: JSON.stringify(item.skills),
        },
      });
    }
  }

  // 5. Seed Demo User & Profile
  console.log("Seeding demo student user...");
  const hashedPassword = await bcrypt.hash("Demo1234!", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@connect.dev" },
    update: {
      name: "Alex Rivera",
      password: hashedPassword,
      role: "STUDENT",
    },
    create: {
      email: "demo@connect.dev",
      name: "Alex Rivera",
      password: hashedPassword,
      role: "STUDENT",
    },
  });

  const demoProfile = await prisma.profile.upsert({
    where: { userId: demoUser.id },
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
      readinessScore: 68.5,
      xp: 450,
      streak: 5,
    },
    create: {
      userId: demoUser.id,
      headline: "Aspiring Full Stack Engineer | CS Senior",
      bio: "Passionate about building intuitive, performant web applications and exploring distributed systems.",
      targetRole: "Full Stack Web Developer",
      college: "Metropolitan Institute of Technology",
      degree: "B.Tech Computer Science",
      graduationYear: 2026,
      gpa: 3.82,
      githubUrl: "https://github.com/alexrivera",
      linkedinUrl: "https://linkedin.com/in/alexrivera-demo",
      readinessScore: 68.5,
      xp: 450,
      streak: 5,
    },
  });

  // Add initial consent for demo user
  for (const consentType of ["TERMS", "PRIVACY", "DATA_PROCESSING", "AI_USAGE"]) {
    await prisma.consent.upsert({
      where: {
        userId_type: {
          userId: demoUser.id,
          type: consentType,
        },
      },
      update: { granted: true },
      create: {
        userId: demoUser.id,
        type: consentType,
        granted: true,
      },
    });
  }

  // Attach some starter skills to Demo Profile
  const sampleSkillNames = ["JavaScript", "TypeScript", "React", "HTML5 & CSS3", "Git & GitHub", "Problem Solving"];
  for (const skillName of sampleSkillNames) {
    const skillRecord = await prisma.skill.findUnique({ where: { name: skillName } });
    if (skillRecord) {
      await prisma.profileSkill.upsert({
        where: {
          profileId_skillId: {
            profileId: demoProfile.id,
            skillId: skillRecord.id,
          },
        },
        update: { confidence: 0.85, source: "TRANSCRIPT" },
        create: {
          profileId: demoProfile.id,
          skillId: skillRecord.id,
          confidence: 0.85,
          source: "TRANSCRIPT",
        },
      });
    }
  }

  // 5. Seed Jobs & Internships (for F7: Job Matcher)
  console.log("Seeding jobs & internships...");
  const jobsData = [
    {
      title: "Software Engineering Intern",
      company: "Google",
      location: "Hyderabad, India",
      type: "INTERNSHIP",
      salary: "₹80,000/month",
      description: "Work on large-scale distributed systems. Join the team building core infrastructure for Google products.",
      requirements: JSON.stringify(["Python", "C++", "Algorithms", "Data Structures", "System Design"]),
      url: "https://careers.google.com",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      source: "seed",
    },
    {
      title: "Associate Cloud & DevOps Engineer",
      company: "Amazon Web Services",
      location: "Bangalore, India",
      type: "FULL_TIME",
      salary: "₹18–24 LPA",
      description: "Build and deploy cloud-native services on AWS infrastructure. Work with Kubernetes, Terraform, and CI/CD pipelines.",
      requirements: JSON.stringify(["AWS", "Kubernetes", "Terraform", "Docker", "Python", "CI/CD"]),
      url: "https://amazon.jobs",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      source: "seed",
    },
    {
      title: "Full Stack Intern",
      company: "Microsoft",
      location: "Remote (India)",
      type: "INTERNSHIP",
      salary: "₹60,000/month",
      description: "Build web applications using React and .NET. Collaborate with PM and design teams on real product features.",
      requirements: JSON.stringify(["React", "TypeScript", "C#", ".NET", "Azure", "REST APIs"]),
      url: "https://careers.microsoft.com",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      source: "seed",
    },
    {
      title: "Graduate Software Engineer",
      company: "Stripe",
      location: "Bangalore, India",
      type: "FULL_TIME",
      salary: "₹25–35 LPA",
      description: "Work on payment infrastructure serving millions of transactions. Strong focus on reliability and correctness.",
      requirements: JSON.stringify(["Java", "Ruby", "Distributed Systems", "SQL", "APIs", "Testing"]),
      url: "https://stripe.com/jobs",
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      source: "seed",
    },
    {
      title: "Data Science Intern",
      company: "Flipkart",
      location: "Bangalore, India",
      type: "INTERNSHIP",
      salary: "₹50,000/month",
      description: "Work on recommendation systems and demand forecasting using ML. Handle petabyte-scale data.",
      requirements: JSON.stringify(["Python", "Machine Learning", "SQL", "Spark", "Statistics", "PyTorch"]),
      url: "https://www.flipkartcareers.com",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      source: "seed",
    },
    {
      title: "Backend Engineer",
      company: "Razorpay",
      location: "Bangalore, India",
      type: "FULL_TIME",
      salary: "₹15–22 LPA",
      description: "Build highly available payment APIs. Work with Go, Kafka, and PostgreSQL at scale.",
      requirements: JSON.stringify(["Go", "Kafka", "PostgreSQL", "Microservices", "REST APIs", "Redis"]),
      url: "https://razorpay.com/jobs",
      deadline: null,
      source: "seed",
    },
    {
      title: "Mobile App Developer Intern",
      company: "Swiggy",
      location: "Bangalore, India",
      type: "INTERNSHIP",
      salary: "₹45,000/month",
      description: "Build features for the consumer app used by 10M+ users. Work with React Native and native Android.",
      requirements: JSON.stringify(["React Native", "Android", "JavaScript", "REST APIs", "Firebase"]),
      url: "https://careers.swiggy.com",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      source: "seed",
    },
    {
      title: "Product Analyst Intern",
      company: "CRED",
      location: "Bangalore, India",
      type: "INTERNSHIP",
      salary: "₹40,000/month",
      description: "Analyze user behavior and work closely with product teams to improve key metrics.",
      requirements: JSON.stringify(["SQL", "Python", "Excel", "Statistics", "Data Visualization", "A/B Testing"]),
      url: "https://careers.cred.club",
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      source: "seed",
    },
    {
      title: "AI/ML Research Intern",
      company: "Nvidia",
      location: "Pune, India",
      type: "INTERNSHIP",
      salary: "₹90,000/month",
      description: "Research deep learning models for GPU optimization. Publish-quality work expected.",
      requirements: JSON.stringify(["Python", "PyTorch", "CUDA", "Deep Learning", "Research", "Linear Algebra"]),
      url: "https://nvidia.com/jobs",
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      source: "seed",
    },
    {
      title: "Frontend Engineer",
      company: "Zepto",
      location: "Mumbai, India",
      type: "FULL_TIME",
      salary: "₹12–18 LPA",
      description: "Build blazing-fast commerce experiences. Own the consumer-facing React web app.",
      requirements: JSON.stringify(["React", "Next.js", "TypeScript", "CSS", "Performance Optimization", "GraphQL"]),
      url: "https://www.zepto.com/careers",
      deadline: null,
      source: "seed",
    },
    {
      title: "Cybersecurity Analyst Intern",
      company: "Infosys",
      location: "Chennai, India",
      type: "INTERNSHIP",
      salary: "₹30,000/month",
      description: "Support security operations center (SOC). Monitor threats, conduct vulnerability assessments.",
      requirements: JSON.stringify(["Network Security", "Linux", "SIEM", "Python", "Ethical Hacking", "Incident Response"]),
      url: "https://infosys.com/careers",
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      source: "seed",
    },
    {
      title: "DevRel Engineer",
      company: "HashiCorp",
      location: "Remote",
      type: "FULL_TIME",
      salary: "₹22–32 LPA",
      description: "Create technical content, demos, and workshops for the Terraform/Vault developer community.",
      requirements: JSON.stringify(["Terraform", "Cloud", "Writing", "Public Speaking", "DevOps", "Kubernetes"]),
      url: "https://hashicorp.com/jobs",
      deadline: null,
      source: "seed",
    },
  ];

  for (const job of jobsData) {
    await prisma.job.upsert({
      where: { id: `seed-job-${job.title.toLowerCase().replace(/\s+/g, "-")}-${job.company.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-job-${job.title.toLowerCase().replace(/\s+/g, "-")}-${job.company.toLowerCase().replace(/\s+/g, "-")}`,
        ...job,
      },
    });
  }
  console.log(`Seeded ${jobsData.length} job listings.`);

  // 6. Seed Government Opportunities
  console.log(`Seeding ${govData.length} government opportunities...`);
  for (const item of govData) {
    await prisma.govOpportunity.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        department: item.department,
        scheme: item.scheme,
        state: item.state,
        qualification: item.qualification,
        deadline: item.deadline ? new Date(item.deadline) : null,
        description: item.description,
        url: item.url,
        type: item.type,
      },
      create: {
        id: item.id,
        title: item.title,
        department: item.department,
        scheme: item.scheme,
        state: item.state,
        qualification: item.qualification,
        deadline: item.deadline ? new Date(item.deadline) : null,
        description: item.description,
        url: item.url,
        type: item.type,
      },
    });
  }
  console.log(`Seeded ${govData.length} government opportunities.`);

  // 7. Seed Scholarships
  console.log(`Seeding ${scholarshipsData.length} scholarships...`);
  for (const item of scholarshipsData) {
    await prisma.scholarship.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        provider: item.provider,
        amount: item.amount,
        deadline: item.deadline ? new Date(item.deadline) : null,
        eligibilityCriteria: JSON.stringify(item.eligibilityCriteria),
        description: item.description,
        url: item.url,
        checklist: JSON.stringify(item.checklist),
      },
      create: {
        id: item.id,
        title: item.title,
        provider: item.provider,
        amount: item.amount,
        deadline: item.deadline ? new Date(item.deadline) : null,
        eligibilityCriteria: JSON.stringify(item.eligibilityCriteria),
        description: item.description,
        url: item.url,
        checklist: JSON.stringify(item.checklist),
      },
    });
  }
  console.log(`Seeded ${scholarshipsData.length} scholarships.`);

  console.log("✅ Seed completed successfully! Demo user: demo@connect.dev / Demo1234!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
