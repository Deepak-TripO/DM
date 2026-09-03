import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFinanceEntries,
  createFinanceEntry,
  updateFinanceEntry,
  deleteFinanceEntry,
  getFinanceCategories,
  addFinanceCategory,
  deleteFinanceCategory,
  getFinanceItems,
  addFinanceItem,
  deleteFinanceItem,
  subscribeToFinanceChange,
} from '@/services/financeService';
import type { FinanceEntry } from '@/services/financeService';
import type { TaskItem } from '@/services/taskService';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { useFinanceAccess } from '@/hooks/useFinanceAccess';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Header } from '@/components/Header';
import { useAppLayout } from '@/layouts/AppLayout';
import { cn } from '@/lib/utils';
import {
  exportToPdf,
  exportToJpg,
  exportToDocx,
} from '@/utils/exportService';
import {
  Plus,
  Lock,
  Search,
  Filter,
  Pencil,
  Trash2,
  ArrowLeft,
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

interface FinanceViewProps {
  task?: TaskItem;
}

export function FinanceView({ task }: FinanceViewProps) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { canAddEntry } = useFinanceAccess();
  const { sidebarOpen, toggleSidebar, hasSidebar } = useAppLayout();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<FinanceEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<FinanceEntry | null>(null);
  const [financeMoreOpen, setFinanceMoreOpen] = useState(false);

  // Category State & Modals
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deletingCategoryName, setDeletingCategoryName] = useState<string | null>(null);

  // Item State & Modals
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [deletingItemName, setDeletingItemName] = useState<string | null>(null);

  // Query Categories
  const { data: categories = ['Software', 'Document', 'ID Card', 'Seal', 'PAN'] } = useQuery({
    queryKey: ['financeCategories'],
    queryFn: getFinanceCategories,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    item: '',
    category: 'Software',
    description: '',
    person: 'Deepak',
    amount: '',
    elumugamAmount: '',
    deepakAmount: '',
  });

  // Query Items for selected Form Category
  const { data: categoryItems = [] } = useQuery({
    queryKey: ['financeItems', formData.category],
    queryFn: () => getFinanceItems(formData.category),
    enabled: !!formData.category,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Auto-set default item when items load or category changes
  useEffect(() => {
    if (categoryItems.length > 0) {
      if (!formData.item || !categoryItems.includes(formData.item)) {
        setFormData((prev) => ({ ...prev, item: categoryItems[0] }));
      }
    } else {
      setFormData((prev) => ({ ...prev, item: '' }));
    }
  }, [formData.category, categoryItems]);

  useEffect(() => {
    const unsubscribe = subscribeToFinanceChange(() => {
      queryClient.invalidateQueries({ queryKey: ['financeEntries'] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  // Category Mutations
  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => addFinanceCategory(name),
    onSuccess: (updatedCategories, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financeCategories'] });
      setFormData((prev) => ({ ...prev, category: variables.trim() }));
      setAddCategoryModalOpen(false);
      setNewCategoryName('');
      toast.success(`Category "${variables.trim()}" added successfully`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add category');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (catName: string) => deleteFinanceCategory(catName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financeCategories'] });
      setDeletingCategoryName(null);
      if (selectedCategory === variables) {
        setSelectedCategory('All');
      }
      if (formData.category === variables) {
        setFormData((prev) => ({ ...prev, category: 'Software' }));
      }
      toast.success(`Category "${variables}" deleted successfully`);
    },
    onError: () => toast.error('Failed to delete category'),
  });

  // Item Mutations
  const addItemMutation = useMutation({
    mutationFn: (name: string) => addFinanceItem(formData.category, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financeItems', formData.category] });
      setFormData((prev) => ({ ...prev, item: variables.trim() }));
      setAddItemModalOpen(false);
      setNewItemName('');
      toast.success(`Item "${variables.trim()}" added to ${formData.category}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add item');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemName: string) => deleteFinanceItem(formData.category, itemName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financeItems', formData.category] });
      setDeletingItemName(null);
      toast.success(`Item "${variables}" deleted successfully`);
    },
    onError: () => toast.error('Failed to delete item'),
  });

  const taskId = task?.id || 'finance';

  // Query Finance entries from Supabase
  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['financeEntries', taskId, searchQuery, selectedCategory],
    queryFn: () => getFinanceEntries(taskId, searchQuery, selectedCategory),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Automatically refetch latest Finance records whenever location changes (e.g. user returns to Home)
  useEffect(() => {
    refetch();
  }, [location.pathname, taskId, refetch]);

  const [expenseCardOpen, setExpenseCardOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'jpg' | 'docx' | null>(null);

  const handleExportPdf = async () => {
    setIsExporting('pdf');
    try {
      await exportToPdf(entries, {
        deepakTotal: expenseDeepakTotal,
        elumugamTotal: expenseElumugamTotal,
        overallTotal: expenseOverallTotal,
      });
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
    setIsExporting('jpg');
    try {
      await exportToJpg(entries, {
        deepakTotal: expenseDeepakTotal,
        elumugamTotal: expenseElumugamTotal,
        overallTotal: expenseOverallTotal,
      });
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
    setIsExporting('docx');
    try {
      await exportToDocx(entries, {
        deepakTotal: expenseDeepakTotal,
        elumugamTotal: expenseElumugamTotal,
        overallTotal: expenseOverallTotal,
      });
      toast.success('Document generated and downloaded successfully!');
      setExportModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Document. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  // Calculate Expense amounts (Deepak Amount, Elumugam Amount, Total Amount)
  const { expenseDeepakTotal, expenseElumugamTotal, expenseOverallTotal } = useMemo(() => {
    let deepak = 0;
    let elumugam = 0;

    entries.forEach((entry) => {
      const amt = Number(entry.amount) || 0;
      const p = (entry.person || '').trim();

      if (entry.deepak_amount != null || entry.elumugam_amount != null) {
        deepak += Number(entry.deepak_amount) || 0;
        elumugam += Number(entry.elumugam_amount) || 0;
      } else if (p === 'Deepak') {
        deepak += amt;
      } else if (p === 'Elumugam') {
        elumugam += amt;
      } else if (p === 'Elumugam+Deepak' || p === 'Elumugam + Deepak') {
        deepak += amt / 2;
        elumugam += amt / 2;
      }
    });

    return {
      expenseDeepakTotal: deepak,
      expenseElumugamTotal: elumugam,
      expenseOverallTotal: deepak + elumugam,
    };
  }, [entries]);

  // Entry Mutations
  const createMutation = useMutation({
    mutationFn: (newEntry: Omit<FinanceEntry, 'id' | 'created_at' | 'updated_at'>) =>
      createFinanceEntry(newEntry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeEntries'] });
      setAddModalOpen(false);
      resetForm();
      toast.success('Finance entry added successfully');
    },
    onError: () => toast.error('Failed to add finance entry'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FinanceEntry> }) =>
      updateFinanceEntry(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeEntries'] });
      setEditingEntry(null);
      resetForm();
      toast.success('Finance entry updated successfully');
    },
    onError: () => toast.error('Failed to update finance entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinanceEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeEntries'] });
      setDeletingEntry(null);
      toast.success('Finance entry deleted successfully');
    },
    onError: () => toast.error('Failed to delete finance entry'),
  });

  const resetForm = () => {
    const defaultCat = 'Software';
    const defaultItems = categoryItems.length > 0 ? categoryItems : ['Renewal (KVM1) VPS'];
    setFormData({
      date: new Date().toISOString().split('T')[0],
      item: defaultItems[0] || 'Renewal (KVM1) VPS',
      category: defaultCat,
      description: '',
      person: 'Deepak',
      amount: '',
      elumugamAmount: '',
      deepakAmount: '',
    });
  };

  const handleOpenAdd = () => {
    if (!canAddEntry) {
      toast.error('Finance entry access is locked by administrator.');
      return;
    }
    resetForm();
    setAddModalOpen(true);
  };

  const handleOpenEdit = (entry: FinanceEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      item: entry.item,
      category: entry.category || 'Software',
      description: entry.description || '',
      person: entry.person || 'Deepak',
      amount: String(entry.amount || ''),
      elumugamAmount: entry.elumugam_amount != null ? String(entry.elumugam_amount) : '',
      deepakAmount: entry.deepak_amount != null ? String(entry.deepak_amount) : '',
    });
  };

  const isBothPersons = formData.person === 'Elumugam+Deepak' || formData.person === 'Elumugam + Deepak';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry && !canAddEntry) {
      toast.error('Finance entry access is locked by administrator.');
      return;
    }
    if (!formData.item.trim() || !formData.person.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    let finalTotal = 0;
    let finalElumugamAmt: number | null = null;
    let finalDeepakAmt: number | null = null;

    if (isBothPersons) {
      if (!formData.elumugamAmount || !formData.deepakAmount) {
        toast.error('Please enter both Elumugam and Deepak amounts.');
        return;
      }
      const eVal = parseFloat(formData.elumugamAmount);
      const dVal = parseFloat(formData.deepakAmount);
      if (isNaN(eVal) || eVal < 0 || isNaN(dVal) || dVal < 0) {
        toast.error('Please enter valid non-negative amounts.');
        return;
      }
      finalElumugamAmt = eVal;
      finalDeepakAmt = dVal;
      finalTotal = eVal + dVal;
    } else if (formData.person === 'Elumugam') {
      const val = parseFloat(formData.elumugamAmount || formData.amount);
      if (isNaN(val) || val < 0) {
        toast.error('Please enter a valid amount.');
        return;
      }
      finalElumugamAmt = val;
      finalTotal = val;
    } else {
      const val = parseFloat(formData.deepakAmount || formData.amount);
      if (isNaN(val) || val < 0) {
        toast.error('Please enter a valid amount.');
        return;
      }
      finalDeepakAmt = val;
      finalTotal = val;
    }

    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        updates: {
          date: formData.date,
          item: formData.item.trim(),
          category: formData.category,
          description: formData.description.trim(),
          person: formData.person.trim(),
          amount: finalTotal,
          elumugam_amount: finalElumugamAmt,
          deepak_amount: finalDeepakAmt,
        },
      });
    } else {
      createMutation.mutate({
        task_id: taskId,
        date: formData.date,
        item: formData.item.trim(),
        category: formData.category,
        description: formData.description.trim(),
        person: formData.person.trim(),
        amount: finalTotal,
        elumugam_amount: finalElumugamAmt,
        deepak_amount: finalDeepakAmt,
        created_by: user?.id,
      });
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Category name cannot be empty');
      return;
    }
    const isDuplicate = categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      toast.error('Category already exists.');
      return;
    }
    addCategoryMutation.mutate(trimmed);
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed) {
      toast.error('Item name cannot be empty');
      return;
    }
    const isDuplicate = categoryItems.some((i) => i.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      toast.error('Item already exists in this category.');
      return;
    }
    addItemMutation.mutate(trimmed);
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

  const numAmount = parseFloat(formData.amount) || 0;
  const isSplitPerson = formData.person === 'Elumugam + Deepak';
  const splitAmountHalf = numAmount / 2;

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header onLogoClick={hasSidebar ? toggleSidebar : undefined} sidebarOpen={sidebarOpen} />
      <div className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Mobile-Only Header & Controls (< md) */}
      <div className="block md:hidden space-y-3">
        {/* Finance Header Title */}
        <h1 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">
          Finance
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

        {/* Row 2: Total + Category + Add Entry */}
        <div className="flex items-center justify-between gap-1.5 w-full">
          {/* Total */}
          <div className="flex items-center gap-1 rounded-xl neu-card px-2 py-1 text-[11px] font-bold shadow-sm border border-[var(--color-border-light)]/50 shrink-0">
            <span className="text-[var(--color-text-secondary)] font-extrabold uppercase text-[9px] tracking-tight">Total</span>
            <span className="text-xs font-black text-[var(--color-primary)]">{formatCurrency(expenseOverallTotal)}</span>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1 neu-card rounded-xl px-1.5 py-1 shadow-sm border border-[var(--color-border-light)]/50 shrink-0 max-w-[110px]">
            <Filter className="h-3 w-3 text-[var(--color-primary)] shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent py-0.5 pr-1 text-[11px] font-extrabold text-[var(--color-text-primary)] focus:outline-none cursor-pointer truncate w-full"
            >
              <option value="All">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Add Entry */}
          {canAddEntry ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1 rounded-xl neu-btn-primary px-2.5 py-1 text-[11px] font-bold text-white shadow-md hover:scale-[1.02] shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Entry</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1 rounded-xl neu-btn px-2.5 py-1 text-[11px] font-bold text-[var(--color-text-secondary)] opacity-60 cursor-not-allowed shadow-sm shrink-0"
              title="Finance entry access is locked by administrator"
            >
              <Lock className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
              <span>Add Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop-Only Header & Top Controls (md:flex / strictly unchanged) */}
      <div className="hidden md:flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">Finance</h1>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-0.5">Finance Updated</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Search Bar (slightly decreased size) */}
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

          {/* 4. Category Filter */}
          <div className="flex items-center gap-1.5 neu-card rounded-2xl p-1.5 shadow-sm border border-[var(--color-border-light)]/50">
            <Filter className="ml-2 h-3.5 w-3.5 text-[var(--color-primary)]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent py-1 pr-2 text-xs font-extrabold text-[var(--color-text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setDeletingCategoryName(selectedCategory)}
                className="p-1 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                title={`Delete ${selectedCategory} category`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 5. Add Entry Button */}
          {canAddEntry ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white transition-all shadow-md hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              <span>Add Entry</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-secondary)] opacity-60 cursor-not-allowed transition-all shadow-sm"
              title="Finance entry access is locked by administrator"
            >
              <Lock className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <span>Add Entry</span>
            </button>
          )}

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] transition-all shadow-md hover:scale-[1.02] cursor-pointer"
            title="Export Finance Data"
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
              <span className="uppercase tracking-wider font-extrabold">Deepak Amount</span>
              <span className="text-sm font-black text-[var(--color-text-primary)]">{formatCurrency(expenseDeepakTotal)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl neu-pressed">
              <span className="uppercase tracking-wider font-extrabold">Elumugam Amount</span>
              <span className="text-sm font-black text-[var(--color-text-primary)]">{formatCurrency(expenseElumugamTotal)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl neu-pressed border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">Total Amount</span>
              <span className="text-base font-black text-[var(--color-primary)]">{formatCurrency(expenseOverallTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Finance Table Container */}
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
            <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">No finance entries yet</h3>
            <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)] max-w-sm">
              Add your first finance entry to start tracking expenses.
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
            {/* Desktop View Table (hidden md:block / strictly unchanged) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--color-border-light)]/40">
              <table className="w-full text-left text-xs font-medium border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--color-surface-secondary)]/50 text-[var(--color-text-tertiary)] uppercase tracking-wider font-extrabold text-[11px] border-b border-[var(--color-border-light)]/60">
                    <th className="py-3.5 px-4 w-14 text-center">S.No</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Person</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]/30 text-[var(--color-text-primary)]">
                  {entries.map((entry, idx) => (
                    <tr key={entry.id} className="transition-colors hover:bg-[var(--color-primary)]/5">
                      <td className="py-3.5 px-4 text-center font-extrabold text-[var(--color-text-tertiary)]">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                        {formatDateString(entry.date)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-sm text-[var(--color-text-primary)]">
                        {entry.item}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block rounded-lg neu-pressed px-2.5 py-1 text-[11px] font-extrabold text-[var(--color-primary)]">
                          {entry.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-[var(--color-text-secondary)] font-medium">
                        {entry.description || '--'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--color-text-primary)]">
                        {entry.person}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-sm text-[var(--color-primary)] whitespace-nowrap">
                        {formatCurrency(Number(entry.amount))}
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {(!entry.created_by || entry.created_by === user?.id || isAdmin) ? (
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Edit Button: Green */}
                            <button
                              onClick={() => handleOpenEdit(entry)}
                              className="rounded-lg p-1.5 neu-btn text-green-600 hover:text-green-700 hover:bg-green-500/10 transition-colors"
                              aria-label="Edit entry"
                              title="Edit entry"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete Button: Red */}
                            <button
                              onClick={() => setDeletingEntry(entry)}
                              className="rounded-lg p-1.5 neu-btn text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards List (< md / Order: 1. Date (DD/MM), 2. Item, 3. Amount, 4. Person) */}
            <div className="block md:hidden space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
              {entries.map((entry) => (
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
                        className="rounded-lg p-1 neu-btn text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                        title="View entry details"
                      >
                        <Eye className="h-3 w-3" />
                      </button>

                      {(!entry.created_by || entry.created_by === user?.id || isAdmin) && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(entry)}
                            className="rounded-lg p-1 neu-btn text-green-600 hover:text-green-700 hover:bg-green-500/10 transition-colors"
                            title="Edit entry"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setDeletingEntry(entry)}
                            className="rounded-lg p-1 neu-btn text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 2. Item */}
                  <div className="font-black text-sm text-[var(--color-text-primary)] tracking-tight">
                    {entry.item}
                  </div>

                  {/* 3. Amount */}
                  <div className="text-sm font-black text-[var(--color-primary)]">
                    {formatCurrency(Number(entry.amount))}
                  </div>

                  {/* 4. Person */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border-light)]/30">
                    <span>{entry.person}</span>
                    {entry.category && (
                      <span className="text-[10px] text-[var(--color-text-tertiary)] font-semibold">
                        {entry.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View Finance Entry Details Read-Only Modal */}
      {viewingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl neu-pressed text-blue-500">
                  <Eye className="h-4.5 w-4.5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">Finance Details</h3>
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

            {/* Details Fields */}
            <div className="space-y-2.5 text-xs font-bold text-[var(--color-text-primary)]">
              {/* Date */}
              <div className="p-3 rounded-2xl neu-pressed flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] font-extrabold">Date</span>
                <span className="text-xs font-bold text-[var(--color-text-primary)]">{formatDateString(viewingEntry.date)}</span>
              </div>

              {/* Item */}
              <div className="p-3 rounded-2xl neu-pressed flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] font-extrabold">Item</span>
                <span className="text-xs font-black text-[var(--color-primary)] truncate max-w-[200px]">{viewingEntry.item}</span>
              </div>

              {/* Category */}
              <div className="p-3 rounded-2xl neu-pressed flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] font-extrabold">Category</span>
                <span className="inline-block rounded-lg neu-flat px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--color-primary)]">
                  {viewingEntry.category || 'Software'}
                </span>
              </div>

              {/* Description */}
              <div className="p-3 rounded-2xl neu-pressed space-y-1">
                <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] font-extrabold block">Description</span>
                <p className="text-xs font-semibold text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                  {viewingEntry.description?.trim() || 'No description provided.'}
                </p>
              </div>

              {/* Person */}
              <div className="p-3 rounded-2xl neu-pressed flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] font-extrabold">Person</span>
                <span className="text-xs font-bold text-[var(--color-text-primary)]">{viewingEntry.person}</span>
              </div>

              {/* Amount */}
              <div className="p-3.5 rounded-2xl neu-pressed border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">Total Amount</span>
                <span className="text-base font-black text-[var(--color-primary)]">{formatCurrency(Number(viewingEntry.amount))}</span>
              </div>
            </div>

            {/* Footer */}
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
              {editingEntry ? 'Edit Finance Entry' : 'Add Finance Entry'}
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

              {/* Category Dropdown */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Category *
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAddCategoryModalOpen(true)}
                      className="flex items-center gap-1 rounded-lg neu-btn px-2 py-1 text-[11px] font-bold text-[var(--color-primary)] hover:scale-[1.02]"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add</span>
                    </button>
                    {formData.category && (
                      <button
                        type="button"
                        onClick={() => setDeletingCategoryName(formData.category)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                        title="Delete selected category"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl neu-input px-3 py-2.5 text-sm text-[var(--color-text-primary)] font-semibold"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Dropdown (Dynamic based on Category) */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Item Name *
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAddItemModalOpen(true)}
                      className="flex items-center gap-1 rounded-lg neu-btn px-2 py-1 text-[11px] font-bold text-[var(--color-primary)] hover:scale-[1.02]"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add</span>
                    </button>
                    {formData.item && (
                      <button
                        type="button"
                        onClick={() => setDeletingItemName(formData.item)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                        title="Delete selected item"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                {categoryItems.length > 0 ? (
                  <select
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    required
                    className="w-full rounded-xl neu-input px-3 py-2.5 text-sm text-[var(--color-text-primary)] font-semibold"
                  >
                    {categoryItems.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={formData.item}
                      onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                      placeholder="Type custom item name"
                      required
                      className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                    />
                  </div>
                )}
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
                  placeholder="Short explanation of entry"
                  className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                />
              </div>

              {/* Person Dropdown */}
              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Person *
                </label>
                <select
                  value={formData.person}
                  onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                  required
                  className="w-full rounded-xl neu-input px-3 py-2.5 text-sm text-[var(--color-text-primary)] font-semibold"
                >
                  <option value="Deepak">Deepak</option>
                  <option value="Elumugam">Elumugam</option>
                  <option value="Elumugam+Deepak">Elumugam+Deepak</option>
                </select>
              </div>

              {/* Amount Inputs — Dynamic per Person */}
              {isBothPersons ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Elumugam Amount (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.elumugamAmount}
                        onChange={(e) => setFormData({ ...formData, elumugamAmount: e.target.value })}
                        placeholder="0.00"
                        required
                        className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] font-bold"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Deepak Amount (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.deepakAmount}
                        onChange={(e) => setFormData({ ...formData, deepakAmount: e.target.value })}
                        placeholder="0.00"
                        required
                        className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] font-bold"
                      />
                    </div>
                  </div>
                  <div className="rounded-xl neu-pressed p-3 flex items-center justify-between text-xs font-black text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    <span className="uppercase tracking-wider">Total</span>
                    <span className="text-base">{formatCurrency((parseFloat(formData.elumugamAmount) || 0) + (parseFloat(formData.deepakAmount) || 0))}</span>
                  </div>
                </div>
              ) : formData.person === 'Elumugam' ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Elumugam Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.elumugamAmount || formData.amount}
                      onChange={(e) => setFormData({ ...formData, elumugamAmount: e.target.value, amount: e.target.value })}
                      placeholder="0.00"
                      required
                      className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] font-bold"
                    />
                  </div>
                  <div className="rounded-xl neu-pressed p-3 flex items-center justify-between text-xs font-black text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    <span className="uppercase tracking-wider">Total</span>
                    <span className="text-base">{formatCurrency(parseFloat(formData.elumugamAmount || formData.amount) || 0)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Deepak Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.deepakAmount || formData.amount}
                      onChange={(e) => setFormData({ ...formData, deepakAmount: e.target.value, amount: e.target.value })}
                      placeholder="0.00"
                      required
                      className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] font-bold"
                    />
                  </div>
                  <div className="rounded-xl neu-pressed p-3 flex items-center justify-between text-xs font-black text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    <span className="uppercase tracking-wider">Total</span>
                    <span className="text-base">{formatCurrency(parseFloat(formData.deepakAmount || formData.amount) || 0)}</span>
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
                  className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 rounded-xl neu-btn-primary px-4 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60"
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

      {/* Add Category Modal */}
      {addCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => {
              setAddCategoryModalOpen(false);
              setNewCategoryName('');
            }}
          />
          <div className="relative w-full max-w-sm rounded-3xl neu-modal p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
              Add Category
            </h3>
            <form onSubmit={handleAddCategorySubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="mb-1.5 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  autoFocus
                  required
                  className="w-full rounded-xl neu-input px-3.5 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAddCategoryModalOpen(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCategoryMutation.isPending || !newCategoryName.trim()}
                  className="flex-1 rounded-xl neu-btn-primary px-4 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60"
                >
                  {addCategoryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'Add'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {addItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => {
              setAddItemModalOpen(false);
              setNewItemName('');
            }}
          />
          <div className="relative w-full max-w-sm rounded-3xl neu-modal p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
              Add Item to {formData.category}
            </h3>
            <form onSubmit={handleAddItemSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="mb-1.5 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Item Name
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter item name"
                  autoFocus
                  required
                  className="w-full rounded-xl neu-input px-3.5 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAddItemModalOpen(false);
                    setNewItemName('');
                  }}
                  className="flex-1 rounded-xl neu-btn px-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addItemMutation.isPending || !newItemName.trim()}
                  className="flex-1 rounded-xl neu-btn-primary px-4 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60"
                >
                  {addItemMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'Add Item'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingCategoryName}
        onClose={() => setDeletingCategoryName(null)}
        onConfirm={() => deletingCategoryName && deleteCategoryMutation.mutate(deletingCategoryName)}
        title="Delete category?"
        description={`Are you sure you want to delete the category "${deletingCategoryName}"? Existing finance records will not be deleted.`}
        confirmLabel="Delete"
      />

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingItemName}
        onClose={() => setDeletingItemName(null)}
        onConfirm={() => deletingItemName && deleteItemMutation.mutate(deletingItemName)}
        title="Delete item?"
        description={`Are you sure you want to delete the item "${deletingItemName}" from ${formData.category}? Existing finance records will not be deleted.`}
        confirmLabel="Delete"
      />

      {/* Delete Entry Confirmation Modal */}
      <ConfirmDialog
        open={!!deletingEntry}
        onClose={() => setDeletingEntry(null)}
        onConfirm={() => deletingEntry && deleteMutation.mutate(deletingEntry.id)}
        title="Delete finance entry?"
        description={`Are you sure you want to delete "${deletingEntry?.item}" (${formatCurrency(Number(deletingEntry?.amount || 0))})?`}
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
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">Export Finance Data</h3>
              </div>
              {!isExporting && (
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="text-xs font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>

            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              Choose a format to export the complete Finance dataset:
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
    </div>
  );
}
