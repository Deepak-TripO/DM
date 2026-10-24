import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type MidFinanceProject,
  updateMidFinanceProjectTotalAmount,
  getMidFinancePaymentSchedules,
  createMidFinancePaymentSchedule,
  updateMidFinancePaymentSchedule,
  deleteMidFinancePaymentSchedule,
  type MidFinancePaymentSchedule,
  getMidFinanceDocuments,
  uploadMidFinanceDocument,
  deleteMidFinanceDocument,
  type MidFinanceDocument,
  getMidFinanceInvoices,
  uploadMidFinanceInvoice,
  deleteMidFinanceInvoice,
  type MidFinanceInvoice,
  getMidFinanceProjectExpenses,
  createMidFinanceProjectExpense,
  updateMidFinanceProjectExpense,
  deleteMidFinanceProjectExpense,
  type MidFinanceProjectExpense,
} from '@/services/midFinanceProjectService';
import { formatDate, formatBytes } from '@/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  FileSpreadsheet,
  Receipt,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  X,
  Eye,
  IndianRupee,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

const MID_PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Card',
  'Cheque',
  'Net Banking',
  'Other',
] as const;

interface MidFinanceProjectDetailViewProps {
  project: MidFinanceProject;
  onBack: () => void;
}

type DetailTab = 'overview' | 'payments' | 'documents' | 'invoices' | 'expenses';

