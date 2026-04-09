-- Plaid connections table
CREATE TABLE IF NOT EXISTS public.plaid_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  item_id text NOT NULL,
  institution_id text,
  institution_name text,
  institution_color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Plaid accounts table
CREATE TABLE IF NOT EXISTS public.plaid_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.plaid_connections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id text NOT NULL,
  name text,
  official_name text,
  type text,
  subtype text,
  current_balance numeric,
  available_balance numeric,
  currency_code text DEFAULT 'USD',
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Plaid transactions table
CREATE TABLE IF NOT EXISTS public.plaid_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.plaid_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id text NOT NULL,
  merchant_name text,
  name text,
  amount numeric NOT NULL,
  date date NOT NULL,
  category text,
  category_icon text,
  pending boolean DEFAULT false,
  currency_code text DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.plaid_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plaid_transactions;
