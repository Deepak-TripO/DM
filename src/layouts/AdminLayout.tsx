import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/features/auth/AuthProvider';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  HardDrive,
  FileText,
  Link2,
  Activity,
  FolderTree,
  Settings,
  ArrowLeft,
  Loader2,
  LogOut,
  User,
  Shield,
} from 'lucide-react';

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true, color: '#4D94E8', bg: '#EAF4FF' },
  { to: '/admin/users', icon: Users, label: 'Users', color: '#22A06B', bg: '#EAF8F1' },
  { to: '/admin/storage', icon: HardDrive, label: 'Storage', color: '#18AFAF', bg: '#E8FAFA' },
  { to: '/admin/files', icon: FileText, label: 'Files', color: '#8A63D2', bg: '#F3EDFF' },
  { to: '/admin/shared-links', icon: Link2, label: 'Shared Links', color: '#159A8A', bg: '#E8F8F5' },
  { to: '/admin/activity', icon: Activity, label: 'Activity', color: '#E59A32', bg: '#FFF4E5' },
  { to: '/admin/categories', icon: FolderTree, label: 'Category', color: '#18AFAF', bg: '#E8FAFA' },
  { to: '/admin/settings', icon: Settings, label: 'Settings', color: '#65758B', bg: '#F1F5F9' },
];

export default function AdminLayout() {
  const { isAdmin, loading } = useAdmin();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--color-surface-secondary)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">Verifying admin permissions...</span>
        </div>
      </div>
    );
  }

  // Access control check: non-admin users see Access Denied
  if (!isAdmin) {
    return <AccessDenied />;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[var(--neu-bg)]">
      {/* Desktop & Tablet Dedicated Admin Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col neu-flat md:flex">
        {/* Admin Header Branding */}
        <div className="flex h-[var(--header-height)] items-center justify-between px-4 border-b border-[var(--color-border-light)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-[#5B9FF3]">
              <Shield className="h-4 w-4 text-[#5B9FF3]" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-[var(--color-text-primary)]">DM</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B9FF3]">Administration</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
                    : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-4 w-4 shrink-0" style={{ color: item.color }} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Bottom Controls */}
        <div className="p-3 space-y-2 neu-pressed-deep my-2 mx-2 rounded-2xl">
          <button
            onClick={() => navigate('/')}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            Back to App
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <User className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <span className="truncate">Admin Profile</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold neu-btn text-[var(--color-danger)] hover:text-[var(--color-danger)]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Administration Bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex flex-col neu-flat md:hidden">
        <div className="flex h-12 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="rounded-lg p-1.5 neu-circle text-[var(--color-text-tertiary)]"
              aria-label="Back to DM"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-[var(--color-primary)]">DM Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-1.5 neu-circle text-[var(--color-danger)]"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="flex gap-1.5 overflow-x-auto px-2 pb-2 scrollbar-none">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                  isActive
                    ? 'neu-active text-[var(--color-primary)]'
                    : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pt-20 md:ml-60 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
