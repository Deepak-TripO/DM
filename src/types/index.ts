export interface FileItem {
  id: string;
  owner_id: string;
  folder_id: string | null;
  name: string;
  original_name: string;
  storage_path: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  metadata: Record<string, unknown>;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FolderItem {
  id: string;
  owner_id: string;
  parent_id: string | null;
  name: string;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface StorageQuota {
  user_id: string;
  quota_bytes: number;
  used_bytes: number;
  is_custom: boolean;
  updated_at: string;
}

export interface ShareItem {
  id: string;
  owner_id: string;
  file_id: string | null;
  folder_id: string | null;
  token: string;
  password_hash: string | null;
  password_enabled: boolean;
  allow_download: boolean;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
  file?: FileItem;
  folder?: FolderItem;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  file_id: string | null;
  folder_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'pdf'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'other';

export type SortField = 'name' | 'created_at' | 'updated_at' | 'size_bytes' | 'extension';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  label: string;
  field: SortField;
  direction: SortDirection;
}

export interface ViewMode {
  type: 'grid' | 'list';
}

export type BreadcrumbItem = {
  id: string | null;
  name: string;
};
