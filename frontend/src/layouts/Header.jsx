import React from "react";
import { Link } from "react-router-dom";
import { Waves, User, LogOut, LogIn, Menu } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Header({ apiStatus, onMenuToggle }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ocean-600 via-ocean-500 to-tealAccent-500 flex items-center justify-center text-slate-950 shadow-lg shadow-ocean-950/60 group-hover:scale-105 transition shrink-0">
            <Waves className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">
                ORCA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none truncate">
              Agentic Marine Intelligence
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend heartbeat */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              apiStatus?.connected
                ? "bg-tealAccent-400 animate-pulse"
                : "bg-rose-500"
            }`}
          />
          <span className="text-slate-400 text-[11px] font-mono">
            {apiStatus?.connected ? "Live" : "Connecting…"}
          </span>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition"
            >
              <User className="w-3.5 h-3.5 text-ocean-400" />
              <span className="font-semibold hidden sm:inline">
                {user?.name?.split(" ")[0] || "Operator"}
              </span>
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-semibold transition shadow-md shadow-ocean-950/50"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
