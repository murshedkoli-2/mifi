import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const { height } = Dimensions.get('window');

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    // Calculate password strength
    const getPasswordStrength = () => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength += 0.25;
        if (password.length >= 12) strength += 0.25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 0.25;
        if (/\d/.test(password)) strength += 0.15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 0.1;
        return Math.min(strength, 1);
    };

    const getPasswordStrengthColor = () => {
        const strength = getPasswordStrength();
        if (strength < 0.3) return '#EF4444'; // red
        if (strength < 0.6) return '#F59E0B'; // orange
        if (strength < 0.8) return '#10B981'; // green
        return '#059669'; // dark green
    };

    const getPasswordStrengthText = () => {
        const strength = getPasswordStrength();
        if (strength === 0) return '';
        if (strength < 0.3) return 'Weak';
        if (strength < 0.6) return 'Fair';
        if (strength < 0.8) return 'Good';
        return 'Strong';
    };

    async function signUpWithEmail() {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Send OTP to email for verification
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                    data: {
                        full_name: name,
                    }
                }
            });

            if (error) throw error;

            Alert.alert(
                'Check your email',
                'We have sent a verification code to your email address.',
                [{
                    text: 'Enter Code',
                    onPress: () => router.push({
                        pathname: '/auth/verify-otp',
                        params: {
                            email,
                            type: 'signup',
                            name,
                            password
                        }
                    })
                }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
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
                                <Text style={styles.tagline}>Start your financial journey</Text>
                            </View>

                            {/* Form Section */}
                            <View style={styles.formContainer}>
                                <View style={styles.formContent}>
                                    <Text style={styles.welcomeText}>Create Account</Text>
                                    <Text style={styles.subtitleText}>Join us to manage your finances better</Text>

                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label="Full Name"
                                            value={name}
                                            onChangeText={setName}
                                            mode="outlined"
                                            autoCapitalize="words"
                                            left={<TextInput.Icon icon="account-outline" />}
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

                                        <View>
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
                                            {password.length > 0 && (
                                                <View style={styles.passwordStrength}>
                                                    <ProgressBar
                                                        progress={getPasswordStrength()}
                                                        color={getPasswordStrengthColor()}
                                                        style={styles.progressBar}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.strengthText,
                                                            { color: getPasswordStrengthColor() }
                                                        ]}
                                                    >
                                                        {getPasswordStrengthText()}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <TextInput
                                            label="Confirm Password"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            mode="outlined"
                                            secureTextEntry={!showConfirmPassword}
                                            left={<TextInput.Icon icon="lock-check-outline" />}
                                            right={
                                                <TextInput.Icon
                                                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                    </View>

                                    <Button
                                        mode="contained"
                                        onPress={signUpWithEmail}
                                        loading={loading}
                                        disabled={loading}
                                        style={styles.button}
                                        contentStyle={styles.buttonContent}
                                        labelStyle={styles.buttonLabel}
                                    >
                                        {loading ? 'Creating account...' : 'Sign Up'}
                                    </Button>

                                    <View style={styles.footer}>
                                        <Text style={styles.footerText}>Already have an account? </Text>
                                        <Text
                                            style={styles.linkText}
                                            onPress={() => router.back()}
                                        >
                                            Sign In
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
    passwordStrength: {
        marginTop: 8,
        gap: 4,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    button: {
        borderRadius: 12,
        marginBottom: 24,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 16,
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
