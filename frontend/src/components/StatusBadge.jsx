import React from 'react';
import clsx from 'clsx';

export default function StatusBadge({ status = 'online', label }) {
  const statusStyles = {
    online: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    offline: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
    checking: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
  };

  const dotColors = {
    online: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    offline: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]',
    checking: 'bg-amber-400 animate-pulse',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border',
        statusStyles[status] || statusStyles.checking
      )}
    >
      <span className={clsx('w-2 h-2 rounded-full', dotColors[status] || dotColors.checking)} />
      {label || (status === 'online' ? 'System Online' : status === 'offline' ? 'Offline' : 'Checking Status')}
    </span>
  );
}
