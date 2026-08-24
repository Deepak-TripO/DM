import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl neu-modal p-7 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 h-8 w-8 neu-circle text-[var(--color-text-tertiary)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl neu-circle text-[var(--color-danger)]">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>

        <div>
          <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">{description}</p>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-60 ${
              confirmVariant === 'danger'
                ? 'neu-btn-danger text-red-500'
                : 'neu-btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
