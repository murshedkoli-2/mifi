import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface TransactionCardProps {
    description: string;
    amount: number;
    category: string;
    date: string;
    icon: string;
    color: string;
    onPress?: () => void;
}

import { useSettings } from '@/context/SettingsContext';

export default function TransactionCard({
    description,
    amount,
    category,
    date,
    icon,
    color,
    onPress,
}: TransactionCardProps) {
    const { currency } = useSettings();
    const isIncome = amount > 0;
    const displayAmount = Math.abs(amount);

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });

    return (
        <Card style={styles.card} onPress={onPress} elevation={1}>
            <Card.Content style={styles.content}>
                <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
                    <FontAwesome name={icon as any} size={20} color={color} />
                </View>

                <View style={styles.detailsContainer}>
                    <Text style={styles.description} numberOfLines={1}>
                        {description}
                    </Text>
                    <View style={styles.metaContainer}>
                        <Text style={styles.category}>{category}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.date}>{formattedDate}</Text>
                    </View>
                </View>

                <Text
                    style={[
                        styles.amount,
                        { color: isIncome ? '#10B981' : '#EF4444' }
                    ]}
                >
                    {isIncome ? '+' : '-'}{currency.symbol}{displayAmount.toLocaleString()}
                </Text>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailsContainer: {
        flex: 1,
    },
    description: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    category: {
        fontSize: 13,
        color: '#6B7280',
    },
    dot: {
        fontSize: 13,
        color: '#D1D5DB',
        marginHorizontal: 6,
    },
    date: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 12,
    },
});
