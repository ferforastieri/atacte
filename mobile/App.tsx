import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/contexts/ToastContext';
import ReauthenticateModal from './src/components/auth/ReauthenticateModal';
import BiometricLock from './src/components/auth/BiometricLock';
import UpdateNotice from './src/components/layout/UpdateNotice';
import AppNavigator from './src/navigation/AppNavigator';
import { ServerProvider } from './src/contexts/ServerContext';


void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppContent() {
  const { isDark, isLoading } = useTheme();
  if (isLoading) return null; // Keep the native splash until the saved theme is ready.
  return <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}
    onLayout={() => { void SplashScreen.hideAsync().catch(() => undefined); }}>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <BiometricLock><AppNavigator /><UpdateNotice /></BiometricLock>
    <ReauthenticateModal />
  </View>;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#111827' }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <ServerProvider>
              <AuthProvider>
                  <AppContent />
              </AuthProvider>
            </ServerProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
