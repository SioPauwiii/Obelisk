-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Soulbound Token System
-- Run these in Supabase SQL Editor in order.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Vouches table — tracks who vouched for what (one vouch per user per post)
CREATE TABLE IF NOT EXISTS public.vouches (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid        NOT NULL REFERENCES public.posts(id)  ON DELETE CASCADE,
  voucher_id  uuid        NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (post_id, voucher_id)   -- prevents duplicate vouches
);

CREATE INDEX IF NOT EXISTS idx_vouches_post_id    ON public.vouches (post_id);
CREATE INDEX IF NOT EXISTS idx_vouches_voucher_id ON public.vouches (voucher_id);

-- 2. SBT mint tracking columns on posts
--    (tx_hash and contract_address already exist from the original schema)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS sbt_token_id       text,
  ADD COLUMN IF NOT EXISTS sbt_minted_at      timestamptz,
  ADD COLUMN IF NOT EXISTS sbt_mint_status    text DEFAULT 'none',
  --  'none'             → vouch_count < 1, no mint triggered
  --  'pending'          → first vouch received, mint queued
  --  'minting'          → mint tx submitted, awaiting confirmation
  --  'success'          → minted, tx_hash + sbt_token_id populated
  --  'failed'           → last attempt failed, will retry
  --  'failed_permanent' → 3 attempts exhausted, manual intervention needed
  ADD COLUMN IF NOT EXISTS sbt_mint_attempts  int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sbt_mint_error     text;

CREATE INDEX IF NOT EXISTS idx_posts_sbt_mint_status ON public.posts (sbt_mint_status)
  WHERE sbt_mint_status IN ('pending', 'failed');
