import { CURRENCIES, useSettings } from '@/context/SettingsContext';
import { authenticateWithBiometrics } from '@/lib/biometrics';
import { cancelAllNotifications, requestNotificationPermissions, scheduleDailyNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, List, Modal, Portal, RadioButton, Switch, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const router = useRouter();
    const {
        currency,
        setCurrency,
        biometricEnabled,
        setBiometricEnabled,
        notificationsEnabled,
        setNotificationsEnabled,
        notificationTime,
        setNotificationTime,
    } = useSettings();
    const [email, setEmail] = useState('');
    const [userName, setUserName] = useState('User');

    // Currency Modal State
    const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

    // Password Modal State
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Biometric Enrollment State
    const [biometricPromptVisible, setBiometricPromptVisible] = useState(false);
    const [verifyPassword, setVerifyPassword] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);

    // Time Picker State
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [tempTime, setTempTime] = useState(new Date());

    React.useEffect(() => {
        getUserEmail().then(setEmail);
        getUserName().then(setUserName);
    }, []);

    const getUserEmail = async () => {
        const { data } = await supabase.auth.getUser();
        return data.user?.email || 'user@example.com';
    };

    const getUserName = async () => {
        const { data } = await supabase.auth.getUser();
        return data.user?.user_metadata?.full_name || 'User';
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.auth.signOut();
                            if (error) {
                                Alert.alert('Error', error.message);
                            } else {
                                router.replace('/auth/login');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to sign out');
                        }
                    },
                },
            ]
        );
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            Alert.alert('Success', 'Password updated successfully');
            setPasswordModalVisible(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };


    const handleEnableBiometric = async () => {
        if (!verifyPassword) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setVerifyLoading(true);
        try {
            // Verify password by trying to sign in (or ensure it's correct)
            const { error } = await supabase.auth.signInWithPassword({
                email: email,
                password: verifyPassword,
            });

            if (error) {
                // If incorrect password
                Alert.alert('Error', 'Incorrect password');
                return;
            }

            // Verify biometric hardware
            const bioSuccess = await authenticateWithBiometrics();
            if (!bioSuccess) {
                Alert.alert('Error', 'Biometric authentication failed');
                return;
            }

            // Store credentials securely
            await SecureStore.setItemAsync('user_credentials', JSON.stringify({
                email: email,
                password: verifyPassword,
            }));

            setBiometricEnabled(true);
            setBiometricPromptVisible(false);
            setVerifyPassword('');
            Alert.alert('Success', 'Biometric login enabled');

        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to enable biometrics');
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleNotificationToggle = async (enabled: boolean) => {
        if (enabled) {
            // Request permission
            const hasPermission = await requestNotificationPermissions();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Please enable notifications in your device settings');
                return;
            }

            // Schedule notification at current time setting
            await scheduleDailyNotification(notificationTime.hour, notificationTime.minute);
        } else {
            // Cancel all notifications
            await cancelAllNotifications();
        }

        await setNotificationsEnabled(enabled);
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setTimePickerVisible(false);
        }

        if (selectedTime) {
            setTempTime(selectedTime);
            if (Platform.OS === 'android') {
                // On Android, save immediately
                const newTime = {
                    hour: selectedTime.getHours(),
                    minute: selectedTime.getMinutes(),
                };
                handleTimeSave(newTime);
            }
        }
    };

    const handleTimeSave = async (time: { hour: number; minute: number }) => {
        await setNotificationTime(time);

        // Reschedule notification if enabled
        if (notificationsEnabled) {
            await scheduleDailyNotification(time.hour, time.minute);
        }

        setTimePickerVisible(false);
    };

    const showTimePicker = () => {
        const date = new Date();
        date.setHours(notificationTime.hour, notificationTime.minute);
        setTempTime(date);
        setTimePickerVisible(true);
    };

    const formatTime = (hour: number, minute: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const displayMinute = minute.toString().padStart(2, '0');
        return `${displayHour}:${displayMinute} ${period}`;
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
                        <Text style={styles.headerTitle}>Settings</Text>
                        <Text style={styles.headerSubtitle}>Manage your preferences</Text>
                    </View>

                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatar}>
                            <FontAwesome name="user" size={32} color="#FFFFFF" />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{userName}</Text>
                            <Text style={styles.profileEmail}>{email}</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <Card style={styles.card} elevation={1}>
                        <List.Item
                            title="Currency"
                            description={`${currency.name} (${currency.code})`}
                            left={props => <List.Icon {...props} icon={currency.icon} />}
                            right={props => <List.Icon {...props} icon="chevron-right" />}
                            onPress={() => setCurrencyModalVisible(true)}
                        />
                    </Card>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>
                    <Card style={styles.card} elevation={1}>
                        <List.Item
                            title="Biometric Unlock"
                            description="Use fingerprint or face ID"
                            left={props => <List.Icon {...props} icon="fingerprint" />}
                            right={() => (
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={async (value) => {
                                        if (value) {
                                            // To enable, we need to verify password first
                                            setBiometricPromptVisible(true);
                                        } else {
                                            // Disable biometrics
                                            setBiometricEnabled(false);
                                            // Remove stored credentials
                                            await SecureStore.deleteItemAsync('user_credentials');
                                        }
                                    }}
                                    color="#3B82F6"
                                />
                            )}
                        />
                        <Divider />
                        <List.Item
                            title="Change Password"
                            description="Update your password"
                            left={props => <List.Icon {...props} icon="lock" />}
                            right={props => <List.Icon {...props} icon="chevron-right" />}
                            onPress={() => setPasswordModalVisible(true)}
                        />
                    </Card>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <Card style={styles.card} elevation={1}>
                        <List.Item
                            title="Daily Reminders"
                            description="Notify about accounts without transactions"
                            left={props => <List.Icon {...props} icon="bell" />}
                            right={() => (
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={handleNotificationToggle}
                                    color="#3B82F6"
                                />
                            )}
                        />
                        {notificationsEnabled && (
                            <>
                                <Divider />
                                <List.Item
                                    title="Notification Time"
                                    description={formatTime(notificationTime.hour, notificationTime.minute)}
                                    left={props => <List.Icon {...props} icon="clock-outline" />}
                                    right={props => <List.Icon {...props} icon="chevron-right" />}
                                    onPress={showTimePicker}
                                />
                            </>
                        )}
                    </Card>
                </View>

                {/* Data Management Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Management</Text>
                    <Card style={styles.card} elevation={1}>
                        <List.Item
                            title="Export Data"
                            description="Download all your data"
                            left={props => <List.Icon {...props} icon="download" />}
                            right={props => <List.Icon {...props} icon="chevron-right" />}
                            onPress={() => console.log('Export data')}
                        />
                        <Divider />
                        <List.Item
                            title="Clear Transactions"
                            description="Delete all transactions"
                            left={props => <List.Icon {...props} icon="delete" color="#EF4444" />}
                            right={props => <List.Icon {...props} icon="chevron-right" />}
                            onPress={() => console.log('Clear transactions')}
                        />
                    </Card>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Card style={styles.card} elevation={1}>
                        <List.Item
                            title="Version"
                            description="1.0.0"
                            left={props => <List.Icon {...props} icon="information" />}
                        />
                        <Divider />
                        <List.Item
                            title="Privacy Policy"
                            left={props => <List.Icon {...props} icon="shield" />}
                            right={props => <List.Icon {...props} icon="chevron-right" />}
                            onPress={() => console.log('Privacy policy')}
                        />
                        <Divider />
                        <List.Item
                            title="Terms of Service"
                            left={props => <List.Icon {...props} icon="file-document" />}
                            right={props => <List.Icon {...props} icon="chevron-right" />}
                            onPress={() => console.log('Terms of service')}
                        />
                    </Card>
                </View>

                {/* Sign Out Button */}
                <View style={styles.section}>
                    <Button
                        mode="contained"
                        icon="logout"
                        onPress={handleSignOut}
                        style={styles.signOutButton}
                        contentStyle={styles.signOutButtonContent}
                        buttonColor="#EF4444"
                    >
                        Sign Out
                    </Button>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            <Portal>
                {/* Currency Selection Modal */}
                <Modal visible={currencyModalVisible} onDismiss={() => setCurrencyModalVisible(false)} contentContainerStyle={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select Currency</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                        <RadioButton.Group onValueChange={value => {
                            setCurrency(value);
                            setCurrencyModalVisible(false);
                        }} value={currency.code}>
                            {CURRENCIES.map((curr) => (
                                <RadioButton.Item
                                    key={curr.code}
                                    label={`${curr.name} (${curr.symbol})`}
                                    value={curr.code}
                                    color="#3B82F6"
                                />
                            ))}
                        </RadioButton.Group>
                    </ScrollView>
                    <Button onPress={() => setCurrencyModalVisible(false)} style={styles.modalButton}>Cancel</Button>
                </Modal>

                {/* Change Password Modal */}
                <Modal visible={passwordModalVisible} onDismiss={() => setPasswordModalVisible(false)} contentContainerStyle={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Change Password</Text>
                    <TextInput
                        label="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        mode="outlined"
                        style={styles.input}
                    />
                    <View style={styles.modalButtons}>
                        <Button onPress={() => setPasswordModalVisible(false)} style={styles.modalButton} disabled={passwordLoading}>Cancel</Button>
                        <Button mode="contained" onPress={handleChangePassword} style={styles.modalButton} loading={passwordLoading}>Update</Button>
                    </View>
                </Modal>

                {/* Biometric Enable Prompt Modal */}
                <Modal visible={biometricPromptVisible} onDismiss={() => setBiometricPromptVisible(false)} contentContainerStyle={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Enable Biometric Login</Text>
                    <Text style={{ marginBottom: 16, color: '#6B7280' }}>
                        Please enter your password to securely store your credentials for biometric login.
                    </Text>
                    <TextInput
                        label="Password"
                        value={verifyPassword}
                        onChangeText={setVerifyPassword}
                        secureTextEntry
                        mode="outlined"
                        style={styles.input}
                    />
                    <View style={styles.modalButtons}>
                        <Button onPress={() => {
                            setBiometricPromptVisible(false);
                            setVerifyPassword('');
                        }} style={styles.modalButton} disabled={verifyLoading}>Cancel</Button>
                        <Button mode="contained" onPress={handleEnableBiometric} style={styles.modalButton} loading={verifyLoading}>Enable</Button>
                    </View>
                </Modal>

                {/* Time Picker Modal */}
                {Platform.OS === 'ios' ? (
                    <Modal visible={timePickerVisible} onDismiss={() => setTimePickerVisible(false)} contentContainerStyle={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Set Notification Time</Text>
                        <DateTimePicker
                            value={tempTime}
                            mode="time"
                            display="spinner"
                            onChange={handleTimeChange}
                        />
                        <View style={styles.modalButtons}>
                            <Button onPress={() => setTimePickerVisible(false)} style={styles.modalButton}>Cancel</Button>
                            <Button
                                mode="contained"
                                onPress={() => handleTimeSave({
                                    hour: tempTime.getHours(),
                                    minute: tempTime.getMinutes()
                                })}
                                style={styles.modalButton}
                            >
                                Save
                            </Button>
                        </View>
                    </Modal>
                ) : timePickerVisible && (
                    <DateTimePicker
                        value={tempTime}
                        mode="time"
                        display="default"
                        onChange={handleTimeChange}
                    />
                )}
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingBottom: 24,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        marginBottom: 24,
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
    profileCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    profileEmail: {
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
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    signOutButton: {
        borderRadius: 12,
    },
    signOutButtonContent: {
        paddingVertical: 8,
    },
    bottomSpacing: {
        height: 40,
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1F2937',
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8,
    },
    modalButton: {
        marginTop: 8,
    },
});
