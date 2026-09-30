-- ==============================================================================
-- Maré Flow - Meta Ads Dashboard Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create meta_ad_accounts table
CREATE TABLE IF NOT EXISTS public.meta_ad_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    account_name TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON public.clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_accounts_client_id ON public.meta_ad_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_accounts_account_id ON public.meta_ad_accounts(account_id);

-- 4. Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ad_accounts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for clients
-- Authenticated users can only see and manipulate their own clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
CREATE POLICY "Users can view their own clients"
    ON public.clients
    FOR SELECT
    TO authenticated
    USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
CREATE POLICY "Users can insert their own clients"
    ON public.clients
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
CREATE POLICY "Users can update their own clients"
    ON public.clients
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
CREATE POLICY "Users can delete their own clients"
    ON public.clients
    FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- 6. RLS Policies for meta_ad_accounts
-- Ad accounts inherit access permissions through client ownership (client.owner_id = auth.uid())
DROP POLICY IF EXISTS "Users can view ad accounts of their clients" ON public.meta_ad_accounts;
CREATE POLICY "Users can view ad accounts of their clients"
    ON public.meta_ad_accounts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = meta_ad_accounts.client_id
              AND c.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert ad accounts for their clients" ON public.meta_ad_accounts;
CREATE POLICY "Users can insert ad accounts for their clients"
    ON public.meta_ad_accounts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = meta_ad_accounts.client_id
              AND c.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update ad accounts of their clients" ON public.meta_ad_accounts;
CREATE POLICY "Users can update ad accounts of their clients"
    ON public.meta_ad_accounts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = meta_ad_accounts.client_id
              AND c.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = meta_ad_accounts.client_id
              AND c.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete ad accounts of their clients" ON public.meta_ad_accounts;
CREATE POLICY "Users can delete ad accounts of their clients"
    ON public.meta_ad_accounts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = meta_ad_accounts.client_id
              AND c.owner_id = auth.uid()
        )
    );
