"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/userContext";
import {
  Code2,
  Terminal,
  Trophy,
  LayoutDashboard,
  History,
  User,
  LogOut,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Debugger", href: "/debugger", icon: Terminal },
    { name: "Challenges", href: "/challenges", icon: Trophy },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "History", href: "/history", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Code2 className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-amber-400 bg-clip-text text-transparent">
                PyDebug
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-slate-400 block font-semibold">
                Write. Debug. Understand.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user.isLoggedIn ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-200 text-sm hover:border-slate-500 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-medium text-xs max-w-[100px] truncate">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm shadow-md hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            {user.isLoggedIn ? (
              <div className="flex items-center justify-between w-full">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-slate-300"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  {user.name}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-400 hover:underline"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 bg-blue-600 rounded-lg text-white font-medium text-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
