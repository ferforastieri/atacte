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
import AppNavigator from './src/navigation/AppNavigator';
// Importar o serviço para registrar a tarefa em background (a definição da tarefa é executada no import)
import './src/services/location/foregroundLocationService';
import { foregroundLocationService } from './src/services/location/foregroundLocationService';
import * as Location from 'expo-location';
import { notificationService } from './src/services/notification/notificationService';

const backgroundLocationFunctions = {
  startBackgroundLocation: async (): Promise<boolean> => {
    try {
      return await foregroundLocationService.start();
    } catch (error) {
      console.error('Erro ao iniciar background location:', error);
      return false;
    }
  },

  stopBackgroundLocation: async (): Promise<void> => {
    try {
      await foregroundLocationService.stop();
    } catch (error) {
      console.error('Erro ao parar background location:', error);
    }
  },

  isBackgroundLocationActive: async (): Promise<boolean> => {
    try {
      return await foregroundLocationService.isActive();
    } catch (error) {
      console.error('Erro ao verificar status do background location:', error);
      return false;
    }
  },
};

(global as any).backgroundLocationFunctions = backgroundLocationFunctions;

// Componente para solicitar permissões na inicialização
function PermissionsInitializer() {
  useEffect(() => {
    const requestAllPermissions = async () => {
      try {
        
        // Solicitar permissões de notificação
        await notificationService.requestPermissions();
        
        // Solicitar permissões de localização (foreground e background)
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (foregroundStatus === 'granted') {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        }
        
      } catch (error) {
        console.error('Erro ao solicitar permissões:', error);
      }
    };

    // Solicitar permissões assim que o app iniciar
    requestAllPermissions();
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
              <PermissionsInitializer />
              <NotificationProvider>
                <LocationProvider>
                  <View style={styles.container}>
                    <StatusBar style="auto" />
                    <AppNavigator />
                  </View>
                </LocationProvider>
              </NotificationProvider>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
