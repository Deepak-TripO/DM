import { useState, useEffect } from 'react';
import { X, FolderPlus } from 'lucide-react';

interface ProofCreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (folderName: string) => void;
  isSubmitting?: boolean;
}

export function ProofCreateFolderModal({
  open,
  onClose,
  onSave,
  isSubmitting = false,
}: ProofCreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');

  useEffect(() => {
    if (open) {
      setFolderName('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    onSave(folderName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl neu-modal p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 neu-circle flex items-center justify-center text-blue-500">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-[var(--color-text-primary)]">
                Create Folder
              </h2>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-0.5">
                Enter a folder name for your Proof files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 neu-circle text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider">
              Folder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name..."
              className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border-light)]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl neu-btn text-xs font-extrabold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !folderName.trim()}
              className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
