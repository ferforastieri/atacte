import React, { useState } from 'react';
import { Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';

interface DatePickerProps {
  value?: Date;
  placeholder?: string;
  onChange: (date: Date) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  placeholder = 'Selecione uma data',
  onChange,
  label,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <View style={[{ marginBottom: label ? spacing.lg : 0 }, style]}>
      {label ? (
        <Text style={{ fontSize: typography.label, fontWeight: typography.weights.medium, color: colors.ink, marginBottom: spacing.sm }}>
          {label}
        </Text>
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        style={{
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          opacity: disabled ? 0.6 : 1,
        }}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
        activeOpacity={0.78}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.inkSubtle} />
        <Text style={{ fontSize: typography.body, color: value ? colors.ink : colors.inkSubtle }}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {showPicker ? (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={(_event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      ) : null}
    </View>
  );
};
