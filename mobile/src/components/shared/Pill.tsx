import React from 'react';
import { Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, typography } from '../../theme/tokens';

export type PillTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Pill: React.FC<PillProps> = ({ label, tone = 'neutral', icon, style, textStyle }) => {
  const { colors } = useTheme();

  const tones: Record<PillTone, { backgroundColor: string; color: string; borderColor: string }> = {
    neutral: { backgroundColor: colors.surfaceMuted, color: colors.inkMuted, borderColor: colors.line },
    accent: { backgroundColor: colors.primarySoft, color: colors.primarySoftText, borderColor: colors.primarySoftBorder },
    success: { backgroundColor: colors.successSoft, color: colors.successText, borderColor: colors.successBorder },
    warning: { backgroundColor: colors.warningSoft, color: colors.warningText, borderColor: colors.warningBorder },
    danger: { backgroundColor: colors.dangerSoft, color: colors.dangerText, borderColor: colors.dangerBorder },
    info: { backgroundColor: colors.infoSoft, color: colors.infoText, borderColor: colors.infoBorder },
  };

  const palette = tones[tone];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
          paddingHorizontal: 9,
          paddingVertical: 4,
          borderRadius: radii.pill,
          borderWidth: 1,
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[{ color: palette.color, fontSize: typography.caption, fontWeight: typography.weights.semibold }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};
