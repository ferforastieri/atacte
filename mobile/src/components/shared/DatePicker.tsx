import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';

interface DatePickerProps {
  value?: Date;
  placeholder?: string;
  onChange: (date: Date) => void;
  label?: string;
  disabled?: boolean;
  style?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  placeholder = 'Selecione uma data',
  onChange,
  label,
  disabled = false,
  style,
}) => {
  const { isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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
      minHeight: 40,
    },
    buttonText: {
      fontSize: 14,
      color: value ? (isDark ? '#f9fafb' : '#111827') : (isDark ? '#6b7280' : '#9ca3af'),
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={isDark ? '#9ca3af' : '#6b7280'} 
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>
            {value ? formatDate(value) : placeholder}
          </Text>
        </View>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
};

