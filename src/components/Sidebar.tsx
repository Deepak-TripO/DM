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
  { to: '/', icon: Home, label: 'Home', color: '#4D94E8', bg: '#EAF4FF' },
  { to: '/files', icon: FolderOpen, label: 'My Files', color: '#18AFAF', bg: '#E8FAFA' },
  { to: '/recent', icon: Clock, label: 'Recent', color: '#E59A32', bg: '#FFF4E5' },
  { to: '/starred', icon: Star, label: 'Starred', color: '#8A63D2', bg: '#F3EDFF' },
  { to: '/shared', icon: Share2, label: 'Shared', color: '#159A8A', bg: '#E8F8F5' },
  { to: '/trash', icon: Trash2, label: 'Trash', color: '#D95C68', bg: '#FDECEE' },
];

const bottomItems = [
  { to: '/profile', icon: User, label: 'Profile', color: '#6675D9', bg: '#EEF0FB' },
  { to: '/settings', icon: Settings, label: 'Settings', color: '#65758B', bg: '#F1F5F9' },
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
          <span className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">DM</span>
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
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: item.bg, color: item.color }
                : undefined
            }
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'neu-pressed font-bold'
                  : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                collapsed && 'justify-center px-0'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className="h-[18px] w-[18px] shrink-0"
                  style={{ color: isActive ? item.color : item.color }}
                />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className={cn('mx-2 my-4 h-px neu-pressed-deep opacity-60', collapsed && 'mx-1')} />
            <NavLink
              to="/admin"
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: '#EAF4FF', color: '#5B9FF3' }
                  : undefined
              }
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'neu-pressed font-bold text-[#5B9FF3]'
                    : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                  collapsed && 'justify-center px-0'
                )
              }
            >
              <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-[#5B9FF3]" />
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
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: item.bg, color: item.color }
                : undefined
            }
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'neu-pressed font-bold'
                  : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                collapsed && 'justify-center px-0'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className="h-[18px] w-[18px] shrink-0"
                  style={{ color: item.color }}
                />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
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
          <LogOut className="h-[18px] w-[18px] shrink-0 text-[#D95C68]" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
