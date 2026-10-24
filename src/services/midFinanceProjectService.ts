import { supabase } from '@/lib/supabase/client';

export interface MidFinanceProject {
  id: string;
  task_id?: string;
  company_name: string;
  project_name: string;
  company_logo?: string;
  total_amount: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MidFinancePaymentSchedule {
  id: string;
  project_id: string;
  title: string;
  date: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  payment_method?: string;
  payment_method_custom?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MidFinanceDocument {
  id: string;
  project_id: string;
  name: string;
  file_type?: string;
  file_size?: number;
  file_data?: string;
  created_at: string;
}

export interface MidFinanceInvoice {
  id: string;
  project_id: string;
  name: string;
  invoice_number?: string;
  invoice_date?: string;
  amount?: number;
  file_type?: string;
  file_size?: number;
  file_data?: string;
  created_at: string;
}

export interface MidFinanceProjectExpense {
  id: string;
  project_id: string;
  title: string;
  category?: string;
  description?: string;
  date: string;
  amount: number;
  receipt_name?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

// LocalStorage Keys for reliable offline/fallback storage
const STORAGE_KEY_PROJECTS = 'dm_mid_finance_projects';
const STORAGE_KEY_PAYMENTS = 'dm_mid_finance_payments';
const STORAGE_KEY_DOCS = 'dm_mid_finance_documents';
const STORAGE_KEY_INVOICES = 'dm_mid_finance_invoices';
const STORAGE_KEY_EXPENSES = 'dm_mid_finance_expenses';

function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// ==========================================
// 1. PROJECT FOLDERS
// ==========================================

export async function getMidFinanceProjects(
  taskId?: string,
  search?: string
): Promise<MidFinanceProject[]> {
  try {
    let query = supabase
      .from('mid_finance_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`company_name.ilike.%${q}%,project_name.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error || !data) {
      return filterLocalProjects(search);
    }

    return (data || []).map((row: any) => ({
      ...row,
      total_amount: Number(row.total_amount || 0),
    })) as MidFinanceProject[];
  } catch {
    return filterLocalProjects(search);
  }
}

function filterLocalProjects(search?: string): MidFinanceProject[] {
  let list = getLocal<MidFinanceProject>(STORAGE_KEY_PROJECTS);
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.company_name.toLowerCase().includes(q) ||
        p.project_name.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function getMidFinanceProjectById(
  id: string
): Promise<MidFinanceProject | null> {
  try {
    const { data, error } = await supabase
      .from('mid_finance_projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      return {
        ...data,
        total_amount: Number(data.total_amount || 0),
      } as MidFinanceProject;
    }
  } catch {}

  const localList = getLocal<MidFinanceProject>(STORAGE_KEY_PROJECTS);
  return localList.find((p) => p.id === id) || null;
}

export async function createMidFinanceProject(data: {
  company_name: string;
  project_name: string;
  company_logo?: string;
  total_amount?: number;
  task_id?: string;
}): Promise<MidFinanceProject> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { data: userData } = await supabase.auth.getUser();

  const newProject: MidFinanceProject = {
    id: newId,
    task_id: data.task_id,
    company_name: data.company_name.trim(),
    project_name: data.project_name.trim(),
    company_logo: data.company_logo,
    total_amount: Number(data.total_amount || 0),
    created_by: userData?.user?.id,
    created_at: now,
    updated_at: now,
  };

  try {
    const { data: res, error } = await supabase
      .from('mid_finance_projects')
      .insert({
        id: newId,
        task_id: data.task_id,
        company_name: newProject.company_name,
        project_name: newProject.project_name,
        company_logo: newProject.company_logo,
        total_amount: newProject.total_amount,
        created_by: newProject.created_by,
      })
      .select('*')
      .single();

    if (error || !res) {
      saveLocalProject(newProject);
      return newProject;
    }

    const saved = {
      ...res,
      total_amount: Number(res.total_amount || 0),
    } as MidFinanceProject;
    saveLocalProject(saved);
    return saved;
  } catch {
    saveLocalProject(newProject);
    return newProject;
  }
}

function saveLocalProject(project: MidFinanceProject) {
  const current = getLocal<MidFinanceProject>(STORAGE_KEY_PROJECTS);
  const exists = current.some((p) => p.id === project.id);
  const updated = exists
    ? current.map((p) => (p.id === project.id ? project : p))
    : [project, ...current];
  setLocal(STORAGE_KEY_PROJECTS, updated);
}

export async function updateMidFinanceProjectTotalAmount(
  projectId: string,
  totalAmount: number
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await supabase
      .from('mid_finance_projects')
      .update({
        total_amount: totalAmount,
        updated_at: now,
      })
      .eq('id', projectId);
  } catch {}

  const current = getLocal<MidFinanceProject>(STORAGE_KEY_PROJECTS);
  const updated = current.map((p) =>
    p.id === projectId
      ? { ...p, total_amount: totalAmount, updated_at: now }
      : p
  );
  setLocal(STORAGE_KEY_PROJECTS, updated);
}

export async function deleteMidFinanceProject(projectId: string): Promise<void> {
  try {
    await supabase.from('mid_finance_projects').delete().eq('id', projectId);
  } catch {}

  const current = getLocal<MidFinanceProject>(STORAGE_KEY_PROJECTS);
  setLocal(
    STORAGE_KEY_PROJECTS,
    current.filter((p) => p.id !== projectId)
  );

  // Clean local child records
  setLocal(
    STORAGE_KEY_PAYMENTS,
    getLocal<MidFinancePaymentSchedule>(STORAGE_KEY_PAYMENTS).filter(
      (p) => p.project_id !== projectId
    )
  );
  setLocal(
    STORAGE_KEY_DOCS,
    getLocal<MidFinanceDocument>(STORAGE_KEY_DOCS).filter(
      (d) => d.project_id !== projectId
    )
  );
  setLocal(
    STORAGE_KEY_INVOICES,
    getLocal<MidFinanceInvoice>(STORAGE_KEY_INVOICES).filter(
      (i) => i.project_id !== projectId
    )
  );
  setLocal(
    STORAGE_KEY_EXPENSES,
    getLocal<MidFinanceProjectExpense>(STORAGE_KEY_EXPENSES).filter(
      (e) => e.project_id !== projectId
    )
  );
}

// ==========================================
// 2. PAYMENT SCHEDULES
// ==========================================

export async function getMidFinancePaymentSchedules(
  projectId: string
): Promise<MidFinancePaymentSchedule[]> {
  const localList = getLocal<MidFinancePaymentSchedule>(STORAGE_KEY_PAYMENTS);
  const localMap = new Map(localList.map((l) => [l.id, l]));

  try {
    const { data, error } = await supabase
      .from('mid_finance_payment_schedules')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: true });

