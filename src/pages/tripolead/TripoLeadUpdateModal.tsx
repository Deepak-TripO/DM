import { useState, useEffect } from 'react';
import { X, Tag, Calendar, FileText, Phone } from 'lucide-react';
import type { TripoLeadEntry, TripoLeadStatus } from '@/services/tripoleadService';

interface TripoLeadUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { status: TripoLeadStatus; approach_date?: string; short_notes?: string; mobile_number?: string }) => void;
  entry: TripoLeadEntry | null;
  isSubmitting?: boolean;
}

export function TripoLeadUpdateModal({
  open,
  onClose,
  onSave,
  entry,
  isSubmitting = false,
}: TripoLeadUpdateModalProps) {
  const [status, setStatus] = useState<TripoLeadStatus>('Pending');
  const [approachDate, setApproachDate] = useState('');
  const [shortNotes, setShortNotes] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  useEffect(() => {
    if (entry) {
      setStatus(entry.status || 'Pending');
      setApproachDate(entry.approach_date || new Date().toISOString().split('T')[0]);
      setShortNotes(entry.short_notes || '');
      setMobileNumber(entry.mobile_number || '');
    }
  }, [entry, open]);

  if (!open || !entry) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status,
      approach_date: approachDate || undefined,
      short_notes: shortNotes.trim() || undefined,
      mobile_number: mobileNumber.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl neu-modal p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-4">
          <div>
            <h2 className="text-base md:text-lg font-black text-[var(--color-text-primary)]">
              Update Entry Status
            </h2>
            <p className="text-xs font-bold text-blue-500 mt-0.5">
              {entry.hotel_name} &middot; <span className="text-[var(--color-text-secondary)]">{entry.district}, {entry.area}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 neu-circle text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-teal-500" />
              Mobile Number
            </label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>

          {/* 1. Status Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-blue-500" />
              Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as TripoLeadStatus)}
                className={`w-full rounded-xl neu-pressed px-4 py-3 text-xs font-extrabold focus:outline-none focus:ring-2 bg-[var(--neu-bg)] cursor-pointer ${
                  status === 'Pending'
                    ? 'text-red-500 focus:ring-red-500/40'
                    : status === 'No Response'
                    ? 'text-amber-500 focus:ring-amber-500/40'
                    : 'text-emerald-500 focus:ring-emerald-500/40'
                }`}
              >
                <option value="Pending" className="text-red-500 bg-[var(--neu-bg)] font-bold">
                  Pending — RED
                </option>
                <option value="No Response" className="text-amber-500 bg-[var(--neu-bg)] font-bold">
                  No Response — YELLOW
                </option>
                <option value="Complete" className="text-emerald-500 bg-[var(--neu-bg)] font-bold">
                  Complete — GREEN
                </option>
              </select>
            </div>
            {/* Status Preview Badge */}
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                  status === 'Pending'
                    ? 'bg-red-500/10 text-red-500 border-red-500/30'
                    : status === 'No Response'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === 'Pending'
                      ? 'bg-red-500'
                      : status === 'No Response'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                {status}
              </span>
            </div>
          </div>

          {/* 2. Approach Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-purple-500" />
              Approach Date
            </label>
            <input
              type="date"
              value={approachDate}
              onChange={(e) => setApproachDate(e.target.value)}
              className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          {/* 3. Short Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              Short Notes
            </label>
            <textarea
              rows={3}
              value={shortNotes}
              onChange={(e) => setShortNotes(e.target.value)}
              placeholder="Enter brief note about this lead approach..."
              className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
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
              {isSubmitting ? 'Saving...' : 'Save Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
