import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    onDismiss: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function CustomAlert({
    visible,
    title,
    message,
    type = 'info',
    onDismiss,
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Cancel',
}: CustomAlertProps) {
    const getIconConfig = () => {
        switch (type) {
            case 'success':
                return { name: 'check-circle' as const, color: '#10B981', bg: '#D1FAE5' };
            case 'error':
                return { name: 'exclamation-circle' as const, color: '#EF4444', bg: '#FEE2E2' };
            case 'warning':
                return { name: 'exclamation-triangle' as const, color: '#F59E0B', bg: '#FEF3C7' };
            case 'confirm':
                return { name: 'question-circle' as const, color: '#3B82F6', bg: '#DBEAFE' };
            default:
                return { name: 'info-circle' as const, color: '#3B82F6', bg: '#DBEAFE' };
        }
    };

    const icon = getIconConfig();
    const isConfirm = type === 'confirm';

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modalContainer}
            >
                <View style={styles.content}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
                        <FontAwesome name={icon.name} size={32} color={icon.color} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {isConfirm && (
                            <Button
                                mode="outlined"
                                onPress={onDismiss}
                                style={styles.button}
                                labelStyle={styles.cancelButtonLabel}
                                textColor="#6B7280"
                            >
                                {cancelText}
                            </Button>
                        )}
                        <Button
                            mode="contained"
                            onPress={() => {
                                if (onConfirm) {
                                    onConfirm();
                                }
                                onDismiss();
                            }}
                            style={[styles.button, isConfirm && styles.confirmButton]}
                            buttonColor={type === 'error' ? '#EF4444' : '#3B82F6'}
                        >
                            {confirmText}
                        </Button>
                    </View>
                </View>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: 'transparent',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        maxWidth: 340,
        width: '100%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        borderRadius: 16,
    },
    confirmButton: {
        flex: 1,
    },
    cancelButtonLabel: {
        color: '#6B7280',
    },
});
