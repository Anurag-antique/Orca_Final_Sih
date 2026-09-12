import React from 'react';
import { useOffline } from '../hooks/useOffline';

/**
 * Small dot rendered next to a nav item, visible only when offline.
 *   'live'   -> teal   (always available)
 *   'cached' -> amber  (available if data was cached)
 *   'online' -> slate  (requires connection)
 */
export default function SidebarStatusDot({ availability }) {
  const { isOnline } = useOffline();
  if (isOnline) return null;

  const map = {
    live:   { color: 'bg-tealAccent-400', title: 'Available offline' },
    cached: { color: 'bg-amber-400',      title: 'Available offline (cached data)' },
    online: { color: 'bg-slate-600',      title: 'Requires connection' },
  };
  const s = map[availability] || map.online;

  return (
    <span
      title={s.title}
      aria-label={s.title}
      className={`inline-block w-1.5 h-1.5 rounded-full ${s.color}`}
    />
  );
}