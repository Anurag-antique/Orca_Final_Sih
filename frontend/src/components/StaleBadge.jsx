import React from 'react';
import { useCacheAge } from '../hooks/useCacheAge';

/**
 * Small pill that shows how old cached data is.
 *
 * Usage:
 *   <StaleBadge url="/weather" params={{ lat, lon, sector }} />
 *
 * Renders nothing if nothing is cached.
 */
export default function StaleBadge({ url, params, className = '' }) {
  const info = useCacheAge({ url, params });

  if (!info) return null;

  const label = (() => {
    if (info.ageMinutes < 1) return 'Updated just now';
    if (info.ageMinutes < 60) return `Updated ${info.ageMinutes} min ago`;
    const hours = Math.round(info.ageMinutes / 60);
    if (hours < 24) return `Updated ${hours}h ago`;
    return `Updated ${Math.round(hours / 24)}d ago`;
  })();

  const tone = info.isStale
    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-slate-800/60 text-slate-300 border-slate-700';

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${tone} ${className}`}
    >
      {info.isStale && <span aria-hidden="true">⚠</span>}
      {label}
      {info.isStale && (
        <span className="sr-only"> — data may be outdated</span>
      )}
    </span>
  );
}