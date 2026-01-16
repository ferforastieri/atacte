import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { TrustDeviceProvider } from './src/contexts/TrustDeviceContext';
import AppNavigator from './src/navigation/AppNavigator';
import { permissionService } from './src/services/permissions/permissionService';
import { nativeLocationService } from './src/services/location/nativeLocationService';

function PermissionsInitializer() {
  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      try {
        const results = await permissionService.requestAllPermissions();
        
        if (results.locationForeground.granted) {
          const isActive = await nativeLocationService.isTrackingActive();
          if (!isActive) {
            await nativeLocationService.startTracking();
          }
        }
        
        await nativeLocationService.sendInteractionLocation();
      } catch (error) {
        console.error('Erro ao verificar/solicitar permissões:', error);
      }
    };

    checkAndRequestPermissions();
  }, []);

  return null;
}


export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <TrustDeviceProvider>
                <PermissionsInitializer />
                <NotificationProvider>
                  <LocationProvider>
                    <View style={styles.container}>
                      <StatusBar style="auto" />
                      <AppNavigator />
                    </View>
                  </LocationProvider>
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
