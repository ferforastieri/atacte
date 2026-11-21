import React, { useState } from 'react';
import {
  TextInput,
  Text,
  TouchableOpacity,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing, touch, typography } from '../../theme/tokens';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  error?: string;
  helperText?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  accessibilityLabel?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  helperText,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  autoCapitalize = 'sentences',
  autoComplete,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasRight = (secureTextEntry && !rightIcon) || Boolean(rightIcon);

  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label ? (
        <Text
          style={{
            fontSize: typography.label,
            fontWeight: typography.weights.medium,
            color: colors.ink,
            marginBottom: spacing.sm,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
        {leftIcon ? (
          <View style={{ position: 'absolute', left: spacing.md, zIndex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {leftIcon}
          </View>
        ) : null}

        <TextInput
          accessibilityLabel={accessibilityLabel || label || placeholder}
          style={[
            {
              flex: 1,
              minHeight: multiline ? 96 : 48,
              borderWidth: 1,
              borderColor: error ? colors.danger : isFocused ? colors.primary : colors.line,
              borderRadius: radii.lg,
              paddingHorizontal: leftIcon ? 44 : spacing.md,
              paddingRight: hasRight ? 48 : spacing.md,
              paddingVertical: multiline ? spacing.md : 0,
              fontSize: typography.body,
              color: colors.ink,
              backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.inkSubtle}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {rightIcon ? (
          <View style={{ position: 'absolute', right: spacing.xs, alignItems: 'center', justifyContent: 'center' }}>
            {rightIcon}
          </View>
        ) : null}

        {secureTextEntry && !rightIcon ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            style={{
              position: 'absolute',
              right: spacing.xs,
              width: touch.minimum,
              height: touch.minimum,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.md,
            }}
            onPress={() => setIsPasswordVisible((current) => !current)}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.inkSubtle}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={{ fontSize: typography.caption, fontWeight: typography.weights.medium, color: colors.dangerText, marginTop: 5 }}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={{ fontSize: typography.caption, color: colors.inkMuted, marginTop: 5 }}>{helperText}</Text>
      ) : null}
    </View>
  );
};
