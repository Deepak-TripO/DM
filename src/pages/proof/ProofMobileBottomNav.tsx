import { Home, FolderOpen, Clock, Trash2 } from 'lucide-react';
import type { ProofTab } from './ProofSidebar';

interface ProofMobileBottomNavProps {
  activeTab: ProofTab;
  onTabChange: (tab: ProofTab) => void;
}

const navItems: { id: ProofTab; label: string; icon: any; color: string; activeText: string; activeBg: string }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    color: '#3B82F6',
    activeText: '#2563EB',
    activeBg: 'rgba(59, 130, 246, 0.14)',
  },
  {
    id: 'files',
    label: 'My Files',
    icon: FolderOpen,
    color: '#10B981',
    activeText: '#059669',
    activeBg: 'rgba(16, 185, 129, 0.14)',
  },
  {
    id: 'recent',
    label: 'Recent',
    icon: Clock,
    color: '#F97316',
    activeText: '#EA580C',
    activeBg: 'rgba(249, 115, 22, 0.14)',
  },
  {
    id: 'trash',
    label: 'Trash',
    icon: Trash2,
    color: '#EF4444',
    activeText: '#DC2626',
    activeBg: 'rgba(239, 68, 68, 0.14)',
  },
];

export function ProofMobileBottomNav({ activeTab, onTabChange }: ProofMobileBottomNavProps) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-[var(--neu-bg)] border-t border-[var(--color-border-light)]/60 shadow-lg px-1.5 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      aria-label="Proof Mobile Bottom Navigation"
    >
      {navItems.map((item) => {
        const active = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            style={active ? { backgroundColor: item.activeBg, color: item.activeText } : undefined}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold transition-all duration-150 flex-1 min-w-0 cursor-pointer ${
              active
                ? 'neu-pressed font-black shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Icon
              className={`h-5 w-5 shrink-0 transition-opacity ${active ? 'opacity-100' : 'opacity-70'}`}
              style={{ color: item.color }}
            />
            <span className="truncate max-w-[64px]" style={active ? { color: item.activeText } : undefined}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
