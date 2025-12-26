import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Currency = {
    code: string;
    symbol: string;
    name: string;
    icon: string;
};

export const CURRENCIES: Currency[] = [
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', icon: 'currency-bdt' },
    { code: 'USD', symbol: '$', name: 'US Dollar', icon: 'currency-usd' },
    { code: 'EUR', symbol: '€', name: 'Euro', icon: 'currency-eur' },
    { code: 'GBP', symbol: '£', name: 'British Pound', icon: 'currency-gbp' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', icon: 'currency-inr' },
];

type NotificationTime = {
    hour: number;
    minute: number;
};

type SettingsContextType = {
    currency: Currency;
    setCurrency: (code: string) => Promise<void>;
    biometricEnabled: boolean;
    setBiometricEnabled: (enabled: boolean) => Promise<void>;
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => Promise<void>;
    notificationTime: NotificationTime;
    setNotificationTime: (time: NotificationTime) => Promise<void>;
    isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]);
    const [biometricEnabled, setBiometricEnabledState] = useState(false);
    const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
    const [notificationTime, setNotificationTimeState] = useState<NotificationTime>({ hour: 9, minute: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [storedCurrency, storedBiometric, storedNotifications, storedNotificationTime] = await Promise.all([
                AsyncStorage.getItem('settings_currency'),
                AsyncStorage.getItem('settings_biometric'),
                AsyncStorage.getItem('settings_notifications'),
                AsyncStorage.getItem('settings_notification_time'),
            ]);

            if (storedCurrency) {
                const found = CURRENCIES.find(c => c.code === storedCurrency);
                if (found) setCurrencyState(found);
            }

            if (storedBiometric !== null) {
                setBiometricEnabledState(storedBiometric === 'true');
            }

            if (storedNotifications !== null) {
                const enabled = storedNotifications === 'true';
                setNotificationsEnabledState(enabled);
                if (enabled) {
                    // Import dynamically to avoid circular dependencies if needed, or just rely on global import
                    const { registerBackgroundTask } = require('@/lib/notifications');
                    registerBackgroundTask();
                }
            }

            if (storedNotificationTime) {
                try {
                    const parsed = JSON.parse(storedNotificationTime);
                    setNotificationTimeState(parsed);
                } catch (e) {
                    // Use default if parsing fails
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setCurrency = async (code: string) => {
        const found = CURRENCIES.find(c => c.code === code);
        if (found) {
            setCurrencyState(found);
            await AsyncStorage.setItem('settings_currency', code);
        }
    };

    const setBiometricEnabled = async (enabled: boolean) => {
        setBiometricEnabledState(enabled);
        await AsyncStorage.setItem('settings_biometric', String(enabled));
    };

    const setNotificationsEnabled = async (enabled: boolean) => {
        setNotificationsEnabledState(enabled);
        await AsyncStorage.setItem('settings_notifications', String(enabled));
    };

    const setNotificationTime = async (time: NotificationTime) => {
        setNotificationTimeState(time);
        await AsyncStorage.setItem('settings_notification_time', JSON.stringify(time));
    };

    return (
        <SettingsContext.Provider
            value={{
                currency,
                setCurrency,
                biometricEnabled,
                setBiometricEnabled,
                notificationsEnabled,
                setNotificationsEnabled,
                notificationTime,
                setNotificationTime,
                isLoading,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
