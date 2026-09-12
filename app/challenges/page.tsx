"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import confetti from "canvas-confetti";
import { useUser } from "@/lib/userContext";
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Play,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Code2,
  RefreshCw,
} from "lucide-react";

export interface Challenge {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  buggyCode: string;
  expectedOutput: string;
  hint: string;
  solutionExplanation: string;
  solutionCode: string;
}

const CATEGORIES = [
  "All Categories",
  "Syntax Errors",
  "Name Errors",
  "Type Errors",
  "Index Errors",
  "Key Errors",
  "Value Errors",
  "Logic Errors",
  "File Handling Errors",
  "Function Errors",
  "Object-Oriented Programming Errors",
];

const PREDEFINED_CHALLENGES: Challenge[] = [
  {
    id: "ch_1",
    title: "Fix Missing Function Colon",
    category: "Syntax Errors",
    categorySlug: "syntax-errors",
    difficulty: "Beginner",
    description: "The function definition below fails to execute because of a missing syntax character required by Python grammar.",
    buggyCode: `def calculate_total(prices)
    total = sum(prices)
    return total

print("Total:", calculate_total([10, 20, 30]))`,
    expectedOutput: "Total: 60",
    hint: "Python function signatures (def) and control blocks (if, for) must end with a colon (:).",
    solutionExplanation: "Added `:` at the end of `def calculate_total(prices):` to create a valid Python syntax block.",
    solutionCode: `def calculate_total(prices):
    total = sum(prices)
    return total

print("Total:", calculate_total([10, 20, 30]))`,
  },
  {
    id: "ch_2",
    title: "Fix Undefined Variable Typo",
    category: "Name Errors",
    categorySlug: "name-errors",
    difficulty: "Beginner",
    description: "The program tries to print a variable name that contains a typo and has not been declared.",
    buggyCode: `user_score = 95
bonus = 10
final_score = user_score + bonus
print("Result:", final_result)`,
    expectedOutput: "Result: 105",
    hint: "Compare the variable name created (`final_score`) with the variable name passed to `print()` (`final_result`).",
    solutionExplanation: "Renamed `final_result` to `final_score` in the print statement.",
    solutionCode: `user_score = 95
bonus = 10
final_score = user_score + bonus
print("Result:", final_score)`,
  },
  {
    id: "ch_3",
    title: "Fix String & Integer Concatenation",
    category: "Type Errors",
    categorySlug: "type-errors",
    difficulty: "Beginner",
    description: "Python cannot concatenate strings and integers directly using the + operator.",
    buggyCode: `age = 22
message = "User age is: " + age
print(message)`,
    expectedOutput: "User age is: 22",
    hint: "Convert `age` to string using `str(age)` or use f-string formatting `f'User age is: {age}'`.",
    solutionExplanation: "Used `str(age)` or f-string formatting to combine text and integer values.",
    solutionCode: `age = 22
message = f"User age is: {age}"
print(message)`,
  },
  {
    id: "ch_4",
    title: "Fix Out of Bounds List Access",
    category: "Index Errors",
    categorySlug: "index-errors",
    difficulty: "Beginner",
    description: "Attempting to access an index beyond the length of the list raises an IndexError.",
    buggyCode: `colors = ["red", "green", "blue"]
print("Last color:", colors[3])`,
    expectedOutput: "Last color: blue",
    hint: "Python lists are 0-indexed. A list with 3 elements has valid indices 0, 1, and 2.",
    solutionExplanation: "Changed index from 3 to 2 (or -1) to access the last list item.",
    solutionCode: `colors = ["red", "green", "blue"]
print("Last color:", colors[2])`,
  },
  {
    id: "ch_5",
    title: "Safe Dictionary Key Retrieval",
    category: "Key Errors",
    categorySlug: "key-errors",
    difficulty: "Intermediate",
    description: "Accessing a missing key in a dictionary directly with square brackets throws a KeyError.",
    buggyCode: `student = {"name": "Alex", "grade": "A"}
print("Age:", student["age"])`,
    expectedOutput: "Age: Not specified",
    hint: "Use `student.get('age', 'Not specified')` to return a fallback value when the key is missing.",
    solutionExplanation: "Replaced bracket access `student['age']` with `.get('age', 'Not specified')`.",
    solutionCode: `student = {"name": "Alex", "grade": "A"}
print("Age:", student.get("age", "Not specified"))`,
  },
  {
    id: "ch_6",
    title: "Fix Invalid String to Int Conversion",
    category: "Value Errors",
    categorySlug: "value-errors",
    difficulty: "Intermediate",
    description: "Passing a string with letters to `int()` raises a ValueError.",
    buggyCode: `raw_input = "100USD"
number = int(raw_input)
print("Double:", number * 2)`,
    expectedOutput: "Double: 200",
    hint: "Strip out non-numeric characters before passing the string to `int()`, e.g., `raw_input.replace('USD', '')`.",
    solutionExplanation: "Cleaned string suffix using `.replace('USD', '')` before casting to `int`.",
    solutionCode: `raw_input = "100USD"
number = int(raw_input.replace("USD", ""))
print("Double:", number * 2)`,
  },
  {
    id: "ch_7",
    title: "Fix Off-by-One Range Sum Loop",
    category: "Logic Errors",
    categorySlug: "logic-errors",
    difficulty: "Intermediate",
    description: "The range function stops one integer early, causing an incorrect mathematical total.",
    buggyCode: `# Calculate sum of numbers 1 to 5 inclusive
total = 0
for i in range(1, 5):
    total += i
print("Sum:", total)`,
    expectedOutput: "Sum: 15",
    hint: "`range(start, stop)` executes up to `stop - 1`. To include 5, pass 6 as the stop parameter.",
    solutionExplanation: "Updated loop upper bound to `range(1, 6)` to sum numbers 1 through 5.",
    solutionCode: `total = 0
for i in range(1, 6):
    total += i
print("Sum:", total)`,
  },
  {
    id: "ch_8",
    title: "Fix File Handling & Existence",
    category: "File Handling Errors",
    categorySlug: "file-handling-errors",
    difficulty: "Intermediate",
    description: "Opening a missing file raises FileNotFoundError.",
    buggyCode: `import os

filename = "missing_data.txt"
with open(filename, "r") as f:
    content = f.read()
print("Data:", content)`,
    expectedOutput: "Data: Sample content loaded",
    hint: "Check if file exists first or write default content if missing.",
    solutionExplanation: "Created missing file fallback before reading.",
    solutionCode: `import os

filename = "missing_data.txt"
if not os.path.exists(filename):
    with open(filename, "w") as f:
        f.write("Sample content loaded")

with open(filename, "r") as f:
    print("Data:", f.read())`,
  },
  {
    id: "ch_9",
    title: "Fix Function Positional Arguments",
    category: "Function Errors",
    categorySlug: "function-errors",
    difficulty: "Intermediate",
    description: "Calling a function without providing required positional parameters raises a TypeError.",
    buggyCode: `def format_greeting(name, title):
    return f"Welcome {title} {name}"

print(format_greeting("Smith"))`,
    expectedOutput: "Welcome Dr. Smith",
    hint: "Provide default parameter values like `title='Dr.'` or pass both arguments when calling.",
    solutionExplanation: "Set default value `title='Dr.'` in function signature.",
    solutionCode: `def format_greeting(name, title="Dr."):
    return f"Welcome {title} {name}"

print(format_greeting("Smith"))`,
  },
  {
    id: "ch_10",
    title: "Fix Missing Self in OOP Class Method",
    category: "Object-Oriented Programming Errors",
    categorySlug: "oop-errors",
    difficulty: "Advanced",
    description: "Instance methods in Python classes require `self` as their first parameter.",
    buggyCode: `class BankAccount:
    def __init__(self, balance):
        self.balance = balance

    def display_balance():
        return f"Balance: {self.balance}"

acc = BankAccount(500)
print(acc.display_balance())`,
    expectedOutput: "Balance: 500",
    hint: "Add `self` to `def display_balance(self):` so it can access instance attributes.",
    solutionExplanation: "Added explicit `self` parameter to class method definition.",
    solutionCode: `class BankAccount:
    def __init__(self, balance):
        self.balance = balance

    def display_balance(self):
        return f"Balance: {self.balance}"

acc = BankAccount(500)
print(acc.display_balance())`,
  },
];

