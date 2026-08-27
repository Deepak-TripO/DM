import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTaskById } from '@/services/taskService';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import {
  Home,
  FolderOpen,
  Clock,
  Share2,
  Trash2,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/home', icon: Home, label: 'Home', color: '#4D94E8', bg: '#EAF4FF' },
  { to: '/recent', icon: Clock, label: 'Recent', color: '#E59A32', bg: '#FFF4E5' },
  { to: '/shared', icon: Share2, label: 'Shared', color: '#159A8A', bg: '#E8F8F5' },
  { to: '/trash', icon: Trash2, label: 'Trash', color: '#D95C68', bg: '#FDECEE' },
  { to: '/files', icon: FolderOpen, label: 'My Files', color: '#18AFAF', bg: '#E8FAFA' },
];

export function Sidebar({ open, onToggle }: SidebarProps) {
  const { isAdmin } = useAdmin();
  const location = useLocation();

  // Extract active taskId if currently on a task route
  const taskMatch = location.pathname.match(/^\/tasks\/([^/]+)$/);
  const currentTaskId = taskMatch?.[1];

  const { data: selectedTask } = useQuery({
    queryKey: ['task', currentTaskId],
    queryFn: () => getTaskById(currentTaskId!),
    enabled: !!currentTaskId,
  });

  const isItemActive = (itemTo: string) => {
    const path = location.pathname;
    if (itemTo === '/home') {
      return path === '/home' || path === '/' || path.startsWith('/tasks');
    }
    if (itemTo === '/files') {
      return path.startsWith('/files') || path.startsWith('/folders');
    }
    return path.startsWith(itemTo);
  };

  if (!open) return null;

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-30 hidden md:flex h-screen w-64 flex-col neu-flat bg-[var(--neu-bg)] border-r border-[var(--color-border-light)]/40 shadow-md transition-all duration-200">
      {/* Header with Clickable DM Product Logo */}
      <div className="flex h-[var(--header-height)] items-center px-5 border-b border-[var(--color-border-light)]/40">
        <button
          onClick={onToggle}
          className="text-2xl font-black tracking-tight text-[var(--color-text-primary)] cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
          aria-label="Toggle navigation"
          title="Toggle sidebar"
        >
          DM
        </button>
      </div>

      {/* Task Specific Active Badge */}
      {selectedTask && (
        <div className="mx-4 mt-3 mb-1 flex items-center gap-2.5 rounded-xl neu-pressed px-3.5 py-2.5 border border-[var(--color-border-light)]/40">
          <CheckSquare className="h-4.5 w-4.5 shrink-0 text-[var(--color-primary)]" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold text-[var(--color-text-tertiary)] uppercase tracking-wider">Active Task</p>
            <p className="truncate text-xs font-black text-[var(--color-text-primary)]">{selectedTask.name}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4 scrollbar-none">
        {navItems.map((item) => {
          const active = isItemActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={active ? { backgroundColor: item.bg, color: item.color } : undefined}
              className={cn(
                'flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150',
                active
                  ? 'neu-pressed font-extrabold shadow-sm'
                  : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <item.icon
                className="h-5 w-5 shrink-0"
                style={{ color: item.color }}
              />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {isAdmin && (
          <>
            <div className="mx-2 my-4 h-px neu-pressed-deep opacity-60" />
            <NavLink
              to="/admin"
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: '#EAF4FF', color: '#5B9FF3' }
                  : undefined
              }
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'neu-pressed font-extrabold text-[#5B9FF3]'
                    : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )
              }
            >
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#5B9FF3]" />
              <span>Admin</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
