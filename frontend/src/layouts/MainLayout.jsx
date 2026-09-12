import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import OfflineBanner from '../components/OfflineBanner';
import BackOnlineToast from '../components/BackOnlineToast';

export default function MainLayout({ children, apiStatus }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header apiStatus={apiStatus} />
      <OfflineBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
      <BackOnlineToast />
    </div>
  );
}