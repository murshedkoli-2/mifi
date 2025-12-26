import { supabase } from './supabase';

// Type definitions
export interface Account {
    id: string;
    user_id: string;
    name: string;
    type: 'cash' | 'bank' | 'card' | 'savings' | 'mobile-banking';
    balance: number;
    color: string;
    account_number?: string;
    created_at: string;
}

export interface Category {
    id: string;
    user_id: string | null;
    name: string;
    icon: string;
    color: string;
    type: 'income' | 'expense';
    is_default: boolean;
    created_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    account_id: string;
    category_id: string | null;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    created_at: string;
}

export interface TransactionWithDetails extends Transaction {
    account?: Account;
    category?: Category;
}

// Account functions
export async function getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function addAccount(account: {
    name: string;
    type: 'cash' | 'bank' | 'card' | 'savings' | 'mobile-banking';
    balance: number;
    color: string;
    account_number?: string;
}): Promise<Account> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('accounts')
        .insert([{ ...account, user_id: user.id }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateAccountBalance(accountId: string, amount: number): Promise<void> {
    const { error } = await supabase.rpc('update_account_balance', {
        account_id: accountId,
        amount_change: amount,
    });

    if (error) {
        // If RPC doesn't exist, use direct update
        const { data: account } = await supabase
            .from('accounts')
            .select('balance')
            .eq('id', accountId)
            .single();

        if (account) {
            const { error: updateError } = await supabase
                .from('accounts')
                .update({ balance: account.balance + amount })
                .eq('id', accountId);

            if (updateError) throw updateError;
        }
    }
}

// Category functions
export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
    let query = supabase
        .from('categories')
        .select('*')
        .order('name');

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

// Transaction functions
export async function getTransactions(limit?: number): Promise<TransactionWithDetails[]> {
    let query = supabase
        .from('transactions')
        .select(`
            *,
            account:accounts(*),
            category:categories(*)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

export async function addTransaction(transaction: {
    account_id: string;
    category_id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
}): Promise<Transaction> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Start transaction
    const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single();

    if (error) throw error;

    // Update account balance
    const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    await updateAccountBalance(transaction.account_id, balanceChange);

    return data;
}

// Statistics functions
export async function getTotalBalance(): Promise<number> {
    const accounts = await getAccounts();
    return accounts.reduce((sum, account) => sum + account.balance, 0);
}

export async function getIncome(startDate: string, endDate: string): Promise<number> {
    const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) throw error;
    return (data || []).reduce((sum, t) => sum + t.amount, 0);
}

export async function getMonthlyIncome(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return getIncome(startOfMonth, endOfMonth);
}

export async function getExpenses(startDate: string, endDate: string): Promise<number> {
    const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) throw error;
    return (data || []).reduce((sum, t) => sum + t.amount, 0);
}

export async function getMonthlyExpenses(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return getExpenses(startOfMonth, endOfMonth);
}

export async function getSpendingByCategory(startDate?: string, endDate?: string) {
    let query = supabase
        .from('transactions')
        .select(`
            amount,
            category:categories(name, icon, color)
        `)
        .eq('type', 'expense');

    if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const categoryTotals: { [key: string]: { amount: number; icon: string; color: string } } = {};

    (data || []).forEach((t: any) => {
        if (t.category) {
            const name = t.category.name;
            if (categoryTotals[name]) {
                categoryTotals[name].amount += t.amount;
            } else {
                categoryTotals[name] = {
                    amount: t.amount,
                    icon: t.category.icon,
                    color: t.category.color,
                };
            }
        }
    });

    return Object.entries(categoryTotals)
        .map(([category, data]) => ({
            category,
            amount: data.amount,
            icon: data.icon,
            color: data.color,
        }))
        .sort((a, b) => b.amount - a.amount);
}
