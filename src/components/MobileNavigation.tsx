import { NavLink } from 'react-router-dom';
import { Home, FolderOpen, Clock, Star, Share2, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const mobileNavItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/files', icon: FolderOpen, label: 'Files' },
  { to: '/recent', icon: Clock, label: 'Recent' },
  { to: '/starred', icon: Star, label: 'Starred' },
  { to: '/shared', icon: Share2, label: 'Shared' },
];

export function MobileNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 neu-flat md:hidden px-2 py-1">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all',
                isActive
                  ? 'neu-active text-[var(--color-primary)]'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-xl neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] md:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl neu-modal pb-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-light)]">
          <span className="text-base font-bold text-[var(--color-text-primary)]">Menu</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
