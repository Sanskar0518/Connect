"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Sparkles,
  Heart,
  PartyPopper,
  Handshake,
  Send,
  Loader2,
  CheckCircle,
  HelpCircle,
  User,
  Shield,
  Clock,
} from "lucide-react";

interface PostItem {
  id: string;
  content: string;
  type: string;
  milestoneData: any;
  createdAt: string;
  author: {
    id: string;
    name: string;
    college: string;
    targetRole: string | null;
    isAnonymous: boolean;
    isCurrentUser: boolean;
  };
  reactions: {
    LIKE: number;
    CELEBRATE: number;
    SUPPORT: number;
  };
  userReaction: string | null;
  commentsCount: number;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    college: string;
    isAnonymous: boolean;
    isCurrentUser: boolean;
  };
}

export function FeedView() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer State
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<"GENERAL" | "MILESTONE" | "QUESTION">("MILESTONE");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("Roadmap Node Completed");

  // Expanded Comments Map: postId -> CommentItem[]
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/community/feed");
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      let milestoneData = null;
      if (postType === "MILESTONE") {
        milestoneData = {
          title: milestoneTitle,
          timestamp: new Date().toISOString(),
        };
      }

      const res = await fetch("/api/community/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postContent,
          type: postType,
          milestoneData,
          isAnonymous,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPosts((prev) => [data.post, ...prev]);
        setPostContent("");
      } else {
        alert(data.error || "Failed to publish post");
      }
    } catch (err) {
      console.error("Post creation error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (postId: string, reactionType: "LIKE" | "CELEBRATE" | "SUPPORT") => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentReaction = p.userReaction;
        const counts = { ...p.reactions };

        if (currentReaction === reactionType) {
          // Toggle off
          counts[reactionType] = Math.max(0, counts[reactionType] - 1);
          return { ...p, userReaction: null, reactions: counts };
        } else {
          // Decrement previous if existed
          if (currentReaction) {
            counts[currentReaction as keyof typeof counts] = Math.max(
              0,
              counts[currentReaction as keyof typeof counts] - 1
            );
          }
          counts[reactionType] = (counts[reactionType] || 0) + 1;
          return { ...p, userReaction: reactionType, reactions: counts };
        }
      })
    );

    try {
      const res = await fetch(`/api/community/feed/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: reactionType }),
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  reactions: data.reactions,
                  userReaction: data.userReaction,
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Reaction failed:", err);
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);

    if (!commentsMap[postId]) {
      try {
        setLoadingComments(postId);
        const res = await fetch(`/api/community/feed/${postId}/comments`);
        const data = await res.json();
        if (res.ok) {
          setCommentsMap((prev) => ({ ...prev, [postId]: data.comments || [] }));
        }
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoadingComments(null);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || submittingComment) return;

    try {
      setSubmittingComment(postId);
      const res = await fetch(`/api/community/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment],
        }));
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
        );
      }
    } catch (err) {
      console.error("Comment submit error:", err);
    } finally {
      setSubmittingComment(null);
    }
  };

  const setPresetMilestone = (title: string, sampleText: string) => {
    setPostType("MILESTONE");
    setMilestoneTitle(title);
    setPostContent(sampleText);
  };

  return (
    <div className="space-y-6">
      {/* Post Composer */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-foreground">Share Progress or Question</h2>
          </div>
          <span className="text-xs text-accent font-semibold flex items-center gap-1">
            <span>+20 XP</span>
          </span>
        </div>

        {/* Post Type Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPostType("MILESTONE")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              postType === "MILESTONE"
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Milestone Share</span>
          </button>
          <button
            type="button"
            onClick={() => setPostType("QUESTION")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              postType === "QUESTION"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ask Cohort</span>
          </button>
          <button
            type="button"
            onClick={() => setPostType("GENERAL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              postType === "GENERAL"
                ? "bg-secondary/15 text-secondary border border-secondary/30"
                : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion</span>
          </button>
        </div>

        {/* Milestone Quick Presets */}
        {postType === "MILESTONE" && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Quick Milestone Presets:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setPresetMilestone(
                    "Roadmap Node Completed",
                    "Just completed the Distributed Caching with Redis roadmap node! Handled 5k RPS simulation."
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors"
              >
                🚀 Roadmap Node
              </button>
              <button
                type="button"
                onClick={() =>
                  setPresetMilestone(
                    "AI Mock Interview Passed",
                    "Passed a Technical + Behavioral mock interview with 85% score! STAR practice paid off."
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors"
              >
                🎯 Mock Interview 85%
              </button>
              <button
                type="button"
                onClick={() =>
                  setPresetMilestone(
                    "ATS Resume Score 84%",
                    "Polished my software engineer resume and scored an 84% on the ATS scanner with optimized keywords."
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors"
              >
                📄 ATS Resume Score
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder={
              postType === "MILESTONE"
                ? "Describe your milestone, what you built, and what you learned..."
                : postType === "QUESTION"
                ? "Ask your cohort peers a question about interviews, prep, or tech stacks..."
                : "Share career updates, tips, or discussion with college peers..."
            }
            rows={3}
            className="w-full p-3 text-xs sm:text-sm rounded-xl bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                Post anonymously (name hidden from peers)
              </span>
            </label>

            <button
              type="submit"
              disabled={!postContent.trim() || submitting}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Share (+20 XP)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Loading cohort milestone feed...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground p-6 rounded-2xl bg-card border border-border">
            No community posts yet. Be the first to share a roadmap milestone!
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-2xl bg-card border border-border space-y-3.5 hover:border-primary/30 transition-all"
            >
              {/* Author & Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold uppercase border ${
                      post.author.isAnonymous
                        ? "bg-muted text-muted-foreground border-border"
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}
                  >
                    {post.author.isAnonymous ? <Shield className="w-4 h-4" /> : post.author.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        {post.author.name}
                      </span>
                      {post.author.isCurrentUser && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {post.author.college}
                      {post.author.targetRole && ` • ${post.author.targetRole}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Milestone Tag if present */}
              {post.type === "MILESTONE" && post.milestoneData && (
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                    <div>
                      <span className="font-bold text-foreground">
                        {post.milestoneData.title || "Milestone Achieved"}
                      </span>
                      {post.milestoneData.nodeName && (
                        <span className="text-muted-foreground ml-1">
                          • {post.milestoneData.nodeName}
                        </span>
                      )}
                    </div>
                  </div>
                  {post.milestoneData.xpEarned && (
                    <span className="text-[11px] font-mono font-bold text-accent bg-card px-2 py-0.5 rounded border border-border">
                      +{post.milestoneData.xpEarned} XP
                    </span>
                  )}
                </div>
              )}

              {/* Content */}
              <p className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed">
                {post.content}
              </p>

              {/* Reaction Bar & Comments Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                {/* Reactions */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Like */}
                  <button
                    onClick={() => handleReact(post.id, "LIKE")}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                      post.userReaction === "LIKE"
                        ? "bg-rose-500/15 text-rose-500 font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    title="Like"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        post.userReaction === "LIKE" ? "fill-rose-500 text-rose-500" : ""
                      }`}
                    />
                    <span>{post.reactions.LIKE}</span>
                  </button>

                  {/* Celebrate */}
                  <button
                    onClick={() => handleReact(post.id, "CELEBRATE")}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                      post.userReaction === "CELEBRATE"
                        ? "bg-accent/15 text-accent font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    title="Celebrate milestone"
                  >
                    <PartyPopper className="w-3.5 h-3.5" />
                    <span>{post.reactions.CELEBRATE}</span>
                  </button>

                  {/* Support */}
                  <button
                    onClick={() => handleReact(post.id, "SUPPORT")}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                      post.userReaction === "SUPPORT"
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    title="Support peer"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>{post.reactions.SUPPORT}</span>
                  </button>
                </div>

                {/* Comment Toggle */}
                <button
                  onClick={() => toggleComments(post.id)}
                  className="px-2.5 py-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1.5 font-medium transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.commentsCount} Comments</span>
                </button>
              </div>

              {/* Comments Accordion */}
              {expandedPostId === post.id && (
                <div className="pt-3 border-t border-border/80 space-y-3">
                  {loadingComments === post.id ? (
                    <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading comments...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(commentsMap[post.id] || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">
                          No comments yet. Start the conversation!
                        </p>
                      ) : (
                        (commentsMap[post.id] || []).map((comment) => (
                          <div
                            key={comment.id}
                            className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-foreground">
                                {comment.author.name}
                                {comment.author.isCurrentUser && " (You)"}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-foreground">{comment.content}</p>
                          </div>
                        ))
                      )}

                      {/* Add Comment Input */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Write a constructive comment (+10 XP)..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim() || submittingComment === post.id}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-semibold text-xs flex items-center gap-1 transition-all"
                        >
                          {submittingComment === post.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
