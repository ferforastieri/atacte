import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import ServerSetupScreen from '../screens/ServerSetupScreen';
import { useServer } from '../contexts/ServerContext';


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
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
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
                    borderColor: colors.primary,
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
          tabBarActiveTintColor: colors.primaryText,
          tabBarInactiveTintColor: colors.inkMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.line,
            height: 64 + insets.bottom,
            paddingTop: 6,
            paddingBottom: Math.max(8, insets.bottom),
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
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
  const { serverUrl, isLoading: isServerLoading } = useServer();
  const { isDark, colors } = useTheme();

  if (isLoading || isServerLoading) {
    return <SkeletonLoader variant="dashboard" />;
  }

  if (!serverUrl) {
    return <ServerSetupScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.canvas,
          card: colors.surface,
          text: colors.ink,
          border: colors.line,
          notification: colors.accent,
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
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.ink,
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
