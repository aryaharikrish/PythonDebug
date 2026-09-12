"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/userContext";
import {
  History as HistoryIcon,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Trash2,
  ArrowRight,
  Filter,
  Code2,
} from "lucide-react";

interface SessionRecord {
  id: string;
  userId: string;
  code: string;
  title: string;
  errorType: string;
  errorMessage: string;
  errorLine?: number;
  explanation: string;
  suggestedFix: string;
  correctedCode: string;
  status: "error" | "success";
  numberOfErrors: number;
  executionTime: number;
  timestamp: number;
  fixed: boolean;
}

export default function HistoryPage() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "fixed" | "unfixed">("all");
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  useEffect(() => {
    // Load debugging history from local storage / Convex fallback
    const saved = localStorage.getItem("pydebug_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {}
    } else {
      // Sample seed history if empty
      const defaultHistory: SessionRecord[] = [
        {
          id: "session_1",
          userId: user.userId,
          code: "numbers = [1, 2, 3]\nprint(numbers[5])",
          title: "Accessing List Index Out of Range",
          errorType: "IndexError",
          errorMessage: "list index out of range",
          errorLine: 2,
          explanation: "The list does not contain an element at index 5.",
          suggestedFix: "Use a valid index or check list length.",
          correctedCode: "numbers = [1, 2, 3]\nprint(numbers[2])",
          status: "error",
          numberOfErrors: 1,
          executionTime: 42,
          timestamp: Date.now() - 3600000 * 2,
          fixed: true,
        },
        {
          id: "session_2",
          userId: user.userId,
          code: "def greet(name)\n    print('Hello ' + name)",
          title: "Missing Function Definition Colon",
          errorType: "SyntaxError",
          errorMessage: "expected ':'",
          errorLine: 1,
          explanation: "Function definition missing colon at end of signature.",
          suggestedFix: "Add colon to function header.",
          correctedCode: "def greet(name):\n    print('Hello ' + name)",
          status: "error",
          numberOfErrors: 1,
          executionTime: 38,
          timestamp: Date.now() - 3600000 * 24,
          fixed: true,
        },
        {
          id: "session_3",
          userId: user.userId,
          code: "person = {'name': 'Alice'}\nprint(person['age'])",
          title: "Dictionary Missing Key Lookup",
          errorType: "KeyError",
          errorMessage: "'age'",
          errorLine: 2,
          explanation: "Key 'age' does not exist in dictionary.",
          suggestedFix: "Use dict.get('age', 'N/A').",
          correctedCode: "person = {'name': 'Alice'}\nprint(person.get('age', 'N/A'))",
          status: "error",
          numberOfErrors: 1,
          executionTime: 45,
          timestamp: Date.now() - 3600000 * 48,
          fixed: false,
        },
      ];
      setSessions(defaultHistory);
      localStorage.setItem("pydebug_sessions", JSON.stringify(defaultHistory));
    }
  }, [user.userId]);

  const toggleFixedStatus = (sessionId: string) => {
    const updated = sessions.map((s) => (s.id === sessionId ? { ...s, fixed: !s.fixed } : s));
    setSessions(updated);
    localStorage.setItem("pydebug_sessions", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSessions([]);
    localStorage.removeItem("pydebug_sessions");
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.errorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "fixed") return matchesSearch && s.fixed;
    if (statusFilter === "unfixed") return matchesSearch && !s.fixed;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-blue-400" />
            Debugging Session History
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review your past Python error diagnostics, inspect tracebacks, and track resolved issues.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 text-red-400 border border-red-900/60 text-xs font-medium hover:bg-red-950/80 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code or error type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Status:</span>
          {(["all", "fixed", "unfixed"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Grid / Table */}
      {filteredSessions.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-slate-400 space-y-3">
          <HistoryIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Session Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search filter or execute python code in the Debugger to record new sessions.
          </p>
          <Link
            href="/debugger"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
          >
            Go to Debugger
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 hover:border-slate-700"
            >
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                      session.errorType === "None"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-red-950 text-red-400 border border-red-800"
                    }`}
                  >
                    {session.errorType}
                  </span>

                  <span className="text-sm font-bold text-slate-200">{session.title}</span>
                </div>

                <p className="text-xs font-mono text-slate-400 truncate max-w-xl">
                  {session.errorMessage || session.explanation}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(session.timestamp).toLocaleDateString()} at{" "}
                    {new Date(session.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span>Execution: {session.executionTime}ms</span>
                </div>
              </div>

              {/* Status & View Button Actions */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                <button
                  onClick={() => toggleFixedStatus(session.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    session.fixed
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                      : "bg-amber-950/80 text-amber-300 border-amber-800"
                  }`}
                >
                  {session.fixed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {session.fixed ? "Fixed" : "Unresolved"}
                </button>

                <button
                  onClick={() => setSelectedSession(session)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">{selectedSession.title}</h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Submitted Python Code:</span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-slate-200">
                  {selectedSession.code}
                </pre>
              </div>

              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
                <span className="font-mono font-bold text-red-400 block mb-1">
                  {selectedSession.errorType}: {selectedSession.errorMessage}
                </span>
                <p className="text-slate-300">{selectedSession.explanation}</p>
              </div>

              <div>
                <span className="text-emerald-400 font-semibold block mb-1">Suggested Corrected Code:</span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-emerald-300">
                  {selectedSession.correctedCode}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
