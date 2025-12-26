// Mock data for development and UI testing

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    date: string;
    accountId: string;
}

export interface Account {
    id: string;
    name: string;
    type: 'cash' | 'bank' | 'card' | 'savings';
    balance: number;
    color: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'income' | 'expense';
}

export const mockAccounts: Account[] = [
    {
        id: '1',
        name: 'Cash Wallet',
        type: 'cash',
        balance: 5420.50,
        color: '#10B981',
    },
    {
        id: '2',
        name: 'Main Bank',
        type: 'bank',
        balance: 25340.00,
        color: '#3B82F6',
    },
    {
        id: '3',
        name: 'Credit Card',
        type: 'card',
        balance: -1250.00,
        color: '#EF4444',
    },
    {
        id: '4',
        name: 'Savings',
        type: 'savings',
        balance: 50000.00,
        color: '#8B5CF6',
    },
];

export const mockCategories: Category[] = [
    // Expense categories
    { id: '1', name: 'Food & Dining', icon: 'cutlery', color: '#EF4444', type: 'expense' },
    { id: '2', name: 'Transportation', icon: 'car', color: '#F59E0B', type: 'expense' },
    { id: '3', name: 'Shopping', icon: 'shopping-cart', color: '#EC4899', type: 'expense' },
    { id: '4', name: 'Bills & Utilities', icon: 'bolt', color: '#6366F1', type: 'expense' },
    { id: '5', name: 'Entertainment', icon: 'film', color: '#8B5CF6', type: 'expense' },
    { id: '6', name: 'Healthcare', icon: 'heartbeat', color: '#10B981', type: 'expense' },
    { id: '7', name: 'Education', icon: 'book', color: '#3B82F6', type: 'expense' },
    { id: '8', name: 'Other', icon: 'ellipsis-h', color: '#6B7280', type: 'expense' },

    // Income categories
    { id: '9', name: 'Salary', icon: 'cash', color: '#10B981', type: 'income' },
    { id: '10', name: 'Freelance', icon: 'briefcase', color: '#3B82F6', type: 'income' },
    { id: '11', name: 'Investment', icon: 'line-chart', color: '#8B5CF6', type: 'income' },
    { id: '12', name: 'Other Income', icon: 'gift', color: '#10B981', type: 'income' },
];

export const mockTransactions: Transaction[] = [
    {
        id: '1',
        description: 'Monthly Salary',
        amount: 50000,
        category: 'Salary',
        type: 'income',
        date: '2024-12-01',
        accountId: '2',
    },
    {
        id: '2',
        description: 'Grocery Shopping',
        amount: -2500,
        category: 'Food & Dining',
        type: 'expense',
        date: '2024-12-23',
        accountId: '1',
    },
    {
        id: '3',
        description: 'Uber Ride',
        amount: -350,
        category: 'Transportation',
        type: 'expense',
        date: '2024-12-23',
        accountId: '1',
    },
    {
        id: '4',
        description: 'Netflix Subscription',
        amount: -800,
        category: 'Entertainment',
        type: 'expense',
        date: '2024-12-22',
        accountId: '3',
    },
    {
        id: '5',
        description: 'Electricity Bill',
        amount: -1200,
        category: 'Bills & Utilities',
        type: 'expense',
        date: '2024-12-20',
        accountId: '2',
    },
    {
        id: '6',
        description: 'Amazon Purchase',
        amount: -3500,
        category: 'Shopping',
        type: 'expense',
        date: '2024-12-18',
        accountId: '3',
    },
    {
        id: '7',
        description: 'Freelance Project',
        amount: 15000,
        category: 'Freelance',
        type: 'income',
        date: '2024-12-15',
        accountId: '2',
    },
    {
        id: '8',
        description: 'Restaurant Dinner',
        amount: -1800,
        category: 'Food & Dining',
        type: 'expense',
        date: '2024-12-14',
        accountId: '1',
    },
    {
        id: '9',
        description: 'Gym Membership',
        amount: -1500,
        category: 'Healthcare',
        type: 'expense',
        date: '2024-12-10',
        accountId: '2',
    },
    {
        id: '10',
        description: 'Book Purchase',
        amount: -950,
        category: 'Education',
        type: 'expense',
        date: '2024-12-08',
        accountId: '1',
    },
];

export const getCategoryIcon = (categoryName: string): string => {
    const category = mockCategories.find(c => c.name === categoryName);
    return category?.icon || 'circle';
};

export const getCategoryColor = (categoryName: string): string => {
    const category = mockCategories.find(c => c.name === categoryName);
    return category?.color || '#6B7280';
};

export const getTotalBalance = (): number => {
    return mockAccounts.reduce((sum, account) => sum + account.balance, 0);
};

export const getMonthlyIncome = (): number => {
    const currentMonth = new Date().getMonth();
    return mockTransactions
        .filter(t => t.type === 'income' && new Date(t.date).getMonth() === currentMonth)
        .reduce((sum, t) => sum + t.amount, 0);
};

export const getMonthlyExpenses = (): number => {
    const currentMonth = new Date().getMonth();
    return Math.abs(
        mockTransactions
            .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
            .reduce((sum, t) => sum + t.amount, 0)
    );
};

export const getSpendingByCategory = () => {
    const categoryTotals: { [key: string]: number } = {};

    mockTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const amount = Math.abs(t.amount);
            if (categoryTotals[t.category]) {
                categoryTotals[t.category] += amount;
            } else {
                categoryTotals[t.category] = amount;
            }
        });

    return Object.entries(categoryTotals)
        .map(([category, amount]) => ({
            category,
            amount,
            color: getCategoryColor(category),
            icon: getCategoryIcon(category),
        }))
        .sort((a, b) => b.amount - a.amount);
};
