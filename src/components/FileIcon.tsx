import {
  FileText,
  Image,
  Video,
  Music,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  FileCode,
  File,
  FileType,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFileCategory } from '@/utils';
import type { FileCategory } from '@/types';

const categoryIcons: Record<FileCategory, typeof File> = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  pdf: FileType,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  archive: FileArchive,
  code: FileCode,
  other: File,
};

const categoryColors: Record<FileCategory, { text: string; bg: string }> = {
  image: { text: '#5B9FF3', bg: '#EAF4FF' },
  video: { text: '#3B82D0', bg: '#EAF4FF' },
  audio: { text: '#8A6FD1', bg: '#F3EEFF' },
  document: { text: '#4D94E8', bg: '#EAF4FF' },
  pdf: { text: '#D95C68', bg: '#FDECEF' },
  spreadsheet: { text: '#38A169', bg: '#EAF8F1' },
  presentation: { text: '#E49A42', bg: '#FFF7E6' },
  archive: { text: '#D79A35', bg: '#FFF7E6' },
  code: { text: '#4D94E8', bg: '#EAF4FF' },
  other: { text: '#718198', bg: '#F3F8FD' },
};

interface FileIconProps {
  extension: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FileIcon({ extension, size = 'md', className }: FileIconProps) {
  const category = getFileCategory(extension);
  const Icon = categoryIcons[category];
  const style = categoryColors[category];

  const sizeClasses = {
    sm: 'h-8 w-8 rounded-xl',
    md: 'h-10 w-10 rounded-2xl',
    lg: 'h-14 w-14 rounded-3xl',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };

  return (
    <div
      className={cn('flex items-center justify-center shrink-0 border border-[var(--dm-border)]/40', sizeClasses[size], className)}
      style={{ color: style.text, backgroundColor: style.bg }}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );
}
