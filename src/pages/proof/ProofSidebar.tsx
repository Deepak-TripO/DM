import { cn } from '@/lib/utils';
import { Home, Clock, Trash2, FolderOpen } from 'lucide-react';

export type ProofTab = 'home' | 'files' | 'recent' | 'trash';

interface ProofSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ProofTab;
  onTabChange: (tab: ProofTab) => void;
}

const navItems: { id: ProofTab; label: string; icon: any; color: string; bg: string }[] = [
  { id: 'home', label: 'Home', icon: Home, color: '#4D94E8', bg: '#EAF4FF' },
  { id: 'files', label: 'My Files', icon: FolderOpen, color: '#18AFAF', bg: '#E8FAFA' },
  { id: 'recent', label: 'Recent', icon: Clock, color: '#E59A32', bg: '#FFF4E5' },
  { id: 'trash', label: 'Trash', icon: Trash2, color: '#D95C68', bg: '#FDECEE' },
];

export function ProofSidebar({ isOpen, onClose, activeTab, onTabChange }: ProofSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Desktop Fixed Left Sidebar (screens >= lg) */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30 h-screen w-64 flex-col neu-flat bg-[var(--neu-bg)] p-5 border-r border-[var(--color-border-light)]/40 shadow-md">
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

        <nav className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={isActive ? { backgroundColor: item.bg, color: item.color } : undefined}
                className={cn(
                  'w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 text-left cursor-pointer',
                  isActive
                    ? 'neu-pressed font-extrabold shadow-sm'
                    : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" style={{ color: item.color }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
