import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
}) => {
  const { isDark } = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      padding: 24,
    };

    const variantStyles: Record<string, ViewStyle> = {
      default: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: isDark ? '#374151' : '#e5e7eb',
      },
      outlined: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderWidth: 1,
        borderColor: isDark ? '#374151' : '#e5e7eb',
      },
      elevated: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.4 : 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: isDark ? '#374151' : '#f3f4f6',
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};
