"use client";

import React, { useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { DebugPanel } from "@/components/DebugPanel";
import { Console } from "@/components/Console";
import { ExecutionResult } from "@/lib/pythonExecutor";
import { AIDebugAnalysis } from "@/lib/aiDebugger";
import { useUser } from "@/lib/userContext";
import { Sparkles, History, Save, Check } from "lucide-react";

const DEFAULT_CODE = `# Write or paste Python code here to debug
numbers = [1, 2, 3]
print(numbers[5])
`;

export default function DebuggerPage() {
  const { user } = useUser();
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [customInputs, setCustomInputs] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [debugAnalysis, setDebugAnalysis] = useState<AIDebugAnalysis | null>(null);
  const [savedSessionNotice, setSavedSessionNotice] = useState<boolean>(false);
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);

  // Load AI preference from local storage
  React.useEffect(() => {
    try {
      const savedPref = localStorage.getItem("pydebug_ai_enabled");
      if (savedPref !== null) {
        setAiEnabled(savedPref === "true");
      }
    } catch (e) {}
  }, []);

  const handleToggleAi = (enabled: boolean) => {
    setAiEnabled(enabled);
    try {
      localStorage.setItem("pydebug_ai_enabled", String(enabled));
    } catch (e) {}
  };

  // Helper to save session to local storage & Convex
  const saveSessionRecord = (res: ExecutionResult, analysis: AIDebugAnalysis | null) => {
    const titleLines = code.trim().split("\n");
    const codeTitle = titleLines[0]?.substring(0, 30) || "Python Debug Session";

    const sessionRecord = {
      id: `session_${Date.now()}`,
      userId: user.userId,
      code,
      title: codeTitle,
      errorType: res.errorType || "None",
      errorMessage: res.errorMessage || "",
      errorLine: res.errorLine,
      explanation: analysis?.simpleExplanation || "Code executed successfully.",
      suggestedFix: analysis?.suggestedFix || "No fixes needed.",
      correctedCode: analysis?.correctedCode || code,
      status: res.hasError ? "error" : "success",
      numberOfErrors: res.hasError ? 1 : 0,
      executionTime: res.executionTime,
      timestamp: Date.now(),
      fixed: !res.hasError,
    };

    // Save to local storage for history view
    try {
      const savedHistory = JSON.parse(localStorage.getItem("pydebug_sessions") || "[]");
      savedHistory.unshift(sessionRecord);
      localStorage.setItem("pydebug_sessions", JSON.stringify(savedHistory.slice(0, 50)));
    } catch (e) {}

    setSavedSessionNotice(true);
    setTimeout(() => setSavedSessionNotice(false), 3000);
  };

  // Run Code action
  const handleRunCode = async () => {
    setIsLoading(true);
    setHasExecuted(true);
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, customInputs }),
      });
      const data = await response.json();

      if (data.success) {
        setExecutionResult(data.result);
        setDebugAnalysis(aiEnabled ? data.debugAnalysis : null);
        saveSessionRecord(data.result, aiEnabled ? data.debugAnalysis : null);
      } else {
        setExecutionResult({
          stdout: "",
          stderr: data.error || "Execution failed",
          exitCode: 1,
          executionTime: 0,
          hasError: true,
          errorType: "SystemError",
          errorMessage: data.error,
        });
      }
    } catch (error: any) {
      setExecutionResult({
        stdout: "",
        stderr: "Network error executing code.",
        exitCode: 1,
        executionTime: 0,
        hasError: true,
        errorType: "NetworkError",
        errorMessage: "Failed to connect to execution sandbox.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debug Code action
  const handleDebugCode = async () => {
    await handleRunCode();
  };

  // Clear code editor
  const handleClear = () => {
    setCode("");
    setExecutionResult(null);
    setDebugAnalysis(null);
    setHasExecuted(false);
  };

  // Apply AI Suggested Fix to Monaco Editor
  const handleApplyFix = (correctedCode: string) => {
    setCode(correctedCode);
    setDebugAnalysis(null);
    setExecutionResult(null);
    setHasExecuted(false);
  };

  return (
    <div className="space-y-4">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Python Debugger Workspace
          </h1>
          <p className="text-xs text-slate-400">
            Write or paste Python code, execute in isolated sandbox, and analyze errors with instant AI fixes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleToggleAi(!aiEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              aiEnabled
                ? "bg-blue-950/80 border-blue-700/60 text-blue-300 hover:bg-blue-900/60"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiEnabled ? "text-blue-400" : "text-slate-500"}`} />
            {aiEnabled ? "AI Assistance: ON" : "AI Assistance: OFF"}
          </button>

          {savedSessionNotice && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs font-medium animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              Session Saved to History
            </div>
          )}
        </div>
      </div>

      {/* Main Split Grid: Editor (Left/Center) & Debug Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[500px]">
        {/* LEFT / CENTER: Monaco Editor */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex-1">
            <CodeEditor
              code={code}
              onChange={setCode}
              customInputs={customInputs}
              onCustomInputsChange={setCustomInputs}
              onRun={handleRunCode}
              onDebug={handleDebugCode}
              onClear={handleClear}
              isLoading={isLoading}
              onSelectPreset={(preset) => {
                setCode(preset);
                setHasExecuted(false);
                setExecutionResult(null);
                setDebugAnalysis(null);
              }}
            />
          </div>
        </div>

        {/* RIGHT: Error & Debugging Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <DebugPanel
            analysis={debugAnalysis}
            onApplyFix={handleApplyFix}
            isLoading={isLoading}
            hasExecuted={hasExecuted}
            aiEnabled={aiEnabled}
            onToggleAi={handleToggleAi}
          />
        </div>
      </div>

      {/* BOTTOM: Output Console Panel */}
      <div>
        <Console result={executionResult} isLoading={isLoading} />
      </div>
    </div>
  );
}

