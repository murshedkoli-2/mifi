import QuickAddModal from '@/components/QuickAddModal';
import StatCard from '@/components/StatCard';
import TransactionCard from '@/components/TransactionCard';
import { useSettings } from '@/context/SettingsContext';
import {
  getMonthlyExpenses,
  getMonthlyIncome,
  getTotalBalance,
  getTransactions,
  TransactionWithDetails,
} from '@/lib/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, FAB, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { currency } = useSettings();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithDetails[]>([]);
  const [quickAddVisible, setQuickAddVisible] = useState(false);

  const loadData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);

      const [balance, income, expenses, transactions] = await Promise.all([
        getTotalBalance(),
        getMonthlyIncome(),
        getMonthlyExpenses(),
        getTransactions(6),
      ]);

      setTotalBalance(balance);
      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);
      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}👋</Text>
              <Text style={styles.headerTitle}>MiFi</Text>
            </View>
            <View style={styles.notificationIcon}>
              <FontAwesome name="bell-o" size={24} color="#FFFFFF" />
            </View>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {currency.symbol}{totalBalance.toLocaleString()}
            </Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <FontAwesome name="arrow-down" size={16} color="#10B981" />
                <Text style={styles.balanceItemLabel}>Income</Text>
                <Text style={[styles.balanceItemValue, { color: '#10B981' }]}>
                  {currency.symbol}{monthlyIncome.toLocaleString()}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <FontAwesome name="arrow-up" size={16} color="#EF4444" />
                <Text style={styles.balanceItemLabel}>Expense</Text>
                <Text style={[styles.balanceItemValue, { color: '#EF4444' }]}>
                  {currency.symbol}{monthlyExpenses.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              mode="contained"
              icon="plus"
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              onPress={() => router.push('/(tabs)/add-transaction')}
            >
              Add Transaction
            </Button>
            <Button
              mode="contained"
              icon="flash"
              style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
              contentStyle={styles.actionButtonContent}
              onPress={() => setQuickAddVisible(true)}
            >
              Quick Add
            </Button>
            <Button
              mode="outlined"
              icon="bank"
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              onPress={() => router.push('/(tabs)/add-account')}
            >
              Add Account
            </Button>
          </View>
        </View>

        {/* Monthly Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <StatCard
                title="Net Savings"
                value={`${currency.symbol}${(monthlyIncome - monthlyExpenses).toLocaleString()}`}
                icon="money"
                color="#8B5CF6"
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Total Transactions"
                value={recentTransactions.length.toString()}
                icon="exchange"
                color="#3B82F6"
                subtitle="This month"
              />
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Button
              mode="text"
              compact
              onPress={() => router.push('/transactions')}
            >
              View All
            </Button>
          </View>


          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="inbox" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Button
                mode="contained"
                onPress={() => router.push('/(tabs)/add-transaction')}
                style={{ marginTop: 16 }}
              >
                Add Your First Transaction
              </Button>
            </View>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                description={transaction.description}
                amount={transaction.type === 'income' ? transaction.amount : -transaction.amount}
                category={transaction.category?.name || 'Uncategorized'}
                date={transaction.date}
                icon={(transaction.category?.icon as any) || 'circle'}
                color={transaction.category?.color || '#6B7280'}
              />
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Quick Add Modal */}
      <QuickAddModal
        visible={quickAddVisible}
        onDismiss={() => setQuickAddVisible(false)}
        onComplete={() => loadData()}
      />

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(tabs)/add-transaction')}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceItemLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    marginBottom: 2,
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  scrollContent: {
    paddingTop: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  statsGrid: {
    gap: 12,
  },
  statItem: {
    marginBottom: 0,
  },
  bottomSpacing: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#3B82F6',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
