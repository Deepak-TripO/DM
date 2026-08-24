import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import {
  Home,
  FolderOpen,
  Clock,
  Star,
  Share2,
  Trash2,
  User,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/files', icon: FolderOpen, label: 'My Files' },
  { to: '/recent', icon: Clock, label: 'Recent' },
  { to: '/starred', icon: Star, label: 'Starred' },
  { to: '/shared', icon: Share2, label: 'Shared' },
  { to: '/trash', icon: Trash2, label: 'Trash' },
];

const bottomItems = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col neu-flat transition-[width] duration-200',
        collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      )}
    >
      {/* Logo */}
      <div className="flex h-[var(--header-height)] items-center justify-between px-4">
        {!collapsed && (
          <span className="text-xl font-extrabold tracking-tight text-[var(--color-text-primary)]">DM</span>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'neu-active text-[var(--color-primary)] font-bold'
                  : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                collapsed && 'justify-center px-0'
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className={cn('mx-2 my-4 h-px neu-pressed-deep opacity-60', collapsed && 'mx-1')} />
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'neu-active text-[var(--color-primary)] font-bold'
                    : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                  collapsed && 'justify-center px-0'
                )
              }
            >
              <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>Admin</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="space-y-2 px-3 py-3 neu-pressed-deep my-2 mx-2 rounded-2xl">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'neu-active text-[var(--color-primary)] font-bold'
                  : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                collapsed && 'justify-center px-0'
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        <button
          onClick={handleSignOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] neu-btn transition-colors hover:text-[var(--color-danger)]',
            collapsed && 'justify-center px-0'
          )}
          aria-label="Sign out"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