    if (!error && data) {
      const remoteList = (data || []).map((row: any) => {
        const local = localMap.get(row.id);
        return {
          ...row,
          amount: Number(row.amount || 0),
          payment_method: row.payment_method || local?.payment_method || undefined,
          payment_method_custom: row.payment_method_custom || local?.payment_method_custom || undefined,
        };
      }) as MidFinancePaymentSchedule[];

      const remoteIds = new Set(remoteList.map((r) => r.id));
      const extraLocal = localList.filter((p) => p.project_id === projectId && !remoteIds.has(p.id));
      return [...remoteList, ...extraLocal];
    }
  } catch {}

  return localList.filter((p) => p.project_id === projectId);
}

export async function createMidFinancePaymentSchedule(
  data: Omit<MidFinancePaymentSchedule, 'id' | 'created_at' | 'updated_at'>
): Promise<MidFinancePaymentSchedule> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newSchedule: MidFinancePaymentSchedule = {
    ...data,
    id: newId,
    amount: Number(data.amount || 0),
    payment_method: data.payment_method || undefined,
    payment_method_custom: data.payment_method_custom || undefined,
    created_at: now,
    updated_at: now,
  };

  try {
    let { data: res, error } = await supabase
      .from('mid_finance_payment_schedules')
      .insert({
        id: newId,
        project_id: data.project_id,
        title: data.title.trim(),
        date: data.date,
        amount: newSchedule.amount,
        status: data.status,
        payment_method: data.payment_method || null,
        payment_method_custom: data.payment_method_custom || null,
        notes: data.notes?.trim() || null,
      })
      .select('*')
      .single();

    if (error && (error.code === '42703' || error.message?.includes('column'))) {
      const fallback = await supabase
        .from('mid_finance_payment_schedules')
        .insert({
          id: newId,
          project_id: data.project_id,
          title: data.title.trim(),
          date: data.date,
          amount: newSchedule.amount,
          status: data.status,
          notes: data.notes?.trim() || null,
        })
        .select('*')
        .single();
      res = fallback.data;
      error = fallback.error;
    }

    if (!error && res) {
      const saved = {
        ...res,
        amount: Number(res.amount || 0),
        payment_method: res.payment_method || newSchedule.payment_method,
        payment_method_custom: res.payment_method_custom || newSchedule.payment_method_custom,
      };
      saveLocalPayment(saved);
      return saved;
    }
  } catch {}

  saveLocalPayment(newSchedule);
  return newSchedule;
}

