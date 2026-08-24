import { useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';

export interface AppLayoutContext {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-secondary)] relative">
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />

      <div
        className={cn(
          'flex flex-1 flex-col min-w-0 transition-[margin] duration-200',
          sidebarOpen ? 'md:ml-64' : 'ml-0'
        )}
      >
        <main className="flex-1 min-w-0">
          <Outlet context={{ sidebarOpen, toggleSidebar }} />
        </main>
      </div>
    </div>
  );
}

export function useAppLayout() {
  const context = useOutletContext<AppLayoutContext>();
  return context || { sidebarOpen: true, toggleSidebar: () => {} };
}
