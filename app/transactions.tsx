import TransactionCard from '@/components/TransactionCard';
import { getTransactions, TransactionWithDetails } from '@/lib/database';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadTransactions = async () => {
        try {
            const data = await getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadTransactions();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'All Transactions' }} />

            {transactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No transactions found</Text>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.itemContainer}>
                            <TransactionCard
                                description={item.description}
                                amount={item.type === 'income' ? item.amount : -item.amount}
                                category={item.category?.name || 'Uncategorized'}
                                date={item.date}
                                icon={(item.category?.icon as any) || 'circle'}
                                color={item.category?.color || '#6B7280'}
                            />
                        </View>
                    )}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    itemContainer: {
        marginBottom: 0, // TransactionCard might have its own margin, but let's see. 
        // In Home screen it was mapping directly. 
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
    },
});