function saveLocalPayment(payment: MidFinancePaymentSchedule) {
  const current = getLocal<MidFinancePaymentSchedule>(STORAGE_KEY_PAYMENTS);
  const exists = current.some((p) => p.id === payment.id);
  const updated = exists
    ? current.map((p) => (p.id === payment.id ? payment : p))
    : [...current, payment];
  setLocal(STORAGE_KEY_PAYMENTS, updated);
}

export async function updateMidFinancePaymentSchedule(
  id: string,
  updates: Partial<MidFinancePaymentSchedule>
): Promise<void> {
  const now = new Date().toISOString();
  try {
    let { error } = await supabase
      .from('mid_finance_payment_schedules')
      .update({
        ...updates,
        updated_at: now,
      })
      .eq('id', id);

    if (error && (error.code === '42703' || error.message?.includes('column'))) {
      const safeUpdates = { ...updates };
      delete (safeUpdates as any).payment_method;
      delete (safeUpdates as any).payment_method_custom;
      await supabase
        .from('mid_finance_payment_schedules')
        .update({
          ...safeUpdates,
          updated_at: now,
        })
        .eq('id', id);
    }
  } catch {}

  const current = getLocal<MidFinancePaymentSchedule>(STORAGE_KEY_PAYMENTS);
  const updated = current.map((p) =>
    p.id === id ? { ...p, ...updates, updated_at: now } : p
  );
  setLocal(STORAGE_KEY_PAYMENTS, updated);
}

export async function deleteMidFinancePaymentSchedule(
  id: string,
  projectId: string
): Promise<void> {
  try {
    await supabase
      .from('mid_finance_payment_schedules')
      .delete()
      .eq('id', id);
  } catch {}

  const current = getLocal<MidFinancePaymentSchedule>(STORAGE_KEY_PAYMENTS);
  setLocal(
    STORAGE_KEY_PAYMENTS,
    current.filter((p) => p.id !== id)
  );
}

// ==========================================
// 3. PROJECT DOCUMENTS
// ==========================================

export async function getMidFinanceDocuments(
  projectId: string
): Promise<MidFinanceDocument[]> {
  try {
    const { data, error } = await supabase
      .from('mid_finance_project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as MidFinanceDocument[];
    }
  } catch {}

  const localList = getLocal<MidFinanceDocument>(STORAGE_KEY_DOCS);
  return localList.filter((d) => d.project_id === projectId);
}

