-- 009_storage_bucket.sql
-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('files', 'files', false, 5368709120, NULL) -- 5GB max file size
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for files bucket
CREATE POLICY "Allow authenticated users to upload to their path."
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'files'
        AND (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "Allow users to read their own files."
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'files'
        AND (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "Allow users to delete their own files."
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'files'
        AND (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

-- Storage RLS Policies for avatars bucket
CREATE POLICY "Public read avatars."
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

CREATE POLICY "Users update own avatar."
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users delete own avatar."
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
