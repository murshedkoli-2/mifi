import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const { height } = Dimensions.get('window');

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleReset() {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false,
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
                        params: { email }
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
                                    <Text style={styles.logoEmoji}>🔒</Text>
                                </View>
                                <Text style={styles.appName}>Forgot Password</Text>
                                <Text style={styles.tagline}>Enter email to reset password</Text>
                            </View>

                            {/* Form Section */}
                            <View style={styles.formContainer}>
                                <View style={styles.formContent}>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label="Email Address"
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
                                    </View>

                                    <Button
                                        mode="contained"
                                        onPress={handleReset}
                                        loading={loading}
                                        disabled={loading}
                                        style={styles.button}
                                        contentStyle={styles.buttonContent}
                                        labelStyle={styles.buttonLabel}
                                    >
                                        Send OTP
                                    </Button>

                                    <Button
                                        mode="text"
                                        onPress={() => router.back()}
                                        style={styles.backButton}
                                        labelStyle={styles.backButtonLabel}
                                    >
                                        Back to Login
                                    </Button>
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
    inputContainer: {
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
    backButton: {
        borderRadius: 12,
    },
    backButtonLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
});
