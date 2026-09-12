import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import OfflineBanner from '../components/OfflineBanner';
import BackOnlineToast from '../components/BackOnlineToast';

export default function MainLayout({ children, apiStatus }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header apiStatus={apiStatus} />
      <OfflineBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BackOnlineToast />
    </div>
  );
}