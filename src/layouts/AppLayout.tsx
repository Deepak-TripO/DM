import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('dm-sidebar-collapsed');
    return stored === 'true';
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      localStorage.setItem('dm-sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  // Hide sidebar ONLY on the initial Select Task page (/tasks)
  const isSelectTaskPage = location.pathname === '/tasks';

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-secondary)]">
      {/* Sidebar - hidden on mobile & hidden on /tasks */}
      {!isMobile && !isSelectTaskPage && (
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      )}

      {/* Main content */}
      <main
        className={cn(
          'flex-1 transition-[margin] duration-200',
          !isMobile && !isSelectTaskPage && (sidebarCollapsed
            ? 'ml-[var(--sidebar-collapsed-width)]'
            : 'ml-[var(--sidebar-width)]')
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
