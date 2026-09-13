import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import OfflineBanner from '../components/OfflineBanner';
import BackOnlineToast from '../components/BackOnlineToast';

export default function MainLayout({ children, apiStatus }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header apiStatus={apiStatus} onMenuClick={() => setIsMobileNavOpen(true)} />
      <OfflineBanner />
      <div className="flex flex-1 md:overflow-hidden">
        <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950 w-full min-w-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BackOnlineToast />
    </div>
  );
}