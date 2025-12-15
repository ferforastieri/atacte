import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

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
  style?: any;
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
  const { isDark } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const styles = StyleSheet.create({
    container: {
      marginBottom: label ? 16 : 0,
      ...style,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#d1d5db' : '#374151',
      marginBottom: 8,
    },
    selectContainer: {
      position: 'relative',
      height: 40,
      justifyContent: 'center',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: disabled ? (isDark ? '#374151' : '#f9fafb') : (isDark ? '#1f2937' : '#ffffff'),
      borderColor: isDark ? '#4b5563' : '#d1d5db',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      height: 40,
    },
    buttonText: {
      fontSize: 14,
      color: value ? (isDark ? '#f9fafb' : '#111827') : (isDark ? '#6b7280' : '#9ca3af'),
      flex: 1,
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 4,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      borderRadius: 12,
      maxHeight: 200,
      zIndex: 1000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    dropdownItemText: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
    },
    dropdownItemActive: {
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.selectContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => !disabled && setShowDropdown(!showDropdown)}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>{displayText}</Text>
          <Ionicons
            name={showDropdown ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={isDark ? '#9ca3af' : '#6b7280'}
          />
        </TouchableOpacity>
        {showDropdown && (
          <View style={styles.dropdown}>
            <ScrollView nestedScrollEnabled>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    value === option.value && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    onChange(option.value);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

