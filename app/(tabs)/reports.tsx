import StatCard from '@/components/StatCard';
import { useSettings } from '@/context/SettingsContext';
import {
    getExpenses,
    getIncome,
    getSpendingByCategory
} from '@/lib/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Button, Card, ProgressBar, SegmentedButtons, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
    const { currency } = useSettings();
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        income: 0,
        expenses: 0,
        savings: 0,
        categoryData: [] as { category: string; amount: number; color: string; icon: string }[],
    });

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true);
            const now = new Date();
            let startDate = '', endDate = '';

            if (period === 'week') {
                const curr = new Date();
                const first = curr.getDate() - curr.getDay();
                const last = first + 6;
                const firstDay = new Date(curr.setDate(first));
                const lastDay = new Date(curr.setDate(last));
                startDate = firstDay.toISOString().split('T')[0];
                endDate = lastDay.toISOString().split('T')[0];
            } else if (period === 'month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            } else if (period === 'year') {
                startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
            }

            const [income, expenses, categoryData] = await Promise.all([
                getIncome(startDate, endDate),
                getExpenses(startDate, endDate),
                getSpendingByCategory(startDate, endDate),
            ]);

            setData({
                income,
                expenses,
                savings: income - expenses,
                categoryData,
            });
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const chartData = data.categoryData.slice(0, 5).map(cat => ({
        name: cat.category,
        amount: cat.amount,
        color: cat.color,
        legendFontColor: '#6B7280',
        legendFontSize: 12,
    }));

    const chartConfig = {
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
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
                        <Text style={styles.headerTitle}>Reports</Text>
                        <Text style={styles.headerSubtitle}>Track your spending</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Period Selector */}
                <View style={styles.section}>
                    <SegmentedButtons
                        value={period}
                        onValueChange={setPeriod}
                        buttons={[
                            { value: 'week', label: 'Week' },
                            { value: 'month', label: 'Month' },
                            { value: 'year', label: 'Year' },
                        ]}
                        style={styles.segmentedButtons}
                    />
                </View>

                {/* Summary Cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <StatCard
                                title="Total Income"
                                value={`${currency.symbol}${data.income.toLocaleString()}`}
                                icon="arrow-down"
                                color="#10B981"
                            />
                        </View>
                        <View style={styles.statItem}>
                            <StatCard
                                title="Total Expenses"
                                value={`${currency.symbol}${data.expenses.toLocaleString()}`}
                                icon="arrow-up"
                                color="#EF4444"
                            />
                        </View>
                        <View style={styles.statItem}>
                            <StatCard
                                title="Net Savings"
                                value={`${currency.symbol}${data.savings.toLocaleString()}`}
                                icon="money"
                                color={data.savings >= 0 ? '#8B5CF6' : '#EF4444'}
                            />
                        </View>
                    </View>
                </View>

                {/* Pie Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Spending by Category</Text>
                    <Card style={styles.chartCard} elevation={2}>
                        <Card.Content>
                            {loading ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>Loading data...</Text>
                                </View>
                            ) : data.categoryData.length > 0 ? (
                                <PieChart
                                    data={chartData}
                                    width={screenWidth - 80}
                                    height={220}
                                    chartConfig={chartConfig}
                                    accessor="amount"
                                    backgroundColor="transparent"
                                    paddingLeft="15"
                                    absolute
                                />
                            ) : (
                                <View style={styles.emptyState}>
                                    <FontAwesome name="pie-chart" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyText}>No data available</Text>
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                </View>

                {/* Category Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Category Breakdown</Text>
                    {data.categoryData.map((category, index) => {
                        const percentage = (category.amount / data.expenses) * 100;
                        return (
                            <View key={index} style={styles.categoryItem}>
                                <View style={styles.categoryHeader}>
                                    <View style={styles.categoryLeft}>
                                        <View
                                            style={[
                                                styles.categoryIcon,
                                                { backgroundColor: `${category.color}15` }
                                            ]}
                                        >
                                            <FontAwesome
                                                name={category.icon as any}
                                                size={18}
                                                color={category.color}
                                            />
                                        </View>
                                        <View>
                                            <Text style={styles.categoryName}>{category.category}</Text>
                                            <Text style={styles.categoryPercentage}>
                                                {percentage.toFixed(1)}%
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.categoryAmount}>
                                        {currency.symbol}{category.amount.toLocaleString()}
                                    </Text>
                                </View>
                                <ProgressBar
                                    progress={percentage / 100}
                                    color={category.color}
                                    style={styles.progressBar}
                                />
                            </View>
                        );
                    })}
                </View>

                {/* Export Options */}
                <View style={styles.section}>
                    <Button
                        mode="outlined"
                        icon="download"
                        style={styles.exportButton}
                        contentStyle={styles.exportButtonContent}
                        onPress={() => console.log('Export PDF')}
                    >
                        Export as PDF
                    </Button>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingBottom: 32,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    segmentedButtons: {
        backgroundColor: '#FFFFFF',
    },
    statsGrid: {
        gap: 12,
    },
    statItem: {
        marginBottom: 0,
    },
    chartCard: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9CA3AF',
    },
    categoryItem: {
        marginBottom: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    categoryPercentage: {
        fontSize: 12,
        color: '#6B7280',
    },
    categoryAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F3F4F6',
    },
    exportButton: {
        borderRadius: 12,
        borderColor: '#3B82F6',
    },
    exportButtonContent: {
        paddingVertical: 8,
    },
    bottomSpacing: {
        height: 40,
    },
});
