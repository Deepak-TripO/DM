import { cn } from '@/lib/utils';
import {
  Clock,
  Trash2,
  FolderOpen,
  Receipt,
  FolderKanban,
} from 'lucide-react';

export type MidFinanceSection = 'finance' | 'project' | 'files' | 'recent' | 'trash';

interface MidFinanceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: MidFinanceSection;
  onSectionChange: (section: MidFinanceSection) => void;
}

const navItems: {
  id: MidFinanceSection;
  label: string;
  icon: any;
  color: string;
  bg: string;
}[] = [
  { id: 'finance', label: 'Finance', icon: Receipt, color: '#4D94E8', bg: '#EAF4FF' },
  { id: 'project', label: 'Project', icon: FolderKanban, color: '#8B5CF6', bg: '#F3E8FF' },
  { id: 'files', label: 'My Files', icon: FolderOpen, color: '#18AFAF', bg: '#E8FAFA' },
  { id: 'recent', label: 'Recent', icon: Clock, color: '#E59A32', bg: '#FFF4E5' },
  { id: 'trash', label: 'Trash', icon: Trash2, color: '#D95C68', bg: '#FDECEE' },
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

  const renderNavItems = (isMobile: boolean) => (
    <nav className="flex-1 space-y-2.5 overflow-y-auto pr-1">
      {navItems.map((item) => {
        const isActive = activeSection === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => (isMobile ? handleSelectSection(item.id) : onSectionChange(item.id))}
            style={isActive ? { backgroundColor: item.bg, color: item.color } : undefined}
            className={cn(
              'w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 text-left cursor-pointer',
              isActive
                ? 'neu-pressed font-extrabold shadow-sm'
                : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" style={{ color: item.color }} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

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

          {renderNavItems(true)}
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

        {renderNavItems(false)}
      </aside>
    </>
  );
}
