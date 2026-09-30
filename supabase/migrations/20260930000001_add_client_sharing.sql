-- ==============================================================================
-- Migration: Add Sharing and Metrics Visibility
-- ==============================================================================

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS visible_metrics TEXT[] DEFAULT ARRAY['spend', 'leads', 'cpl', 'ctr', 'cpc', 'cpm', 'clicks', 'impressions'];

-- Update existing clients
UPDATE public.clients 
SET share_token = encode(gen_random_bytes(16), 'hex')
WHERE share_token IS NULL;

-- Allow read access for clients with share_enabled
DROP POLICY IF EXISTS "Public can view client via share_token" ON public.clients;
CREATE POLICY "Public can view client via share_token"
    ON public.clients
    FOR SELECT
    TO anon
    USING (share_enabled = true);

DROP POLICY IF EXISTS "Public can view accounts for shared clients" ON public.meta_ad_accounts;
CREATE POLICY "Public can view accounts for shared clients"
    ON public.meta_ad_accounts
    FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = meta_ad_accounts.client_id
              AND c.share_enabled = true
        )
    );
