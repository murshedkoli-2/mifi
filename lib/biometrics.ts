import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

export const checkBiometricSupported = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
};

export const authenticateWithBiometrics = async () => {
    try {
        const supported = await checkBiometricSupported();
        if (!supported) {
            return false;
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock Finance Tracker',
            fallbackLabel: 'Use Passcode',
        });

        return result.success;
    } catch (error) {
        Alert.alert('Biometric Auth Error', 'An error occurred during authentication.');
        return false;
    }
};
