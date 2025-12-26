import { useSettings } from '@/context/SettingsContext';
import { useAlert } from '@/hooks/useAlert';
import { Account, addTransaction, getAccounts, updateAccountBalance } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import CustomAlert from './CustomAlert';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80;

interface QuickAddModalProps {
    visible: boolean;
    onDismiss: () => void;
    onComplete: () => void;
}

export default function QuickAddModal({ visible, onDismiss, onComplete }: QuickAddModalProps) {
    const { currency } = useSettings();
    const alert = useAlert();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [newBalances, setNewBalances] = useState<{ [accountId: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (visible) {
            loadAccounts();
        }
    }, [visible]);

    const loadAccounts = async () => {
        try {
            const accountsData = await getAccounts();
            setAccounts(accountsData);
            const initialBalances: { [key: string]: string } = {};
            accountsData.forEach(acc => {
                initialBalances[acc.id] = acc.balance.toString();
            });
            setNewBalances(initialBalances);
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    };

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + 20));
        setCurrentIndex(index);
    };

    const scrollToIndex = (index: number) => {
        scrollViewRef.current?.scrollTo({
            x: index * (CARD_WIDTH + 20),
            animated: true,
        });
    };

    const handleUpdateBalance = async (account: Account) => {
        const newBalanceStr = newBalances[account.id];
        if (!newBalanceStr || newBalanceStr === account.balance.toString()) {
            return; // No change
        }

        const newBalance = parseFloat(newBalanceStr);
        if (isNaN(newBalance)) {
            alert.showError('Error', 'Please enter a valid number');
            return;
        }

        const difference = newBalance - account.balance;

        if (difference === 0) {
            return; // No change
        }

        try {
            setLoading(true);

            // Use first available category or create adjustment placeholder
            const { data: categories } = await supabase
                .from('categories')
                .select('id')
                .limit(1);

            const categoryId = categories && categories.length > 0 ? categories[0].id : '00000000-0000-0000-0000-000000000000';

            const transactionType = difference > 0 ? 'income' : 'expense';
            const amount = Math.abs(difference);
            const description = `Balance adjustment for ${account.name}`;

            await addTransaction({
                description,
                amount,
                type: transactionType,
                account_id: account.id,
                category_id: categoryId,
                date: new Date().toISOString(),
            });

            // Update account balance
            await updateAccountBalance(account.id, newBalance);

            alert.showSuccess(
                'Success',
                `${account.name} updated!\n${difference > 0 ? 'Income' : 'Expense'}: ${currency.symbol}${amount.toFixed(2)}\nNew balance: ${currency.symbol}${newBalance.toFixed(2)}`
            );

        } catch (error) {
            console.error('Error updating balance:', error);
            alert.showError('Error', 'Failed to update balance');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAll = async () => {
        setLoading(true);
        try {
            for (const account of accounts) {
                await handleUpdateBalance(account);
            }
            onComplete();
            onDismiss();
        } catch (error) {
            console.error('Error updating all balances:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <CustomAlert
                visible={alert.visible}
                title={alert.config.title}
                message={alert.config.message}
                type={alert.config.type}
                onDismiss={alert.hideAlert}
                onConfirm={alert.config.onConfirm}
                confirmText={alert.config.confirmText}
                cancelText={alert.config.cancelText}
            />
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                onRequestClose={onDismiss}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Quick Add</Text>
                            <TouchableOpacity onPress={onDismiss}>
                                <FontAwesome name="times" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subtitle}>
                            Update account balances - differences will be auto-adjusted
                        </Text>

                        {accounts.length === 0 ? (
                            <View style={styles.emptyState}>
                                <FontAwesome name="bank" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyText}>No accounts found</Text>
                                <Text style={styles.emptySubtext}>Add an account first</Text>
                            </View>
                        ) : (
                            <>
                                <ScrollView
                                    ref={scrollViewRef}
                                    horizontal
                                    pagingEnabled={false}
                                    showsHorizontalScrollIndicator={false}
                                    onScroll={handleScroll}
                                    scrollEventThrottle={16}
                                    contentContainerStyle={styles.scrollContainer}
                                    snapToInterval={CARD_WIDTH + 20}
                                    decelerationRate="fast"
                                >
                                    {accounts.map((account, index) => {
                                        const newBalance = parseFloat(newBalances[account.id] || '0');
                                        const difference = newBalance - account.balance;
                                        const isDifferent = difference !== 0 && !isNaN(newBalance);

                                        return (
                                            <Card key={account.id} style={styles.accountCard}>
                                                <Card.Content>
                                                    <View style={styles.accountHeader}>
                                                        <View style={[styles.iconContainer, { backgroundColor: account.color + '20' }]}>
                                                            <FontAwesome name="bank" size={24} color={account.color} />
                                                        </View>
                                                        <Text style={styles.accountName}>{account.name}</Text>
                                                    </View>

                                                    <View style={styles.balanceInfo}>
                                                        <Text style={styles.label}>Current Balance</Text>
                                                        <Text style={styles.currentBalance}>
                                                            {currency.symbol}{account.balance.toLocaleString()}
                                                        </Text>
                                                    </View>

                                                    <TextInput
                                                        label="New Balance"
                                                        value={newBalances[account.id]}
                                                        onChangeText={(value) => setNewBalances(prev => ({ ...prev, [account.id]: value }))}
                                                        mode="outlined"
                                                        keyboardType="numeric"
                                                        style={styles.input}
                                                        left={<TextInput.Affix text={currency.symbol} />}
                                                    />

                                                    {isDifferent && (
                                                        <View style={[styles.differenceCard, { backgroundColor: difference > 0 ? '#D1FAE5' : '#FEE2E2' }]}>
                                                            <FontAwesome
                                                                name={difference > 0 ? 'arrow-down' : 'arrow-up'}
                                                                size={16}
                                                                color={difference > 0 ? '#10B981' : '#EF4444'}
                                                            />
                                                            <Text style={[styles.differenceText, { color: difference > 0 ? '#10B981' : '#EF4444' }]}>
                                                                {difference > 0 ? 'Income' : 'Expense'}: {currency.symbol}{Math.abs(difference).toFixed(2)}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    <Button
                                                        mode="contained"
                                                        onPress={() => handleUpdateBalance(account)}
                                                        loading={loading}
                                                        disabled={!isDifferent || loading}
                                                        style={styles.updateButton}
                                                    >
                                                        Update Balance
                                                    </Button>
                                                </Card.Content>
                                            </Card>
                                        );
                                    })}
                                </ScrollView>

                                {/* Pagination Dots */}
                                <View style={styles.pagination}>
                                    {accounts.map((_, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => scrollToIndex(index)}
                                            style={[
                                                styles.dot,
                                                currentIndex === index && styles.dotActive,
                                            ]}
                                        />
                                    ))}
                                </View>

                                <Button
                                    mode="outlined"
                                    onPress={onDismiss}
                                    style={styles.closeButton}
                                >
                                    Close
                                </Button>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 24,
        paddingBottom: 40,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    scrollContainer: {
        paddingHorizontal: 40,
        gap: 20,
    },
    accountCard: {
        width: CARD_WIDTH,
        borderRadius: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    accountHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    accountName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    balanceInfo: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    currentBalance: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    input: {
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
    },
    differenceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        gap: 10,
    },
    differenceText: {
        fontSize: 14,
        fontWeight: '600',
    },
    updateButton: {
        borderRadius: 16,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D5DB',
    },
    dotActive: {
        backgroundColor: '#3B82F6',
        width: 28,
        height: 8,
    },
    closeButton: {
        marginHorizontal: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#9CA3AF',
        marginTop: 16,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#D1D5DB',
        marginTop: 4,
    },
});
