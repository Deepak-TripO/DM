import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MobileNavigation } from '@/components/MobileNavigation';
import { cn } from '@/lib/utils';

export function AppLayout() {
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

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-secondary)]">
      {/* Sidebar - hidden on mobile */}
      {!isMobile && (
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      )}

      {/* Main content */}
      <main
        className={cn(
          'flex-1 transition-[margin] duration-200',
          !isMobile && (sidebarCollapsed
            ? 'ml-[var(--sidebar-collapsed-width)]'
            : 'ml-[var(--sidebar-width)]'),
          isMobile && 'pb-16'
        )}
      >
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      {isMobile && <MobileNavigation />}
    </div>
  );
}
