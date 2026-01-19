import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { TrustDeviceProvider } from './src/contexts/TrustDeviceContext';
import AppNavigator from './src/navigation/AppNavigator';


export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <TrustDeviceProvider>
                <NotificationProvider>
                  <View style={styles.container}>
                    <StatusBar style="auto" />
                    <AppNavigator />
                  </View>
                </NotificationProvider>
              </TrustDeviceProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
