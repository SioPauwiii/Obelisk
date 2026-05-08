-- ─────────────────────────────────────────────────────────────────────────────
-- Badges / Trophy Cabinet Migration
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add `received_vouches` to track how many times this user's posts have been vouched for
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS received_vouches int DEFAULT 0;

-- 2. Create RPC function to securely increment the received_vouches counter
CREATE OR REPLACE FUNCTION increment_received_vouches(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.users
  SET received_vouches = COALESCE(received_vouches, 0) + 1
  WHERE id = user_id;
$$;
