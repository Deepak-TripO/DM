import { supabase } from '@/lib/supabase/client';
import { getLocalUserFinanceAccessMap } from '@/services/adminService';

export interface MidFinanceEntry {
  id: string;
  task_id: string;
  date: string;
  company_name?: string;
  item?: string;
  category?: string;
  description: string;
  person: string;
  amount: number;
  elumugam_amount?: number | null;
  deepak_amount?: number | null;
  incoming_amount?: number | null;
  outgoing_amount?: number | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export function mapMidPersonClassification(person: string | undefined): string {
  if (!person) return 'Incoming';
  const p = person.trim();
  if (p === 'Deepak') return 'Incoming';
  if (p === 'Elumugam') return 'Outgoing';
  if (
    p === 'Elumugam+Deepak' ||
    p === 'Elumugam + Deepak' ||
    p === 'Deepak+Elumugam' ||
    p === 'Deepak + Elumugam' ||
    p === 'Incoming+Outgoing' ||
    p === 'Incoming + Outgoing'
  ) {
    return 'Incoming + Outgoing';
  }
  return p;
}

export const DEFAULT_MID_FINANCE_CATEGORIES = [
  'Software',
  'Document',
  'ID Card',
  'Seal',
  'PAN',
];

export const DEFAULT_MID_CATEGORY_ITEMS: Record<string, string[]> = {
  Software: [
    'Renewal (KVM1) VPS',
    'Organisation Gmail',
    'Supabase',
    'Claude',
  ],
  Document: ['Agreement', 'Invoice', 'Report'],
  'ID Card': ['Employee ID', 'Company ID'],
  Seal: ['Company Seal', 'Office Seal'],
  PAN: ['PAN Document'],
};

export const MID_ITEM_NAME_MAPPINGS: Record<string, string> = {
  'Microsoft 365': 'Renewal (KVM1) VPS',
  Adobe: 'Organisation Gmail',
  Antivirus: 'Supabase',
  'Cloud Storage': 'Claude',
};

export function mapMidLegacyItemName(name?: string): string {
  if (!name) return '';
  return MID_ITEM_NAME_MAPPINGS[name] || name;
}

const MID_CATEGORIES_STORAGE_KEY = 'dm_mid_finance_categories';
const MID_ITEMS_STORAGE_KEY = 'dm_mid_finance_items';

export async function getMidFinanceCategories(): Promise<string[]> {
  try {
    const stored = localStorage.getItem(MID_CATEGORIES_STORAGE_KEY);
    const custom: string[] = stored ? JSON.parse(stored) : [];
    const all = Array.from(new Set([...DEFAULT_MID_FINANCE_CATEGORIES, ...custom]));
    return all;
  } catch {
    return DEFAULT_MID_FINANCE_CATEGORIES;
  }
}

export async function addMidFinanceCategory(name: string): Promise<string[]> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name cannot be empty');
  }

  const existing = await getMidFinanceCategories();
  const isDuplicate = existing.some(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    throw new Error('Category already exists.');
  }

  try {
    const stored = localStorage.getItem(MID_CATEGORIES_STORAGE_KEY);
    const custom: string[] = stored ? JSON.parse(stored) : [];
    const updatedCustom = [...custom, trimmed];
    localStorage.setItem(MID_CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCustom));

    return Array.from(new Set([...DEFAULT_MID_FINANCE_CATEGORIES, ...updatedCustom]));
  } catch {
    return [...existing, trimmed];
  }
}

export async function deleteMidFinanceCategory(categoryName: string): Promise<string[]> {
  try {
    const stored = localStorage.getItem(MID_CATEGORIES_STORAGE_KEY);
    const custom: string[] = stored ? JSON.parse(stored) : [];
    const updatedCustom = custom.filter(
      (c) => c.toLowerCase() !== categoryName.toLowerCase()
    );
    localStorage.setItem(MID_CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCustom));
    return Array.from(new Set([...DEFAULT_MID_FINANCE_CATEGORIES.filter(c => c !== categoryName), ...updatedCustom]));
  } catch {
    return DEFAULT_MID_FINANCE_CATEGORIES;
  }
}

