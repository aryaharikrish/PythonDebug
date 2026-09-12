import React from "react";
import Link from "next/link";
import { Code2, Github, Terminal, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-sm py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-amber-400 font-bold">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white">PyDebug</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering students and developers to analyze, understand, and resolve Python runtime and syntax errors seamlessly.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/debugger" className="hover:text-blue-400 transition-colors">Python Debugger</Link></li>
              <li><Link href="/challenges" className="hover:text-blue-400 transition-colors">Practice Challenges</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-400 transition-colors">Student Dashboard</Link></li>
              <li><Link href="/history" className="hover:text-blue-400 transition-colors">Debugging History</Link></li>
            </ul>
          </div>

          {/* Error Categories */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Error Diagnosis</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-400">Syntax & Indentation</span></li>
              <li><span className="text-slate-400">Index & Key Errors</span></li>
              <li><span className="text-slate-400">Type & Name Errors</span></li>
              <li><span className="text-slate-400">Logic & OOP Pitfalls</span></li>
            </ul>
          </div>

          {/* Architecture info */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Architecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Built with Next.js App Router, Monaco Editor, Convex DB backend, and isolated Python Sandbox.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-950/60 border border-blue-800/40 text-[11px] text-blue-300">
              <Terminal className="w-3.5 h-3.5" />
              <span>Python Execution Active</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} PyDebug. Write. Debug. Understand.</p>
          <div className="flex items-center gap-1">
            <span>Built for developer education</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400 mx-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
