-- ==============================================================================
-- Migration: Add Account Balance and Extended Metrics
-- ==============================================================================

ALTER TABLE public.meta_ad_accounts
ADD COLUMN IF NOT EXISTS balance_type TEXT DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS manual_balance NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC DEFAULT NULL;

ALTER TABLE public.clients
ALTER COLUMN visible_metrics SET DEFAULT ARRAY['balance', 'spend', 'leads', 'cpl', 'ctr', 'cpc', 'cpm', 'clicks', 'impressions', 'reach', 'frequency'];
