import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authenticateWithBiometrics, checkBiometricSupported } from '../lib/biometrics';

import { useSettings } from '@/context/SettingsContext';

export default function BiometricProtected({ children }: { children: React.ReactNode }) {
    const { biometricEnabled } = useSettings();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [appState, setAppState] = useState(AppState.currentState);

    useEffect(() => {
        checkBiometricSupported().then(setIsBiometricSupported);
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (appState.match(/inactive|background/) && nextAppState === 'active') {
            // App came to foreground, prompt auth if enabled
            if (biometricEnabled && isBiometricSupported) {
                setIsAuthenticated(false);
            }
        }
        setAppState(nextAppState);
    };

    const handleAuth = async () => {
        const success = await authenticateWithBiometrics();
        if (success) {
            setIsAuthenticated(true);
        }
    };

    useEffect(() => {
        if (isBiometricSupported && biometricEnabled) {
            if (!isAuthenticated) {
                handleAuth();
            }
        } else {
            // Not enabled or not supported, allow access
            setIsAuthenticated(true);
        }
    }, [isBiometricSupported, biometricEnabled, isAuthenticated]);

    if (!isBiometricSupported || !biometricEnabled) {
        return <>{children}</>;
    }

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center">
            <Text className="text-2xl font-bold mb-4">Locked</Text>
            <Text className="text-gray-500 mb-8">Unlock to view your finances</Text>
            <TouchableOpacity
                onPress={handleAuth}
                className="bg-blue-600 px-8 py-3 rounded-full"
            >
                <Text className="text-white font-bold">Unlock</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