export async function uploadMidFinanceDocument(
  projectId: string,
  file: File
): Promise<MidFinanceDocument> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const fileData = await fileToBase64(file);

  const newDoc: MidFinanceDocument = {
    id: newId,
    project_id: projectId,
    name: file.name,
    file_type: file.type || file.name.split('.').pop() || 'file',
    file_size: file.size,
    file_data: fileData,
    created_at: now,
  };

  try {
    const { data: res, error } = await supabase
      .from('mid_finance_project_documents')
      .insert({
        id: newId,
        project_id: projectId,
        name: newDoc.name,
        file_type: newDoc.file_type,
        file_size: newDoc.file_size,
        file_data: newDoc.file_data,
      })
      .select('*')
      .single();

    if (!error && res) {
      saveLocalDoc(res);
      return res;
    }
  } catch {}

  saveLocalDoc(newDoc);
  return newDoc;
}

function saveLocalDoc(doc: MidFinanceDocument) {
  const current = getLocal<MidFinanceDocument>(STORAGE_KEY_DOCS);
  setLocal(STORAGE_KEY_DOCS, [doc, ...current]);
}

export async function deleteMidFinanceDocument(
  id: string,
  projectId: string
): Promise<void> {
  try {
    await supabase
      .from('mid_finance_project_documents')
      .delete()
      .eq('id', id);
  } catch {}

  const current = getLocal<MidFinanceDocument>(STORAGE_KEY_DOCS);
  setLocal(
    STORAGE_KEY_DOCS,
    current.filter((d) => d.id !== id)
  );
}

// ==========================================
// 4. PROJECT INVOICES
// ==========================================

export async function getMidFinanceInvoices(
  projectId: string
): Promise<MidFinanceInvoice[]> {
  try {
    const { data, error } = await supabase
      .from('mid_finance_project_invoices')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return (data || []).map((row: any) => ({
        ...row,
        amount: Number(row.amount || 0),
      })) as MidFinanceInvoice[];
    }
  } catch {}

  const localList = getLocal<MidFinanceInvoice>(STORAGE_KEY_INVOICES);
  return localList.filter((i) => i.project_id === projectId);
}

export async function uploadMidFinanceInvoice(
  projectId: string,
  file: File,
  meta?: { invoice_number?: string; invoice_date?: string; amount?: number }
): Promise<MidFinanceInvoice> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const fileData = await fileToBase64(file);

  const newInvoice: MidFinanceInvoice = {
    id: newId,
    project_id: projectId,
    name: file.name,
    invoice_number: meta?.invoice_number?.trim() || undefined,
    invoice_date: meta?.invoice_date || now.split('T')[0],
    amount: Number(meta?.amount || 0),
    file_type: file.type || file.name.split('.').pop() || 'pdf',
    file_size: file.size,
    file_data: fileData,
    created_at: now,
  };

  try {
    const { data: res, error } = await supabase
      .from('mid_finance_project_invoices')
      .insert({
        id: newId,
        project_id: projectId,
        name: newInvoice.name,
        invoice_number: newInvoice.invoice_number || null,
        invoice_date: newInvoice.invoice_date,
        amount: newInvoice.amount,
        file_type: newInvoice.file_type,
        file_size: newInvoice.file_size,
        file_data: newInvoice.file_data,
      })
      .select('*')
      .single();

    if (!error && res) {
      const saved = { ...res, amount: Number(res.amount || 0) };
      saveLocalInvoice(saved);
      return saved;
    }
  } catch {}

  saveLocalInvoice(newInvoice);
  return newInvoice;
}

function saveLocalInvoice(invoice: MidFinanceInvoice) {
  const current = getLocal<MidFinanceInvoice>(STORAGE_KEY_INVOICES);
  setLocal(STORAGE_KEY_INVOICES, [invoice, ...current]);
}

export async function deleteMidFinanceInvoice(
  id: string,
  projectId: string
): Promise<void> {
  try {
    await supabase
      .from('mid_finance_project_invoices')
      .delete()
      .eq('id', id);
  } catch {}

  const current = getLocal<MidFinanceInvoice>(STORAGE_KEY_INVOICES);
  setLocal(
    STORAGE_KEY_INVOICES,
    current.filter((i) => i.id !== id)
  );
}

