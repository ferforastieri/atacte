import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, shadows, spacing } from '../../theme/tokens';

interface HeroCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Dark "hero" surface used for secrets and TOTP. React Native has no gradient
 * primitive in the current dependency set, so the web gradient is approximated
 * with a layered dark surface and a soft green glow.
 */
export const HeroCard: React.FC<HeroCardProps> = ({ children, style, padding = 'lg' }) => {
  const { colors } = useTheme();
  const paddings = { none: 0, sm: spacing.lg, md: spacing.xl, lg: spacing['2xl'] };

  return (
    <View
      style={[
        {
          backgroundColor: colors.hero,
          borderRadius: radii['2xl'],
          borderWidth: 1,
          borderColor: colors.heroBorder,
          overflow: 'hidden',
          padding: paddings[padding],
          ...shadows.hero,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 190,
          height: 190,
          borderRadius: 95,
          backgroundColor: colors.heroGlow,
          top: -80,
          right: -70,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: colors.heroGlow,
          bottom: -90,
          left: -60,
          opacity: 0.55,
        }}
      />
      <View style={{ zIndex: 1 }}>{children}</View>
    </View>
  );
};
