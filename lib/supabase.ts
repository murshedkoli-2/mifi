import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

const ExpoSecureStoreAdapter = {
    getItem: async (key: string) => {
        if (Platform.OS === 'web') {
            if (typeof localStorage === 'undefined') {
                return null
            }
            return localStorage.getItem(key)
        }
        return await SecureStore.getItemAsync(key)
    },
    setItem: async (key: string, value: string) => {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value)
            }
            return
        }
        await SecureStore.setItemAsync(key, value)
    },
    removeItem: async (key: string) => {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key)
            }
            return
        }
        await SecureStore.deleteItemAsync(key)
    },
}

// TODO: Replace with environment variables
const supabaseUrl = 'https://xgaigbyiveammqumxdcc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnYWlnYnlpdmVhbW1xdW14ZGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NjA2OTksImV4cCI6MjA4MjEzNjY5OX0.LjctbfmCSZCOyUvJmex-XZ7C_qJ6eUiI_y8s8w0sM_k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})
