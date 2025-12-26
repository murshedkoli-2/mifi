-- Migration: Add mobile-banking account type and account_number field
-- Run this in your Supabase SQL Editor to update existing database

-- 1. Add account_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' AND column_name = 'account_number'
    ) THEN
        ALTER TABLE accounts ADD COLUMN account_number TEXT;
    END IF;
END $$;

-- 2. Update the type check constraint to include 'mobile-banking'
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check 
    CHECK (type IN ('cash', 'bank', 'card', 'savings', 'mobile-banking'));

-- 3. Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts'
ORDER BY ordinal_position;
