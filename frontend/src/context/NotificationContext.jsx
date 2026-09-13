import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { notificationService } from "../services/notificationService";
import { useAuth } from "../hooks/useAuth";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, token } = useAuth() || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamOk, setStreamOk] = useState(false);
  const cleanupRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.list({ limit: 100 });
      setNotifications(
        Array.isArray(res?.notifications) ? res.notifications : [],
      );
    } catch (err) {
      setError(err?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return undefined;
    }
    refresh();

    cleanupRef.current = notificationService.openStream(
      token,
      (row) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === row.id)) return prev;
          return [row, ...prev];
        });
        setStreamOk(true);
      },
      () => setStreamOk(false),
    );

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [token, refresh]);

  // Fallback polling if SSE is blocked (corporate proxy, etc.).
  useEffect(() => {
    if (!token || streamOk) return undefined;
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [token, streamOk, refresh]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      setError(err?.message || "Unable to mark as read.");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError(err?.message || "Unable to mark all as read.");
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      streamOk,
      refresh,
      markRead,
      markAllRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      streamOk,
      refresh,
      markRead,
      markAllRead,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside <NotificationProvider>.",
    );
  return ctx;
}
