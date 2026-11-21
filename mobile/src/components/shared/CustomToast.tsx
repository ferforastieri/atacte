import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, shadows, spacing, typography } from '../../theme/tokens';

interface CustomToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  text1: string;
  text2: string;
  onHide: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({ type, text1, text2, onHide }) => {
  const { colors } = useTheme();

  const palette = {
    success: { color: colors.success, soft: colors.successSoft, icon: 'checkmark-circle' as const },
    error: { color: colors.danger, soft: colors.dangerSoft, icon: 'close-circle' as const },
    info: { color: colors.info, soft: colors.infoSoft, icon: 'information-circle' as const },
    warning: { color: colors.warning, soft: colors.warningSoft, icon: 'warning' as const },
  }[type];

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        marginHorizontal: spacing.lg,
        padding: spacing.lg,
        borderRadius: radii['2xl'],
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        ...shadows.pop,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.soft,
        }}
      >
        <Ionicons name={palette.icon} size={20} color={palette.color} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: typography.body, fontWeight: typography.weights.semibold, color: colors.ink }}>
          {text1}
        </Text>
        <Text style={{ marginTop: 2, fontSize: typography.label, lineHeight: 17, color: colors.inkMuted }}>
          {text2}
        </Text>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Fechar aviso"
        onPress={onHide}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={18} color={colors.inkSubtle} />
      </TouchableOpacity>
    </View>
  );
};

export default CustomToast;
