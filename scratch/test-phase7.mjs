/**
 * Phase 7 Integration Tests: Module 6 (Community, Social Benchmarking, Challenges) + Dashboard + Demo Mode
 * Run: node scratch/test-phase7.mjs
 */

const BASE = "http://localhost:3000";
let cookieJar = "";

// ── Auth ──────────────────────────────────────────────────────────────────────
async function login() {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const csrfCookie = csrfRes.headers.get("set-cookie") || "";

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie.split(";")[0],
    },
    body: new URLSearchParams({
      email: "demo@connect.dev",
      password: "Demo1234!",
      csrfToken,
      callbackUrl: `${BASE}/dashboard`,
      json: "true",
    }),
    redirect: "manual",
  });

  const loginCookies = loginRes.headers.get("set-cookie") || "";
  const allCookies = [csrfCookie, loginCookies]
    .flatMap((c) => c.split(",").map((p) => p.trim().split(";")[0]))
    .filter(Boolean)
    .join("; ");

  cookieJar = allCookies;

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieJar },
  });
  const sessionData = await sessionRes.json();
  return sessionData?.user?.email || null;
}

async function api(path, opts = {}) {
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieJar,
      ...(opts.headers || {}),
    },
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("🚀 Phase 7 Integration Tests (Module 6 + Dashboard + Demo Mode)\n");

  // 1. Authenticate Demo Student
  console.log("🔑 Authenticating demo@connect.dev...");
  const loggedInEmail = await login();
  assert(loggedInEmail === "demo@connect.dev", `Session user = ${loggedInEmail}`);

  // 2. Test POST /api/demo/load (Idempotent, < 5s, all 14 features)
  console.log("\n⚡ POST /api/demo/load");
  const t0 = Date.now();
  const demoRes = await api("/api/demo/load", { method: "POST" });
  const t1 = Date.now();
  const demoData = await demoRes.json();

  assert(demoRes.status === 200, "Demo load returned status 200");
  assert(demoData.success === true, "Demo load success = true");
  assert(demoData.featuresLoaded === 14, "All 14 features loaded");
  assert(demoData.readinessScore >= 70, `Readiness score = ${demoData.readinessScore}% (>= 70)`);
  assert(t1 - t0 < 5000, `Demo loaded in ${t1 - t0}ms (< 5000ms target)`);

  // 3. Test GET /api/community/feed
  console.log("\n📰 GET /api/community/feed");
  const feedRes = await api("/api/community/feed");
  const feedData = await feedRes.json();
  assert(feedRes.status === 200, "Feed returned status 200");
  assert(Array.isArray(feedData.posts), "Has posts array");
  assert(feedData.posts.length > 0, `Returned ${feedData.posts.length} posts`);
  const firstPost = feedData.posts[0];
  assert(firstPost.id && firstPost.content, "Post has id and content");
  assert(firstPost.reactions && typeof firstPost.reactions.LIKE === "number", "Post has reaction counts");

  // 4. Test POST /api/community/feed (Create Post)
  console.log("\n📝 POST /api/community/feed");
  const createPostRes = await api("/api/community/feed", {
    method: "POST",
    body: JSON.stringify({
      content: "Completed Phase 7 Integration: Module 6 Community & Social Benchmarking Hub active!",
      type: "MILESTONE",
      milestoneData: { title: "Phase 7 Complete", xpEarned: 100 },
      isAnonymous: false,
    }),
  });
  const createPostData = await createPostRes.json();
  assert(createPostRes.status === 201, "Create post returned 201");
  assert(createPostData.post?.id, "Created post has id");
  assert(createPostData.xpAwarded === 20, "Awarded 20 XP for post creation");
  const createdPostId = createPostData.post.id;

  // 5. Test POST /api/community/feed/[id]/react (Toggle Reaction)
  console.log("\n❤️ POST /api/community/feed/[id]/react");
  const reactRes = await api(`/api/community/feed/${createdPostId}/react`, {
    method: "POST",
    body: JSON.stringify({ type: "CELEBRATE" }),
  });
  const reactData = await reactRes.json();
  assert(reactRes.status === 200, "Reaction returned status 200");
  assert(reactData.userReaction === "CELEBRATE", "userReaction set to CELEBRATE");
  assert(reactData.reactions.CELEBRATE >= 1, "CELEBRATE count >= 1");

  // 6. Test Comments on Post
  console.log("\n💬 Comments: GET & POST /api/community/feed/[id]/comments");
  const commentRes = await api(`/api/community/feed/${createdPostId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content: "Great progress Alex! Love the architecture." }),
  });
  const commentData = await commentRes.json();
  assert(commentRes.status === 201, "Create comment returned 201");
  assert(commentData.comment?.content.includes("Great progress"), "Comment content saved");

  const listCommentsRes = await api(`/api/community/feed/${createdPostId}/comments`);
  const listCommentsData = await listCommentsRes.json();
  assert(listCommentsData.comments.length >= 1, "Comments listed successfully");

  // 7. Test GET /api/community/leaderboard
  console.log("\n🏆 GET /api/community/leaderboard");
  const lbRes = await api("/api/community/leaderboard?period=weekly&filter=all");
  const lbData = await lbRes.json();
  assert(lbRes.status === 200, "Leaderboard returned status 200");
  assert(Array.isArray(lbData.leaderboard), "Has leaderboard array");
  assert(lbData.leaderboard.length >= 5, `Leaderboard has ${lbData.leaderboard.length} ranked students`);
  assert(typeof lbData.userRank === "number", `User rank returned: #${lbData.userRank}`);
  const userEntry = lbData.leaderboard.find((i) => i.isUser);
  assert(userEntry && userEntry.isUser === true, "User row highlighted with isUser = true");

  // 8. Test Filtered Leaderboard (College & Track)
  console.log("\n🏫 Filtered Leaderboard");
  const collegeLbRes = await api("/api/community/leaderboard?period=weekly&filter=college");
  const collegeLbData = await collegeLbRes.json();
  assert(collegeLbRes.status === 200, "College filter returned 200");
  assert(collegeLbData.filter === "college", "Filter is college");

  // 9. Test GET /api/community/challenges
  console.log("\n🎯 GET /api/community/challenges");
  const chRes = await api("/api/community/challenges");
  const chData = await chRes.json();
  assert(chRes.status === 200, "Challenges returned status 200");
  assert(chData.challenges.length >= 4, `Returned ${chData.challenges.length} active challenges`);
  const firstChallenge = chData.challenges[0];
  assert(firstChallenge.title && firstChallenge.xpReward > 0, "Challenge has title & xpReward");

  // 10. Test POST /api/community/challenges/[id]/submit
  console.log("\n📤 POST /api/community/challenges/[id]/submit");
  const submitRes = await api(`/api/community/challenges/${firstChallenge.id}/submit`, {
    method: "POST",
    body: JSON.stringify({
      proofUrl: "https://github.com/alexrivera/phase7-submission",
      notes: "Implemented token-bucket sliding window rate limiter in Edge runtime.",
    }),
  });
  const submitData = await submitRes.json();
  assert(submitRes.status === 200, "Challenge submission returned 200");
  assert(submitData.submission.status === "APPROVED", "Submission status = APPROVED");
  assert(submitData.xpAwarded === firstChallenge.xpReward, `Awarded +${submitData.xpAwarded} XP`);

  // 11. Test Badges GET /api/community/badges
  console.log("\n🎖️ GET /api/community/badges");
  const badgesRes = await api("/api/community/badges");
  const badgesData = await badgesRes.json();
  assert(badgesRes.status === 200, "Badges returned status 200");
  assert(badgesData.badges.length >= 7, `Returned ${badgesData.badges.length} badges`);
  const earnedBadges = badgesData.badges.filter((b) => b.isEarned);
  assert(earnedBadges.length >= 3, `User has unlocked ${earnedBadges.length} badges`);

  // 12. Test Privacy Settings GET & PATCH /api/community/privacy
  console.log("\n🛡️ Privacy Controls: GET & PATCH /api/community/privacy");
  const privRes = await api("/api/community/privacy");
  const privData = await privRes.json();
  assert(privRes.status === 200, "Privacy GET returned 200");
  assert(typeof privData.isAnonymous === "boolean", "Has isAnonymous boolean");

  const patchPrivRes = await api("/api/community/privacy", {
    method: "PATCH",
    body: JSON.stringify({ isAnonymous: true, optOutCommunity: false }),
  });
  const patchPrivData = await patchPrivRes.json();
  assert(patchPrivRes.status === 200, "Privacy PATCH returned 200");
  assert(patchPrivData.privacy.isAnonymous === true, "isAnonymous toggled to true");

  // Toggle back to false for demo clean state
  await api("/api/community/privacy", {
    method: "PATCH",
    body: JSON.stringify({ isAnonymous: false, optOutCommunity: false }),
  });

  // ────────────────────────────────────────────────────
  console.log("\n────────────────────────────────────────────────────");
  console.log(`  ✅ Passed: ${passed}   ❌ Failed: ${failed}`);
  if (failed === 0) {
    console.log("  🎉 Phase 7 ALL PASSED — Module 6, Dashboard & Demo Mode verified!");
  } else {
    console.log("  ⚠️ Some tests failed. Please review output above.");
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test runner fatal error:", e);
  process.exit(1);
});
