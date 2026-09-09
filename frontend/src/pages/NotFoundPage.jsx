import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[500px] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="p-3 w-fit mx-auto rounded-full bg-ocean-950 border border-ocean-800 text-ocean-400">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-100">404</h1>
        <h2 className="text-lg font-bold text-slate-200">Lost at Sea?</h2>
        <p className="text-xs text-slate-400">
          The marine coordinate or page you requested does not exist in the ORCA navigation index.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-semibold rounded-lg transition"
        >
          <Home className="w-4 h-4" />
          <span>Return to Safety</span>
        </Link>
      </div>
    </div>
  );
}
