import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface StatCardProps {
    title: string;
    value: string;
    icon: string;
    color: string;
    subtitle?: string;
}

export default function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
    return (
        <Card style={styles.card} elevation={2}>
            <Card.Content style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
                        <FontAwesome name={icon as any} size={24} color={color} />
                    </View>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={[styles.value, { color }]}>{value}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconContainer: {
        marginRight: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    value: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
});
