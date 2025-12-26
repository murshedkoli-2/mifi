-- Quick Diagnostic Query for ExpoFinance
-- Run this in Supabase SQL Editor to check your database status

-- 1. Check if accounts table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'accounts'
ORDER BY ordinal_position;

-- 2. Check the current constraint on account type
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.accounts'::regclass
  AND conname LIKE '%type%';

-- 3. Check if there are any existing accounts
SELECT COUNT(*) as total_accounts FROM accounts;

-- Expected Results:
-- - You should see columns: id, user_id, name, type, balance, color, account_number, created_at
-- - The type constraint should include: 'cash', 'bank', 'card', 'savings', 'mobile-banking'
-- - If account_number column is missing or mobile-banking is not in constraint, run the migration
