import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { getAccounts } from './database';
import { supabase } from './supabase';

const BACKGROUND_FETCH_TASK = 'TRANSACTION_CHECK_TASK';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Configure Background Fetch Task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
        // 1. Load settings
        const [storedNotifications, storedNotificationTime, lastNotifiedDate] = await Promise.all([
            AsyncStorage.getItem('settings_notifications'),
            AsyncStorage.getItem('settings_notification_time'),
            AsyncStorage.getItem('last_notified_date'),
        ]);

        // If notifications disabled, stop
        if (storedNotifications !== 'true') {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        // 2. Check if already notified today
        if (lastNotifiedDate === dateString) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // 3. Check time
        // Default 9:00 PM if not set
        let targetHour = 21;
        let targetMinute = 0;

        if (storedNotificationTime) {
            try {
                const parsed = JSON.parse(storedNotificationTime);
                targetHour = parsed.hour;
                targetMinute = parsed.minute;
            } catch (e) {
                console.error('Error parsing time', e);
            }
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // If it's too early, don't notify yet
        if (currentHour < targetHour || (currentHour === targetHour && currentMinute < targetMinute)) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // 4. Check transactions
        const accountsWithoutTransactions = await checkAccountsWithoutTransactions();

        // 5. Send Notification
        if (accountsWithoutTransactions.length > 0) {
            await sendNoTransactionNotification(accountsWithoutTransactions);

            // Mark as notified for today
            await AsyncStorage.setItem('last_notified_date', dateString);
            return BackgroundFetch.BackgroundFetchResult.NewData;
        }

        // Even if no notification sent (all accounts active), mark as done to avoid checking constantly
        await AsyncStorage.setItem('last_notified_date', dateString);
        return BackgroundFetch.BackgroundFetchResult.NoData;

    } catch (error) {
        console.error('Background fetch failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('transaction-reminders', {
            name: 'Transaction Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3B82F6',
        });
    }

    return true;
}

// Check which accounts have no transactions today
export async function checkAccountsWithoutTransactions(): Promise<string[]> {
    try {
        // Get all user accounts
        const allAccounts = await getAccounts();

        if (allAccounts.length === 0) {
            return [];
        }

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('account_id')
            .gte('date', today.toISOString())
            .lt('date', tomorrow.toISOString());

        // Get account IDs with transactions
        const accountsWithTransactions = new Set(
            transactions?.map(t => t.account_id) || []
        );

        // Find accounts without transactions
        const accountsWithoutTransactions = allAccounts
            .filter(account => !accountsWithTransactions.has(account.id))
            .map(account => account.name);

        return accountsWithoutTransactions;
    } catch (error) {
        console.error('Error checking accounts without transactions:', error);
        return [];
    }
}

// Send notification about accounts without transactions
export async function sendNoTransactionNotification(accountNames: string[]): Promise<void> {
    if (accountNames.length === 0) {
        return;
    }

    let body: string;
    if (accountNames.length === 1) {
        body = `${accountNames[0]} has no transactions today`;
    } else if (accountNames.length === 2) {
        body = `${accountNames[0]} and ${accountNames[1]} have no transactions today`;
    } else {
        const count = accountNames.length;
        const firstTwo = accountNames.slice(0, 2).join(', ');
        const remaining = count - 2;
        body = `${firstTwo} and ${remaining} other account${remaining > 1 ? 's' : ''} have no transactions today`;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Transaction Reminder',
            body,
            data: { accountNames },
            sound: true,
        },
        trigger: null, // Send immediately
    });
}

// Register background task
export async function registerBackgroundTask() {
    try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 60 * 15, // 15 minutes
            stopOnTerminate: false,   // Android only
            startOnBoot: true,        // Android only
        });
        console.log('Background task registered');
    } catch (err) {
        console.log('Task Register failed:', err);
    }
}

// Unregister background task
export async function unregisterBackgroundTask() {
    try {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
        console.log('Background task unregistered');
    } catch (err) {
        console.log('Task Unregister failed:', err);
    }
}

// Schedule logic (called from UI) - now just registers/unregisters background task
export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
    // We don't schedule an exact time trigger anymore, we rely on the background task checking the time
    // But we ensure the task is registered
    await registerBackgroundTask();
}

// Manually trigger the transaction check (for testing or immediate check)
export async function triggerTransactionCheck(): Promise<void> {
    const accountsWithoutTransactions = await checkAccountsWithoutTransactions();
    if (accountsWithoutTransactions.length > 0) {
        await sendNoTransactionNotification(accountsWithoutTransactions);
    }
}

// Cancel all notifications (called from UI when disabled)
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await unregisterBackgroundTask();
}

// Get notification permission status
export async function getNotificationPermissionStatus(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
}
