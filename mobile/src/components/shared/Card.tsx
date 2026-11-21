import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, shadows, spacing } from '../../theme/tokens';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'muted' | 'hero';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const { colors } = useTheme();

  const variantStyles: Record<CardVariant, ViewStyle> = {
    default: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      ...shadows.card,
    },
    outlined: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    elevated: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      ...shadows.pop,
    },
    muted: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.line,
    },
    hero: {
      backgroundColor: colors.hero,
      borderWidth: 1,
      borderColor: colors.heroBorder,
      ...shadows.hero,
    },
  };

  const paddingStyles = {
    none: 0,
    sm: spacing.lg,
    md: spacing.xl,
    lg: spacing['2xl'],
  };

  return (
    <View
      style={[
        { borderRadius: radii['2xl'], padding: paddingStyles[padding], overflow: variant === 'hero' ? 'hidden' : 'visible' },
        variantStyles[variant],
        style,
      ]}
    >
      {children}
    </View>
  );
};
