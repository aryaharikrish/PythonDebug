"use client";

import React, { useState } from "react";
import { AIDebugAnalysis } from "@/lib/aiDebugger";
import { AlertTriangle, CheckCircle2, Lightbulb, ArrowRight, Check, Copy, Code, Sparkles, Info } from "lucide-react";

interface DebugPanelProps {
  analysis: AIDebugAnalysis | null;
  onApplyFix: (correctedCode: string) => void;
  isLoading: boolean;
  hasExecuted: boolean;
}

export function DebugPanel({ analysis, onApplyFix, isLoading, hasExecuted }: DebugPanelProps) {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="h-full bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
        <div>
          <h3 className="text-base font-semibold text-slate-200">Analyzing Python Errors...</h3>
          <p className="text-xs text-slate-400 mt-1">Inspecting AST structure, tracebacks, and root causes</p>
        </div>
      </div>
    );
  }

  if (!hasExecuted) {
    return (
      <div className="h-full bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">AI Debugging Assistant</h3>
        <p className="text-xs max-w-xs leading-relaxed">
          Run your code or click <span className="text-blue-400 font-medium">Debug Code</span> to detect errors, inspect tracebacks, and receive beginner-friendly explanations with instant fixes.
        </p>
      </div>
    );
  }

  if (!analysis || analysis.errorType === "None") {
    return (
      <div className="h-full bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-emerald-400">No Errors Detected!</h3>
        <p className="text-xs text-slate-400 max-w-xs">
          Your Python code executed successfully without throwing any syntax or runtime exceptions.
        </p>
      </div>
    );
  }

  const copyCode = () => {
    navigator.clipboard.writeText(analysis.correctedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-red-950/40 border-b border-red-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-sm font-bold text-red-300">Error & Debugging Panel</h3>
        </div>
        {analysis.errorLine && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-red-900/60 text-red-200 border border-red-700/50">
            Line {analysis.errorLine}
          </span>
        )}
      </div>

      {/* Scrollable Diagnostics Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Error Type Badge & Message */}
        <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm text-red-400">{analysis.errorType}</span>
          </div>
          <p className="font-mono text-red-200 break-words">{analysis.errorMessage}</p>
        </div>

        {/* Problem Location Snippet */}
        {analysis.errorSnippet && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Problematic Line
            </span>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-md font-mono text-red-300 bg-red-950/10">
              {analysis.errorSnippet}
            </div>
          </div>
        )}

        {/* Explanation Section */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
            <Info className="w-3.5 h-3.5" />
            <span>What Happened?</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{analysis.simpleExplanation}</p>
        </div>

        {/* Why it Happened */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Why Did It Happen?</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{analysis.rootCause}</p>
        </div>

        {/* Suggested Fix */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Suggested Fix</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{analysis.suggestedFix}</p>
        </div>

        {/* Corrected Code Preview & Apply Fix Button */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Code className="w-3.5 h-3.5 text-blue-400" />
              Suggested Corrected Code
            </span>
            <button
              onClick={copyCode}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-emerald-300 overflow-x-auto text-[11px] max-h-40">
            {analysis.correctedCode}
          </pre>

          <button
            onClick={() => onApplyFix(analysis.correctedCode)}
            className="w-full mt-3 py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Apply Fix to Editor
          </button>
        </div>
      </div>
    </div>
  );
}
