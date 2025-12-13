import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Logo } from './Logo';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title?: string;
  showThemeToggle?: boolean;
  onThemeToggle?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showNotificationsButton?: boolean;
  onNotificationsPress?: () => void;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showThemeToggle = true, 
  onThemeToggle,
  showBackButton = false,
  onBack,
  showRefreshButton = false,
  onRefresh,
  isRefreshing = false,
  showNotificationsButton = false,
  onNotificationsPress,
  notificationCount = 0
}) => {
  const { isDark } = useTheme();
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    content: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      minHeight: 60,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    logoContainer: {
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      marginRight: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    refreshButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationsButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: '#ef4444',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '600',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack || (() => navigation.goBack())}
            >
              <Ionicons 
                name="arrow-back" 
                size={20} 
                color={isDark ? '#f9fafb' : '#111827'} 
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={() => {
              try {
                navigation.navigate('Main', { screen: 'Dashboard' });
              } catch (e) {
                // Fallback se já estiver na tela principal
                navigation.navigate('Dashboard');
              }
            }}
            activeOpacity={0.7}
          >
            <Logo size={40} showText={false} />
          </TouchableOpacity>
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
        
        <View style={styles.rightSection}>
          {showRefreshButton && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={isRefreshing}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={isRefreshing ? (isDark ? '#6b7280' : '#9ca3af') : (isDark ? '#f9fafb' : '#111827')} 
              />
            </TouchableOpacity>
          )}
          {showNotificationsButton && (
            <TouchableOpacity 
              style={styles.notificationsButton}
              onPress={onNotificationsPress}
            >
              <Ionicons 
                name="notifications-outline" 
                size={20} 
                color={isDark ? '#f9fafb' : '#111827'} 
              />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {showThemeToggle && (
            <TouchableOpacity 
              style={styles.themeButton}
              onPress={onThemeToggle}
            >
              <Ionicons 
                name={isDark ? 'sunny' : 'moon'} 
                size={20} 
                color={isDark ? '#f9fafb' : '#111827'} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
