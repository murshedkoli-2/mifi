import { useState } from 'react';

interface AlertConfig {
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export function useAlert() {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<AlertConfig>({
        title: '',
        message: '',
        type: 'info',
    });

    const showAlert = (alertConfig: AlertConfig) => {
        setConfig(alertConfig);
        setVisible(true);
    };

    const hideAlert = () => {
        setVisible(false);
    };

    const showSuccess = (title: string, message: string) => {
        showAlert({ title, message, type: 'success' });
    };

    const showError = (title: string, message: string) => {
        showAlert({ title, message, type: 'error' });
    };

    const showWarning = (title: string, message: string) => {
        showAlert({ title, message, type: 'warning' });
    };

    const showInfo = (title: string, message: string) => {
        showAlert({ title, message, type: 'info' });
    };

    const showConfirm = (
        title: string,
        message: string,
        onConfirm: () => void,
        confirmText = 'Confirm',
        cancelText = 'Cancel'
    ) => {
        showAlert({
            title,
            message,
            type: 'confirm',
            onConfirm,
            confirmText,
            cancelText,
        });
    };

    return {
        visible,
        config,
        showAlert,
        hideAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
    };
}
