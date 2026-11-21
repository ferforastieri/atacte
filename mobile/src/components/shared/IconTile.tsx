import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { radii } from '../../theme/tokens';

interface IconTileProps {
  children: React.ReactNode;
  size?: number;
  variant?: 'primary' | 'muted' | 'success' | 'warning' | 'danger' | 'info' | 'hero';
  style?: ViewStyle;
}

export const IconTile: React.FC<IconTileProps> = ({
  children,
  size = 44,
  variant = 'primary',
  style,
}) => {
  const { colors } = useTheme();

  const backgrounds = {
    primary: colors.primarySoft,
    muted: colors.surfaceMuted,
    success: colors.successSoft,
    warning: colors.warningSoft,
    danger: colors.dangerSoft,
    info: colors.infoSoft,
    hero: colors.heroRaised,
  };

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radii.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: backgrounds[variant],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
