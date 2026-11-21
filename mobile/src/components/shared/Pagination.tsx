import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing, touch, typography } from '../../theme/tokens';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  busy?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  busy = false,
}) => {
  const { colors } = useTheme();
  if (totalPages <= 1) return null;

  const button = (label: string, icon: 'chevron-back' | 'chevron-forward', onPress: () => void, disabled: boolean) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{
        minHeight: touch.minimum,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        backgroundColor: colors.surfaceMuted,
        opacity: disabled || busy ? 0.45 : 1,
      }}
      onPress={onPress}
      disabled={disabled || busy}
    >
      {icon === 'chevron-back' ? <Ionicons name={icon} size={18} color={colors.inkMuted} /> : null}
      <Text style={{ fontSize: typography.label, fontWeight: typography.weights.semibold, color: colors.inkMuted }}>{label}</Text>
      {icon === 'chevron-forward' ? <Ionicons name={icon} size={18} color={colors.inkMuted} /> : null}
    </TouchableOpacity>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg }}>
      {button('Anterior', 'chevron-back', onPrevious, currentPage <= 1)}
      <Text style={{ fontSize: typography.label, fontWeight: typography.weights.medium, color: colors.inkMuted }}>
        Página {currentPage} de {totalPages}
      </Text>
      {button('Próxima', 'chevron-forward', onNext, currentPage >= totalPages)}
    </View>
  );
};
