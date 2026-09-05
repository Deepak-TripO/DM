import { useState, useEffect } from 'react';
import { X, Building2, MapPin, Navigation, ExternalLink, UserCheck, Phone } from 'lucide-react';
import {
  TAMIL_NADU_DISTRICTS,
  INDIAN_STATES,
  INDIAN_STATES_DISTRICTS_MAP,
  TRIPO_LEAD_PROFESSIONAL_OPTIONS,
  type TripoLeadEntry,
} from '@/services/tripoleadService';

interface TripoLeadEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    hotel_name: string;
    district: string;
    area: string;
    location_link?: string;
    professional?: string;
    mobile_number?: string;
    state?: string;
  }) => void;
  initialData?: TripoLeadEntry | null;
  isSubmitting?: boolean;
}

export function TripoLeadEntryModal({
  open,
  onClose,
  onSave,
  initialData,
  isSubmitting = false,
}: TripoLeadEntryModalProps) {
  const [hotelName, setHotelName] = useState('');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [professional, setProfessional] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [state, setState] = useState('Tamil Nadu');

  useEffect(() => {
    if (initialData) {
      setHotelName(initialData.hotel_name || '');
      setProfessional(initialData.professional || '');
      setMobileNumber(initialData.mobile_number || '');
      const savedState = initialData.state || 'Tamil Nadu';
      setState(savedState);
      setDistrict(initialData.district || '');
      setArea(initialData.area || '');
      setLocationLink(initialData.location_link || '');
    } else {
      setHotelName('');
      setProfessional('');
      setMobileNumber('');
      setState('Tamil Nadu');
      setDistrict('');
      setArea('');
      setLocationLink('');
    }
  }, [initialData, open]);

  if (!open) return null;

  const isPackager = professional === 'Packager';

  const handleStateChange = (newState: string) => {
    setState(newState);
    setDistrict('');
  };

  const availableDistricts = state ? INDIAN_STATES_DISTRICTS_MAP[state] || [] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPackager) {
      if (!hotelName.trim() || !mobileNumber.trim() || !state.trim() || !district.trim()) return;

      onSave({
        hotel_name: hotelName.trim(),
        mobile_number: mobileNumber.trim(),
        state: state.trim(),
        district: district.trim(),
        area: area.trim(),
        location_link: locationLink.trim() || undefined,
        professional: professional || undefined,
      });
    } else {
      if (!hotelName.trim() || !district || !area.trim()) return;

      onSave({
        hotel_name: hotelName.trim(),
        district: district.trim(),
        area: area.trim(),
        location_link: locationLink.trim() || undefined,
        professional: professional || undefined,
        mobile_number: mobileNumber.trim() || undefined,
        state: state.trim() || undefined,
      });
    }
  };

  const isEditing = !!initialData;
  const isFormInvalid = isPackager
    ? !hotelName.trim() || !mobileNumber.trim() || !state.trim() || !district.trim()
    : !hotelName.trim() || !district.trim() || !area.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl neu-modal p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-4">
          <div>
            <h2 className="text-base md:text-lg font-black text-[var(--color-text-primary)]">
              {isEditing ? 'Edit TripO Lead Entry' : 'Add New TripO Lead Entry'}
            </h2>
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
          {/* Professional */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
              Professional
            </label>
            <select
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
              className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-[var(--neu-bg)] cursor-pointer"
            >
              <option value="" className="bg-[var(--neu-bg)] text-[var(--color-text-secondary)] font-bold">
                Select Professional
              </option>
              {TRIPO_LEAD_PROFESSIONAL_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-[var(--neu-bg)] text-[var(--color-text-primary)] font-bold">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Packager Fields */}
          {isPackager ? (
            <>
              {/* 1. Company Name (Full width) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-blue-500" />
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder="e.g. ABC Travels"
                  className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* Row 1: Mobile Number + State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-teal-500" />
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-[var(--neu-bg)] cursor-pointer"
                  >
                    <option value="" className="bg-[var(--neu-bg)] text-[var(--color-text-secondary)] font-bold">
                      Select State
                    </option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s} className="bg-[var(--neu-bg)] text-[var(--color-text-primary)] font-bold">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: District + Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* District */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-purple-500" />
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/40 bg-[var(--neu-bg)] cursor-pointer"
                  >
                    <option value="" className="bg-[var(--neu-bg)] text-[var(--color-text-secondary)] font-bold">
                      Select District
                    </option>
                    {availableDistricts.map((d) => (
                      <option key={d} value={d} className="bg-[var(--neu-bg)] text-[var(--color-text-primary)] font-bold">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5 text-amber-500" />
                    Area
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Downtown / Beachside"
                    className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Website Link (Full width) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 text-indigo-500" />
                  Website Link
                </label>
                <input
                  type="url"
                  value={locationLink}
                  onChange={(e) => setLocationLink(e.target.value)}
                  placeholder="e.g. https://www.abctravels.com"
                  className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </>
          ) : (
            <>
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-blue-500" />
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder="e.g. Grand Palace Hotel / Contact Person"
                  className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

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

              {/* District & Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-purple-500" />
                    District (Tamil Nadu) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={district || TAMIL_NADU_DISTRICTS[0]}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/40 bg-[var(--neu-bg)] cursor-pointer"
                  >
                    {TAMIL_NADU_DISTRICTS.map((d) => (
                      <option key={d} value={d} className="bg-[var(--neu-bg)] text-[var(--color-text-primary)] font-bold">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5 text-amber-500" />
                    Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Downtown / Beachside"
                    className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Location Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-500" />
                  Location Link (Google Maps / URL)
                </label>
                <input
                  type="url"
                  value={locationLink}
                  onChange={(e) => setLocationLink(e.target.value)}
                  placeholder="e.g. https://maps.google.com/?q=..."
                  className="w-full rounded-xl neu-pressed px-4 py-3 text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </>
          )}

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
              disabled={isSubmitting || isFormInvalid}
              className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
