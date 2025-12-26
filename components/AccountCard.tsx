import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface AccountCardProps {
    name: string;
    type: 'cash' | 'bank' | 'card' | 'savings';
    balance: number;
    color: string;
    onPress?: () => void;
}

const getAccountIcon = (type: string): string => {
    switch (type) {
        case 'cash':
            return 'money';
        case 'bank':
            return 'bank';
        case 'card':
            return 'credit-card';
        case 'savings':
            return 'university';
        default:
            return 'wallet';
    }
};

const getAccountLabel = (type: string): string => {
    switch (type) {
        case 'cash':
            return 'Cash';
        case 'bank':
            return 'Bank Account';
        case 'card':
            return 'Credit Card';
        case 'savings':
            return 'Savings';
        default:
            return 'Account';
    }
};

import { useSettings } from '@/context/SettingsContext';

export default function AccountCard({ name, type, balance, color, onPress }: AccountCardProps) {
    const { currency } = useSettings();
    const isNegative = balance < 0;
    const displayBalance = Math.abs(balance);

    return (
        <Card style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]} elevation={2} onPress={onPress}>
            <Card.Content style={styles.content}>
                <View style={styles.header}>
                    <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
                        <FontAwesome name={getAccountIcon(type) as any} size={24} color={color} />
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.accountName} numberOfLines={1}>
                            {name}
                        </Text>
                        <Text style={styles.accountType}>{getAccountLabel(type)}</Text>
                    </View>
                </View>

                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Balance</Text>
                    <Text
                        style={[
                            styles.balance,
                            { color: isNegative ? '#EF4444' : color }
                        ]}
                    >
                        {isNegative ? '-' : ''}{currency.symbol}{displayBalance.toLocaleString()}
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
    },
    content: {
        paddingVertical: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    accountName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    accountType: {
        fontSize: 14,
        color: '#6B7280',
    },
    balanceContainer: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    balanceLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    balance: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});
