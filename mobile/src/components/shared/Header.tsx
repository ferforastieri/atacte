import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from './Logo';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title?: string;
  showThemeToggle?: boolean;
  onThemeToggle?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showThemeToggle = true, 
  onThemeToggle,
  showBackButton = false,
  onBack
}) => {
  const { isDark } = useTheme();
  const { logout } = useAuth();
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
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoutButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
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
          <View style={styles.logoContainer}>
            <Logo size={40} showText={false} />
          </View>
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
        
        <View style={styles.rightSection}>
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
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={logout}
          >
            <Ionicons 
              name="log-out-outline" 
              size={20} 
              color="#dc2626" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
