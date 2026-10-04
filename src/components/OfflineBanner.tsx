import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showRestored) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition-all duration-300 pointer-events-none select-none ${
        isOffline
          ? 'bg-[var(--neu-bg)] text-[var(--color-danger)] border border-[var(--color-danger)]/30 neu-flat'
          : 'bg-[var(--neu-bg)] text-[var(--color-success)] border border-[var(--color-success)]/30 neu-flat'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4 animate-pulse text-[var(--color-danger)] shrink-0" />
          <span>Offline mode &mdash; using cached application</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 text-[var(--color-success)] shrink-0" />
          <span>Connection restored</span>
        </>
      )}
    </div>
  );
}
