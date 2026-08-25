import { useState } from 'react';
import { Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { cn } from '@/lib/utils';

export interface AppLayoutContext {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  hasSidebar: boolean;
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // The Select Task page ("/tasks") must NOT display the sidebar
  const isSelectTaskPage = location.pathname === '/tasks' || location.pathname === '/tasks/';
  const hasSidebar = !isSelectTaskPage;

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-secondary)] relative">
      {hasSidebar && <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />}

      <div
        className={cn(
          'flex flex-1 flex-col min-w-0 transition-[margin] duration-200',
          hasSidebar && sidebarOpen ? 'md:ml-64' : 'ml-0'
        )}
      >
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <Outlet context={{ sidebarOpen: hasSidebar && sidebarOpen, toggleSidebar, hasSidebar }} />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export function useAppLayout() {
  const context = useOutletContext<AppLayoutContext>();
  return context || { sidebarOpen: true, toggleSidebar: () => {}, hasSidebar: true };
}