// ==========================================
// 5. PROJECT EXPENSES
// ==========================================

export async function getMidFinanceProjectExpenses(
  projectId: string
): Promise<MidFinanceProjectExpense[]> {
  try {
    const { data, error } = await supabase
      .from('mid_finance_project_expenses')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (!error && data) {
      return (data || []).map((row: any) => ({
        ...row,
        amount: Number(row.amount || 0),
      })) as MidFinanceProjectExpense[];
    }
  } catch {}

  const localList = getLocal<MidFinanceProjectExpense>(STORAGE_KEY_EXPENSES);
  return localList.filter((e) => e.project_id === projectId);
}

export async function createMidFinanceProjectExpense(
  data: Omit<MidFinanceProjectExpense, 'id' | 'created_at' | 'updated_at'>,
  receiptFile?: File
): Promise<MidFinanceProjectExpense> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  let receiptUrl: string | undefined = undefined;
  let receiptName: string | undefined = undefined;

  if (receiptFile) {
    receiptUrl = await fileToBase64(receiptFile);
    receiptName = receiptFile.name;
  }

  const newExpense: MidFinanceProjectExpense = {
    ...data,
    id: newId,
    amount: Number(data.amount || 0),
    receipt_name: receiptName || data.receipt_name,
    receipt_url: receiptUrl || data.receipt_url,
    created_at: now,
    updated_at: now,
  };

  try {
    const { data: res, error } = await supabase
      .from('mid_finance_project_expenses')
      .insert({
        id: newId,
        project_id: data.project_id,
        title: data.title.trim(),
        category: (data.category || 'General').trim(),
        description: data.description?.trim() || null,
        date: data.date,
        amount: newExpense.amount,
        receipt_name: newExpense.receipt_name,
        receipt_url: newExpense.receipt_url,
      })
      .select('*')
      .single();

    if (!error && res) {
      const saved = { ...res, amount: Number(res.amount || 0) };
      saveLocalExpense(saved);
      return saved;
    }
  } catch {}

  saveLocalExpense(newExpense);
  return newExpense;
}

function saveLocalExpense(expense: MidFinanceProjectExpense) {
  const current = getLocal<MidFinanceProjectExpense>(STORAGE_KEY_EXPENSES);
  const exists = current.some((e) => e.id === expense.id);
  const updated = exists
    ? current.map((e) => (e.id === expense.id ? expense : e))
    : [expense, ...current];
  setLocal(STORAGE_KEY_EXPENSES, updated);
}

export async function updateMidFinanceProjectExpense(
  id: string,
  updates: Partial<MidFinanceProjectExpense>,
  newReceiptFile?: File
): Promise<void> {
  const now = new Date().toISOString();
  let receiptUrl = updates.receipt_url;
  let receiptName = updates.receipt_name;

  if (newReceiptFile) {
    receiptUrl = await fileToBase64(newReceiptFile);
    receiptName = newReceiptFile.name;
  }

  const payload: any = {
    ...updates,
    updated_at: now,
  };
  if (receiptUrl !== undefined) payload.receipt_url = receiptUrl;
  if (receiptName !== undefined) payload.receipt_name = receiptName;

  try {
    await supabase
      .from('mid_finance_project_expenses')
      .update(payload)
      .eq('id', id);
  } catch {}

  const current = getLocal<MidFinanceProjectExpense>(STORAGE_KEY_EXPENSES);
  const updated = current.map((e) =>
    e.id === id ? { ...e, ...payload, updated_at: now } : e
  );
  setLocal(STORAGE_KEY_EXPENSES, updated);
}

export async function deleteMidFinanceProjectExpense(
  id: string,
  projectId: string
): Promise<void> {
  try {
    await supabase
      .from('mid_finance_project_expenses')
      .delete()
      .eq('id', id);
  } catch {}

  const current = getLocal<MidFinanceProjectExpense>(STORAGE_KEY_EXPENSES);
  setLocal(
    STORAGE_KEY_EXPENSES,
    current.filter((e) => e.id !== id)
  );
}
