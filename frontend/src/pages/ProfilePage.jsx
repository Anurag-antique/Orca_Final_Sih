import React from 'react';
import { User, Mail, Shield, Building, Anchor, MapPin, Calendar, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabels = {
    fisherman: 'Fisherman / Vessel Master',
    researcher: 'Marine Researcher / Oceanographer',
    coastal_authority: 'Coastal Authority / Coast Guard',
    operator: 'Disaster Management / Port Operator',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operator Profile</h1>
          <p className="text-sm text-slate-400">Maritime credentials, vessel attributes, and regional sectors</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-semibold rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ocean-500 to-tealAccent-500 flex items-center justify-center mx-auto text-2xl font-extrabold text-slate-950 shadow-xl shadow-ocean-950/60">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.name || 'Marine Operator'}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ocean-950 border border-ocean-800 text-ocean-300 text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>{roleLabels[user?.role] || user?.role || 'Operator'}</span>
          </div>
        </div>

        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">Operational Profile Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Building className="w-3.5 h-3.5 text-ocean-400" />
                <span>Affiliated Organization</span>
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {user?.organization || 'Independent Operator'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Anchor className="w-3.5 h-3.5 text-tealAccent-400" />
                <span>Registered Vessel</span>
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {user?.vesselName || 'No Vessel Assigned'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Default Sector</span>
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {user?.preferredSector || 'Arabian Sea / Mumbai Coast'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Registered On</span>
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Active Session'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">Role Capabilities:</span>
            <p>
              Your account is authorized to initiate AI Marine Safety queries, receive localized PFZ telemetry, submit geofenced voyage paths, and configure active emergency safety alert thresholds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
