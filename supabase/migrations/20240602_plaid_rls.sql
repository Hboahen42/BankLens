-- Enable RLS on plaid tables
ALTER TABLE public.plaid_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_transactions ENABLE ROW LEVEL SECURITY;

-- plaid_connections policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'plaid_connections'
    AND policyname = 'Users can view own connections'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own connections" ON public.plaid_connections
      FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text))';
  END IF;
END $$;

-- plaid_accounts policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'plaid_accounts'
    AND policyname = 'Users can view own accounts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own accounts" ON public.plaid_accounts
      FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text))';
  END IF;
END $$;

-- plaid_transactions policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'plaid_transactions'
    AND policyname = 'Users can view own transactions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own transactions" ON public.plaid_transactions
      FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text))';
  END IF;
END $$;
