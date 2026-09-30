"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DeadlineItem {
  id: string;
  type: "APPLICATION" | "SCHOLARSHIP" | "JOB";
  title: string;
  organization: string;
  deadline: string | null;
  daysUntil: number | null;
  urgency: "overdue" | "critical" | "soon" | "upcoming" | "none";
  status: string;
  url?: string | null;
  notes?: string | null;
  amount?: string;
  jobType?: string;
}

interface Stats {
  total: number;
  overdue: number;
  critical: number;
  upcoming: number;
  applied: number;
}

const COLUMNS = ["SAVED", "APPLIED", "INTERVIEWING", "ACCEPTED", "REJECTED"];

export default function DeadlineTracker() {
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Add form state
  const [form, setForm] = useState({
    title: "",
    organization: "",
    deadline: "",
    url: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchDeadlines = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deadlines");
      const data = await res.json();
      setDeadlines(data.deadlines || []);
      setStats(data.stats || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const handleAdd = async () => {
    if (!form.title || !form.organization) return;
    setSaving(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ title: "", organization: "", deadline: "", url: "", notes: "" });
        setShowAddForm(false);
        fetchDeadlines();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, column: string) => {
    await fetch(`/api/deadlines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ column }),
    });
    fetchDeadlines();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/deadlines/${id}`, { method: "DELETE" });
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  };

  const urgencyConfig = {
    overdue: { label: "Overdue", color: "text-rose-600 dark:text-red-400", bg: "bg-rose-50 dark:bg-red-500/10 border-rose-300 dark:border-red-500/30", dot: "bg-rose-500 dark:bg-red-400" },
    critical: { label: "Due in 3 days", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10 border-orange-300 dark:border-orange-500/30", dot: "bg-orange-500 dark:bg-orange-400" },
    soon: { label: "Due this week", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30", dot: "bg-amber-500 dark:bg-amber-400" },
    upcoming: { label: "Upcoming", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30", dot: "bg-blue-500 dark:bg-blue-400" },
    none: { label: "No deadline", color: "text-muted-foreground", bg: "bg-card border-border", dot: "bg-muted-foreground/40" },
  };

  const filtered =
    filter === "all"
      ? deadlines
      : filter === "overdue"
      ? deadlines.filter((d) => d.urgency === "overdue")
      : filter === "critical"
      ? deadlines.filter((d) => ["overdue", "critical", "soon"].includes(d.urgency))
      : deadlines.filter((d) => d.type === filter.toUpperCase());

  // Group by urgency
  const groups = [
    { key: "overdue", items: filtered.filter((d) => d.urgency === "overdue") },
    { key: "critical", items: filtered.filter((d) => d.urgency === "critical") },
    { key: "soon", items: filtered.filter((d) => d.urgency === "soon") },
    { key: "upcoming", items: filtered.filter((d) => d.urgency === "upcoming") },
    { key: "none", items: filtered.filter((d) => d.urgency === "none") },
  ].filter((g) => g.items.length > 0);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Tracked", value: stats.total, color: "text-foreground", icon: Calendar },
            { label: "Overdue", value: stats.overdue, color: "text-rose-600 dark:text-red-400", icon: AlertTriangle },
            { label: "Critical (≤3d)", value: stats.critical, color: "text-orange-600 dark:text-orange-400", icon: Clock },
            { label: "Applied", value: stats.applied, color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-muted-foreground text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Deadline Tracker</h2>
            <p className="text-muted-foreground text-xs">{deadlines.length} items tracked</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDeadlines}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Track Deadline
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-card border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-foreground font-semibold text-sm">Add New Deadline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Title *</label>
              <input
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
                placeholder="e.g. Google SWE Internship"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Organization *</label>
              <input
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
                placeholder="e.g. Google"
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Deadline</label>
              <input
                type="date"
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-amber-500"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">URL</label>
              <input
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Notes</label>
            <textarea
              rows={2}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Any notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !form.title || !form.organization}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? "Saving…" : "Add Deadline"}
            </button>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { key: "all", label: "All" },
          { key: "critical", label: "⚡ Urgent" },
          { key: "application", label: "My Applications" },
          { key: "scholarship", label: "Scholarships" },
          { key: "job", label: "Jobs" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-xl font-medium capitalize transition-all ${
              filter === key
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grouped Deadline List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
          <p>No deadlines found. Add one above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ key, items }) => {
            const cfg = urgencyConfig[key as keyof typeof urgencyConfig];
            const collapsed = collapsedGroups.has(key);
            return (
              <div key={key}>
                <button
                  onClick={() => toggleGroup(key)}
                  className="flex items-center gap-2 mb-2 w-full text-left"
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                  <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-muted-foreground text-xs ml-1">({items.length})</span>
                  {collapsed ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" />
                  )}
                </button>
                {!collapsed && (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-xl p-4 flex items-start gap-4 ${cfg.bg} shadow-sm`}
                      >
                        {/* Type Tag */}
                        <div className="flex-shrink-0 text-lg">
                          {item.type === "SCHOLARSHIP" ? "🏆" : item.type === "JOB" ? "💼" : "📋"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="text-foreground font-semibold text-sm truncate">{item.title}</p>
                              <p className="text-muted-foreground text-xs">{item.organization}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {item.deadline && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <span className={`text-xs font-semibold ${cfg.color}`}>
                                    {item.daysUntil !== null && item.daysUntil < 0
                                      ? `${Math.abs(item.daysUntil)}d overdue`
                                      : item.daysUntil !== null
                                      ? `${item.daysUntil}d left`
                                      : new Date(item.deadline).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Status + Actions for user applications */}
                          {item.type === "APPLICATION" && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                              >
                                {COLUMNS.map((c) => (
                                  <option key={c} value={c} className="bg-background text-foreground">
                                    {c}
                                  </option>
                                ))}
                              </select>
                              {item.notes && (
                                <span className="text-muted-foreground text-xs truncate max-w-xs">{item.notes}</span>
                              )}
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="ml-auto p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Scholarship amount */}
                          {item.type === "SCHOLARSHIP" && item.amount && (
                            <div className="mt-1 flex items-center gap-2">
                              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">{item.amount}</span>
                              <span className="text-muted-foreground text-xs">• {item.status}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
