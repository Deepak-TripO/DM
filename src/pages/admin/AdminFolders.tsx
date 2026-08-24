import { Folder, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminFolders() {
  const handleCreateClick = () => {
    toast.info('Folder creation functionality will be available in the next update.');
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-[#4D94E8]">
              <Folder className="h-5 w-5 text-[#4D94E8]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Folder</h1>
          </div>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            Manage administrative system folders and directory organization
          </p>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-2.5 text-sm font-bold text-white transition-all shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Folder</span>
        </button>
      </div>

      {/* Clean Empty State Container */}
      <div className="rounded-3xl neu-card p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full neu-circle text-[#4D94E8]">
          <Folder className="h-10 w-10 text-[#4D94E8]" />
        </div>
        
        <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">
          No folders created yet
        </h2>
        
        <p className="mt-2 text-xs font-semibold text-[var(--color-text-secondary)] max-w-sm">
          Folders created by the administrator will appear here.
        </p>

        <button
          onClick={handleCreateClick}
          className="mt-6 flex items-center justify-center gap-2 rounded-xl neu-btn-primary px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Create Folder</span>
        </button>
      </div>
    </div>
  );
}
