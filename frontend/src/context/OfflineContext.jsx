import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastOfflineHit, setLastOfflineHit] = useState(null);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  // --- online / offline browser events -------------------------------
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // --- listen for cached-data hits from the axios interceptor --------
  useEffect(() => {
    const onHit = (e) => setLastOfflineHit(e.detail);
    window.addEventListener('orca:offline-hit', onHit);
    return () => window.removeEventListener('orca:offline-hit', onHit);
  }, []);

  // Clear the stale marker once we are back online.
  useEffect(() => {
    if (isOnline) setLastOfflineHit(null);
  }, [isOnline]);

  // --- SW update prompt -----------------------------------------------
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    let cancelled = false;

    navigator.serviceWorker.ready.then((reg) => {
      if (cancelled) return;
      setSwRegistration(reg);

      reg.addEventListener?.('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            setSwUpdateAvailable(true);
          }
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!swRegistration?.waiting) return;
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }, [swRegistration]);

  const retry = useCallback(() => {
    setIsOnline(navigator.onLine);
    if (navigator.onLine) window.location.reload();
  }, []);

  const value = {
    isOnline,
    lastOfflineHit,
    swUpdateAvailable,
    applyUpdate,
    retry,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineInternal() {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return ctx;
}