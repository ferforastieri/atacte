import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, shadows, spacing, touch, typography } from '../../theme/tokens';

interface SelectOption {
  value: string;
  label: string;
}

interface BaseSelectProps {
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const BaseSelect: React.FC<BaseSelectProps> = ({
  value,
  placeholder = 'Selecione...',
  options,
  onChange,
  label,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <View style={[{ marginBottom: label ? spacing.lg : 0 }, style]}>
      {label ? (
        <Text style={{ fontSize: typography.label, fontWeight: typography.weights.medium, color: colors.ink, marginBottom: spacing.sm }}>
          {label}
        </Text>
      ) : null}

      <View style={{ position: 'relative', zIndex: 20 }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={label || placeholder}
          accessibilityState={{ disabled, expanded: showDropdown }}
          style={{
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
            backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
            borderColor: showDropdown ? colors.primary : colors.line,
            borderWidth: 1,
            borderRadius: radii.lg,
            paddingHorizontal: spacing.md,
            opacity: disabled ? 0.6 : 1,
          }}
          onPress={() => !disabled && setShowDropdown((current) => !current)}
          disabled={disabled}
          activeOpacity={0.78}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: typography.body,
              color: selectedOption ? colors.ink : colors.inkSubtle,
            }}
          >
            {selectedOption?.label || placeholder}
          </Text>
          <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={colors.inkSubtle} />
        </TouchableOpacity>

        {showDropdown ? (
          <View
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: spacing.xs,
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.line,
              borderWidth: 1,
              borderRadius: radii.lg,
              maxHeight: 240,
              overflow: 'hidden',
              zIndex: 100,
              ...shadows.pop,
            }}
          >
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {options.map((option) => {
                const active = value === option.value;
                return (
                  <TouchableOpacity
                    key={option.value || option.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      minHeight: touch.minimum,
                      justifyContent: 'center',
                      paddingHorizontal: spacing.lg,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.line,
                      backgroundColor: active ? colors.primarySoft : colors.surfaceRaised,
                    }}
                    onPress={() => {
                      onChange(option.value);
                      setShowDropdown(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: typography.body,
                        color: active ? colors.primarySoftText : colors.ink,
                        fontWeight: active ? typography.weights.semibold : typography.weights.regular,
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
};
