import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  rightIcon,
}) => {
  const { isDark } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label && (
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          color: isDark ? '#d1d5db' : '#374151',
          marginBottom: 8,
        }}>
          {label}
        </Text>
      )}
      
      <View style={{
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TextInput
          style={[{
            flex: 1,
            borderWidth: 1,
            borderColor: error ? '#dc2626' : (isDark ? '#4b5563' : '#d1d5db'),
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            color: isDark ? '#f9fafb' : '#111827',
            backgroundColor: disabled ? (isDark ? '#374151' : '#f9fafb') : (isDark ? '#1f2937' : '#ffffff'),
            minHeight: multiline ? 80 : 40,
            textAlignVertical: multiline ? 'top' : 'center',
          }, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        
        {rightIcon && (
          <View style={{
            position: 'absolute',
            right: 12,
            padding: 4,
          }}>
            {rightIcon}
          </View>
        )}
        
        {secureTextEntry && !rightIcon && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: 12,
              padding: 4,
            }}
            onPress={togglePasswordVisibility}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={{
          fontSize: 12,
          color: '#dc2626',
          marginTop: 4,
        }}>
          {error}
        </Text>
      )}
    </View>
  );
};
