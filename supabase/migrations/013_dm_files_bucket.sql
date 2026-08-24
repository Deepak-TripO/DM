-- 013_dm_files_bucket.sql
-- Create dedicated single Supabase storage bucket 'dm-files' and admin RLS policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('dm-files', 'dm-files', false, 5368709120, NULL) -- 5GB max file size
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for dm-files bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload to dm-files." ON storage.objects;
CREATE POLICY "Allow authenticated users to upload to dm-files."
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'dm-files'
        AND (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Allow users to read their dm-files." ON storage.objects;
CREATE POLICY "Allow users to read their dm-files."
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'dm-files'
        AND (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Allow users to delete their dm-files." ON storage.objects;
CREATE POLICY "Allow users to delete their dm-files."
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'dm-files'
        AND (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

-- Admin RLS Policies for public.folders table
DROP POLICY IF EXISTS "Admins can view all folders." ON public.folders;
CREATE POLICY "Admins can view all folders."
    ON public.folders FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can manage all folders." ON public.folders;
CREATE POLICY "Admins can manage all folders."
    ON public.folders FOR ALL
    USING (public.is_admin(auth.uid()) OR auth.uid() = owner_id);
