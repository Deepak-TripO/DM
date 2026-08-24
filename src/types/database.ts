export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          preferences?: Json;
          updated_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          owner_id: string;
          parent_id: string | null;
          name: string;
          is_starred: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          parent_id?: string | null;
          name: string;
          is_starred?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          parent_id?: string | null;
          name?: string;
          is_starred?: boolean;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      files: {
        Row: {
          id: string;
          owner_id: string;
          folder_id: string | null;
          name: string;
          original_name: string;
          storage_path: string;
          mime_type: string;
          extension: string;
          size_bytes: number;
          metadata: Json;
          is_starred: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          folder_id?: string | null;
          name: string;
          original_name: string;
          storage_path: string;
          mime_type: string;
          extension: string;
          size_bytes: number;
          metadata?: Json;
          is_starred?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          folder_id?: string | null;
          name?: string;
          storage_path?: string;
          metadata?: Json;
          is_starred?: boolean;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      shares: {
        Row: {
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
        };
        Insert: {
          id?: string;
          owner_id: string;
          file_id?: string | null;
          folder_id?: string | null;
          token: string;
          password_hash?: string | null;
          password_enabled?: boolean;
          allow_download?: boolean;
          expires_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          password_hash?: string | null;
          password_enabled?: boolean;
          allow_download?: boolean;
          expires_at?: string | null;
          revoked_at?: string | null;
          updated_at?: string;
        };
      };
      share_access_logs: {
        Row: {
          id: string;
          share_id: string;
          accessed_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          share_id: string;
          accessed_at?: string;
          metadata?: Json;
        };
        Update: Record<string, never>;
      };
      storage_quotas: {
        Row: {
          user_id: string;
          quota_bytes: number;
          used_bytes: number;
          is_custom: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          quota_bytes?: number;
          used_bytes?: number;
          is_custom?: boolean;
          updated_at?: string;
        };
        Update: {
          quota_bytes?: number;
          used_bytes?: number;
          is_custom?: boolean;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          file_id: string | null;
          folder_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          file_id?: string | null;
          folder_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      admin_users: {
        Row: {
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          role?: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: { uid: string };
        Returns: boolean;
      };
      get_admin_stats: {
        Args: Record<string, never>;
        Returns: Json;
      };
      verify_share_password: {
        Args: { share_token: string; password: string };
        Returns: boolean;
      };
      update_storage_used: {
        Args: { target_user_id: string; delta: number };
        Returns: void;
      };
    };
  };
}
