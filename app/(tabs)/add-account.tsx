import { useSettings } from '@/context/SettingsContext';
import { addAccount } from '@/lib/database';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACCOUNT_TYPES = [
    { value: 'cash', label: 'Cash', icon: 'cash', color: '#10B981' },
    { value: 'bank', label: 'Bank', icon: 'bank', color: '#3B82F6' },
    { value: 'card', label: 'Card', icon: 'credit-card', color: '#EF4444' },
    { value: 'savings', label: 'Savings', icon: 'piggy-bank-outline', color: '#8B5CF6' },
    { value: 'mobile-banking', label: 'Mobile Banking', icon: 'cellphone', color: '#F97316' },
];

export default function AddAccountScreen() {
    const router = useRouter();
    const { currency } = useSettings();
    const [name, setName] = useState('');
    const [type, setType] = useState<'cash' | 'bank' | 'card' | 'savings' | 'mobile-banking'>('cash');
    const [balance, setBalance] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const selectedTypeColor = ACCOUNT_TYPES.find(t => t.value === type)?.color || '#3B82F6';

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter an account name');
            return;
        }
        if (!balance || isNaN(parseFloat(balance))) {
            Alert.alert('Error', 'Please enter a valid balance');
            return;
        }


        setLoading(true);
        try {
            const result = await addAccount({
                name: name.trim(),
                type,
                balance: parseFloat(balance),
                color: selectedTypeColor,
                account_number: accountNumber.trim() || undefined,
            });

            console.log('Account saved successfully:', result);
            setLoading(false);

            Alert.alert('Success', 'Account added successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Error saving account:', error);

            // Check for specific database errors
            let errorMessage = 'Failed to add account';
            if (error.message) {
                errorMessage = error.message;

                // Provide helpful hints for common errors
                if (error.message.includes('new row for relation "accounts" violates check constraint')) {
                    errorMessage = 'Database error: Please run the migration script in Supabase to support mobile banking accounts.';
                } else if (error.message.includes('column "account_number" of relation "accounts" does not exist')) {
                    errorMessage = 'Database error: Please run the migration script in Supabase to add the account_number field.';
                } else if (error.message.includes('Not authenticated')) {
                    errorMessage = 'Please log in first to add an account.';
                }
            }

            Alert.alert('Error', errorMessage);
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Add Account',
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
                    {/* Account Name */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Account Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g., My Wallet"
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="wallet" />}
                        />
                    </View>

                    {/* Account Type */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Account Type</Text>
                        <View style={styles.typeGrid}>
                            {ACCOUNT_TYPES.map((accountType) => (
                                <Button
                                    key={accountType.value}
                                    mode={type === accountType.value ? 'contained' : 'outlined'}
                                    onPress={() => setType(accountType.value as any)}
                                    style={styles.typeButton}
                                    icon={accountType.icon}
                                    buttonColor={type === accountType.value ? accountType.color : undefined}
                                    textColor={type === accountType.value ? '#FFFFFF' : accountType.color}
                                >
                                    {accountType.label}
                                </Button>
                            ))}
                        </View>
                    </View>

                    {/* Account Number */}
                    {(type === 'bank' || type === 'card' || type === 'mobile-banking') && (
                        <View style={styles.section}>
                            <Text style={styles.label}>Account Number</Text>
                            <TextInput
                                value={accountNumber}
                                onChangeText={setAccountNumber}
                                placeholder={type === 'mobile-banking' ? 'e.g., 01XXX-XXXXXX' : 'e.g., XXXX-XXXX-XXXX-XXXX'}
                                mode="outlined"
                                style={styles.input}
                                left={<TextInput.Icon icon={type === 'mobile-banking' ? 'phone' : 'card-account-details'} />}
                                keyboardType={type === 'mobile-banking' ? 'phone-pad' : 'default'}
                            />
                            <Text style={styles.hint}>
                                {type === 'mobile-banking'
                                    ? 'Enter your mobile banking number'
                                    : 'Enter your account or card number (optional)'}
                            </Text>
                        </View>
                    )}

                    {/* Initial Balance */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Initial Balance ({currency.symbol})</Text>
                        <TextInput
                            value={balance}
                            onChangeText={setBalance}
                            keyboardType="numeric"
                            placeholder="0.00"
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon={currency.icon} />}
                        />
                        <Text style={styles.hint}>
                            Enter the current balance in this account
                        </Text>
                    </View>

                    {/* Preview Card */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Preview</Text>
                        <View style={[styles.previewCard, { borderLeftColor: selectedTypeColor }]}>
                            <View style={styles.previewHeader}>
                                <View style={[styles.previewIcon, { backgroundColor: `${selectedTypeColor}15` }]}>
                                    <Text style={[styles.previewIconText, { color: selectedTypeColor }]}>
                                        {ACCOUNT_TYPES.find(t => t.value === type)?.icon.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.previewInfo}>
                                    <Text style={styles.previewName}>{name || 'Account Name'}</Text>
                                    <Text style={styles.previewType}>
                                        {ACCOUNT_TYPES.find(t => t.value === type)?.label}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.previewBalance}>
                                <Text style={styles.previewBalanceLabel}>Balance</Text>
                                <Text style={[styles.previewBalanceValue, { color: selectedTypeColor }]}>
                                    {currency.symbol}{balance || '0.00'}
                                </Text>
                            </View>
                        </View>
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
        marginBottom: 24,
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
    hint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeButton: {
        flex: 1,
        minWidth: '47%',
        borderRadius: 12,
    },
    previewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    previewIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    previewIconText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    previewInfo: {
        flex: 1,
    },
    previewName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    previewType: {
        fontSize: 14,
        color: '#6B7280',
    },
    previewBalance: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    previewBalanceLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    previewBalanceValue: {
        fontSize: 24,
        fontWeight: 'bold',
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
