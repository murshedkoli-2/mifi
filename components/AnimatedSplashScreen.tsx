import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface AnimatedSplashScreenProps {
    onFinish: () => void;
}

export default function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
    const logoScale = useSharedValue(0);
    const logoRotate = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        // Logo animation - scale and rotate
        logoScale.value = withSpring(1, {
            damping: 10,
            stiffness: 100,
        });

        logoRotate.value = withSequence(
            withTiming(360, { duration: 800, easing: Easing.out(Easing.ease) }),
            withTiming(0, { duration: 0 })
        );

        // Text fade in after logo
        setTimeout(() => {
            textOpacity.value = withTiming(1, { duration: 600 });
        }, 400);

        // Fade out entire splash screen
        setTimeout(() => {
            containerOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
                if (finished) {
                    runOnJS(onFinish)();
                }
            });
        }, 2000);
    }, []);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: logoScale.value },
            { rotate: `${logoRotate.value}deg` },
        ],
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
            <LinearGradient
                colors={['#3B82F6', '#8B5CF6', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                        <Image
                            source={require('../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    <Animated.View style={textAnimatedStyle}>
                        <Text style={styles.appName}>ExpoFinance</Text>
                        <Text style={styles.tagline}>Your Financial Journey</Text>
                    </Animated.View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logo: {
        width: 80,
        height: 80,
    },
    appName: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
});
