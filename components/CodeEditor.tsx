"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Bug, Trash2, Sun, Moon, Sparkles, FileCode } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onDebug: () => void;
  onClear: () => void;
  isLoading: boolean;
  onSelectPreset?: (presetCode: string) => void;
}

const SAMPLE_PRESETS = [
  {
    name: "Index Error Example",
    code: `# Intentional IndexError preset
numbers = [1, 2, 3]
print("Accessing index 5:")
print(numbers[5])
`,
  },
  {
    name: "Syntax Error Example",
    code: `# Intentional SyntaxError preset
def check_even(num)
    if num % 2 == 0
        return True
    return False

print(check_even(10))
`,
  },
  {
    name: "Type Error Example",
    code: `# Intentional TypeError preset
user_age = 25
message = "User is " + user_age + " years old"
print(message)
`,
  },
  {
    name: "Key Error Example",
    code: `# Intentional KeyError preset
student = {"name": "Alice", "course": "Python 101"}
print("Student GPA:", student["gpa"])
`,
  },
  {
    name: "Zero Division Example",
    code: `# Intentional ZeroDivisionError preset
items_count = 0
total_score = 450
average = total_score / items_count
print("Average score:", average)
`,
  },
];

export function CodeEditor({
  code,
  onChange,
  onRun,
  onDebug,
  onClear,
  isLoading,
  onSelectPreset,
}: CodeEditorProps) {
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Editor Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/60 border border-blue-800/40 rounded-md text-xs font-mono text-blue-300">
            <FileCode className="w-3.5 h-3.5" />
            <span>script.py</span>
          </div>

          {/* Sample Error Presets dropdown */}
          {onSelectPreset && (
            <select
              onChange={(e) => {
                const selected = SAMPLE_PRESETS.find((p) => p.name === e.target.value);
                if (selected) onSelectPreset(selected.code);
              }}
              className="text-xs bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
              defaultValue=""
            >
              <option value="" disabled>
                -- Load Preset Error --
              </option>
              {SAMPLE_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === "vs-dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>

          <button
            onClick={onRun}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Code
          </button>

          <button
            onClick={onDebug}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Bug className="w-3.5 h-3.5" />
            {isLoading ? "Debugging..." : "Debug Code"}
          </button>
        </div>
      </div>

      {/* Monaco Code Editor */}
      <div className="relative flex-1 min-h-[350px]">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme={theme}
          value={code}
          onChange={(val) => onChange(val || "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12 },
            fontFamily: "Fira Code, Consolas, Monaco, monospace",
          }}
        />
      </div>
    </div>
  );
}
