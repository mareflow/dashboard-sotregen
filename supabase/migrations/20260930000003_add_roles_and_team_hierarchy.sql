-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coordenador', 'gestor')) DEFAULT 'gestor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Insert existing users into profiles
INSERT INTO public.profiles (id, email, role, full_name)
SELECT 
  id, 
  email,
  CASE 
    WHEN email = 'ia.mareflow@gmail.com' THEN 'admin'
    ELSE 'gestor'
  END,
  split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role;

-- 3. Function to get user role securely
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

-- 4. Trigger function to auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'ia.mareflow@gmail.com' THEN 'admin'
      ELSE 'gestor'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Profiles RLS Policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'coordenador')
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id 
    OR public.get_user_role(auth.uid()) = 'admin'
  );

-- 6. Updated Clients RLS Policies
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
CREATE POLICY "clients_select_policy" ON public.clients
  FOR SELECT
  USING (
    owner_id = auth.uid() 
    OR public.get_user_role(auth.uid()) IN ('admin', 'coordenador')
  );

DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
CREATE POLICY "clients_insert_policy" ON public.clients
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
CREATE POLICY "clients_update_policy" ON public.clients
  FOR UPDATE
  USING (
    owner_id = auth.uid() 
    OR public.get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;
CREATE POLICY "clients_delete_policy" ON public.clients
  FOR DELETE
  USING (
    owner_id = auth.uid() 
    OR public.get_user_role(auth.uid()) = 'admin'
  );

-- 7. Updated Meta Ad Accounts RLS Policies
DROP POLICY IF EXISTS "Users can view their ad accounts" ON public.meta_ad_accounts;
DROP POLICY IF EXISTS "meta_ad_accounts_select_policy" ON public.meta_ad_accounts;
CREATE POLICY "meta_ad_accounts_select_policy" ON public.meta_ad_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = meta_ad_accounts.client_id
      AND (c.owner_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'coordenador'))
    )
  );

DROP POLICY IF EXISTS "Users can insert ad accounts" ON public.meta_ad_accounts;
DROP POLICY IF EXISTS "meta_ad_accounts_insert_policy" ON public.meta_ad_accounts;
CREATE POLICY "meta_ad_accounts_insert_policy" ON public.meta_ad_accounts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = meta_ad_accounts.client_id
      AND (c.owner_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can update their ad accounts" ON public.meta_ad_accounts;
DROP POLICY IF EXISTS "meta_ad_accounts_update_policy" ON public.meta_ad_accounts;
CREATE POLICY "meta_ad_accounts_update_policy" ON public.meta_ad_accounts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = meta_ad_accounts.client_id
      AND (c.owner_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can delete their ad accounts" ON public.meta_ad_accounts;
DROP POLICY IF EXISTS "meta_ad_accounts_delete_policy" ON public.meta_ad_accounts;
CREATE POLICY "meta_ad_accounts_delete_policy" ON public.meta_ad_accounts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = meta_ad_accounts.client_id
      AND (c.owner_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
  );
