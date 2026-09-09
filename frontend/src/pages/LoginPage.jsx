import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Waves, LogIn, Lock, Mail, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fromPath = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleFillDemo = () => {
    setFormData({
      email: 'demo@orca.marine',
      password: 'Password123!',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-500 to-tealAccent-500 flex items-center justify-center mx-auto shadow-lg shadow-ocean-950/60">
            <Waves className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Sign In to ORCA
          </h1>
          <p className="text-xs text-slate-400">
            Agentic AI Marine Intelligence & Operational Telemetry Platform
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-r from-ocean-950/80 to-slate-900 border border-ocean-800/80 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-tealAccent-400" />
            <div>
              <div className="text-xs font-bold text-slate-200">Hackathon Reviewer Demo</div>
              <div className="text-[11px] text-slate-400">demo@orca.marine &bull; Password123!</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-ocean-600 hover:bg-ocean-500 text-white transition"
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="operator@marine.gov.in"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-ocean-600 to-ocean-500 hover:from-ocean-500 hover:to-ocean-400 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-ocean-950/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Access Dashboard'}</span>
          </button>

          <div className="pt-2 text-center text-xs text-slate-400">
            New operator?{' '}
            <Link to="/register" className="text-ocean-400 hover:text-ocean-300 font-semibold underline underline-offset-4">
              Create an account
            </Link>
          </div>
        </form>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-tealAccent-400" />
          <span>Protected with JWT & SHA-256 password hashing</span>
        </div>
      </div>
    </div>
  );
}
