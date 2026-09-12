import React, { useEffect, useState } from 'react';
import { useOffline } from '../hooks/useOffline';
import { usePendingActions } from '../context/PendingActionContext';

export default function BackOnlineToast() {
  const { isOnline } = useOffline();
  const { pending, clear } = usePendingActions();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOnline && pending.length > 0) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        clear();
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [isOnline, pending.length, clear]);

  if (!visible || pending.length === 0) return null;

  const first = pending[0];
  const extra = pending.length > 1 ? ` +${pending.length - 1} more` : '';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-tealAccent-600/40 bg-slate-900 text-slate-100 shadow-2xl px-4 py-3 text-sm"
    >
      <div className="font-semibold text-tealAccent-400 mb-1">
        You're back online
      </div>
      <div className="text-slate-300 text-xs">
        You wanted to retry: <span className="font-medium text-slate-100">{first.label}</span>{extra}
      </div>
      <button
        onClick={() => {
          setVisible(false);
          clear();
        }}
        className="mt-2 text-[11px] text-slate-400 hover:text-slate-200 transition"
      >
        Dismiss
      </button>
    </div>
  );
}