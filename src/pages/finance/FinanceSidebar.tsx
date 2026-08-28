import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  Clock,
  Share2,
  Trash2,
  FolderOpen,
} from 'lucide-react';

interface FinanceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const financeNavItems = [
  { to: '/tasks', icon: Home, label: 'Home', color: '#4D94E8', bg: '#EAF4FF' },
  { to: '/recent', icon: Clock, label: 'Recent', color: '#E59A32', bg: '#FFF4E5' },
  { to: '/shared', icon: Share2, label: 'Shared', color: '#159A8A', bg: '#E8F8F5' },
  { to: '/trash', icon: Trash2, label: 'Trash', color: '#D95C68', bg: '#FDECEE' },
  { to: '/files', icon: FolderOpen, label: 'My Files', color: '#18AFAF', bg: '#E8FAFA' },
];

export function FinanceSidebar({ isOpen, onClose }: FinanceSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay Drawer (screens < lg) */}
      <div className="lg:hidden fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
        />
        <aside className="relative z-50 flex h-full w-64 flex-col neu-flat bg-[var(--neu-bg)] p-5 shadow-2xl transition-transform duration-300 border-r border-[var(--color-border-light)]/40">
          {/* Header with Clickable DM Product Logo */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-4 mb-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
              aria-label="Toggle navigation"
              title="Close sidebar"
            >
              <img src="/dm-logo.png" alt="DM Logo" className="h-8 w-auto object-contain" />
            </button>
          </div>

          <nav className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {financeNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                style={({ isActive }) =>
                  isActive
                    ? { backgroundColor: item.bg, color: item.color }
                    : undefined
                }
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150',
                    isActive
                      ? 'neu-pressed font-extrabold shadow-sm'
                      : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className="h-5 w-5 shrink-0"
                      style={{ color: item.color }}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>

      {/* Desktop Fixed Full-Height Left Navigation Sidebar (screens >= lg) */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30 h-screen w-64 flex-col neu-flat bg-[var(--neu-bg)] p-5 border-r border-[var(--color-border-light)]/40 shadow-md">
        {/* Header with Clickable DM Product Logo */}
        <div className="flex h-[var(--header-height)] items-center justify-between border-b border-[var(--color-border-light)]/40 pb-4 mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
            aria-label="Toggle navigation"
            title="Collapse sidebar"
          >
            <img src="/dm-logo.png" alt="DM Logo" className="h-8 w-auto object-contain" />
          </button>
        </div>

        {/* Full-Height Navigation Items */}
        <nav className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {financeNavItems.map((item) => (
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
                  'flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'neu-pressed font-extrabold shadow-sm'
                    : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className="h-5 w-5 shrink-0"
                    style={{ color: item.color }}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
