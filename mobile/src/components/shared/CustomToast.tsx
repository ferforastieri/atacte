import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  text1: string;
  text2: string;
  onHide: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({ type, text1, text2, onHide }) => {
  const { isDark } = useTheme();

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'info':
        return 'information-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'info':
        return '#3b82f6';
      case 'warning':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const styles = {
    container: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 60,
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
      borderLeftWidth: 4,
      borderLeftColor: getIconColor(),
    },
    iconContainer: {
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 2,
    },
    message: {
      fontSize: 14,
      color: isDark ? '#d1d5db' : '#6b7280',
      lineHeight: 20,
    },
    closeButton: {
      marginLeft: 12,
      padding: 4,
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getIconName() as any} 
          size={24} 
          color={getIconColor()} 
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        <Text style={styles.message}>{text2}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={onHide}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons 
          name="close" 
          size={20} 
          color={isDark ? '#9ca3af' : '#6b7280'} 
        />
      </TouchableOpacity>
    </View>
  );
};

export default CustomToast;
