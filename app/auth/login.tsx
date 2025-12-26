import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authenticateWithBiometrics } from '../../lib/biometrics';
import { supabase } from '../../lib/supabase';

const { height } = Dimensions.get('window');

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            checkBiometricEnrollment();
        }, [])
    );

    const checkBiometricEnrollment = async () => {
        try {
            const credentials = await SecureStore.getItemAsync('user_credentials');
            console.log('Checking credentials:', credentials ? 'Found' : 'Not Found');
            if (credentials) {
                setIsBiometricEnrolled(true);
            } else {
                setIsBiometricEnrolled(false);
            }
        } catch (error) {
            console.error('Error checking biometric enrollment:', error);
        }
    };

    const handleBiometricLogin = async () => {
        try {
            const hasAuth = await authenticateWithBiometrics();
            if (!hasAuth) {
                Alert.alert('Authentication Failed', 'Could not authenticate with biometrics');
                return;
            }

            const credentialsJson = await SecureStore.getItemAsync('user_credentials');
            if (!credentialsJson) {
                Alert.alert('Error', 'No credentials found');
                return;
            }

            const { email: storedEmail, password: storedPassword } = JSON.parse(credentialsJson);

            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
                email: storedEmail,
                password: storedPassword,
            });

            if (error) {
                Alert.alert('Login Failed', error.message);
                setLoading(false);
            } else {
                setLoading(false);
                router.replace('/(tabs)');
            }

        } catch (error) {
            Alert.alert('Error', 'Biometric login failed');
            setLoading(false);
        }
    };

    async function signInWithEmail() {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Login Failed', error.message);
            setLoading(false);
        } else {
            setLoading(false);
            router.replace('/(tabs)');
        }
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['#3B82F6', '#8B5CF6', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Header Section */}
                            <View style={styles.header}>
                                <View style={styles.logoContainer}>
                                    <Text style={styles.logoEmoji}>💰</Text>
                                </View>
                                <Text style={styles.appName}>ExpoFinance</Text>
                                <Text style={styles.tagline}>Smart money management</Text>
                            </View>

                            {/* Form Section */}
                            <View style={styles.formContainer}>
                                <View style={styles.formContent}>
                                    <Text style={styles.welcomeText}>Welcome Back</Text>
                                    <Text style={styles.subtitleText}>Sign in to continue</Text>

                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label="Email"
                                            value={email}
                                            onChangeText={setEmail}
                                            mode="outlined"
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            left={<TextInput.Icon icon="email-outline" />}
                                            style={styles.input}
                                            outlineStyle={styles.inputOutline}
                                            theme={{
                                                colors: {
                                                    primary: '#3B82F6',
                                                    outline: '#E5E7EB',
                                                }
                                            }}
                                        />

                                        <TextInput
                                            label="Password"
                                            value={password}
                                            onChangeText={setPassword}
                                            mode="outlined"
                                            secureTextEntry={!showPassword}
                                            left={<TextInput.Icon icon="lock-outline" />}
                                            right={
                                                <TextInput.Icon
                                                    icon={showPassword ? 'eye-off' : 'eye'}
                                                    onPress={() => setShowPassword(!showPassword)}
                                                />
                                            }
                                            style={styles.input}
                                            outlineStyle={styles.inputOutline}
                                            theme={{
                                                colors: {
                                                    primary: '#3B82F6',
                                                    outline: '#E5E7EB',
                                                }
                                            }}
                                        />
                                        <View style={{ alignItems: 'flex-end', marginTop: -8 }}>
                                            <Text
                                                style={{ color: '#3B82F6', fontWeight: '600' }}
                                                onPress={() => router.push('/auth/forgot-password')}
                                            >
                                                Forgot Password?
                                            </Text>
                                        </View>
                                    </View>

                                    <Button
                                        mode="contained"
                                        onPress={signInWithEmail}
                                        loading={loading}
                                        disabled={loading}
                                        style={styles.button}
                                        contentStyle={styles.buttonContent}
                                        labelStyle={styles.buttonLabel}
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </Button>

                                    {isBiometricEnrolled && (
                                        <TouchableOpacity
                                            style={styles.biometricButton}
                                            onPress={handleBiometricLogin}
                                            disabled={loading}
                                        >
                                            <MaterialCommunityIcons name="fingerprint" size={24} color="#3B82F6" />
                                            <Text style={styles.biometricText}>Login with Biometrics</Text>
                                        </TouchableOpacity>
                                    )}

                                    <View style={styles.footer}>
                                        <Text style={styles.footerText}>Don't have an account? </Text>
                                        <Text
                                            style={styles.linkText}
                                            onPress={() => router.push('/auth/signup')}
                                        >
                                            Sign Up
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        minHeight: height,
    },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoEmoji: {
        fontSize: 40,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    formContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 40,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    formContent: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 32,
    },
    inputContainer: {
        gap: 16,
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#FFFFFF',
    },
    inputOutline: {
        borderRadius: 12,
        borderWidth: 1.5,
    },
    button: {
        borderRadius: 12,
        marginBottom: 16,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
    },
    biometricText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#3B82F6',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#6B7280',
    },
    linkText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
});
