import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)]">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
