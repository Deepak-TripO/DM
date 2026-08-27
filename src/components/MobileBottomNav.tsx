import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Folder,
  Share2,
  Clock,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItemsConfig = [
  {
    to: '/home',
    label: 'Home',
    icon: Home,
    color: '#3B82F6', // Solid Blue
    activeBg: 'rgba(59, 130, 246, 0.14)',
    activeText: '#2563EB',
  },
  {
    to: '/files',
    label: 'My Files',
    icon: Folder,
    color: '#10B981', // Solid Green
    activeBg: 'rgba(16, 185, 129, 0.14)',
    activeText: '#059669',
  },
  {
    to: '/shared',
    label: 'Shared',
    icon: Share2,
    color: '#8A63D2', // Solid Purple
    activeBg: 'rgba(138, 99, 210, 0.14)',
    activeText: '#7C3AED',
  },
  {
    to: '/recent',
    label: 'Recent',
    icon: Clock,
    color: '#F97316', // Solid Orange
    activeBg: 'rgba(249, 115, 22, 0.14)',
    activeText: '#EA580C',
  },
  {
    to: '/trash',
    label: 'Trash',
    icon: Trash2,
    color: '#EF4444', // Solid Red
    activeBg: 'rgba(239, 68, 68, 0.14)',
    activeText: '#DC2626',
  },
];

export function MobileBottomNav() {
  const location = useLocation();

  // On MOBILE VIEW: Hide bottom navigation bar on "Select Task" page (/tasks)
  const isSelectTaskPage = location.pathname === '/tasks' || location.pathname === '/tasks/';
  if (isSelectTaskPage) return null;

  const isPathActive = (path: string) => {
    const p = location.pathname;
    if (path === '/home') {
      return p === '/home' || p === '/' || p === '/tasks' || p === '/tasks/';
    }
    if (path === '/files') {
      return p.startsWith('/files') || p.startsWith('/folders');
    }
    return p.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-[var(--neu-bg)] border-t border-[var(--color-border-light)]/60 shadow-lg px-1.5 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:hidden"
      aria-label="Mobile bottom navigation"
    >
      {navItemsConfig.map((item) => {
        const active = isPathActive(item.to);
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            style={active ? { backgroundColor: item.activeBg, color: item.activeText } : undefined}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold transition-all duration-150 flex-1 min-w-0',
              active
                ? 'neu-pressed font-black shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <Icon
              className={cn('h-5 w-5 shrink-0 transition-opacity', active ? 'opacity-100' : 'opacity-70')}
              style={{ color: item.color }}
            />
            <span className="truncate max-w-[64px]" style={active ? { color: item.activeText } : undefined}>
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
