"use client";

import React, { useState } from "react";
import { Terminal, AlertCircle, Clock, CheckCircle, ShieldAlert } from "lucide-react";
import { ExecutionResult } from "@/lib/pythonExecutor";

interface ConsoleProps {
  result: ExecutionResult | null;
  isLoading: boolean;
}

export function Console({ result, isLoading }: ConsoleProps) {
  const [activeTab, setActiveTab] = useState<"stdout" | "stderr">("stdout");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-48">
      {/* Header Tabs & Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("stdout")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors font-medium ${
              activeTab === "stdout"
                ? "bg-slate-800 text-slate-100 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            Standard Output (stdout)
          </button>

          <button
            onClick={() => setActiveTab("stderr")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors font-medium ${
              activeTab === "stderr"
                ? "bg-slate-800 text-red-300 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            Error Console (stderr)
            {result?.hasError && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>
        </div>

        {/* Execution Metadata Status */}
        {result && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{result.executionTime} ms</span>
            </div>

            {result.hasError ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/80 text-red-300 border border-red-800/60">
                <ShieldAlert className="w-3 h-3" />
                Exit Code {result.exitCode ?? 1}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                <CheckCircle className="w-3 h-3" />
                Success (0)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Terminal View Content */}
      <div className="flex-1 p-3 bg-slate-950 font-mono text-xs overflow-auto font-normal leading-relaxed">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400 py-2">
            <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            Executing Python code in sandbox...
          </div>
        ) : !result ? (
          <p className="text-slate-600 italic">Click "Run Code" or "Debug Code" to inspect output here.</p>
        ) : activeTab === "stdout" ? (
          result.stdout ? (
            <pre className="text-emerald-400 whitespace-pre-wrap">{result.stdout}</pre>
          ) : (
            <p className="text-slate-600 italic">(No standard output returned)</p>
          )
        ) : result.stderr ? (
          <pre className="text-red-400 whitespace-pre-wrap">{result.stderr}</pre>
        ) : (
          <p className="text-slate-600 italic">(No errors printed in stderr)</p>
        )}
      </div>
    </div>
  );
}
