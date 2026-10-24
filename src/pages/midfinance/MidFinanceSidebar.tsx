import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Clock,
  Share2,
  Trash2,
  FolderOpen,
  Receipt,
  FolderKanban,
} from 'lucide-react';

export type MidFinanceSection = 'finance' | 'project';

interface MidFinanceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: MidFinanceSection;
  onSectionChange: (section: MidFinanceSection) => void;
}

const standardNavItems = [
  { to: '/recent', icon: Clock, label: 'Recent', color: '#E59A32', bg: '#FFF4E5' },
  { to: '/shared', icon: Share2, label: 'Shared', color: '#159A8A', bg: '#E8F8F5' },
  { to: '/trash', icon: Trash2, label: 'Trash', color: '#D95C68', bg: '#FDECEE' },
  { to: '/files', icon: FolderOpen, label: 'My Files', color: '#18AFAF', bg: '#E8FAFA' },
];

export function MidFinanceSidebar({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
}: MidFinanceSidebarProps) {
  if (!isOpen) return null;

  const handleSelectSection = (section: MidFinanceSection) => {
    onSectionChange(section);
    onClose();
  };

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
            {/* 1. MID Finance Entries */}
            <button
              onClick={() => handleSelectSection('finance')}
              style={
                activeSection === 'finance'
                  ? { backgroundColor: '#EAF4FF', color: '#4D94E8' }
                  : undefined
              }
              className={cn(
                'w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 text-left cursor-pointer',
                activeSection === 'finance'
                  ? 'neu-pressed font-extrabold shadow-sm'
                  : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <Receipt className="h-5 w-5 shrink-0" style={{ color: '#4D94E8' }} />
              <span>Finance</span>
            </button>

            {/* 2. Project Section */}
            <button
              onClick={() => handleSelectSection('project')}
              style={
                activeSection === 'project'
                  ? { backgroundColor: '#F3E8FF', color: '#8B5CF6' }
                  : undefined
              }
              className={cn(
                'w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 text-left cursor-pointer',
                activeSection === 'project'
                  ? 'neu-pressed font-extrabold shadow-sm'
                  : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <FolderKanban className="h-5 w-5 shrink-0" style={{ color: '#8B5CF6' }} />
              <span>Project</span>
            </button>

            <div className="my-2 h-px bg-[var(--color-border-light)]/40" />

            {/* Standard Navigation Items */}
            {standardNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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
          {/* 1. MID Finance Entries */}
          <button
            onClick={() => onSectionChange('finance')}
            style={
              activeSection === 'finance'
                ? { backgroundColor: '#EAF4FF', color: '#4D94E8' }
                : undefined
            }
            className={cn(
              'w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 text-left cursor-pointer',
              activeSection === 'finance'
                ? 'neu-pressed font-extrabold shadow-sm'
                : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <Receipt className="h-5 w-5 shrink-0" style={{ color: '#4D94E8' }} />
            <span>Finance</span>
          </button>

          {/* 2. Project Section */}
          <button
            onClick={() => onSectionChange('project')}
            style={
              activeSection === 'project'
                ? { backgroundColor: '#F3E8FF', color: '#8B5CF6' }
                : undefined
            }
            className={cn(
              'w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 text-left cursor-pointer',
              activeSection === 'project'
                ? 'neu-pressed font-extrabold shadow-sm'
                : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <FolderKanban className="h-5 w-5 shrink-0" style={{ color: '#8B5CF6' }} />
            <span>Project</span>
          </button>

          <div className="my-2 h-px bg-[var(--color-border-light)]/40" />

          {/* Standard Navigation Items */}
          {standardNavItems.map((item) => (
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
