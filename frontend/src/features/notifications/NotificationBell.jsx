import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  Loader2,
  AlertTriangle,
  Info,
  ShieldAlert,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

const SEVERITY_META = {
  INFO: { Icon: Info, color: "text-sky-300", bg: "bg-sky-950 border-sky-800" },
  WARNING: {
    Icon: AlertTriangle,
    color: "text-amber-300",
    bg: "bg-amber-950 border-amber-800",
  },
  CRITICAL: {
    Icon: ShieldAlert,
    color: "text-rose-300",
    bg: "bg-rose-950 border-rose-800",
  },
};

const formatTime = (iso) => {
  try {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
};

export default function NotificationBell() {
  const { notifications, unreadCount, loading, error, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-4 w-4 text-slate-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[92vw] z-[600] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-sm font-semibold text-slate-100">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] text-ocean-400 hover:text-ocean-300 font-medium"
              >
                <Check className="inline h-3 w-3 mr-1" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && (
              <div className="p-6 text-center text-xs text-slate-400">
                <Loader2 className="inline h-4 w-4 animate-spin mr-1" />{" "}
                Loading…
              </div>
            )}
            {error && !loading && (
              <div className="p-4 text-xs text-amber-300">{error}</div>
            )}
            {!loading && !error && notifications.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No active alerts.
              </div>
            )}
            {!loading &&
              !error &&
              notifications.map((n) => {
                const meta = SEVERITY_META[n.severity] || SEVERITY_META.INFO;
                const { Icon } = meta;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => !n.read && markRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-900 hover:bg-slate-900/60 transition ${n.read ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex items-center justify-center rounded-lg border p-1.5 ${meta.bg}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-100 truncate">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {formatTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                        {n.sector && (
                          <span className="text-[10px] text-slate-500">
                            {n.sector}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
