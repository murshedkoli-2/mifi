import { useSettings } from '@/context/SettingsContext';
import { Account, addTransaction, Category, getAccounts, getCategories } from '@/lib/database';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddTransactionScreen() {
    const router = useRouter();
    const { currency } = useSettings();
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    useEffect(() => {
        loadData();
    }, [type]);

    // ... (loadData and handleSave unchanged)

    const loadData = async () => {
        try {
            const [accountsData, categoriesData] = await Promise.all([
                getAccounts(),
                getCategories(type),
            ]);
            setAccounts(accountsData);
            setCategories(categoriesData);

            // Auto-select first items if available
            if (!selectedAccount && accountsData.length > 0) {
                setSelectedAccount(accountsData[0]);
            }
            if (!selectedCategory || categories.length === 0) {
                setSelectedCategory(categoriesData.length > 0 ? categoriesData[0] : null);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleSave = async () => {
        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a description');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }
        if (!selectedAccount) {
            Alert.alert('Error', 'Please select an account');
            return;
        }
        if (!selectedCategory) {
            Alert.alert('Error', 'Please select a category');
            return;
        }

        setLoading(true);
        try {
            await addTransaction({
                description: description.trim(),
                amount: parseFloat(amount),
                type,
                account_id: selectedAccount.id,
                category_id: selectedCategory.id,
                date,
            });

            Alert.alert('Success', 'Transaction added successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add transaction');
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Add Transaction',
                    headerShown: true,
                    presentation: 'modal',
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Type Selector */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Type</Text>
                        <SegmentedButtons
                            value={type}
                            onValueChange={(value) => {
                                setType(value as 'expense' | 'income');
                                setSelectedCategory(null); // Reset category when type changes
                            }}
                            buttons={[
                                {
                                    value: 'expense',
                                    label: 'Expense',
                                    icon: 'arrow-up',
                                },
                                {
                                    value: 'income',
                                    label: 'Income',
                                    icon: 'arrow-down',
                                },
                            ]}
                        />
                    </View>

                    {/* Amount */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Amount ({currency.symbol})</Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="0.00"
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon={currency.icon} />}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="e.g., Grocery shopping"
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="text" />}
                        />
                    </View>

                    {/* Category Selector */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                            {categories.map((category) => (
                                <Button
                                    key={category.id}
                                    mode={selectedCategory?.id === category.id ? 'contained' : 'outlined'}
                                    onPress={() => setSelectedCategory(category)}
                                    style={styles.categoryButton}
                                    buttonColor={selectedCategory?.id === category.id ? category.color : undefined}
                                    textColor={selectedCategory?.id === category.id ? '#FFFFFF' : category.color}
                                >
                                    {category.name}
                                </Button>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Account Selector */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Account</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                            {accounts.map((account) => (
                                <Button
                                    key={account.id}
                                    mode={selectedAccount?.id === account.id ? 'contained' : 'outlined'}
                                    onPress={() => setSelectedAccount(account)}
                                    style={styles.categoryButton}
                                    buttonColor={selectedAccount?.id === account.id ? account.color : undefined}
                                    textColor={selectedAccount?.id === account.id ? '#FFFFFF' : account.color}
                                >
                                    {account.name}
                                </Button>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Date */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Date</Text>
                        <TextInput
                            value={date}
                            onChangeText={setDate}
                            placeholder="YYYY-MM-DD"
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="calendar" />}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <Button
                            mode="outlined"
                            onPress={() => router.back()}
                            style={[styles.button, styles.cancelButton]}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            style={[styles.button, styles.saveButton]}
                            loading={loading}
                            disabled={loading}
                        >
                            Save
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
    },
    categoryScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    categoryButton: {
        marginRight: 8,
        borderRadius: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        marginBottom: 40,
    },
    button: {
        flex: 1,
        borderRadius: 12,
    },
    cancelButton: {
        borderColor: '#D1D5DB',
    },
    saveButton: {
        backgroundColor: '#3B82F6',
    },
});
