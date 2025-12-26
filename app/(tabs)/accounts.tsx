import AccountCard from '@/components/AccountCard';
import { useSettings } from '@/context/SettingsContext';
import { getAccounts, getTotalBalance } from '@/lib/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountsScreen() {
    const { currency } = useSettings();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [accountsData, balance] = await Promise.all([
                getAccounts(),
                getTotalBalance(),
            ]);
            setAccounts(accountsData);
            setTotalBalance(balance);
        } catch (error) {
            console.error('Error loading accounts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const totalAccounts = accounts.length;

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
                        <Text style={styles.headerTitle}>My Accounts</Text>
                        <Text style={styles.accountCount}>{totalAccounts} Accounts</Text>
                    </View>

                    {/* Total Balance Card */}
                    <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>Total Balance</Text>
                        <Text style={styles.totalAmount}>
                            {currency.symbol}{totalBalance.toLocaleString()}
                        </Text>
                        <Text style={styles.totalSubtext}>
                            Across all accounts
                        </Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>All Accounts</Text>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#3B82F6" />
                        </View>
                    ) : accounts.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No accounts yet</Text>
                            <Text style={styles.emptySubtext}>
                                Tap the "Add Account" button to get started
                            </Text>
                        </View>
                    ) : (
                        accounts.map((account) => (
                            <AccountCard
                                key={account.id}
                                name={account.name}
                                type={account.type}
                                balance={account.balance}
                                color={account.color}
                                onPress={() => console.log('View account:', account.name)}
                            />
                        ))
                    )}
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Floating Action Button */}
            <Link href="/add-account" asChild>
                <FAB
                    icon="plus"
                    label="Add Account"
                    style={styles.fab}
                    color="#FFFFFF"
                />
            </Link>
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
        paddingHorizontal: 20,
        paddingTop: 16,
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    accountCount: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    totalCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    totalLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 8,
    },
    totalAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    totalSubtext: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
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
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    bottomSpacing: {
        height: 100,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#3B82F6',
    },
});
