const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(decimals)} ${SIZE_UNITS[i]}`;
}

export function parseBytes(value: number, unit: 'B' | 'KB' | 'MB' | 'GB' | 'TB'): number {
  const k = 1024;
  const unitIndex = SIZE_UNITS.indexOf(unit);
  return value * Math.pow(k, unitIndex);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts.pop()?.toLowerCase() || '';
}

export function getFileNameWithoutExtension(filename: string): string {
  const ext = getFileExtension(filename);
  if (!ext) return filename;
  return filename.slice(0, -(ext.length + 1));
}

import type { FileCategory } from '@/types';

const CATEGORY_MAP: Record<string, FileCategory> = {
  // Images
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', gif: 'image', svg: 'image',
  // Videos
  mp4: 'video', webm: 'video', mov: 'video', avi: 'video',
  // Audio
  mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',
  // Documents
  doc: 'document', docx: 'document', odt: 'document', txt: 'document', rtf: 'document',
  // PDF
  pdf: 'pdf',
  // Spreadsheets
  xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet', ods: 'spreadsheet',
  // Presentations
  ppt: 'presentation', pptx: 'presentation', odp: 'presentation',
  // Archives
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  // Code/Data
  json: 'code', xml: 'code', sql: 'code', log: 'code', md: 'code', yaml: 'code', yml: 'code',
  js: 'code', ts: 'code', tsx: 'code', jsx: 'code', html: 'code', css: 'code',
  py: 'code', java: 'code', cpp: 'code', c: 'code', rs: 'code', go: 'code',
};

export function getFileCategory(extension: string): FileCategory {
  return CATEGORY_MAP[extension.toLowerCase()] || 'other';
}

export function getCategoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    document: 'Document',
    pdf: 'PDF',
    spreadsheet: 'Spreadsheet',
    presentation: 'Presentation',
    archive: 'Archive',
    code: 'Code',
    other: 'File',
  };
  return labels[category];
}

export function isPreviewable(extension: string): boolean {
  const previewable = new Set([
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
    'mp4', 'webm',
    'mp3', 'wav', 'ogg', 'm4a',
    'pdf',
    'txt', 'md', 'json', 'xml', 'sql', 'log', 'yaml', 'yml',
    'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp', 'c',
    'csv',
  ]);
  return previewable.has(extension.toLowerCase());
}

export function generateShareToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSharePassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join('');
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