export default function ChallengesPage() {
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [activeChallenge, setActiveChallenge] = useState<Challenge>(PREDEFINED_CHALLENGES[0]);
  const [userCode, setUserCode] = useState<string>(PREDEFINED_CHALLENGES[0].buggyCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResult, setTestResult] = useState<{
    passed: boolean;
    output: string;
    error?: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load solved challenges from storage
    const savedSolved = localStorage.getItem("pydebug_solved_challenges");
    if (savedSolved) {
      try {
        setSolvedIds(new Set(JSON.parse(savedSolved)));
      } catch (e) {}
    }
  }, []);

  const selectChallenge = (ch: Challenge) => {
    setActiveChallenge(ch);
    setUserCode(ch.buggyCode);
    setTestResult(null);
    setShowHint(false);
    setShowSolution(false);
  };

  const handleTestCode = async () => {
    setIsExecuting(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: userCode }),
      });
      const data = await response.json();

      const outputTrimmed = (data.result?.stdout || "").trim();
      const expectedTrimmed = activeChallenge.expectedOutput.trim();
      const passed = !data.result?.hasError && outputTrimmed === expectedTrimmed;

      setTestResult({
        passed,
        output: outputTrimmed || data.result?.stderr || "No output returned",
        error: data.result?.hasError ? data.result.errorMessage : undefined,
      });

      if (passed) {
        // Trigger celebratory confetti animation
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

        const updatedSolved = new Set(solvedIds);
        updatedSolved.add(activeChallenge.id);
        setSolvedIds(updatedSolved);
        localStorage.setItem(
          "pydebug_solved_challenges",
          JSON.stringify(Array.from(updatedSolved))
        );
      }
    } catch (err: any) {
      setTestResult({
        passed: false,
        output: "Failed to connect to Python runner",
        error: err.message,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const filteredChallenges = PREDEFINED_CHALLENGES.filter(
    (c) => selectedCategory === "All Categories" || c.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Interactive Debugging Challenges
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Practice identifying and fixing Python bugs across 10 error categories.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">
            Solved: <strong className="text-emerald-400">{solvedIds.size}</strong> / {PREDEFINED_CHALLENGES.length}
          </span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Challenge Selection List */}
        <div className="lg:col-span-4 space-y-3">
          {/* Category Filter */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Filter Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Challenge Items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredChallenges.map((ch) => {
              const isSolved = solvedIds.has(ch.id);
              const isActive = activeChallenge.id === ch.id;

              return (
                <button
                  key={ch.id}
                  onClick={() => selectChallenge(ch)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? "bg-blue-600/20 border-blue-500/50 shadow-md"
                      : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                      {ch.category}
                    </span>
                    {isSolved ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Solved
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {ch.difficulty}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-100">{ch.title}</h3>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Practice Editor & Evaluation */}
        <div className="lg:col-span-8 space-y-4">
          {/* Challenge Description Box */}
          <div className="glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  {activeChallenge.category} • {activeChallenge.difficulty}
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">{activeChallenge.title}</h2>
              </div>
              <button
                onClick={() => setUserCode(activeChallenge.buggyCode)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                title="Reset buggy code"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{activeChallenge.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-emerald-400">
                <span className="text-slate-500 mr-2">Target Output:</span>
                "{activeChallenge.expectedOutput}"
              </div>
            </div>
          </div>

          {/* User Monaco Editor for Challenge */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg h-72">
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={userCode}
              onChange={(val) => setUserCode(val || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "on",
                fontFamily: "Fira Code, Consolas, monospace",
              }}
            />
          </div>

          {/* Action Bar: Test Code & Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-900/50 text-xs font-medium hover:bg-amber-950/80"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showHint ? "Hide Hint" : "Show Hint"}
              </button>

              <button
                onClick={() => setShowSolution(!showSolution)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-900/50 text-xs font-medium hover:bg-purple-950/80"
              >
                {showSolution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showSolution ? "Hide Solution" : "Reveal Solution"}
              </button>
            </div>

            <button
              onClick={handleTestCode}
              disabled={isExecuting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isExecuting ? "Testing Code..." : "Run & Test Code"}
            </button>
          </div>

          {/* Hint Dropdown Card */}
          {showHint && (
            <div className="p-4 bg-amber-950/30 border border-amber-900/50 rounded-xl text-xs space-y-1 animate-fadeIn">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> Hint:
              </span>
              <p className="text-amber-200 leading-relaxed">{activeChallenge.hint}</p>
            </div>
          )}

          {/* Solution Dropdown Card */}
          {showSolution && (
            <div className="p-4 bg-purple-950/30 border border-purple-900/50 rounded-xl text-xs space-y-2 animate-fadeIn">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" /> Solution Explanation:
              </span>
              <p className="text-purple-200 leading-relaxed">{activeChallenge.solutionExplanation}</p>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-emerald-300 text-[11px]">
                {activeChallenge.solutionCode}
              </pre>
            </div>
          )}

          {/* Evaluation Result Feedback */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                testResult.passed
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-red-950/40 border-red-800 text-red-300"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {testResult.passed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Challenge Solved! Great job!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span>Output does not match target. Keep trying!</span>
                  </>
                )}
              </div>

              <div>
                <span className="font-semibold block mb-1">Your Code Output:</span>
                <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-slate-200 text-[11px]">
                  {testResult.output}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
