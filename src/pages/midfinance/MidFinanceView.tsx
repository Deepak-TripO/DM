import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMidFinanceEntries,
  createMidFinanceEntry,
  updateMidFinanceEntry,
  deleteMidFinanceEntry,
  subscribeToMidFinanceChange,
} from '@/services/midFinanceService';
import type { MidFinanceEntry } from '@/services/midFinanceService';
import type { TaskItem } from '@/services/taskService';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { useMidFinanceAccess } from '@/hooks/useMidFinanceAccess';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import {
  exportToPdf,
  exportToJpg,
  exportToDocx,
} from '@/utils/midFinanceExportService';
import { MidFinanceSidebar, type MidFinanceSection } from './MidFinanceSidebar';
import { MidFinanceProjectsView } from './MidFinanceProjectsView';
import { MidFinanceProjectDetailView } from './MidFinanceProjectDetailView';
import type { MidFinanceProject } from '@/services/midFinanceProjectService';
import {
  Plus,
  Lock,
  Search,
  Pencil,
  Trash2,
  Loader2,
  IndianRupee,
  Receipt,
  Download,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  MoreVertical,
  Eye,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface MidFinanceViewProps {
  task?: TaskItem;
}

export function MidFinanceView({ task }: MidFinanceViewProps) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { canAddEntry } = useMidFinanceAccess();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<MidFinanceSection>('finance');
  const [openedProject, setOpenedProject] = useState<MidFinanceProject | null>(null);
  const [localSidebarOpen, setLocalSidebarOpen] = useState(true);
  const toggleLocalSidebar = () => setLocalSidebarOpen((prev) => !prev);

  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MidFinanceEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<MidFinanceEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<MidFinanceEntry | null>(null);
  const [financeMoreOpen, setFinanceMoreOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    company_name: '',
    description: '',
    person: 'Incoming',
    amount: '',
    incomingAmount: '',
    outgoingAmount: '',
  });

  useEffect(() => {
    const unsubscribe = subscribeToMidFinanceChange(() => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceEntries'] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  const taskId = task?.id || 'mid-finance';

  // Query MID Finance entries from Supabase / Memory
  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['midFinanceEntries', taskId, searchQuery],
    queryFn: () => getMidFinanceEntries(taskId, searchQuery, 'All'),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    refetch();
  }, [location.pathname, taskId, refetch]);

  const [expenseCardOpen, setExpenseCardOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'jpg' | 'docx' | null>(null);

  // Date Range Export State
  const [exportMode, setExportMode] = useState<'range' | 'all'>('all');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const getFilteredExportData = async () => {
    let allStoredEntries: MidFinanceEntry[] = [];
    try {
      allStoredEntries = await getMidFinanceEntries(taskId, '', 'All');
    } catch {
      allStoredEntries = entries;
    }

    let exportEntries = [...allStoredEntries];

    if (exportMode === 'range') {
      if (!exportStartDate || !exportEndDate) {
        toast.error('Please select both Start Date and End Date.');
        return null;
      }
      if (exportStartDate > exportEndDate) {
        toast.error('Start date cannot be after end date.');
        return null;
      }
      exportEntries = allStoredEntries.filter(
        (e) => e.date >= exportStartDate && e.date <= exportEndDate
      );
    }

    if (exportEntries.length === 0) {
      toast.error('No data available for the selected date range.');
      return null;
    }

    const summary = {
      overallTotal: exportEntries.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
      incomingTotal: exportEntries.reduce((acc, curr) => {
        if (curr.incoming_amount != null) return acc + Number(curr.incoming_amount);
        if (curr.deepak_amount != null) return acc + Number(curr.deepak_amount);
        if (curr.person === 'Incoming' || curr.person === 'Deepak') return acc + Number(curr.amount || 0);
        if (curr.person === 'Incoming + Outgoing' || curr.person === 'Elumugam+Deepak') return acc + (Number(curr.amount || 0) / 2);
        return acc;
      }, 0),
      outgoingTotal: exportEntries.reduce((acc, curr) => {
        if (curr.outgoing_amount != null) return acc + Number(curr.outgoing_amount);
        if (curr.elumugam_amount != null) return acc + Number(curr.elumugam_amount);
        if (curr.person === 'Outgoing' || curr.person === 'Elumugam') return acc + Number(curr.amount || 0);
        if (curr.person === 'Incoming + Outgoing' || curr.person === 'Elumugam+Deepak') return acc + (Number(curr.amount || 0) / 2);
        return acc;
      }, 0),
    };

    return { entries: exportEntries, summary };
  };

  const handleExportPdf = async () => {
    const data = await getFilteredExportData();
    if (!data) return;
    setIsExporting('pdf');
    try {
      await exportToPdf(data.entries, data.summary);
      toast.success('PDF generated and downloaded successfully!');
      setExportModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportJpg = async () => {
    const data = await getFilteredExportData();
    if (!data) return;
    setIsExporting('jpg');
    try {
      await exportToJpg(data.entries, data.summary);
      toast.success('JPG generated and downloaded successfully!');
      setExportModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate JPG. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportDocx = async () => {
    const data = await getFilteredExportData();
    if (!data) return;
    setIsExporting('docx');
    try {
      await exportToDocx(data.entries, data.summary);
      toast.success('Document generated and downloaded successfully!');
      setExportModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Document. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  // Calculate Expense amounts (Incoming Amount, Outgoing Amount, Total Amount)
  const { expenseIncomingTotal, expenseOutgoingTotal, expenseOverallTotal } = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;

    entries.forEach((entry) => {
      const amt = Number(entry.amount) || 0;
      const p = (entry.person || '').trim();

      if (entry.incoming_amount != null || entry.outgoing_amount != null) {
        incoming += Number(entry.incoming_amount) || 0;
        outgoing += Number(entry.outgoing_amount) || 0;
      } else if (entry.deepak_amount != null || entry.elumugam_amount != null) {
        incoming += Number(entry.deepak_amount) || 0;
        outgoing += Number(entry.elumugam_amount) || 0;
      } else if (p === 'Incoming' || p === 'Deepak') {
        incoming += amt;
      } else if (p === 'Outgoing' || p === 'Elumugam') {
        outgoing += amt;
      } else if (
        p === 'Incoming + Outgoing' ||
        p === 'Incoming+Outgoing' ||
        p === 'Elumugam+Deepak' ||
        p === 'Elumugam + Deepak'
      ) {
        incoming += amt / 2;
        outgoing += amt / 2;
      } else {
        incoming += amt;
      }
    });

    return {
      expenseIncomingTotal: incoming,
      expenseOutgoingTotal: outgoing,
      expenseOverallTotal: incoming + outgoing,
    };
  }, [entries]);

  // Entry Mutations
  const createMutation = useMutation({
    mutationFn: (newEntry: Omit<MidFinanceEntry, 'id' | 'created_at' | 'updated_at'>) =>
      createMidFinanceEntry(newEntry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceEntries'] });
      setAddModalOpen(false);
      resetForm();
      toast.success('MID Finance entry added successfully');
    },
    onError: () => toast.error('Failed to add MID finance entry'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MidFinanceEntry> }) =>
      updateMidFinanceEntry(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceEntries'] });
      setEditingEntry(null);
      resetForm();
      toast.success('MID Finance entry updated successfully');
    },
    onError: () => toast.error('Failed to update MID finance entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMidFinanceEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceEntries'] });
      setDeletingEntry(null);
      toast.success('MID Finance entry deleted successfully');
    },
    onError: () => toast.error('Failed to delete MID finance entry'),
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      company_name: '',
      description: '',
      person: 'Incoming',
      amount: '',
      incomingAmount: '',
      outgoingAmount: '',
    });
  };

  const handleOpenAdd = () => {
    if (!canAddEntry) {
      toast.error('MID Finance entry access is locked by administrator.');
      return;
    }
    resetForm();
    setAddModalOpen(true);
  };

  const handleOpenEdit = (entry: MidFinanceEntry) => {
    setEditingEntry(entry);
    const mappedPerson = entry.person === 'Deepak' ? 'Incoming' : entry.person === 'Elumugam' ? 'Outgoing' : (entry.person || 'Incoming');
    const incVal = entry.incoming_amount ?? entry.deepak_amount ?? null;
    const outVal = entry.outgoing_amount ?? entry.elumugam_amount ?? null;

    setFormData({
      date: entry.date,
      company_name: entry.company_name || entry.item || '',
      description: entry.description || '',
      person: mappedPerson,
      amount: String(entry.amount || ''),
      incomingAmount: incVal != null ? String(incVal) : '',
      outgoingAmount: outVal != null ? String(outVal) : '',
    });
  };

  const isBothPersons = formData.person === 'Incoming + Outgoing' || formData.person === 'Incoming+Outgoing';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry && !canAddEntry) {
      toast.error('MID Finance entry access is locked by administrator.');
      return;
    }
    if (!formData.company_name.trim()) {
      toast.error('Please enter company name');
      return;
    }
    if (!formData.person.trim()) {
      toast.error('Please select an entry type (Incoming or Outgoing)');
      return;
    }

    let finalTotal = 0;
    let finalIncomingAmt: number | null = null;
    let finalOutgoingAmt: number | null = null;

    if (isBothPersons) {
      if (!formData.incomingAmount || !formData.outgoingAmount) {
        toast.error('Please enter both Incoming and Outgoing amounts.');
        return;
      }
      const inc = parseFloat(formData.incomingAmount);
      const out = parseFloat(formData.outgoingAmount);
      if (isNaN(inc) || inc < 0 || isNaN(out) || out < 0) {
        toast.error('Please enter valid non-negative amounts.');
        return;
      }
      finalIncomingAmt = inc;
      finalOutgoingAmt = out;
      finalTotal = inc + out;
    } else if (formData.person === 'Outgoing') {
      const val = parseFloat(formData.outgoingAmount || formData.amount);
      if (isNaN(val) || val < 0) {
        toast.error('Please enter a valid amount.');
        return;
      }
      finalOutgoingAmt = val;
      finalTotal = val;
    } else {
      const val = parseFloat(formData.incomingAmount || formData.amount);
      if (isNaN(val) || val < 0) {
        toast.error('Please enter a valid amount.');
        return;
      }
      finalIncomingAmt = val;
      finalTotal = val;
    }

    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        updates: {
          date: formData.date,
          company_name: formData.company_name.trim(),
          description: formData.description.trim(),
          person: formData.person.trim(),
          amount: finalTotal,
          incoming_amount: finalIncomingAmt,
          outgoing_amount: finalOutgoingAmt,
          deepak_amount: finalIncomingAmt,
          elumugam_amount: finalOutgoingAmt,
        },
      });
    } else {
      createMutation.mutate({
        task_id: taskId,
        date: formData.date,
        company_name: formData.company_name.trim(),
        description: formData.description.trim(),
        person: formData.person.trim(),
        amount: finalTotal,
        incoming_amount: finalIncomingAmt,
        outgoing_amount: finalOutgoingAmt,
        deepak_amount: finalIncomingAmt,
        elumugam_amount: finalOutgoingAmt,
        created_by: user?.id,
      });
    }
  };

  const formatDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatMobileDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-secondary)] relative">
      {/* MID Finance Dedicated Desktop & Mobile Sidebar */}
      <MidFinanceSidebar
        isOpen={localSidebarOpen}
        onClose={toggleLocalSidebar}
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setOpenedProject(null);
        }}
      />

      {/* Main Container */}
      <div
        className={cn(
          'flex flex-1 flex-col min-w-0 transition-[margin] duration-200',
          localSidebarOpen ? 'lg:ml-64' : 'ml-0'
        )}
      >
        <Header onLogoClick={toggleLocalSidebar} sidebarOpen={localSidebarOpen} />
        <main className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full pb-20 lg:pb-6">
          {activeSection === 'project' ? (
            openedProject ? (
              <MidFinanceProjectDetailView
                project={openedProject}
                onBack={() => setOpenedProject(null)}
              />
            ) : (
              <MidFinanceProjectsView
                taskId={taskId}
                onOpenProject={(p) => setOpenedProject(p)}
              />
            )
          ) : (
            <>
              {/* Mobile-Only Header & Controls (< md) */}
              <div className="block md:hidden space-y-3">
                {/* MID Finance Header Title */}
                <h1 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">
                  MID Finance
                </h1>

          {/* Row 1: Search Bar (flex: 1) + More (⋮) directly beside Search Bar */}
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-xl neu-input py-1.5 pl-8 pr-2.5 text-xs font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
              />
            </div>

            {/* More Option: Icon ONLY (⋮) directly beside Search Bar */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setFinanceMoreOpen((prev) => !prev)}
                className="flex h-8 w-8 items-center justify-center rounded-xl neu-btn text-[var(--color-text-primary)] transition-all cursor-pointer"
                title="More options"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4 text-[var(--color-primary)]" />
              </button>

              {financeMoreOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 z-50 rounded-2xl neu-flat bg-[var(--neu-bg)] border border-[var(--color-border-light)]/40 p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setFinanceMoreOpen(false);
                      setExpenseCardOpen((prev) => !prev);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-primary)] hover:neu-pressed"
                  >
                    <Receipt className="h-4 w-4 text-[var(--color-primary)]" />
                    <span>Expense</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFinanceMoreOpen(false);
                      setExportModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] hover:neu-pressed"
                  >
                    <Download className="h-4 w-4 text-[var(--color-primary)]" />
                    <span>Export</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Total + Add Entry */}
          <div className="flex items-center justify-between gap-2 w-full">
            {/* Total */}
            <div className="flex items-center gap-1.5 rounded-xl neu-card px-2.5 py-1 text-[11px] font-bold shadow-sm border border-[var(--color-border-light)]/50 shrink-0">
              <span className="text-[var(--color-text-secondary)] font-extrabold uppercase text-[9px] tracking-tight">Total</span>
              <span className="text-xs font-black text-[var(--color-primary)]">{formatCurrency(expenseOverallTotal)}</span>
            </div>

            {/* Add Entry */}
            {canAddEntry ? (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1 rounded-xl neu-btn-primary px-3 py-1.5 text-xs font-bold text-white shadow-md hover:scale-[1.02] shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Entry</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1 rounded-xl neu-btn px-3 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] opacity-60 cursor-not-allowed shadow-sm shrink-0"
                title="MID Finance entry access is locked by administrator"
              >
                <Lock className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                <span>Add Entry</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop-Only Header & Top Controls (md:flex) */}
        <div className="hidden md:flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">MID Finance</h1>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-0.5">MID Finance Updated</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Search Bar */}
            <div className="relative flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-xl neu-input py-1.5 pl-8 pr-3 text-xs font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
              />
            </div>

            {/* 2. Total Option Card */}
            <div className="flex items-center gap-2 rounded-xl neu-card px-3.5 py-2 text-xs font-bold shadow-sm border border-[var(--color-border-light)]/50">
              <span className="text-[var(--color-text-secondary)] font-extrabold uppercase tracking-wider">Total</span>
              <span className="text-sm font-black text-[var(--color-primary)]">{formatCurrency(expenseOverallTotal)}</span>
            </div>

            {/* 3. Expense Option Button */}
            <button
              type="button"
              onClick={() => setExpenseCardOpen((prev) => !prev)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm',
                expenseCardOpen
                  ? 'neu-pressed text-[var(--color-primary)] font-black border border-[var(--color-primary)]/30'
                  : 'neu-btn text-[var(--color-text-primary)] hover:scale-[1.02]'
              )}
              title="Toggle Expense summary card"
            >
              <Receipt className="h-4 w-4 text-[var(--color-primary)]" />
              <span>Expense</span>
            </button>

            {/* 4. Add Entry Button */}
            {canAddEntry ? (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white transition-all shadow-md hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Entry</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-secondary)] opacity-60 cursor-not-allowed transition-all shadow-sm"
                title="MID Finance entry access is locked by administrator"
              >
                <Lock className="h-4 w-4 text-[var(--color-text-secondary)]" />
                <span>Add Entry</span>
              </button>
            )}

            {/* 5. Export Button */}
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] transition-all shadow-md hover:scale-[1.02] cursor-pointer"
              title="Export MID Finance Data"
            >
              <Download className="h-4 w-4 text-[var(--color-primary)]" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Compact Expense Summary Card */}
        {expenseCardOpen && (
          <div className="rounded-3xl neu-card p-5 border border-[var(--color-primary)]/20 shadow-md space-y-3 transition-all animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-2">
              <div className="flex items-center gap-2">
                <Receipt className="h-4.5 w-4.5 text-[var(--color-primary)]" />
                <h3 className="text-sm font-black text-[var(--color-text-primary)]">Expense Summary</h3>
              </div>
              <button
                onClick={() => setExpenseCardOpen(false)}
                className="text-[11px] font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs font-bold text-[var(--color-text-secondary)]">
              <div className="flex items-center justify-between p-2.5 rounded-xl neu-pressed">
                <span className="uppercase tracking-wider font-extrabold">Incoming Amount</span>
                <span className="text-sm font-black text-[var(--color-text-primary)]">{formatCurrency(expenseIncomingTotal)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl neu-pressed">
                <span className="uppercase tracking-wider font-extrabold">Outgoing Amount</span>
                <span className="text-sm font-black text-[var(--color-text-primary)]">{formatCurrency(expenseOutgoingTotal)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl neu-pressed border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">Total Amount</span>
                <span className="text-base font-black text-[var(--color-primary)]">{formatCurrency(expenseOverallTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* MID Finance Table Container */}
        <div className="rounded-3xl neu-card p-4 md:p-6 space-y-4">
          {isLoading ? (
            <div className="flex h-48 w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl neu-pressed p-10 text-center flex flex-col items-center justify-center min-h-[220px]">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full neu-circle text-[var(--color-primary)]">
                <IndianRupee className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">No MID finance entries yet</h3>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)] max-w-sm">
                Add your first MID finance entry to start tracking expenses.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-5 flex items-center gap-1.5 rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Entry</span>
              </button>
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--color-border-light)]/40">
                <table className="w-full text-left text-xs font-medium border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)]/50 text-[var(--color-text-tertiary)] uppercase tracking-wider font-extrabold text-[11px] border-b border-[var(--color-border-light)]/60">
                      <th className="py-3.5 px-4 w-14 text-center">S.No</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Company Name</th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4 text-right">Amount</th>
                      <th className="py-3.5 px-4 w-24 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-light)]/30 text-[var(--color-text-primary)]">
                    {entries.map((entry, idx) => {
                      const displayPerson = entry.person === 'Deepak' ? 'Incoming' : entry.person === 'Elumugam' ? 'Outgoing' : (entry.person || 'Incoming');
                      return (
                        <tr key={entry.id} className="transition-colors hover:bg-[var(--color-primary)]/5">
                          <td className="py-3.5 px-4 text-center font-extrabold text-[var(--color-text-tertiary)]">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                            {formatDateString(entry.date)}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-sm text-[var(--color-text-primary)]">
                            {entry.company_name || entry.item || '—'}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-[var(--color-text-secondary)] font-medium">
                            {entry.description || '--'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-bold">
                            <span className={cn(
                              "inline-block rounded-lg px-2.5 py-1 text-[11px] font-extrabold",
                              displayPerson === 'Incoming'
                                ? "neu-pressed text-emerald-600 dark:text-emerald-400"
                                : displayPerson === 'Outgoing'
                                ? "neu-pressed text-rose-600 dark:text-rose-400"
                                : "neu-pressed text-[var(--color-primary)]"
                            )}>
                              {displayPerson}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-sm text-[var(--color-primary)] whitespace-nowrap">
                            {formatCurrency(Number(entry.amount))}
                          </td>
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                            {(!entry.created_by || entry.created_by === user?.id || isAdmin) ? (
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Edit Button */}
                                <button
                                  onClick={() => handleOpenEdit(entry)}
                                  className="rounded-lg p-1.5 neu-btn text-green-600 hover:text-green-700 hover:bg-green-500/10 transition-colors cursor-pointer"
                                  aria-label="Edit entry"
                                  title="Edit entry"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => setDeletingEntry(entry)}
                                  className="rounded-lg p-1.5 neu-btn text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  aria-label="Delete entry"
                                  title="Delete entry"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-extrabold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                                View Only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards List (< md) */}
              <div className="block md:hidden space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
                {entries.map((entry) => {
                  const displayPerson = entry.person === 'Deepak' ? 'Incoming' : entry.person === 'Elumugam' ? 'Outgoing' : (entry.person || 'Incoming');
                  return (
                    <div
                      key={entry.id}
                      className="rounded-2xl neu-card p-3 space-y-1.5 border border-[var(--color-border-light)]/40 text-xs shadow-sm hover:border-[var(--color-primary)]/30 transition-all"
                    >
                      {/* 1. Date (DD/MM) & Action Buttons */}
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--color-text-secondary)]">
                        <span className="inline-block rounded-md neu-pressed px-2 py-0.5 text-[10px] text-[var(--color-primary)] font-mono">
                          {formatMobileDateString(entry.date)}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            onClick={() => setViewingEntry(entry)}
                            className="rounded-lg p-1 neu-btn text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors cursor-pointer"
                            title="View entry details"
                          >
                            <Eye className="h-3 w-3" />
                          </button>

                          {(!entry.created_by || entry.created_by === user?.id || isAdmin) && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(entry)}
                                className="rounded-lg p-1 neu-btn text-green-600 hover:text-green-700 hover:bg-green-500/10 transition-colors cursor-pointer"
                                title="Edit entry"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setDeletingEntry(entry)}
                                className="rounded-lg p-1 neu-btn text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Delete entry"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 2. Company Name */}
                      <div className="font-black text-sm text-[var(--color-text-primary)] tracking-tight">
                        {entry.company_name || entry.item || '—'}
                      </div>

                      {/* 3. Amount */}
                      <div className="text-sm font-black text-[var(--color-primary)]">
                        {formatCurrency(Number(entry.amount))}
                      </div>

                      {/* 4. Type & Description */}
                      <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border-light)]/30">
                        <span className={cn(
                          "inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold",
                          displayPerson === 'Incoming'
                            ? "neu-pressed text-emerald-600 dark:text-emerald-400"
                            : displayPerson === 'Outgoing'
                            ? "neu-pressed text-rose-600 dark:text-rose-400"
                            : "neu-pressed text-[var(--color-primary)]"
                        )}>
                          {displayPerson}
                        </span>
                        {entry.description && (
                          <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium truncate max-w-[150px]">
                            {entry.description}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </>
    )}
  </main>
</div>

        {/* View Finance Entry Details Read-Only Modal */}
        {viewingEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-md rounded-3xl neu-modal p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-pressed text-blue-500">
                    <Eye className="h-4.5 w-4.5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">MID Finance Details</h3>
                    <p className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Read-only entry view</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingEntry(null)}
                  className="p-1.5 rounded-full neu-circle text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs font-bold text-[var(--color-text-primary)]">
                <div className="p-3 rounded-2xl neu-pressed flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] font-extrabold">Date</span>
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">{formatDateString(viewingEntry.date)}</span>
                </div>

                <div className="p-3 rounded-2xl neu-pressed flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] font-extrabold">Company Name</span>
                  <span className="text-xs font-black text-[var(--color-primary)] truncate max-w-[200px]">{viewingEntry.company_name || viewingEntry.item || '—'}</span>
                </div>

                <div className="p-3 rounded-2xl neu-pressed flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] font-extrabold">Type</span>
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    {viewingEntry.person === 'Deepak' ? 'Incoming' : viewingEntry.person === 'Elumugam' ? 'Outgoing' : (viewingEntry.person || 'Incoming')}
                  </span>
                </div>

                <div className="p-3 rounded-2xl neu-pressed space-y-1">
                  <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] font-extrabold block">Description</span>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                    {viewingEntry.description?.trim() || 'No description provided.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl neu-pressed border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">Total Amount</span>
                  <span className="text-base font-black text-[var(--color-primary)]">{formatCurrency(Number(viewingEntry.amount))}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--color-border-light)]/40">
                <button
                  onClick={() => setViewingEntry(null)}
                  className="rounded-xl neu-btn px-5 py-2 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Entry Modal */}
        {(addModalOpen || editingEntry) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => {
                setAddModalOpen(false);
                setEditingEntry(null);
              }}
            />
            <div className="relative w-full max-w-md rounded-3xl neu-modal p-7 shadow-2xl space-y-5">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                {editingEntry ? 'Edit MID Finance Entry' : 'Add MID Finance Entry'}
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold">
                {/* Date */}
                <div>
                  <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Enter company name"
                    required
                    className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] font-semibold"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short explanation of entry (optional)"
                    className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                  />
                </div>

                {/* Person / Entry Type Dropdown */}
                <div>
                  <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Type *
                  </label>
                  <select
                    value={formData.person}
                    onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                    required
                    className="w-full rounded-xl neu-input px-3 py-2.5 text-sm text-[var(--color-text-primary)] font-semibold cursor-pointer"
                  >
                    <option value="Incoming">Incoming</option>
                    <option value="Outgoing">Outgoing</option>
                    <option value="Incoming + Outgoing">Incoming + Outgoing</option>
                  </select>
                </div>

                {/* Amount Inputs — Dynamic per Type */}
                {isBothPersons ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                          Incoming Amount (₹) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.incomingAmount}
                          onChange={(e) => setFormData({ ...formData, incomingAmount: e.target.value })}
                          placeholder="0.00"
                          required
                          className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] font-bold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                          Outgoing Amount (₹) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.outgoingAmount}
                          onChange={(e) => setFormData({ ...formData, outgoingAmount: e.target.value })}
                          placeholder="0.00"
                          required
                          className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] font-bold"
                        />
                      </div>
                    </div>
                    <div className="rounded-xl neu-pressed p-3 flex items-center justify-between text-xs font-black text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                      <span className="uppercase tracking-wider">Total</span>
                      <span className="text-base">{formatCurrency((parseFloat(formData.incomingAmount) || 0) + (parseFloat(formData.outgoingAmount) || 0))}</span>
                    </div>
                  </div>
                ) : formData.person === 'Outgoing' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Outgoing Amount (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.outgoingAmount || formData.amount}
                        onChange={(e) => setFormData({ ...formData, outgoingAmount: e.target.value, amount: e.target.value })}
                        placeholder="0.00"
                        required
                        className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] font-bold"
                      />
                    </div>
                    <div className="rounded-xl neu-pressed p-3 flex items-center justify-between text-xs font-black text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                      <span className="uppercase tracking-wider">Total</span>
                      <span className="text-base">{formatCurrency(parseFloat(formData.outgoingAmount || formData.amount) || 0)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Incoming Amount (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.incomingAmount || formData.amount}
                        onChange={(e) => setFormData({ ...formData, incomingAmount: e.target.value, amount: e.target.value })}
                        placeholder="0.00"
                        required
                        className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] font-bold"
                      />
                    </div>
                    <div className="rounded-xl neu-pressed p-3 flex items-center justify-between text-xs font-black text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                      <span className="uppercase tracking-wider">Total</span>
                      <span className="text-base">{formatCurrency(parseFloat(formData.incomingAmount || formData.amount) || 0)}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddModalOpen(false);
                      setEditingEntry(null);
                    }}
                    className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 rounded-xl neu-btn-primary px-4 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : editingEntry ? (
                      'Save Changes'
                    ) : (
                      'Add Entry'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Entry Confirmation Modal */}
        <ConfirmDialog
          open={!!deletingEntry}
          onClose={() => setDeletingEntry(null)}
          onConfirm={() => deletingEntry && deleteMutation.mutate(deletingEntry.id)}
          title="Delete MID finance entry?"
          description={`Are you sure you want to delete "${deletingEntry?.company_name || deletingEntry?.item || 'this entry'}" (${formatCurrency(Number(deletingEntry?.amount || 0))})?`}
          confirmLabel="Delete"
        />

        {/* Export Options Modal */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => !isExporting && setExportModalOpen(false)}
            />
            <div className="relative w-full max-w-sm rounded-3xl neu-modal p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-[var(--color-primary)]" />
                  <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">Export MID Finance Data</h3>
                </div>
                {!isExporting && (
                  <button
                    onClick={() => setExportModalOpen(false)}
                    className="text-xs font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Selection Mode: Date Range vs All Data */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider">
                  Select Export Range
                </label>

                <div className="grid grid-cols-2 gap-2 rounded-2xl neu-pressed p-1">
                  <button
                    type="button"
                    onClick={() => setExportMode('range')}
                    className={cn(
                      'py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center',
                      exportMode === 'range'
                        ? 'neu-active text-[var(--color-primary)] shadow-xs'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                    )}
                  >
                    Select Date Range
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportMode('all')}
                    className={cn(
                      'py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center',
                      exportMode === 'all'
                        ? 'neu-active text-[var(--color-primary)] shadow-xs'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                    )}
                  >
                    All Data
                  </button>
                </div>

                {/* Date Inputs when Date Range Mode selected */}
                {exportMode === 'range' && (
                  <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in zoom-in-95 duration-150">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-secondary)]">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-secondary)]">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="w-full rounded-xl neu-input px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs font-medium text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border-light)]/40">
                Select export format:
              </p>

              <div className="space-y-2.5">
                {/* PDF Option */}
                <button
                  type="button"
                  disabled={isExporting !== null}
                  onClick={handleExportPdf}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-2xl neu-btn text-left transition-all cursor-pointer border border-transparent hover:border-[var(--color-primary)]/30',
                    isExporting === 'pdf' && 'neu-pressed opacity-80 cursor-wait'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-red-500 bg-red-500/10">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[var(--color-text-primary)]">PDF Document</h4>
                      <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">Print-ready formatted PDF report (.pdf)</p>
                    </div>
                  </div>
                  {isExporting === 'pdf' ? (
                    <span className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                    </span>
                  ) : (
                    <Download className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                  )}
                </button>

                {/* JPG Option */}
                <button
                  type="button"
                  disabled={isExporting !== null}
                  onClick={handleExportJpg}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-2xl neu-btn text-left transition-all cursor-pointer border border-transparent hover:border-[var(--color-primary)]/30',
                    isExporting === 'jpg' && 'neu-pressed opacity-80 cursor-wait'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-blue-500 bg-blue-500/10">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[var(--color-text-primary)]">JPG Image</h4>
                      <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">High-resolution export image (.jpg)</p>
                    </div>
                  </div>
                  {isExporting === 'jpg' ? (
                    <span className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                    </span>
                  ) : (
                    <Download className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                  )}
                </button>

                {/* DOCX Option */}
                <button
                  type="button"
                  disabled={isExporting !== null}
                  onClick={handleExportDocx}
                  className={cn(
                    'w-full flex items-center justify-between p-3.5 rounded-2xl neu-btn text-left transition-all cursor-pointer border border-transparent hover:border-[var(--color-primary)]/30',
                    isExporting === 'docx' && 'neu-pressed opacity-80 cursor-wait'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-circle text-emerald-600 bg-emerald-500/10">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[var(--color-text-primary)]">Document (DOCX)</h4>
                      <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">Editable Word document (.docx)</p>
                    </div>
                  </div>
                  {isExporting === 'docx' ? (
                    <span className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                    </span>
                  ) : (
                    <Download className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
