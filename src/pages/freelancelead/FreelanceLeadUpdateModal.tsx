import { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Calendar, FileText, User } from 'lucide-react';
import type { FreelanceLeadEntry, FreelanceLeadStatus } from '@/services/freelanceleadService';

interface FreelanceLeadUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { status: FreelanceLeadStatus; approach_date?: string; short_notes?: string; contact_person?: string }) => void;
  entry: FreelanceLeadEntry | null;
  isSubmitting?: boolean;
}

export function FreelanceLeadUpdateModal({
  open,
  onClose,
  onSave,
  entry,
  isSubmitting = false,
}: FreelanceLeadUpdateModalProps) {
  const [status, setStatus] = useState<FreelanceLeadStatus>('Pending');
  const [approachDate, setApproachDate] = useState('');
  const [shortNotes, setShortNotes] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  useEffect(() => {
    if (entry) {
      setStatus(entry.status || 'Pending');
      setApproachDate(entry.approach_date || '');
      setShortNotes(entry.short_notes || '');
      setContactPerson(entry.contact_person || '');
    }
  }, [entry, open]);

  if (!open || !entry) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status,
      approach_date: approachDate ? approachDate : undefined,
      short_notes: shortNotes.trim() ? shortNotes.trim() : undefined,
      contact_person: contactPerson.trim() ? contactPerson.trim() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl neu-modal p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-4">
          <div>
            <h2 className="text-base md:text-lg font-black text-[var(--color-text-primary)]">
              Update Freelance Lead Details
            </h2>
            <p className="text-xs font-bold text-blue-500 mt-0.5">{entry.hotel_name}</p>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
              Lead Status <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Pending', 'No Response', 'Complete', 'Follow up'] as FreelanceLeadStatus[]).map((s) => {
                const isSelected = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-2.5 px-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer border text-center ${
                      isSelected
                        ? s === 'Pending'
                          ? 'bg-red-500 text-white border-red-600 shadow-md'
                          : s === 'No Response'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                          : s === 'Complete'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                          : 'bg-pink-500 text-white border-pink-600 shadow-md'
                        : 'neu-btn text-[var(--color-text-secondary)] border-transparent'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Person Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-blue-500" />
              Contact Person
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. John Doe / Manager"
              className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Approach Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-purple-500" />
              Approach Date
            </label>
            <input
              type="date"
              value={approachDate}
              onChange={(e) => setApproachDate(e.target.value)}
              className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/40 bg-[var(--neu-bg)]"
            />
          </div>

          {/* Short Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              Short Notes
            </label>
            <textarea
              rows={3}
              value={shortNotes}
              onChange={(e) => setShortNotes(e.target.value)}
              placeholder="Enter updates, client remarks, or follow-up notes..."
              className="w-full rounded-xl neu-pressed p-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-light)]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl neu-btn text-xs font-extrabold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
