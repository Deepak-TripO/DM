import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl neu-circle text-[var(--color-primary)]">
        <Icon className="h-10 w-10 text-[var(--color-primary)]" />
      </div>
      <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs font-semibold text-[var(--color-text-secondary)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
