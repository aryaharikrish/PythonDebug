"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/userContext";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, LogOut, CheckCircle2, Key, Sparkles, UserPlus } from "lucide-react";

export default function LoginPage() {
  const { user, login, logout, updateUser } = useUser();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const userName = name || email.split("@")[0] || "PyDebug Student";
    login(userName, email);
    setMessage(`Successfully signed in as ${userName}! Redirecting to Debugger...`);

    setTimeout(() => {
      router.push("/debugger");
    }, 1200);
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      {/* Profile Card if already logged in */}
      {user.isLoggedIn ? (
        <div className="glass-card rounded-2xl p-6 space-y-6 border border-slate-800 text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-amber-500 p-1 mx-auto shadow-xl">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl font-bold text-white">
                {user.name.charAt(0)}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-slate-950 stroke-[3]" />
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">{user.name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-950/80 border border-blue-800/60 rounded-full text-[11px] font-semibold text-blue-300">
              ID: {user.userId}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
            >
              Go to My Student Dashboard
            </button>

            <button
              onClick={() => {
                logout();
                setMessage("Logged out successfully.");
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        /* Sign In / Sign Up Form */
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-800">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">
              {mode === "login" ? "Sign In to PyDebug" : "Create Student Account"}
            </h1>
            <p className="text-xs text-slate-400">
              Save your Python debugging history, track solved challenges, and access your personal dashboard.
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                mode === "login" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                mode === "signup" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === "signup" && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@pydebug.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {mode === "login" ? <Shield className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {mode === "login" ? "Sign In to Account" : "Create Account"}
            </button>
          </form>

          {message && (
            <p className="text-xs text-center text-emerald-400 bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
