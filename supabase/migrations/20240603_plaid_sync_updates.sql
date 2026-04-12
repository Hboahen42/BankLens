-- Add next_cursor to plaid_connections
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plaid_connections' AND column_name = 'next_cursor') THEN
    ALTER TABLE public.plaid_connections ADD COLUMN next_cursor text;
  END IF;
END $$;

-- Update plaid_transactions to better handle sync
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plaid_transactions' AND column_name = 'pending_transaction_id') THEN
    ALTER TABLE public.plaid_transactions ADD COLUMN pending_transaction_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'plaid_transactions' AND column_name = 'updated_at') THEN
    ALTER TABLE public.plaid_transactions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create an index on transaction_id for faster lookups during sync
-- Cleanup duplicates before creating unique index
DELETE FROM public.plaid_transactions t1
USING public.plaid_transactions t2
WHERE t1.id < t2.id 
  AND t1.transaction_id = t2.transaction_id;

CREATE UNIQUE INDEX IF NOT EXISTS plaid_transactions_transaction_id_idx ON public.plaid_transactions (transaction_id);
