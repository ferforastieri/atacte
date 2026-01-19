import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SkeletonLoader } from '../components/shared/Skeleton';


import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SecureNotesScreen from '../screens/SecureNotesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PasswordDetailScreen from '../screens/PasswordDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SecureNoteDetailScreen from '../screens/SecureNoteDetailScreen';
import AuditLogsScreen from '../screens/admin/AuditLogsScreen';
import SessionsScreen from '../screens/admin/SessionsScreen';
import UsersScreen from '../screens/admin/UsersScreen';


export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PasswordDetail: { passwordId: string };
  SecureNoteDetail: { noteId: string };
  AuditLogs: undefined;
  Sessions: undefined;
  Users: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  SecureNotes: undefined;
  Profile: undefined;
  Settings: undefined;
  PasswordDetail: { passwordId: string };
  SecureNoteDetail: { noteId: string };
  AuditLogs: undefined;
  Sessions: undefined;
  Users: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  const { isDark } = useTheme();
  const { user } = useAuth();

  return (
    <Tab.Navigator
      key={user?.profilePicture || 'default'}
      screenOptions={({ route }) => {
        return {
          tabBarIcon: ({ focused, color, size }) => {
            if (route.name === 'Profile' && user?.profilePicture) {
              return (
                <Image 
                  source={{ uri: user.profilePicture }} 
                  style={{ 
                    width: size, 
                    height: size, 
                    borderRadius: size / 2,
                    borderWidth: focused ? 2 : 0,
                    borderColor: '#22c55e',
                  }} 
                />
              );
            }

            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Dashboard') {
              iconName = focused ? 'key' : 'key-outline';
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
        };
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Senhas' }}
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
      <Tab.Screen 
        name="PasswordDetail" 
        component={PasswordDetailScreen}
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' }
        }}
      />
      <Tab.Screen 
        name="SecureNoteDetail" 
        component={SecureNoteDetailScreen}
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' }
        }}
      />
      <Tab.Screen 
        name="AuditLogs" 
        component={AuditLogsScreen}
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' }
        }}
      />
      <Tab.Screen 
        name="Sessions" 
        component={SessionsScreen}
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' }
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={UsersScreen}
        options={{ 
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
    return <SkeletonLoader variant="default" />;
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
            <Stack.Screen 
              name="SecureNoteDetail" 
              component={SecureNoteDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="AuditLogs" 
              component={AuditLogsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Sessions" 
              component={SessionsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Users" 
              component={UsersScreen}
              options={{
                headerShown: false,
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

