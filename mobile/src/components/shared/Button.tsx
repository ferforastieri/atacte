import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, touch, typography } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'subtle' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: { paddingHorizontal: 12, minHeight: touch.minimum, borderRadius: radii.md },
    md: { paddingHorizontal: 16, minHeight: 48, borderRadius: radii.lg },
    lg: { paddingHorizontal: 22, minHeight: 52, borderRadius: radii.lg },
    icon: { width: touch.minimum, height: touch.minimum, borderRadius: radii.md },
  };

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.primary },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    danger: { backgroundColor: colors.dangerSolid },
    ghost: { backgroundColor: 'transparent' },
    subtle: { backgroundColor: colors.primarySoft },
    dark: { backgroundColor: colors.hero, borderWidth: 1, borderColor: colors.heroBorder },
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: colors.onPrimary,
    secondary: colors.ink,
    danger: colors.onPrimary,
    ghost: colors.inkMuted,
    subtle: colors.primarySoftText,
    dark: colors.heroText,
  };

  const textSizes: Record<ButtonSize, number> = {
    sm: typography.label,
    md: typography.body,
    lg: typography.bodyLarge,
    icon: typography.body,
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      activeOpacity={0.78}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled || loading ? 0.55 : 1,
        },
        sizeStyles[size],
        variantStyles[variant],
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : (
        <>
          {icon ? <View style={{ alignItems: 'center', justifyContent: 'center' }}>{icon}</View> : null}
          {size !== 'icon' ? (
            <Text
              style={[
                {
                  color: textColors[variant],
                  fontSize: textSizes[size],
                  fontWeight: typography.weights.semibold,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
};
