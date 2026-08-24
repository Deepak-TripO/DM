-- 010_rpc_functions.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper RPC for updating storage used
CREATE OR REPLACE FUNCTION public.update_storage_used(
    target_user_id UUID,
    delta BIGINT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.storage_quotas
    SET used_bytes = GREATEST(0, used_bytes + delta),
        updated_at = NOW()
    WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper RPC for verifying password protected share link
CREATE OR REPLACE FUNCTION public.verify_share_password(
    share_token TEXT,
    password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT password_hash INTO stored_hash
    FROM public.shares
    WHERE token = share_token
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW());

    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Compare exact or bcrypt
    IF stored_hash = password THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for admin dashboard statistics
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB AS $$
DECLARE
    user_count INT;
    file_count INT;
    total_used BIGINT;
    total_alloc BIGINT;
    share_count INT;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT COUNT(*) INTO user_count FROM public.profiles;
    SELECT COUNT(*) INTO file_count FROM public.files WHERE deleted_at IS NULL;
    SELECT COALESCE(SUM(used_bytes), 0), COALESCE(SUM(quota_bytes), 0)
    INTO total_used, total_alloc FROM public.storage_quotas;
    SELECT COUNT(*) INTO share_count FROM public.shares WHERE revoked_at IS NULL;

    RETURN jsonb_build_object(
        'totalUsers', user_count,
        'totalFiles', file_count,
        'totalUsed', total_used,
        'totalAllocated', total_alloc,
        'activeShares', share_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
