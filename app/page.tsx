"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  Bug,
  Sparkles,
  Trophy,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const [demoActive, setDemoActive] = useState(false);

  const features = [
    {
      icon: Terminal,
      title: "Python Code Editor",
      description: "Monaco-powered editor with syntax highlighting, line numbers, light/dark themes, and preset bug examples.",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: Bug,
      title: "Error Detection",
      description: "Instant identification of SyntaxErrors, IndexErrors, KeyErrors, TypeErrors, and runtime exceptions.",
      color: "from-red-500 to-rose-600",
    },
    {
      icon: AlertTriangle,
      title: "Error Explanation",
      description: "Clear, beginner-friendly explanations that break down Python tracebacks into understandable concepts.",
      color: "from-amber-500 to-orange-600",
    },
    {
      icon: Sparkles,
      title: "AI Debugging Assistance",
      description: "Root cause analysis with one-click 'Apply Fix' code corrections and educational tips.",
      color: "from-purple-500 to-indigo-600",
    },
    {
      icon: Trophy,
      title: "Debugging Challenges",
      description: "Interactive practice exercises across 10 error categories to build confidence and debugging mastery.",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description: "Monitor solved challenges, error type breakdown, success rate, and historical debugging sessions.",
      color: "from-cyan-500 to-blue-600",
    },
  ];

  return (
    <div className="space-y-20 py-6">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-8 overflow-hidden text-center max-w-4xl mx-auto">
        {/* Glow ambient circle background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-blue-400 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Interactive Python Error Diagnosis & Learning Platform</span>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400 bg-clip-text text-transparent">
            PyDebug
          </span>
        </h1>

        <p className="text-2xl sm:text-3xl font-bold text-slate-200 tracking-wide mb-6">
          Write. Debug. Understand.
        </p>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          The smart educational workspace designed for students and beginner to intermediate programmers to instantly pinpoint, understand, and fix Python bugs.
        </p>

        {/* CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/debugger"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Terminal className="w-4 h-4" />
            Start Debugging Now
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/challenges"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:border-slate-500"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Practice Challenges
          </Link>
        </div>
      </section>

      {/* LIVE DEMO PREVIEW WIDGET */}
      <section className="glass-card rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 block mb-1">
              Live Preview
            </span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              See PyDebug in Action
            </h2>
          </div>
          <button
            onClick={() => setDemoActive(!demoActive)}
            className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30 flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            {demoActive ? "Show Fixed Version" : "Simulate Error Fix"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Code View */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px] pb-2 border-b border-slate-900">
              <span>numbers_demo.py</span>
              <span>Python 3.11</span>
            </div>
            <pre className="text-slate-200">
              {demoActive ? (
                <>
                  <span className="text-slate-500"># Corrected code</span>{"\n"}
                  numbers = [10, 20, 30]{"\n"}
                  <span className="text-emerald-400">print("Last item:", numbers[2])</span>
                </>
              ) : (
                <>
                  <span className="text-slate-500"># Buggy code</span>{"\n"}
                  numbers = [10, 20, 30]{"\n"}
                  <span className="text-red-400 underline decoration-wavy">print(numbers[5])</span>
                </>
              )}
            </pre>
          </div>

          {/* AI Debugging Result Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
            {demoActive ? (
              <div className="space-y-2 text-emerald-400">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Code Fixed & Executed
                </div>
                <p className="text-slate-300 text-xs font-mono bg-slate-900 p-2.5 rounded border border-slate-800">
                  Output: Last item: 30
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-mono font-bold text-xs border border-red-800">
                    IndexError
                  </span>
                  <span className="text-slate-500 text-[11px]">Line 3</span>
                </div>
                <p className="text-slate-300 font-medium">
                  The list does not contain an element at index 5.
                </p>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-slate-400 leading-relaxed text-[11px]">
                  <strong className="text-amber-400 block mb-1">Suggested Fix:</strong>
                  Use index <code className="text-emerald-400">2</code> (the last item) or check list length with <code className="text-blue-400">len(numbers)</code>.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURE CARDS GRID */}
      <section className="space-y-8 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Everything You Need to Master Python Errors
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From interactive code editing to step-by-step error explanations and progress metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="glass-card rounded-xl p-6 space-y-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} p-0.5 shadow-lg`}>
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* BENCHMARK / ADVANTAGE */}
      <section className="glass-panel border border-blue-900/40 rounded-2xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            Secure Python Sandbox Architecture
          </h3>
          <p className="text-xs text-slate-400 max-w-md">
            User Python scripts are executed in isolated, time-limited micro-processes to protect server infrastructure and deliver fast stdout/stderr output.
          </p>
        </div>

        <Link
          href="/debugger"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs whitespace-nowrap shadow-lg transition-all"
        >
          Open Python Debugger
        </Link>
      </section>
    </div>
  );
}
