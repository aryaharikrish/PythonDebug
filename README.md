# PyDebug - Modern Python Debugging Platform

> **Tagline**: Write. Debug. Understand.

PyDebug is an interactive developer education platform designed to assist students and programmers in detecting, understanding, and resolving Python errors.

---

## 🌟 Key Features

1. **Monaco Code Editor**: Python syntax highlighting, line numbers, light/dark themes, and preset bug examples.
2. **Instant Error Detection**: Automated classification of `SyntaxError`, `NameError`, `TypeError`, `IndexError`, `KeyError`, `ValueError`, `LogicError`, `FileHandlingError`, `FunctionError`, and `OOPError`.
3. **AI Error Diagnosis Panel**:
   - **What Happened?**: Beginner-friendly error summary.
   - **Why Did It Happen?**: Root cause breakdown.
   - **Suggested Fix**: Clear resolution instructions.
   - **Corrected Code & "Apply Fix"**: One-click code replacement.
4. **Interactive Practice Challenges**: 10 distinct error categories with test runners, hint toggles, solution explanations, and celebratory feedback.
5. **Debugging History**: Persistent logging of debugging sessions stored in Convex DB / local storage.
6. **Student Dashboard**: Performance stats, error frequency bar charts, solved challenge trackers, and success rate metrics.
7. **Secure Python Sandbox**: User Python scripts execute in isolated sub-processes with 4.0-second execution timeouts and memory protection.

---

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons + Glassmorphism design system
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Backend / Database**: Convex DB (`convex/schema.ts`)
- **Python Execution**: Node.js Subprocess Sandbox (`lib/pythonExecutor.ts` & `/api/execute`)
- **AI Diagnostics Engine**: Rule-based AST & Traceback Parser (`lib/aiDebugger.ts`)

---

## 🛠️ Local Development Setup

### 1. Clone or Open Project
Navigate to project directory:
```bash
cd pythondebg
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create `.env.local` using `.env.example`:
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

### 4. Run Convex Backend (Optional for live Convex sync)
```bash
npx convex dev
```

### 5. Run Next.js Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Project Structure

```
app/
├── api/
│   ├── execute/route.ts      # Python sandbox execution endpoint
│   └── debug/route.ts        # AI debugging assistant endpoint
├── challenges/page.tsx       # 10-category practice challenges
├── dashboard/page.tsx        # Student progress dashboard
├── debugger/page.tsx         # Main Python Debugger workspace
├── history/page.tsx          # Debugging history & logs
├── login/page.tsx            # Auth & user profile
├── globals.css               # Dark theme & glassmorphism CSS
├── layout.tsx                # App root layout with providers
└── page.tsx                  # Landing Page

components/
├── CodeEditor.tsx            # Monaco Editor wrapper
├── DebugPanel.tsx            # AI Error & Debugging panel
├── Console.tsx               # Tabbed stdout/stderr console
├── Navbar.tsx                # Header navigation bar
└── Footer.tsx                # Footer component

convex/
├── schema.ts                 # Convex database tables schema
├── debuggingSessions.ts      # Session history queries & mutations
├── challenges.ts             # Challenge seed data & queries
├── submissions.ts            # Submission handlers
├── progress.ts               # User progress tracker
├── dashboard.ts              # Dashboard analytics aggregator
└── users.ts                  # User profile store

lib/
├── pythonExecutor.ts         # Subprocess Python execution engine
├── aiDebugger.ts             # Python error diagnosis & fix logic
└── userContext.tsx           # User auth state context
```
