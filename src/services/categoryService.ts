import { supabase } from '@/lib/supabase/client';
import type { CategoryItem, FileCategory } from '@/types';

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Documents', type: 'document', status: 'Active', created_at: new Date(Date.now() - 86400000 * 30).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Images', type: 'image', status: 'Active', created_at: new Date(Date.now() - 86400000 * 25).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Videos', type: 'video', status: 'Active', created_at: new Date(Date.now() - 86400000 * 20).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Audio', type: 'audio', status: 'Active', created_at: new Date(Date.now() - 86400000 * 15).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-5', name: 'PDF Documents', type: 'pdf', status: 'Active', created_at: new Date(Date.now() - 86400000 * 10).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Spreadsheets', type: 'spreadsheet', status: 'Active', created_at: new Date(Date.now() - 86400000 * 8).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-7', name: 'Presentations', type: 'presentation', status: 'Active', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-8', name: 'Archives & ZIPs', type: 'archive', status: 'Active', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-9', name: 'Source Code', type: 'code', status: 'Inactive', created_at: new Date(Date.now() - 86400000 * 1).toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-10', name: 'Other Files', type: 'other', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

let memoryCategories: CategoryItem[] = [...DEFAULT_CATEGORIES];

export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return memoryCategories;
    }
    return data as CategoryItem[];
  } catch {
    return memoryCategories;
  }
}

export async function createCategory(input: {
  name: string;
  type: FileCategory;
  status: 'Active' | 'Inactive';
}): Promise<CategoryItem> {
  const newCat: CategoryItem = {
    id: `cat-${Date.now()}`,
    name: input.name.trim(),
    type: input.type,
    status: input.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: input.name.trim(),
        type: input.type,
        status: input.status,
      }])
      .select('*')
      .single();

    if (error || !data) {
      memoryCategories = [newCat, ...memoryCategories];
      return newCat;
    }
    return data as CategoryItem;
  } catch {
    memoryCategories = [newCat, ...memoryCategories];
    return newCat;
  }
}

export async function updateCategory(
  id: string,
  updates: {
    name?: string;
    type?: FileCategory;
    status?: 'Active' | 'Inactive';
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      memoryCategories = memoryCategories.map((cat) =>
        cat.id === id
          ? { ...cat, ...updates, updated_at: new Date().toISOString() }
          : cat
      );
    }
  } catch {
    memoryCategories = memoryCategories.map((cat) =>
      cat.id === id
        ? { ...cat, ...updates, updated_at: new Date().toISOString() }
        : cat
    );
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      memoryCategories = memoryCategories.map((cat) =>
        cat.id === id ? { ...cat, status: 'Inactive' as const } : cat
      );
    }
  } catch {
    memoryCategories = memoryCategories.map((cat) =>
      cat.id === id ? { ...cat, status: 'Inactive' as const } : cat
    );
  }
}