export async function getMidFinanceItems(category: string): Promise<string[]> {
  if (!category) return [];
  try {
    const stored = localStorage.getItem(MID_ITEMS_STORAGE_KEY);
    const customMap: Record<string, string[]> = stored ? JSON.parse(stored) : {};
    const defaults = DEFAULT_MID_CATEGORY_ITEMS[category] || [];
    const custom = customMap[category] || [];
    return Array.from(new Set([...defaults, ...custom]));
  } catch {
    return DEFAULT_MID_CATEGORY_ITEMS[category] || [];
  }
}

export async function addMidFinanceItem(category: string, itemName: string): Promise<string[]> {
  const trimmed = itemName.trim();
  if (!trimmed) {
    throw new Error('Item name cannot be empty');
  }
  if (!category) {
    throw new Error('Category must be selected');
  }

  const existing = await getMidFinanceItems(category);
  const isDuplicate = existing.some((i) => i.toLowerCase() === trimmed.toLowerCase());
  if (isDuplicate) {
    throw new Error('Item already exists in this category.');
  }

  try {
    const stored = localStorage.getItem(MID_ITEMS_STORAGE_KEY);
    const customMap: Record<string, string[]> = stored ? JSON.parse(stored) : {};
    const categoryCustom = customMap[category] || [];
    const updatedCustom = [...categoryCustom, trimmed];
    customMap[category] = updatedCustom;
    localStorage.setItem(MID_ITEMS_STORAGE_KEY, JSON.stringify(customMap));

    const defaults = DEFAULT_MID_CATEGORY_ITEMS[category] || [];
    return Array.from(new Set([...defaults, ...updatedCustom]));
  } catch {
    return [...existing, trimmed];
  }
}

export async function deleteMidFinanceItem(category: string, itemName: string): Promise<string[]> {
  try {
    const stored = localStorage.getItem(MID_ITEMS_STORAGE_KEY);
    const customMap: Record<string, string[]> = stored ? JSON.parse(stored) : {};
    const categoryCustom = customMap[category] || [];
    const updatedCustom = categoryCustom.filter((i) => i !== itemName);
    customMap[category] = updatedCustom;
    localStorage.setItem(MID_ITEMS_STORAGE_KEY, JSON.stringify(customMap));

    const defaults = (DEFAULT_MID_CATEGORY_ITEMS[category] || []).filter((i) => i !== itemName);
    return Array.from(new Set([...defaults, ...updatedCustom]));
  } catch {
    return (DEFAULT_MID_CATEGORY_ITEMS[category] || []).filter((i) => i !== itemName);
  }
}

const MID_ENTRIES_STORAGE_KEY = 'dm_mid_finance_entries_data';

