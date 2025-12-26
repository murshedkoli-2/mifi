-- ExpoFinance Database Schema
-- Run these commands in your Supabase SQL Editor

-- 1. Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'card', 'savings', 'mobile-banking')),
    balance NUMERIC DEFAULT 0,
    color TEXT DEFAULT '#3B82F6',
    account_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for accounts
CREATE POLICY "Users can view their own accounts"
    ON accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
    ON accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
    ON accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
    ON accounts FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Create RLS Policies for categories
CREATE POLICY "Users can view their own and default categories"
    ON categories FOR SELECT
    USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert their own categories"
    ON categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON categories FOR UPDATE
    USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own categories"
    ON categories FOR DELETE
    USING (auth.uid() = user_id AND is_default = false);

-- 7. Create RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);

-- 8. Insert default categories
INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
    (NULL, 'Food & Dining', 'cutlery', '#EF4444', 'expense', true),
    (NULL, 'Transportation', 'car', '#F59E0B', 'expense', true),
    (NULL, 'Shopping', 'shopping-cart', '#EC4899', 'expense', true),
    (NULL, 'Bills & Utilities', 'bolt', '#6366F1', 'expense', true),
    (NULL, 'Entertainment', 'film', '#8B5CF6', 'expense', true),
    (NULL, 'Healthcare', 'heartbeat', '#10B981', 'expense', true),
    (NULL, 'Education', 'book', '#3B82F6', 'expense', true),
    (NULL, 'Other', 'ellipsis-h', '#6B7280', 'expense', true),
    (NULL, 'Salary', 'cash', '#10B981', 'income', true),
    (NULL, 'Freelance', 'briefcase', '#3B82F6', 'income', true),
    (NULL, 'Investment', 'line-chart', '#8B5CF6', 'income', true),
    (NULL, 'Other Income', 'gift', '#10B981', 'income', true)
ON CONFLICT DO NOTHING;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
