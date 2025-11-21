import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';


import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SecureNotesScreen from '../screens/SecureNotesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PasswordDetailScreen from '../screens/PasswordDetailScreen';
import FamilyScreen from '../screens/FamilyScreen';
import FamilyDetailScreen from '../screens/FamilyDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';


export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PasswordDetail: { passwordId: string };
  FamilyDetail: { familyId: string; familyName: string };
  FamilyDetails: { familyId: string };
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Family: undefined;
  FamilyDetail: { familyId: string; familyName: string };
  SecureNotes: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'key' : 'key-outline';
          } else if (route.name === 'Family') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'SecureNotes') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
        tabBarStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Senhas' }}
      />
      <Tab.Screen 
        name="Family" 
        component={FamilyScreen}
        options={{ title: 'Família' }}
      />
      <Tab.Screen 
        name="FamilyDetail" 
        component={FamilyDetailScreen}
        options={{ 
          title: 'Detalhes da Família',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' }
        }}
      />
      <Tab.Screen 
        name="SecureNotes" 
        component={SecureNotesScreen}
        options={{ title: 'Notas Seguras' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Configurações',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' }
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          Carregando...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: '#22c55e',
          background: isDark ? '#111827' : '#f9fafb',
          card: isDark ? '#1f2937' : '#ffffff',
          text: isDark ? '#f9fafb' : '#111827',
          border: isDark ? '#374151' : '#e5e7eb',
          notification: '#22c55e',
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="PasswordDetail" 
              component={PasswordDetailScreen}
              options={{
                headerShown: true,
                title: 'Detalhes da Senha',
                headerStyle: {
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                },
                headerTintColor: isDark ? '#f9fafb' : '#111827',
                headerTitleStyle: {
                  fontWeight: '600',
                },
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});