export function MidFinanceProjectDetailView({
  project,
  onBack,
}: MidFinanceProjectDetailViewProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  // Total Amount State & Mutation
  const [projectTotalAmount, setProjectTotalAmount] = useState(String(project.total_amount || ''));
  const [isEditingTotal, setIsEditingTotal] = useState(false);

  // Queries
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['midFinancePayments', project.id],
    queryFn: () => getMidFinancePaymentSchedules(project.id),
  });

  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['midFinanceDocs', project.id],
    queryFn: () => getMidFinanceDocuments(project.id),
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['midFinanceInvoices', project.id],
    queryFn: () => getMidFinanceInvoices(project.id),
  });

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['midFinanceExpenses', project.id],
    queryFn: () => getMidFinanceProjectExpenses(project.id),
  });

  // Financial Calculations
  const {
    totalScheduledAmount,
    totalPaidAmount,
    remainingScheduledAmount,
    totalExpensesAmount,
  } = useMemo(() => {
    let scheduled = 0;
    let paid = 0;
    let expenseTotal = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      scheduled += amt;
      if (p.status === 'Paid') {
        paid += amt;
      }
    });

    expenses.forEach((e) => {
      expenseTotal += Number(e.amount) || 0;
    });

    const projectTotal = parseFloat(projectTotalAmount) || project.total_amount || 0;
    const remaining = Math.max(0, projectTotal - paid);

    return {
      totalScheduledAmount: scheduled,
      totalPaidAmount: paid,
      remainingScheduledAmount: remaining,
      totalExpensesAmount: expenseTotal,
    };
  }, [payments, expenses, projectTotalAmount, project.total_amount]);

  // Update Total Amount Mutation
  const updateTotalAmountMutation = useMutation({
    mutationFn: (newAmount: number) =>
      updateMidFinanceProjectTotalAmount(project.id, newAmount),
    onSuccess: (_, newAmount) => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceProjects'] });
      setIsEditingTotal(false);
      toast.success(`Total project amount updated to ${formatCurrency(newAmount)}`);
    },
    onError: () => toast.error('Failed to update total project amount'),
  });

  const handleSaveTotalAmount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(projectTotalAmount);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid non-negative amount');
      return;
    }
    updateTotalAmountMutation.mutate(val);
  };

  // Payment Schedule Modals & State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<MidFinancePaymentSchedule | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<MidFinancePaymentSchedule | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    status: 'Pending' as 'Pending' | 'Paid' | 'Overdue',
    payment_method: '',
    payment_method_custom: '',
    notes: '',
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(paymentForm.amount);
      if (isNaN(amt) || amt < 0) {
        throw new Error('Please enter a valid amount.');
      }
      if (paymentForm.status === 'Paid') {
        if (!paymentForm.payment_method) {
          throw new Error('Please select a payment method.');
        }
        if (paymentForm.payment_method === 'Other' && !paymentForm.payment_method_custom.trim()) {
          throw new Error('Please specify the payment method.');
        }
      }

      const methodVal = paymentForm.status === 'Paid' ? paymentForm.payment_method : undefined;
      const customVal = (paymentForm.status === 'Paid' && paymentForm.payment_method === 'Other')
        ? paymentForm.payment_method_custom.trim()
        : undefined;

      if (editingPayment) {
        await updateMidFinancePaymentSchedule(editingPayment.id, {
          title: paymentForm.title.trim(),
          date: paymentForm.date,
          amount: amt,
          status: paymentForm.status,
          payment_method: methodVal,
          payment_method_custom: customVal,
          notes: paymentForm.notes.trim() || undefined,
        });
      } else {
        await createMidFinancePaymentSchedule({
          project_id: project.id,
          title: paymentForm.title.trim(),
          date: paymentForm.date,
          amount: amt,
          status: paymentForm.status,
          payment_method: methodVal,
          payment_method_custom: customVal,
          notes: paymentForm.notes.trim() || undefined,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinancePayments', project.id] });
      setPaymentModalOpen(false);
      setEditingPayment(null);
      toast.success(editingPayment ? 'Payment schedule updated' : 'Payment schedule added');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to save payment schedule'),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => deleteMidFinancePaymentSchedule(id, project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinancePayments', project.id] });
      setDeletingPayment(null);
      toast.success('Payment schedule deleted');
    },
    onError: () => toast.error('Failed to delete payment schedule'),
  });

  // Document Upload State & Modals
  const [deletingDoc, setDeletingDoc] = useState<MidFinanceDocument | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size must be less than 25MB');
      return;
    }

    setIsUploadingDoc(true);
    try {
      await uploadMidFinanceDocument(project.id, file);
      queryClient.invalidateQueries({ queryKey: ['midFinanceDocs', project.id] });
      toast.success(`Document "${file.name}" uploaded successfully`);
    } catch {
      toast.error('Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  const deleteDocMutation = useMutation({
    mutationFn: (id: string) => deleteMidFinanceDocument(id, project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceDocs', project.id] });
      setDeletingDoc(null);
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  // Invoice Upload State & Modals
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<MidFinanceInvoice | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    amount: '',
  });

  const invoiceMutation = useMutation({
    mutationFn: async () => {
      if (!invoiceFile) throw new Error('Please select an invoice file');
      return uploadMidFinanceInvoice(project.id, invoiceFile, {
        invoice_date: invoiceForm.invoice_date,
        amount: parseFloat(invoiceForm.amount) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceInvoices', project.id] });
      setInvoiceModalOpen(false);
      setInvoiceFile(null);
      setInvoiceForm({
        invoice_date: new Date().toISOString().split('T')[0],
        amount: '',
      });
      toast.success('Invoice uploaded successfully');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to upload invoice'),
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => deleteMidFinanceInvoice(id, project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceInvoices', project.id] });
      setDeletingInvoice(null);
      toast.success('Invoice deleted');
    },
    onError: () => toast.error('Failed to delete invoice'),
  });

  // Expense Breakdown State & Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MidFinanceProjectExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<MidFinanceProjectExpense | null>(null);
  const [expenseReceiptFile, setExpenseReceiptFile] = useState<File | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
  });

  const expenseMutation = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(expenseForm.amount);
      if (isNaN(amt) || amt < 0) {
        throw new Error('Please enter a valid amount.');
      }
      if (editingExpense) {
        await updateMidFinanceProjectExpense(
          editingExpense.id,
          {
            title: expenseForm.title.trim(),
            category: editingExpense.category || 'General',
            description: expenseForm.description.trim() || undefined,
            date: expenseForm.date,
            amount: amt,
          },
          expenseReceiptFile || undefined
        );
      } else {
        await createMidFinanceProjectExpense(
          {
            project_id: project.id,
            title: expenseForm.title.trim(),
            category: 'General',
            description: expenseForm.description.trim() || undefined,
            date: expenseForm.date,
            amount: amt,
          },
          expenseReceiptFile || undefined
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceExpenses', project.id] });
      setExpenseModalOpen(false);
      setEditingExpense(null);
      setExpenseReceiptFile(null);
      toast.success(editingExpense ? 'Expense updated' : 'Expense recorded');
    },
    onError: () => toast.error('Failed to save expense'),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => deleteMidFinanceProjectExpense(id, project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['midFinanceExpenses', project.id] });
      setDeletingExpense(null);
      toast.success('Expense deleted');
    },
    onError: () => toast.error('Failed to delete expense'),
  });

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const [mobileActionMenuOpen, setMobileActionMenuOpen] = useState(false);

  const handleOpenAddSchedule = () => {
    setMobileActionMenuOpen(false);
    setEditingPayment(null);
    setPaymentForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      status: 'Pending',
      payment_method: '',
      payment_method_custom: '',
      notes: '',
    });
    setPaymentModalOpen(true);
  };

  const handleOpenAddExpense = () => {
    setMobileActionMenuOpen(false);
    setEditingExpense(null);
    setExpenseReceiptFile(null);
    setExpenseForm({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
    });
    setExpenseModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border-light)]/40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            title="Back to Projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            {project.company_logo ? (
              <img
                src={project.company_logo}
                alt={project.company_name}
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl object-cover neu-flat bg-white p-1 border border-[var(--color-border-light)]/40"
              />
            ) : (
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl neu-circle bg-[#F3E8FF] text-[#8B5CF6] font-black text-sm">
                {project.company_name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider">
                  {project.company_name}
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                  &middot; Created {formatDate(project.created_at)}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-[var(--color-text-primary)] tracking-tight">
                {project.project_name}
              </h1>
            </div>
          </div>
        </div>

        {/* Quick Entry Indicator */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-xl neu-card px-3 py-1.5 text-xs font-bold border border-[#8B5CF6]/30 bg-[#F3E8FF]/20 text-[#8B5CF6]">
            <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
            <span className="text-[11px]">Project Entry Active</span>
          </div>
        </div>
      </div>

      {/* Financial Summary Dashboard (5 KPI Cards) - Compact on Mobile, Full on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3.5">
        {/* 1. Total Project Amount */}
        <div className="rounded-xl sm:rounded-2xl neu-card p-2.5 sm:p-4 space-y-0.5 sm:space-y-1 border border-[#8B5CF6]/20">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-tight sm:tracking-wider">
            <span className="truncate">Project Total</span>
            <button
              onClick={() => setIsEditingTotal(true)}
              className="text-[#8B5CF6] hover:underline text-[9px] sm:text-[10px] font-bold cursor-pointer shrink-0 ml-1"
            >
              Edit
            </button>
          </div>
          <p className="text-xs sm:text-base lg:text-lg font-black text-[#8B5CF6] truncate" title={formatCurrency(parseFloat(projectTotalAmount) || project.total_amount)}>
            {formatCurrency(parseFloat(projectTotalAmount) || project.total_amount)}
          </p>
        </div>

        {/* 2. Total Scheduled Payments */}
        <div className="rounded-xl sm:rounded-2xl neu-card p-2.5 sm:p-4 space-y-0.5 sm:space-y-1">
          <p className="text-[10px] sm:text-[11px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-tight sm:tracking-wider truncate">
            Total Scheduled
          </p>
          <p className="text-xs sm:text-base lg:text-lg font-black text-[var(--color-text-primary)] truncate" title={formatCurrency(totalScheduledAmount)}>
            {formatCurrency(totalScheduledAmount)}
          </p>
        </div>

        {/* 3. Total Paid Amount */}
        <div className="rounded-xl sm:rounded-2xl neu-card p-2.5 sm:p-4 space-y-0.5 sm:space-y-1 border border-emerald-500/20">
          <p className="text-[10px] sm:text-[11px] font-extrabold text-emerald-600 uppercase tracking-tight sm:tracking-wider truncate">
            Total Paid
          </p>
          <p className="text-xs sm:text-base lg:text-lg font-black text-emerald-600 truncate" title={formatCurrency(totalPaidAmount)}>
            {formatCurrency(totalPaidAmount)}
          </p>
        </div>

        {/* 4. Remaining Balance */}
        <div className="rounded-xl sm:rounded-2xl neu-card p-2.5 sm:p-4 space-y-0.5 sm:space-y-1 border border-amber-500/20">
          <p className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 uppercase tracking-tight sm:tracking-wider truncate">
            Remaining
          </p>
          <p className="text-xs sm:text-base lg:text-lg font-black text-amber-600 truncate" title={formatCurrency(remainingScheduledAmount)}>
            {formatCurrency(remainingScheduledAmount)}
          </p>
        </div>

        {/* 5. Total Expenses */}
        <div className="rounded-xl sm:rounded-2xl neu-card p-2.5 sm:p-4 space-y-0.5 sm:space-y-1 border border-red-500/20 col-span-2 lg:col-span-1">
          <p className="text-[10px] sm:text-[11px] font-extrabold text-red-500 uppercase tracking-tight sm:tracking-wider truncate">
            Total Expenses
          </p>
          <p className="text-xs sm:text-base lg:text-lg font-black text-red-500 truncate" title={formatCurrency(totalExpensesAmount)}>
            {formatCurrency(totalExpensesAmount)}
          </p>
        </div>
      </div>

      {/* Edit Total Amount Form Drawer/Inline */}
      {isEditingTotal && (
        <form
          onSubmit={handleSaveTotalAmount}
          className="rounded-2xl neu-card p-4 flex flex-col sm:flex-row items-center gap-3 border border-[#8B5CF6]/40 bg-[#F3E8FF]/10 animate-in fade-in duration-150"
        >
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Update Total Project Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={projectTotalAmount}
              onChange={(e) => setProjectTotalAmount(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
              className="w-full rounded-xl neu-input px-3 py-2 text-sm font-black text-[var(--color-text-primary)]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto self-end">
            <button
              type="submit"
              disabled={updateTotalAmountMutation.isPending}
              className="flex-1 sm:flex-initial rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-60 cursor-pointer"
            >
              {updateTotalAmountMutation.isPending ? 'Saving...' : 'Save Amount'}
            </button>
            <button
              type="button"
              onClick={() => {
                setProjectTotalAmount(String(project.total_amount));
                setIsEditingTotal(false);
              }}
              className="flex-1 sm:flex-initial rounded-xl neu-btn px-3 py-2 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Navigation Pills / Sections Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'overview'
              ? 'neu-pressed text-[#8B5CF6] font-extrabold border border-[#8B5CF6]/30 bg-[#F3E8FF]/20 shadow-xs'
              : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Financial Entry Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'payments'
              ? 'neu-pressed text-[#8B5CF6] font-extrabold border border-[#8B5CF6]/30 bg-[#F3E8FF]/20 shadow-xs'
              : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          <CreditCard className="h-4 w-4" />
          <span>Payment Schedule ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'documents'
              ? 'neu-pressed text-[#8B5CF6] font-extrabold border border-[#8B5CF6]/30 bg-[#F3E8FF]/20 shadow-xs'
              : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          <FileText className="h-4 w-4" />
          <span>Documents ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'invoices'
              ? 'neu-pressed text-[#8B5CF6] font-extrabold border border-[#8B5CF6]/30 bg-[#F3E8FF]/20 shadow-xs'
              : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'expenses'
              ? 'neu-pressed text-[#8B5CF6] font-extrabold border border-[#8B5CF6]/30 bg-[#F3E8FF]/20 shadow-xs'
              : 'neu-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          <Receipt className="h-4 w-4" />
          <span>Expense Breakdown ({expenses.length})</span>
        </button>
      </div>

      {/* SECTION B: PAYMENT SCHEDULE */}
      {(activeTab === 'overview' || activeTab === 'payments') && (
        <div className="rounded-3xl neu-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[#8B5CF6]">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[var(--color-text-primary)]">
                  Payment Schedule
                </h3>
                <p className="hidden sm:block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  Scheduled milestones, due dates & collection statuses
                </p>
              </div>
            </div>

            {/* Desktop-Only Full Size Add Schedule Button */}
            <button
              onClick={handleOpenAddSchedule}
              className="hidden sm:flex items-center gap-1.5 rounded-xl neu-btn-primary px-3 py-1.5 text-xs font-bold text-white shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Schedule</span>
            </button>
          </div>

          {loadingPayments ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-2xl neu-pressed p-8 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
              No payment schedule milestones added yet. Click &ldquo;Add Schedule&rdquo; to plan project payments.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-border-light)]/40">
              <table className="w-full text-left text-xs font-medium border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-[var(--color-surface-secondary)]/50 text-[var(--color-text-tertiary)] uppercase tracking-wider font-extrabold text-[11px] border-b border-[var(--color-border-light)]/60">
                    <th className="py-3 px-4">Title / Milestone</th>
                    <th className="py-3 px-4">Scheduled Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]/30 text-[var(--color-text-primary)]">
                  {payments.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-[#8B5CF6]/5">
                      <td className="py-3 px-4 font-bold text-sm text-[var(--color-text-primary)]">
                        {p.title}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[var(--color-text-secondary)] font-semibold">
                        {formatDate(p.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
                            p.status === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : p.status === 'Overdue'
                              ? 'bg-red-500/10 text-red-600'
                              : 'bg-amber-500/10 text-amber-600'
                          )}
                        >
                          {p.status === 'Paid' && <CheckCircle2 className="h-3 w-3" />}
                          {p.status === 'Overdue' && <AlertCircle className="h-3 w-3" />}
                          {p.status === 'Pending' && <Clock className="h-3 w-3" />}
                          <span>{p.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {p.status === 'Paid' && (p.payment_method || p.payment_method_custom) ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#8B5CF6]/10 text-[#8B5CF6]">
                            {p.payment_method === 'Other' && p.payment_method_custom
                              ? p.payment_method_custom
                              : (p.payment_method || 'Paid')}
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-tertiary)] font-bold">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-secondary)] max-w-xs truncate">
                        {p.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-sm text-[var(--color-text-primary)] whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingPayment(p);
                              setPaymentForm({
                                title: p.title,
                                date: p.date,
                                amount: String(p.amount),
                                status: p.status,
                                payment_method: p.payment_method || '',
                                payment_method_custom: p.payment_method_custom || '',
                                notes: p.notes || '',
                              });
                              setPaymentModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 neu-btn text-green-600 hover:bg-green-500/10 transition-colors"
                            title="Edit schedule"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPayment(p)}
                            className="rounded-lg p-1.5 neu-btn text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete schedule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION C & D: DOCUMENTS & INVOICES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SECTION C: UPLOAD DOCUMENTS */}
        {(activeTab === 'overview' || activeTab === 'documents') && (
          <div className="rounded-3xl neu-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-blue-500">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--color-text-primary)]">
                    Project Documents
                  </h3>
                  <p className="hidden sm:block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                    Agreements, project briefs & files
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-1.5 rounded-xl neu-btn px-3 py-1.5 text-xs font-bold text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-all cursor-pointer shadow-sm">
                {isUploadingDoc ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>Upload</span>
                <input
                  type="file"
                  onChange={handleDocumentUpload}
                  disabled={isUploadingDoc}
                  className="hidden"
                />
              </label>
            </div>

            {loadingDocs ? (
              <div className="flex h-28 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-2xl neu-pressed p-6 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
                No documents uploaded yet. Click Upload to attach agreements or briefs.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-2xl neu-card hover:neu-pressed transition-all text-xs"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-[#8B5CF6] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold text-[var(--color-text-primary)]">
                          {doc.name}
                        </p>
                        <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                          {doc.file_size ? formatBytes(doc.file_size) : ''} &middot; {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {doc.file_data && (
                        <button
                          onClick={() => downloadDataUrl(doc.file_data!, doc.name)}
                          className="p-1.5 rounded-lg neu-btn text-blue-500 hover:bg-blue-500/10 cursor-pointer"
                          title="Download document"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingDoc(doc)}
                        className="p-1.5 rounded-lg neu-btn text-red-500 hover:bg-red-500/10 cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION D: UPLOAD INVOICES */}
        {(activeTab === 'overview' || activeTab === 'invoices') && (
          <div className="rounded-3xl neu-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-emerald-600">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--color-text-primary)]">
                    Invoices
                  </h3>
                  <p className="hidden sm:block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                    Client billing invoices & tax documents
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInvoiceModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl neu-btn px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-500/10 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Invoice</span>
              </button>
            </div>

            {loadingInvoices ? (
              <div className="flex h-28 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="rounded-2xl neu-pressed p-6 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
                No invoices recorded yet. Click Add Invoice to store billings.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-2xl neu-card hover:neu-pressed transition-all text-xs"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[var(--color-text-primary)] truncate">
                            {inv.invoice_number || inv.name}
                          </span>
                          {inv.amount ? (
                            <span className="text-[11px] font-black text-emerald-600">
                              {formatCurrency(inv.amount)}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] truncate">
                          {inv.name} &middot; {formatDate(inv.invoice_date || inv.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {inv.file_data && (
                        <button
                          onClick={() => downloadDataUrl(inv.file_data!, inv.name)}
                          className="p-1.5 rounded-lg neu-btn text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                          title="Download invoice"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingInvoice(inv)}
                        className="p-1.5 rounded-lg neu-btn text-red-500 hover:bg-red-500/10 cursor-pointer"
                        title="Delete invoice"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION E: EXPENSE BREAKDOWN */}
      {(activeTab === 'overview' || activeTab === 'expenses') && (
        <div className="rounded-3xl neu-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-red-500">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[var(--color-text-primary)]">
                  Expense Breakdown
                </h3>
                <p className="hidden sm:block text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  Direct project expenses, licenses, travel & subcontractor costs
                </p>
              </div>
            </div>

            {/* Desktop-Only Full Size Add Expense Button */}
            <button
              onClick={handleOpenAddExpense}
              className="hidden sm:flex items-center gap-1.5 rounded-xl neu-btn-primary px-3 py-1.5 text-xs font-bold text-white shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Expense</span>
            </button>
          </div>

          {loadingExpenses ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="rounded-2xl neu-pressed p-8 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
              No expenses recorded for this project yet. Click &ldquo;Add Expense&rdquo; to track project expenditures.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-border-light)]/40">
              <table className="w-full text-left text-xs font-medium border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-[var(--color-surface-secondary)]/50 text-[var(--color-text-tertiary)] uppercase tracking-wider font-extrabold text-[11px] border-b border-[var(--color-border-light)]/60">
                    <th className="py-3 px-4">Title / Item</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4">Receipt</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]/30 text-[var(--color-text-primary)]">
                  {expenses.map((e) => (
                    <tr key={e.id} className="transition-colors hover:bg-red-500/5">
                      <td className="py-3 px-4 font-bold text-sm text-[var(--color-text-primary)]">
                        {e.title}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[var(--color-text-secondary)] font-semibold">
                        {formatDate(e.date)}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-secondary)] max-w-xs truncate">
                        {e.description || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {e.receipt_url ? (
                          <button
                            onClick={() => downloadDataUrl(e.receipt_url!, e.receipt_name || 'receipt.png')}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-500 hover:underline cursor-pointer"
                          >
                            <Download className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{e.receipt_name || 'Receipt'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--color-text-tertiary)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-sm text-red-500 whitespace-nowrap">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingExpense(e);
                              setExpenseReceiptFile(null);
                              setExpenseForm({
                                title: e.title,
                                description: e.description || '',
                                date: e.date,
                                amount: String(e.amount),
                              });
                              setExpenseModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 neu-btn text-green-600 hover:bg-green-500/10 transition-colors"
                            title="Edit expense"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingExpense(e)}
                            className="rounded-lg p-1.5 neu-btn text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Schedule Modal (Add / Edit) */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => !paymentMutation.isPending && setPaymentModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                {editingPayment ? 'Edit Payment Schedule' : 'Add Payment Schedule'}
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                paymentMutation.mutate();
              }}
              className="space-y-3.5 text-xs font-bold"
            >
              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Payment Title / Milestone *
                </label>
                <input
                  type="text"
                  value={paymentForm.title}
                  onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })}
                  placeholder="e.g. 50% Advance Payment"
                  required
                  autoFocus
                  className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    required
                    className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm font-black text-[var(--color-text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Payment Status *
                </label>
                <select
                  value={paymentForm.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as 'Pending' | 'Paid' | 'Overdue';
                    setPaymentForm({
                      ...paymentForm,
                      status: newStatus,
                      payment_method: newStatus === 'Paid' ? paymentForm.payment_method : '',
                      payment_method_custom: newStatus === 'Paid' ? paymentForm.payment_method_custom : '',
                    });
                  }}
                  className="w-full rounded-xl neu-input px-3 py-2.5 text-sm text-[var(--color-text-primary)] font-bold"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Dynamic Payment Method when status is Paid */}
              {paymentForm.status === 'Paid' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 animate-in fade-in duration-150">
                  <div>
                    <label className="mb-1 block text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Payment Method *
                    </label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) => {
                        const newMethod = e.target.value;
                        setPaymentForm({
                          ...paymentForm,
                          payment_method: newMethod,
                          payment_method_custom: newMethod === 'Other' ? paymentForm.payment_method_custom : '',
                        });
                      }}
                      required
                      className="w-full rounded-xl neu-input px-3 py-2.5 text-sm text-[var(--color-text-primary)] font-bold"
                    >
                      <option value="">Select Payment Method...</option>
                      {MID_PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  {paymentForm.payment_method === 'Other' && (
                    <div className="animate-in fade-in duration-150">
                      <label className="mb-1 block text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Specify Payment Method *
                      </label>
                      <input
                        type="text"
                        value={paymentForm.payment_method_custom}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, payment_method_custom: e.target.value })
                        }
                        placeholder="e.g. Demand Draft, Crypto, Wire"
                        required
                        className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Notes
                </label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optional notes or remarks"
                  className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isPending || !paymentForm.title.trim() || !paymentForm.amount}
                  className="flex-1 rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {paymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => !invoiceMutation.isPending && setInvoiceModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                Upload Project Invoice
              </h3>
              <button
                onClick={() => setInvoiceModalOpen(false)}
                className="p-1 rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                invoiceMutation.mutate();
              }}
              className="space-y-3.5 text-xs font-bold"
            >

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                    className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm font-black text-[var(--color-text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Select Invoice File (PDF, Image, Doc) *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl neu-input p-2 text-xs text-[var(--color-text-primary)] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#8B5CF6]/10 file:text-[#8B5CF6]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="flex-1 rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={invoiceMutation.isPending || !invoiceFile}
                  className="flex-1 rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {invoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Breakdown Modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => !expenseMutation.isPending && setExpenseModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl neu-modal p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)]/40 pb-3">
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                {editingExpense ? 'Edit Project Expense' : 'Add Project Expense'}
              </h3>
              <button
                onClick={() => setExpenseModalOpen(false)}
                className="p-1 rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                expenseMutation.mutate();
              }}
              className="space-y-3.5 text-xs font-bold"
            >
              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Expense Title *
                </label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Domain Registration & SSL"
                  required
                  autoFocus
                  className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                    className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm font-black text-[var(--color-text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Description / Notes
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Short note or vendor details"
                  className="w-full rounded-xl neu-input px-3.5 py-2.5 text-sm text-[var(--color-text-primary)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Receipt Upload (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setExpenseReceiptFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl neu-input p-2 text-xs text-[var(--color-text-primary)] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-500/10 file:text-red-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="flex-1 rounded-xl neu-btn px-4 py-2 text-xs font-bold text-[var(--color-text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expenseMutation.isPending || !expenseForm.title.trim() || !expenseForm.amount}
                  className="flex-1 rounded-xl neu-btn-primary px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {expenseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Payment Confirm */}
      <ConfirmDialog
        open={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={() => deletingPayment && deletePaymentMutation.mutate(deletingPayment.id)}
        title="Delete payment schedule?"
        description={`Are you sure you want to remove milestone "${deletingPayment?.title}" (${formatCurrency(Number(deletingPayment?.amount || 0))})?`}
        confirmLabel="Delete"
        loading={deletePaymentMutation.isPending}
      />

      {/* Delete Document Confirm */}
      <ConfirmDialog
        open={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onConfirm={() => deletingDoc && deleteDocMutation.mutate(deletingDoc.id)}
        title="Delete document?"
        description={`Are you sure you want to delete "${deletingDoc?.name}"?`}
        confirmLabel="Delete"
        loading={deleteDocMutation.isPending}
      />

      {/* Delete Invoice Confirm */}
      <ConfirmDialog
        open={!!deletingInvoice}
        onClose={() => setDeletingInvoice(null)}
        onConfirm={() => deletingInvoice && deleteInvoiceMutation.mutate(deletingInvoice.id)}
        title="Delete invoice?"
        description={`Are you sure you want to delete invoice "${deletingInvoice?.invoice_number || deletingInvoice?.name}"?`}
        confirmLabel="Delete"
        loading={deleteInvoiceMutation.isPending}
      />

      {/* Delete Expense Confirm */}
      <ConfirmDialog
        open={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={() => deletingExpense && deleteExpenseMutation.mutate(deletingExpense.id)}
        title="Delete expense?"
        description={`Are you sure you want to delete "${deletingExpense?.title}" (${formatCurrency(Number(deletingExpense?.amount || 0))})?`}
        confirmLabel="Delete"
        loading={deleteExpenseMutation.isPending}
      />

      {/* Mobile Floating Action Button (FAB) for Quick Project Actions */}
      <div className="sm:hidden fixed bottom-20 right-4 z-40">
        <div className="relative">
          {mobileActionMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs"
                onClick={() => setMobileActionMenuOpen(false)}
              />
              <div className="absolute bottom-full right-0 mb-3 w-48 z-50 rounded-2xl neu-flat bg-[var(--neu-bg)] border border-[var(--color-border-light)]/60 p-1.5 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-150">
                <button
                  type="button"
                  onClick={handleOpenAddSchedule}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] transition-colors cursor-pointer"
                >
                  <CreditCard className="h-4 w-4 text-[#8B5CF6]" />
                  <span>Add Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddExpense}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--color-text-primary)] hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Receipt className="h-4 w-4 text-red-500" />
                  <span>Add Expense</span>
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileActionMenuOpen((prev) => !prev)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl neu-btn-primary text-white shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Add Schedule or Expense"
            title="Add Schedule or Expense"
          >
            <Plus className={cn('h-6 w-6 transition-transform duration-200', mobileActionMenuOpen && 'rotate-45')} />
          </button>
        </div>
      </div>
    </div>
  );
}
