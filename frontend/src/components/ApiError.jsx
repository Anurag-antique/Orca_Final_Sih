import React from 'react';

/**
 * Offline-aware error block.
 *
 * Usage:
 *   const [err, setErr] = useState(null);
 *   ...
 *   <ApiError error={err} onRetry={() => doIt()} />
 *
 * - err.offline === true -> amber offline message
 * - otherwise            -> red backend error
 * - err === null         -> renders nothing
 */
export default function ApiError({ error, onRetry, className = '' }) {
  if (!error) return null;

  if (error.offline) {
    return (
      <div
        role="alert"
        className={`rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 ${className}`}
      >
        <div className="font-semibold mb-0.5">You're offline</div>
        <div className="text-amber-200/80 leading-relaxed">
          This action needs a live connection. Your page stays as it is — try again when you're back online.
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-[11px] font-medium underline underline-offset-2 hover:text-amber-100"
          >
            Retry now
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ${className}`}
    >
      <div className="font-semibold mb-0.5">Something went wrong</div>
      <div className="text-rose-200/80 leading-relaxed">
        {error.message || 'Unexpected error.'}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-[11px] font-medium underline underline-offset-2 hover:text-rose-100"
        >
          Retry
        </button>
      )}
    </div>
  );
}