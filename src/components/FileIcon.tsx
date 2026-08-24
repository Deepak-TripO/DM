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

const categoryColors: Record<FileCategory, string> = {
  image: 'text-emerald-500 neu-circle',
  video: 'text-purple-500 neu-circle',
  audio: 'text-pink-500 neu-circle',
  document: 'text-blue-500 neu-circle',
  pdf: 'text-red-500 neu-circle',
  spreadsheet: 'text-green-500 neu-circle',
  presentation: 'text-amber-500 neu-circle',
  archive: 'text-orange-500 neu-circle',
  code: 'text-indigo-500 neu-circle',
  other: 'text-gray-500 neu-circle',
};

interface FileIconProps {
  extension: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FileIcon({ extension, size = 'md', className }: FileIconProps) {
  const category = getFileCategory(extension);
  const Icon = categoryIcons[category];
  const colorClass = categoryColors[category];

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
    <div className={cn('flex items-center justify-center shrink-0', sizeClasses[size], colorClass, className)}>
      <Icon className={iconSizes[size]} />
    </div>
  );
}
