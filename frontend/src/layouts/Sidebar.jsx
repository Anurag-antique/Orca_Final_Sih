import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  Map,
  BellRing,
  Navigation,
  History,
  User,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "AI Marine Assistant", path: "/chat", icon: Bot },
  { name: "Marine Map", path: "/map", icon: Map },
  { name: "Route Planner", path: "/routes", icon: Navigation },
  { name: "Safety & Alerts", path: "/alerts", icon: BellRing },
  { name: "PFZ Intelligence", path: "/pfz", icon: Navigation },
  { name: "History & Logs", path: "/history", icon: History },
  { name: "Operator Profile", path: "/profile", icon: User },
];

export default function Sidebar({ mobileOpen = false, onClose }) {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "w-64 border-r border-slate-800/80 bg-slate-950 flex flex-col justify-between p-4",
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 px-3">
              Marine Operations
            </span>
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-ocean-950/80 text-ocean-300 border border-ocean-800/60"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white",
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isAuthenticated
              ? `Signed in as ${user?.name || "Operator"}`
              : "Sign in to sync your voyages."}
          </p>
        </div>
      </aside>
    </>
  );
}