function loadStoredMidFinanceEntries(): MidFinanceEntry[] {
  try {
    const stored = localStorage.getItem(MID_ENTRIES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

let memoryMidFinanceEntries: MidFinanceEntry[] = loadStoredMidFinanceEntries();

function saveMemoryMidEntries() {
  try {
    localStorage.setItem(MID_ENTRIES_STORAGE_KEY, JSON.stringify(memoryMidFinanceEntries));
  } catch {}
}

function isUUID(val: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
}

export async function getMidFinanceEntries(
  taskId: string,
  search?: string,
  categoryFilter?: string
): Promise<MidFinanceEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Data Security Check: Verify user is Admin or authorized
  let isAuthorized = false;
  if (user.email?.toLowerCase() === 'admin@dm.com') {
    isAuthorized = true;
  } else {
    try {
      const { data: rpcAdmin } = await supabase.rpc('is_admin', { uid: user.id });
      if (rpcAdmin === true) {
        isAuthorized = true;
      } else {
        const { data: accessRows } = await supabase
          .from('task_access')
          .select('task_id')
          .eq('user_id', user.id);

        if (accessRows && accessRows.length > 0) {
          const { data: midFolder } = await supabase
            .from('folders')
            .select('id')
            .ilike('name', '%mid%finance%')
            .is('parent_id', null)
            .is('deleted_at', null)
            .maybeSingle();

          if (midFolder && accessRows.some((a: any) => a.task_id === midFolder.id)) {
            isAuthorized = true;
          }
        }
      }
    } catch {
      // fallback
    }
  }

  // If user is logged in, allow viewing MID finance unless specifically blocked
  if (!isAuthorized && user.id) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    console.warn('Blocked unauthorized request for MID Finance data.');
    return [];
  }

  try {
    let query = supabase
      .from('mid_finance_entries')
      .select('*')
      .order('date', { ascending: false });

    if (taskId && isUUID(taskId)) {
      query = query.or(`task_id.eq.${taskId},task_id.is.null`);
    }

    if (categoryFilter && categoryFilter !== 'All') {
      query = query.eq('category', categoryFilter);
    }

    if (search) {
      query = query.or(
        `item.ilike.%${search}%,description.ilike.%${search}%,person.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return filterMemoryMidEntries(taskId, search, categoryFilter);
    }

    const activeRows = (data || []).filter((row: any) => !row.is_deleted);

    const remoteEntries = activeRows.map((row: any) => {
      const companyName = row.company_name || row.item || '';
      const mappedPerson = mapMidPersonClassification(row.person);
      const incAmt = row.incoming_amount != null ? Number(row.incoming_amount) : (row.deepak_amount != null ? Number(row.deepak_amount) : null);
      const outAmt = row.outgoing_amount != null ? Number(row.outgoing_amount) : (row.elumugam_amount != null ? Number(row.elumugam_amount) : null);

      return {
        ...row,
        company_name: companyName,
        item: row.item || companyName,
        category: row.category || 'General',
        person: mappedPerson,
        amount: Number(row.amount || 0),
        incoming_amount: incAmt,
        outgoing_amount: outAmt,
        deepak_amount: incAmt,
        elumugam_amount: outAmt,
      };
    }) as MidFinanceEntry[];

    const remoteIds = new Set(remoteEntries.map((r) => r.id));
    const memoryEntries = filterMemoryMidEntries(taskId, search, categoryFilter).filter(
      (m) => !remoteIds.has(m.id)
    );

    return [...remoteEntries, ...memoryEntries];
  } catch (err) {
    console.error('Unexpected error fetching MID finance entries:', err);
    return filterMemoryMidEntries(taskId, search, categoryFilter);
  }
}

function filterMemoryMidEntries(
  taskId: string,
  search?: string,
  categoryFilter?: string
): MidFinanceEntry[] {
  let list = memoryMidFinanceEntries
    .filter((e) => !e.is_deleted)
    .map((e) => {
      const companyName = e.company_name || e.item || '';
      const mappedPerson = mapMidPersonClassification(e.person);
      const incAmt = e.incoming_amount != null ? Number(e.incoming_amount) : (e.deepak_amount != null ? Number(e.deepak_amount) : null);
      const outAmt = e.outgoing_amount != null ? Number(e.outgoing_amount) : (e.elumugam_amount != null ? Number(e.elumugam_amount) : null);

      return {
        ...e,
        company_name: companyName,
        item: e.item || companyName,
        category: e.category || 'General',
        person: mappedPerson,
        amount: Number(e.amount || 0),
        incoming_amount: incAmt,
        outgoing_amount: outAmt,
        deepak_amount: incAmt,
        elumugam_amount: outAmt,
      };
    });

  if (taskId && isUUID(taskId)) {
    list = list.filter(
      (e) => !e.task_id || e.task_id === taskId
    );
  }

  if (categoryFilter && categoryFilter !== 'All') {
    list = list.filter((e) => e.category === categoryFilter);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (e) =>
        (e.company_name && e.company_name.toLowerCase().includes(q)) ||
        (e.item && e.item.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        e.person.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.date.includes(q)
    );
  }

  return list;
}

export async function createMidFinanceEntry(
  entry: Omit<MidFinanceEntry, 'id' | 'created_at' | 'updated_at'>
): Promise<MidFinanceEntry> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { data: { user } } = await supabase.auth.getUser();
  const createdBy = entry.created_by || user?.id || 'anonymous';
  const targetTaskId = isUUID(entry.task_id) ? entry.task_id : null;

  // Server-side / Service-level check: Verify admin permission or user finance entry lock
  if (user) {
    const isDefaultAdmin = user.email?.toLowerCase() === 'admin@dm.com';
    if (!isDefaultAdmin) {
      const { data: rpcAdmin } = await supabase.rpc('is_admin', { uid: user.id });
      if (rpcAdmin === false) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!adminData) {
          let isLocked = false;
          try {
            const { data: permData, error: permError } = await supabase
              .from('user_permissions')
              .select('finance_entry_access')
              .eq('user_id', user.id)
              .maybeSingle();

            if (!permError && permData) {
              isLocked = permData.finance_entry_access === 'locked';
            } else {
              const localMap = getLocalUserFinanceAccessMap();
              isLocked = localMap[user.id] === 'locked';
            }
          } catch {
            const localMap = getLocalUserFinanceAccessMap();
            isLocked = localMap[user.id] === 'locked';
          }

          if (isLocked) {
            throw new Error('MID Finance entry access is locked by administrator.');
          }
        }
      }
    }
  }

  const companyName = entry.company_name?.trim() || entry.item?.trim() || 'General';
  const mappedPerson = mapMidPersonClassification(entry.person);
  const incVal = entry.incoming_amount != null ? Number(entry.incoming_amount) : (entry.deepak_amount != null ? Number(entry.deepak_amount) : null);
  const outVal = entry.outgoing_amount != null ? Number(entry.outgoing_amount) : (entry.elumugam_amount != null ? Number(entry.elumugam_amount) : null);

  const newRecord: MidFinanceEntry = {
    ...entry,
    id: newId,
    task_id: targetTaskId || entry.task_id,
    company_name: companyName,
    item: companyName,
    category: entry.category || 'General',
    person: mappedPerson,
    amount: Number(entry.amount),
    incoming_amount: incVal,
    outgoing_amount: outVal,
    elumugam_amount: outVal,
    deepak_amount: incVal,
    is_deleted: false,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  };

  try {
    let { data, error } = await supabase
      .from('mid_finance_entries')
      .insert({
        id: newId,
        task_id: targetTaskId,
        date: entry.date,
        company_name: companyName,
        item: companyName,
        category: entry.category || 'General',
        description: entry.description,
        person: mappedPerson,
        amount: entry.amount,
        incoming_amount: incVal,
        outgoing_amount: outVal,
        elumugam_amount: outVal,
        deepak_amount: incVal,
        is_deleted: false,
        created_by: createdBy,
      })
      .select('*')
      .single();

    if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('schema cache'))) {
      const fallbackResult = await supabase
        .from('mid_finance_entries')
        .insert({
          id: newId,
          task_id: targetTaskId,
          date: entry.date,
          item: companyName,
          category: entry.category || 'General',
          description: entry.description,
          person: mappedPerson,
          amount: entry.amount,
          elumugam_amount: outVal,
          deepak_amount: incVal,
          is_deleted: false,
          created_by: createdBy,
        })
        .select('*')
        .single();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      const errStatus = (error as any)?.status;
      if (
        error.code === '42501' ||
        errStatus === 403 ||
        error.message?.includes('policy') ||
        error.message?.includes('permission')
      ) {
        throw new Error('MID Finance entry access is locked by administrator.');
      }
      memoryMidFinanceEntries.unshift(newRecord);
      saveMemoryMidEntries();
      return newRecord;
    }

    if (!data) {
      memoryMidFinanceEntries.unshift(newRecord);
      saveMemoryMidEntries();
      return newRecord;
    }

    const resCompany = data.company_name || data.item || companyName;
    const resPerson = mapMidPersonClassification(data.person);
    const resInc = data.incoming_amount != null ? Number(data.incoming_amount) : (data.deepak_amount != null ? Number(data.deepak_amount) : null);
    const resOut = data.outgoing_amount != null ? Number(data.outgoing_amount) : (data.elumugam_amount != null ? Number(data.elumugam_amount) : null);

    return {
      ...data,
      company_name: resCompany,
      item: data.item || resCompany,
      category: data.category || 'General',
      person: resPerson,
      amount: Number(data.amount || 0),
      incoming_amount: resInc,
      outgoing_amount: resOut,
      elumugam_amount: resOut,
      deepak_amount: resInc,
    } as MidFinanceEntry;
  } catch (err: any) {
    if (
      err.message === 'MID Finance entry access is locked by administrator.' ||
      err.message === 'Only administrators can add finance entries.'
    ) {
      throw err;
    }
    memoryMidFinanceEntries.unshift(newRecord);
    saveMemoryMidEntries();
    return newRecord;
  }
}

export async function updateMidFinanceEntry(
  id: string,
  updates: Partial<Omit<MidFinanceEntry, 'id' | 'task_id'>>
): Promise<void> {
  const payload: any = { ...updates, updated_at: new Date().toISOString() };
  if (updates.company_name) {
    payload.company_name = updates.company_name;
    payload.item = updates.company_name;
  }
  if (updates.person) {
    payload.person = mapMidPersonClassification(updates.person);
  }
  if (updates.incoming_amount !== undefined) {
    payload.deepak_amount = updates.incoming_amount;
    payload.incoming_amount = updates.incoming_amount;
  }
  if (updates.outgoing_amount !== undefined) {
    payload.elumugam_amount = updates.outgoing_amount;
    payload.outgoing_amount = updates.outgoing_amount;
  }

  try {
    let { error } = await supabase
      .from('mid_finance_entries')
      .update(payload)
      .eq('id', id);

    if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('schema cache'))) {
      const safePayload = { ...payload };
      delete safePayload.company_name;
      delete safePayload.incoming_amount;
      delete safePayload.outgoing_amount;
      const res = await supabase
        .from('mid_finance_entries')
        .update(safePayload)
        .eq('id', id);
      error = res.error;
    }

    if (error) {
      updateMemoryMidEntry(id, payload);
    }
  } catch {
    updateMemoryMidEntry(id, payload);
  }
}

function updateMemoryMidEntry(
  id: string,
  updates: Partial<Omit<MidFinanceEntry, 'id' | 'task_id'>>
) {
  memoryMidFinanceEntries = memoryMidFinanceEntries.map((e) =>
    e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
  );
  saveMemoryMidEntries();
}

export async function deleteMidFinanceEntry(id: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const { error } = await supabase
      .from('mid_finance_entries')
      .update({
        is_deleted: true,
        deleted_at: now,
      })
      .eq('id', id);

    if (error) {
      memoryMidFinanceEntries = memoryMidFinanceEntries.map((e) =>
        e.id === id ? { ...e, is_deleted: true, deleted_at: now } : e
      );
      saveMemoryMidEntries();
    }
  } catch {
    memoryMidFinanceEntries = memoryMidFinanceEntries.map((e) =>
      e.id === id ? { ...e, is_deleted: true, deleted_at: now } : e
    );
    saveMemoryMidEntries();
  }
}

export async function getTrashMidFinanceEntries(): Promise<MidFinanceEntry[]> {
  try {
    const { data, error } = await supabase
      .from('mid_finance_entries')
      .select('*')
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false });

    if (error || !data) {
      return memoryMidFinanceEntries
        .filter((e) => e.is_deleted)
        .map((e) => ({ ...e, item: mapMidLegacyItemName(e.item) }));
    }

    return (data || []).map((row: any) => ({
      ...row,
      item: mapMidLegacyItemName(row.item),
      amount: Number(row.amount || 0),
      elumugam_amount: row.elumugam_amount != null ? Number(row.elumugam_amount) : null,
      deepak_amount: row.deepak_amount != null ? Number(row.deepak_amount) : null,
    })) as MidFinanceEntry[];
  } catch {
    return memoryMidFinanceEntries
      .filter((e) => e.is_deleted)
      .map((e) => ({ ...e, item: mapMidLegacyItemName(e.item) }));
  }
}

export async function restoreMidFinanceEntry(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('mid_finance_entries')
      .update({
        is_deleted: false,
        deleted_at: null,
      })
      .eq('id', id);

    if (error) {
      memoryMidFinanceEntries = memoryMidFinanceEntries.map((e) =>
        e.id === id ? { ...e, is_deleted: false, deleted_at: null } : e
      );
      saveMemoryMidEntries();
    }
  } catch {
    memoryMidFinanceEntries = memoryMidFinanceEntries.map((e) =>
      e.id === id ? { ...e, is_deleted: false, deleted_at: null } : e
    );
    saveMemoryMidEntries();
  }
}

export async function permanentDeleteMidFinanceEntry(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('mid_finance_entries')
      .delete()
      .eq('id', id);

    if (error) {
      memoryMidFinanceEntries = memoryMidFinanceEntries.filter((e) => e.id !== id);
      saveMemoryMidEntries();
    }
  } catch {
    memoryMidFinanceEntries = memoryMidFinanceEntries.filter((e) => e.id !== id);
    saveMemoryMidEntries();
  }
}

export function subscribeToMidFinanceChange(onUpdate: () => void) {
  const channel = supabase
    .channel('global-mid-finance-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'mid_finance_entries' },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
