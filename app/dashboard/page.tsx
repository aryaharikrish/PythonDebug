"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/userContext";
import {
  LayoutDashboard,
  Trophy,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  PieChart,
  BarChart2,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalAttempts: 0,
    problemsSolved: 0,
    problemsRemaining: 10,
    successRate: 0,
    errorCounts: [] as { type: string; count: number; percentage: number }[],
    recentSessions: [] as any[],
  });

  useEffect(() => {
    // Load local storage session history and solved challenge count
    const savedSessions = JSON.parse(localStorage.getItem("pydebug_sessions") || "[]");
    const savedSolved = JSON.parse(localStorage.getItem("pydebug_solved_challenges") || "[]");

    const totalAttempts = savedSessions.length + savedSolved.length;
    const problemsSolved = savedSolved.length;
    const problemsRemaining = Math.max(0, 10 - problemsSolved);

    const successfulSessions = savedSessions.filter(
      (s: any) => s.status === "success" || s.fixed
    ).length;
    const successRate =
      totalAttempts > 0
        ? Math.min(100, Math.round(((successfulSessions + problemsSolved) / (totalAttempts + 1)) * 100))
        : 0;

    // Aggregate common error types
    const errorMap: Record<string, number> = {};
    savedSessions.forEach((s: any) => {
      if (s.errorType && s.errorType !== "None") {
        errorMap[s.errorType] = (errorMap[s.errorType] || 0) + 1;
      }
    });

    // Provide default error distribution if empty
    if (Object.keys(errorMap).length === 0) {
      errorMap["IndexError"] = 3;
      errorMap["SyntaxError"] = 2;
      errorMap["TypeError"] = 2;
      errorMap["KeyError"] = 1;
    }

    const totalErrorCount = Object.values(errorMap).reduce((a, b) => a + b, 0) || 1;
    const errorCounts = Object.entries(errorMap).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalErrorCount) * 100),
    }));

    setStats({
      totalAttempts,
      problemsSolved,
      problemsRemaining,
      successRate,
      errorCounts,
      recentSessions: savedSessions.slice(0, 5),
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xs text-slate-400">
              Student Debugging Dashboard • Progress Metrics & Error Analysis
            </p>
          </div>
        </div>

        <Link
          href="/debugger"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all"
        >
          <Terminal className="w-4 h-4" />
          Open Debugger
        </Link>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attempts */}
        <div className="glass-card rounded-xl p-5 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Debugging Attempts
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 text-blue-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.totalAttempts}</p>
          <p className="text-[11px] text-slate-500">Total Python scripts executed</p>
        </div>

        {/* Problems Solved */}
        <div className="glass-card rounded-xl p-5 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Problems Solved
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">{stats.problemsSolved}</p>
          <p className="text-[11px] text-slate-500">Challenges completed</p>
        </div>

        {/* Problems Remaining */}
        <div className="glass-card rounded-xl p-5 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Challenges Left
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-400">{stats.problemsRemaining}</p>
          <p className="text-[11px] text-slate-500">Out of 10 categories</p>
        </div>

        {/* Success Rate */}
        <div className="glass-card rounded-xl p-5 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Success Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-indigo-400">{stats.successRate}%</p>
          <p className="text-[11px] text-slate-500">Fixed & correct output ratio</p>
        </div>
      </div>

      {/* CHARTS & ERROR BREAKDOWN ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Common Error Types Distribution Bar Chart */}
        <div className="lg:col-span-7 glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">Common Error Types Encountered</h2>
            </div>
            <span className="text-xs text-slate-500">Frequency Analysis</span>
          </div>

          <div className="space-y-3 pt-1">
            {stats.errorCounts.map((err) => (
              <div key={err.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-300 font-mono">{err.type}</span>
                  <span className="text-slate-400">
                    {err.count} occurrences ({err.percentage}%)
                  </span>
                </div>
                {/* Visual percentage progress bar */}
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${err.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Challenge Progress Card */}
        <div className="lg:col-span-5 glass-card rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Practice Progress</h2>
              </div>
              <span className="text-xs text-emerald-400 font-bold">
                {stats.problemsSolved}/10 Solved
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Master Python debugging by working through challenges covering Syntax, Indentation, Indexing, Dictionaries, OOP, and Exception Handling.
            </p>

            <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Overall Completion</span>
                <span className="font-bold text-amber-400">
                  {Math.round((stats.problemsSolved / 10) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.problemsSolved / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <Link
            href="/challenges"
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all mt-4"
          >
            Continue Practice Challenges
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* RECENT DEBUGGING SESSIONS */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Recent Debugging Sessions</h2>
          </div>
          <Link href="/history" className="text-xs text-blue-400 hover:underline">
            View All History →
          </Link>
        </div>

        {stats.recentSessions.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No debugging sessions logged yet. Head to the Debugger to write and test Python code!
          </p>
        ) : (
          <div className="space-y-2">
            {stats.recentSessions.map((s: any) => (
              <div
                key={s.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      s.errorType === "None"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-red-950 text-red-400 border border-red-800"
                    }`}
                  >
                    {s.errorType}
                  </span>
                  <span className="text-slate-200 font-medium truncate max-w-xs">{s.title}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span>{new Date(s.timestamp).toLocaleDateString()}</span>
                  <span className={s.fixed ? "text-emerald-400" : "text-amber-400"}>
                    {s.fixed ? "Fixed" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
