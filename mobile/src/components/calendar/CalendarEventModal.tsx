import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Input, Button } from '../shared';
import { CalendarEvent, CreateCalendarEventRequest } from '../../services/calendar/calendarService';
import { useTheme } from '../../contexts/ThemeContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BaseSelect } from '../shared/BaseSelect';

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 22, g: 163, b: 74 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

interface ColorSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  color: string;
  label: string;
  trackColor: string;
  isDark: boolean;
}

const ColorSlider: React.FC<ColorSliderProps> = ({ value, onValueChange, color, label, trackColor, isDark }) => {
  const [sliderWidth, setSliderWidth] = useState(300);
  const thumbSize = 24;
  const trackHeight = 8;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const newValue = Math.max(0, Math.min(255, (evt.nativeEvent.locationX / sliderWidth) * 255));
      onValueChange(Math.round(newValue));
    },
    onPanResponderMove: (evt) => {
      const newValue = Math.max(0, Math.min(255, (evt.nativeEvent.locationX / sliderWidth) * 255));
      onValueChange(Math.round(newValue));
    },
  });

  const thumbPosition = (value / 255) * (sliderWidth - thumbSize);

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 14, color: isDark ? '#f9fafb' : '#111827', fontWeight: '500' }}>{label}</Text>
        <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>{value}</Text>
      </View>
      <View
        style={{
          height: trackHeight,
          backgroundColor: isDark ? '#374151' : '#e5e7eb',
          borderRadius: 4,
          position: 'relative',
        }}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: thumbPosition + thumbSize / 2,
            height: trackHeight,
            backgroundColor: trackColor,
            borderRadius: 4,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: thumbPosition,
            top: -8,
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: color,
            borderWidth: 3,
            borderColor: '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        />
      </View>
    </View>
  );
};

interface CalendarEventModalProps {
  visible: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  isEdit?: boolean;
  onSave: (data: CreateCalendarEventRequest) => Promise<void>;
  onDelete?: () => void;
  isLoading?: boolean;
}

const reminderOptions = [
  { label: '5 minutos antes', value: 5 },
  { label: '15 minutos antes', value: 15 },
  { label: '30 minutos antes', value: 30 },
  { label: '1 hora antes', value: 60 },
  { label: '24 horas antes', value: 1440 },
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const weekOfMonthOptions = [
  { label: 'Primeira', value: 1 },
  { label: 'Segunda', value: 2 },
  { label: 'Terceira', value: 3 },
  { label: 'Quarta', value: 4 },
  { label: 'Última', value: -1 },
];

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  visible,
  onClose,
  event,
  isEdit = false,
  onSave,
  onDelete,
  isLoading = false,
}) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<CreateCalendarEventRequest & {
    reminderMinutes: number[];
    recurrenceType?: string | null;
    recurrenceInterval?: number | null;
    recurrenceEndDate?: string | null;
    recurrenceDaysOfWeek?: number[];
    recurrenceDayOfMonth?: number | null;
    recurrenceWeekOfMonth?: number | null;
  }>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isAllDay: false,
      reminderMinutes: [],
      color: '#16a34a',
    location: '',
    recurrenceType: null,
    recurrenceInterval: 1,
    recurrenceEndDate: null,
    recurrenceDaysOfWeek: [],
    recurrenceDayOfMonth: null,
    recurrenceWeekOfMonth: null,
  });

  const [monthlyRecurrenceMode, setMonthlyRecurrenceMode] = useState<'day' | 'week'>('day');
  const [noRecurrenceEndDate, setNoRecurrenceEndDate] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(0);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorRgb, setColorRgb] = useState({ r: 22, g: 163, b: 74 });

  useEffect(() => {
    if (event && isEdit) {
      const startDate = parseISO(event.startDate);
      const endDate = event.endDate ? parseISO(event.endDate) : null;
      const recurrenceEndDate = event.recurrenceEndDate ? parseISO(event.recurrenceEndDate) : null;

      setFormData({
        title: event.title,
        description: event.description || '',
        startDate: event.startDate,
        endDate: event.endDate || '',
        isAllDay: event.isAllDay,
        reminderMinutes: event.reminderMinutes || [],
        color: event.color,
        location: event.location || '',
        recurrenceType: event.recurrenceType || null,
        recurrenceInterval: event.recurrenceInterval || 1,
        recurrenceEndDate: event.recurrenceEndDate || null,
        recurrenceDaysOfWeek: event.recurrenceDaysOfWeek || [],
        recurrenceDayOfMonth: event.recurrenceDayOfMonth || null,
        recurrenceWeekOfMonth: event.recurrenceWeekOfMonth || null,
      });

      setNoRecurrenceEndDate(!event.recurrenceEndDate);
      if (event.recurrenceDayOfMonth) {
        setMonthlyRecurrenceMode('day');
      } else if (event.recurrenceWeekOfMonth) {
        setMonthlyRecurrenceMode('week');
        if (event.recurrenceDaysOfWeek && event.recurrenceDaysOfWeek.length > 0) {
          setSelectedDayOfWeek(event.recurrenceDaysOfWeek[0]);
        }
      }
    } else if (event && !isEdit) {
      const startDate = parseISO(event.startDate);
      setFormData({
        title: '',
        description: '',
        startDate: event.startDate,
        endDate: '',
        isAllDay: false,
        reminderMinutes: [15, 60],
        color: '#16a34a',
        location: '',
        recurrenceType: null,
        recurrenceInterval: 1,
        recurrenceEndDate: null,
        recurrenceDaysOfWeek: [],
        recurrenceDayOfMonth: null,
        recurrenceWeekOfMonth: null,
      });
      setNoRecurrenceEndDate(true);
      setMonthlyRecurrenceMode('day');
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      setFormData({
        title: '',
        description: '',
        startDate: tomorrow.toISOString(),
        endDate: '',
        isAllDay: false,
        reminderMinutes: [15, 60],
        color: '#16a34a',
        location: '',
        recurrenceType: null,
        recurrenceInterval: 1,
        recurrenceEndDate: null,
        recurrenceDaysOfWeek: [],
        recurrenceDayOfMonth: null,
        recurrenceWeekOfMonth: null,
      });
      setNoRecurrenceEndDate(true);
      setMonthlyRecurrenceMode('day');
    }
  }, [event, isEdit, visible]);

  useEffect(() => {
    if (noRecurrenceEndDate) {
      setFormData(prev => ({ ...prev, recurrenceEndDate: null }));
    }
  }, [noRecurrenceEndDate]);

  useEffect(() => {
    if (showColorPicker && formData.color) {
      setColorRgb(hexToRgb(formData.color));
    }
  }, [showColorPicker, formData.color]);

  useEffect(() => {
    if (monthlyRecurrenceMode === 'day') {
      setFormData(prev => ({
        ...prev,
        recurrenceWeekOfMonth: null,
        recurrenceDaysOfWeek: [],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        recurrenceDayOfMonth: null,
      }));
      if (formData.recurrenceDaysOfWeek && formData.recurrenceDaysOfWeek.length > 0) {
        setSelectedDayOfWeek(formData.recurrenceDaysOfWeek[0]);
      } else {
        const startDate = formData.startDate ? parseISO(formData.startDate) : new Date();
        setSelectedDayOfWeek(startDate.getDay());
      }
    }
  }, [monthlyRecurrenceMode]);

  const getRecurrenceIntervalLabel = () => {
    if (!formData.recurrenceType) return '';
    const labels: Record<string, string> = {
      'DAILY': 'dia(s)',
      'WEEKLY': 'semana(s)',
      'MONTHLY': 'mês(es)',
      'YEARLY': 'ano(s)',
      'CUSTOM': 'dia(s)',
    };
    return labels[formData.recurrenceType] || '';
  };

  const formatDateTimeLocal = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDateLocal = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleToggleReminder = (value: number) => {
    const current = formData.reminderMinutes || [];
    if (current.includes(value)) {
      setFormData(prev => ({
        ...prev,
        reminderMinutes: current.filter(v => v !== value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        reminderMinutes: [...current, value],
      }));
    }
  };

  const handleToggleDayOfWeek = (dayIndex: number) => {
    const current = formData.recurrenceDaysOfWeek || [];
    if (current.includes(dayIndex)) {
      setFormData(prev => ({
        ...prev,
        recurrenceDaysOfWeek: current.filter(d => d !== dayIndex),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        recurrenceDaysOfWeek: [...current, dayIndex],
      }));
    }
  };

  const handleDateChange = (type: 'start' | 'end' | 'recurrenceEnd', date: Date | undefined) => {
    if (!date) {
      if (type === 'start') setShowStartDatePicker(false);
      else if (type === 'end') setShowEndDatePicker(false);
      else setShowRecurrenceEndDatePicker(false);
      return;
    }

    if (type === 'start') {
      setFormData(prev => ({ ...prev, startDate: date.toISOString() }));
      if (Platform.OS === 'android') {
        setShowStartDatePicker(false);
      }
    } else if (type === 'end') {
      setFormData(prev => ({ ...prev, endDate: date.toISOString() }));
      if (Platform.OS === 'android') {
        setShowEndDatePicker(false);
      }
    } else {
      setFormData(prev => ({ ...prev, recurrenceEndDate: date.toISOString() }));
      if (Platform.OS === 'android') {
        setShowRecurrenceEndDatePicker(false);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      return;
    }

    const eventData: CreateCalendarEventRequest = {
      title: formData.title,
      startDate: formData.startDate,
      isAllDay: formData.isAllDay,
      reminderMinutes: formData.reminderMinutes || [],
      color: formData.color,
    };

    if (formData.description) {
      eventData.description = formData.description;
    }
    if (formData.endDate) {
      eventData.endDate = formData.endDate;
    }
    if (formData.location) {
      eventData.location = formData.location;
    }

    if (formData.recurrenceType && formData.recurrenceType !== 'NONE') {
      eventData.recurrenceType = formData.recurrenceType;
      if (formData.recurrenceInterval) {
        eventData.recurrenceInterval = formData.recurrenceInterval;
      }
      if (formData.recurrenceType === 'WEEKLY' && formData.recurrenceDaysOfWeek && formData.recurrenceDaysOfWeek.length > 0) {
        eventData.recurrenceDaysOfWeek = formData.recurrenceDaysOfWeek;
      }
      if (formData.recurrenceType === 'MONTHLY') {
        if (monthlyRecurrenceMode === 'day' && formData.recurrenceDayOfMonth) {
          eventData.recurrenceDayOfMonth = formData.recurrenceDayOfMonth;
        } else if (monthlyRecurrenceMode === 'week') {
          if (formData.recurrenceWeekOfMonth) {
            eventData.recurrenceWeekOfMonth = formData.recurrenceWeekOfMonth;
          }
          if (formData.recurrenceDaysOfWeek && formData.recurrenceDaysOfWeek.length > 0) {
            eventData.recurrenceDaysOfWeek = formData.recurrenceDaysOfWeek;
          }
        }
      }
      if (!noRecurrenceEndDate && formData.recurrenceEndDate) {
        eventData.recurrenceEndDate = formData.recurrenceEndDate;
      }
    }

    await onSave(eventData);
  };

  const styles = StyleSheet.create({
    scrollContent: {
      flex: 1,
    },
    scrollContentContainer: {
      padding: 20,
      paddingBottom: 20,
    },
    section: {
      marginBottom: 20,
      width: '100%',
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 8,
    },
    required: {
      color: '#dc2626',
    },
    input: {
      marginBottom: 0,
      width: '100%',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 0,
      width: '100%',
    },
    switchLabel: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
      marginLeft: 12,
    },
    colorButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      width: '100%',
    },
    colorPreviewSmall: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
    colorInput: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      justifyContent: 'center',
    },
    colorInputText: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
    },
    colorPickerModal: {
      padding: 20,
      paddingBottom: 40,
    },
    colorPreviewContainer: {
      alignItems: 'center',
      marginBottom: 32,
      paddingVertical: 20,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
      borderRadius: 12,
      paddingHorizontal: 20,
    },
    colorPreview: {
      width: 120,
      height: 120,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    colorHexText: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    colorSlidersContainer: {
      marginBottom: 32,
    },
    colorInputContainer: {
      marginBottom: 32,
    },
    colorInputLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    colorHexInput: {
      marginBottom: 0,
    },
    colorPresetsSection: {
      marginBottom: 24,
    },
    colorPresetsLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
    },
    colorPresets: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      width: '100%',
    },
    colorPreset: {
      width: 50,
      height: 50,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorPresetSelected: {
      borderColor: '#16a34a',
      borderWidth: 3,
    },
    colorPickerActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    recurrenceSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
    },
    intervalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    intervalInput: {
      width: 80,
    },
    intervalLabel: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    weekDaysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    weekDayButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    weekDayButtonSelected: {
      backgroundColor: '#16a34a',
      borderColor: '#16a34a',
    },
    weekDayButtonUnselected: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
    weekDayText: {
      fontSize: 12,
      fontWeight: '500',
    },
    weekDayTextSelected: {
      color: '#ffffff',
    },
    weekDayTextUnselected: {
      color: isDark ? '#f9fafb' : '#111827',
    },
    radioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonSelected: {
      borderColor: '#16a34a',
    },
    radioButtonUnselected: {
      borderColor: isDark ? '#6b7280' : '#9ca3af',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#16a34a',
    },
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    reminderCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reminderCheckboxSelected: {
      backgroundColor: '#16a34a',
      borderColor: '#16a34a',
    },
    reminderCheckboxUnselected: {
      borderColor: isDark ? '#6b7280' : '#9ca3af',
      backgroundColor: 'transparent',
    },
    reminderLabel: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
    },
    dateButton: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
    },
    dateButtonText: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
      width: '100%',
      justifyContent: 'flex-end',
    },
    cancelButton: {
      minWidth: 100,
    },
    saveButton: {
      minWidth: 100,
    },
    deleteButton: {
      minWidth: 100,
    },
  });

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={event && event.id && isEdit ? 'Editar Evento' : 'Novo Evento'}
      size="lg"
    >
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.label}>
            Título <Text style={styles.required}>*</Text>
          </Text>
          <Input
            placeholder="Ex: Reunião, Aniversário, Lembrete"
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Descrição</Text>
          <Input
            placeholder="Adicione uma descrição para o evento"
            value={formData.description || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            Data de Início <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {formData.startDate ? formatDateTimeLocal(formData.startDate) : 'Selecione a data'}
            </Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={formData.startDate ? parseISO(formData.startDate) : new Date()}
              mode="datetime"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                handleDateChange('start', date);
                if (Platform.OS === 'ios' && event.type === 'dismissed') {
                  setShowStartDatePicker(false);
                }
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Data de Fim</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {formData.endDate ? formatDateTimeLocal(formData.endDate) : 'Selecione a data'}
            </Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={formData.endDate ? parseISO(formData.endDate) : new Date()}
              mode="datetime"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                handleDateChange('end', date);
                if (Platform.OS === 'ios' && event.type === 'dismissed') {
                  setShowEndDatePicker(false);
                }
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Switch
              value={formData.isAllDay}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isAllDay: value }))}
              trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#16a34a' }}
              thumbColor="#ffffff"
            />
            <Text style={styles.switchLabel}>Evento de dia inteiro</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Localização</Text>
          <Input
            placeholder="Ex: Sala de reuniões, Casa, etc."
            value={formData.location || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Cor</Text>
          <TouchableOpacity
            style={styles.colorButton}
            onPress={() => setShowColorPicker(true)}
          >
            <View
              style={[
                styles.colorPreviewSmall,
                { backgroundColor: formData.color || '#16a34a' },
              ]}
            />
            <View style={styles.colorInput}>
              <Text style={styles.colorInputText}>{formData.color || '#16a34a'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Repetir</Text>
          <BaseSelect
            value={formData.recurrenceType || ''}
            placeholder="Não repetir"
            options={[
              { label: 'Não repetir', value: '' },
              { label: 'Diariamente', value: 'DAILY' },
              { label: 'Semanalmente', value: 'WEEKLY' },
              { label: 'Mensalmente', value: 'MONTHLY' },
              { label: 'Anualmente', value: 'YEARLY' },
              { label: 'Personalizado', value: 'CUSTOM' },
            ]}
            onChange={(value) => setFormData(prev => ({ ...prev, recurrenceType: value || null }))}
            style={styles.input}
          />

          {formData.recurrenceType && formData.recurrenceType !== 'NONE' && (
            <View style={styles.recurrenceSection}>
              {formData.recurrenceType !== 'WEEKLY' && formData.recurrenceType !== 'MONTHLY' && (
                <View style={styles.section}>
                  <Text style={styles.label}>A cada</Text>
                  <View style={styles.intervalRow}>
                    <Input
                      keyboardType="numeric"
                      value={String(formData.recurrenceInterval || 1)}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, recurrenceInterval: parseInt(text) || 1 }))}
                      style={styles.intervalInput}
                    />
                    <Text style={styles.intervalLabel}>{getRecurrenceIntervalLabel()}</Text>
                  </View>
                </View>
              )}

              {formData.recurrenceType === 'WEEKLY' && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.label}>Dias da semana</Text>
                    <View style={styles.weekDaysGrid}>
                      {weekDays.map((day, index) => {
                        const isSelected = formData.recurrenceDaysOfWeek?.includes(index) || false;
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.weekDayButton,
                              isSelected ? styles.weekDayButtonSelected : styles.weekDayButtonUnselected,
                            ]}
                            onPress={() => handleToggleDayOfWeek(index)}
                          >
                            <Text
                              style={[
                                styles.weekDayText,
                                isSelected ? styles.weekDayTextSelected : styles.weekDayTextUnselected,
                              ]}
                            >
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View style={styles.section}>
                    <Text style={styles.label}>A cada</Text>
                    <View style={styles.intervalRow}>
                      <Input
                        keyboardType="numeric"
                        value={String(formData.recurrenceInterval || 1)}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, recurrenceInterval: parseInt(text) || 1 }))}
                        style={styles.intervalInput}
                      />
                      <Text style={styles.intervalLabel}>semana(s)</Text>
                    </View>
                  </View>
                </>
              )}

              {formData.recurrenceType === 'MONTHLY' && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.label}>Repetir em</Text>
                    <View style={styles.radioRow}>
                      <TouchableOpacity
                        style={[
                          styles.radioButton,
                          monthlyRecurrenceMode === 'day' ? styles.radioButtonSelected : styles.radioButtonUnselected,
                        ]}
                        onPress={() => setMonthlyRecurrenceMode('day')}
                      >
                        {monthlyRecurrenceMode === 'day' && <View style={styles.radioInner} />}
                      </TouchableOpacity>
                      <Text style={styles.switchLabel}>
                        Dia{' '}
                        <Input
                          keyboardType="numeric"
                          value={String(formData.recurrenceDayOfMonth || '')}
                          onChangeText={(text) => setFormData(prev => ({ ...prev, recurrenceDayOfMonth: parseInt(text) || null }))}
                          style={{ width: 60, marginLeft: 8 }}
                        />
                        {' '}de cada mês
                      </Text>
                    </View>
                    <View style={styles.radioRow}>
                      <TouchableOpacity
                        style={[
                          styles.radioButton,
                          monthlyRecurrenceMode === 'week' ? styles.radioButtonSelected : styles.radioButtonUnselected,
                        ]}
                        onPress={() => setMonthlyRecurrenceMode('week')}
                      >
                        {monthlyRecurrenceMode === 'week' && <View style={styles.radioInner} />}
                      </TouchableOpacity>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <BaseSelect
                          value={String(formData.recurrenceWeekOfMonth || '')}
                          placeholder="Semana"
                          options={weekOfMonthOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                          onChange={(value) => setFormData(prev => ({ ...prev, recurrenceWeekOfMonth: parseInt(value) || null }))}
                          style={{ flex: 1 }}
                        />
                        <BaseSelect
                          value={String(selectedDayOfWeek)}
                          placeholder="Dia"
                          options={weekDays.map((day, index) => ({ label: day, value: String(index) }))}
                          onChange={(value) => {
                            setSelectedDayOfWeek(parseInt(value));
                            setFormData(prev => ({ ...prev, recurrenceDaysOfWeek: [parseInt(value)] }));
                          }}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={styles.section}>
                    <Text style={styles.label}>A cada</Text>
                    <View style={styles.intervalRow}>
                      <Input
                        keyboardType="numeric"
                        value={String(formData.recurrenceInterval || 1)}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, recurrenceInterval: parseInt(text) || 1 }))}
                        style={styles.intervalInput}
                      />
                      <Text style={styles.intervalLabel}>mês(es)</Text>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.section}>
                <Text style={styles.label}>Até</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowRecurrenceEndDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formData.recurrenceEndDate ? formatDateLocal(formData.recurrenceEndDate) : 'Selecione a data'}
                  </Text>
                </TouchableOpacity>
                {showRecurrenceEndDatePicker && (
                  <DateTimePicker
                    value={formData.recurrenceEndDate ? parseISO(formData.recurrenceEndDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                      handleDateChange('recurrenceEnd', date);
                      if (Platform.OS === 'ios' && event.type === 'dismissed') {
                        setShowRecurrenceEndDatePicker(false);
                      }
                    }}
                  />
                )}
                <View style={styles.row}>
                  <Switch
                    value={noRecurrenceEndDate}
                    onValueChange={setNoRecurrenceEndDate}
                    trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#16a34a' }}
                    thumbColor="#ffffff"
                  />
                  <Text style={styles.switchLabel}>Sem data de término</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Lembretes</Text>
          {reminderOptions.map(reminder => {
            const isSelected = formData.reminderMinutes?.includes(reminder.value) || false;
            return (
              <View key={reminder.value} style={styles.reminderRow}>
                <TouchableOpacity
                  style={[
                    styles.reminderCheckbox,
                    isSelected ? styles.reminderCheckboxSelected : styles.reminderCheckboxUnselected,
                  ]}
                  onPress={() => handleToggleReminder(reminder.value)}
                >
                  {isSelected && <Text style={{ color: '#ffffff', fontSize: 12 }}>✓</Text>}
                </TouchableOpacity>
                <Text style={styles.reminderLabel}>{reminder.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          {event && event.id && isEdit && onDelete && (
            <Button
              variant="danger"
              onPress={onDelete}
              title="Deletar"
              style={styles.deleteButton}
            />
          )}
          <Button
            variant="secondary"
            onPress={onClose}
            title="Cancelar"
            style={styles.cancelButton}
          />
          <Button
            variant="primary"
            onPress={handleSave}
            title={event && event.id && isEdit ? 'Atualizar' : 'Criar'}
            loading={isLoading}
            disabled={!formData.title.trim() || isLoading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        title="Selecionar Cor"
        size="lg"
      >
        <ScrollView style={styles.colorPickerModal} showsVerticalScrollIndicator={false}>
          <View style={styles.colorPreviewContainer}>
            <View style={[styles.colorPreview, { backgroundColor: formData.color || '#16a34a' }]} />
            <Text style={[styles.colorHexText, { color: isDark ? '#f9fafb' : '#111827' }]}>
              {(formData.color || '#16a34a').toUpperCase()}
            </Text>
          </View>

          <View style={styles.colorSlidersContainer}>
            <ColorSlider
              value={colorRgb.r}
              onValueChange={(r) => {
                const newRgb = { ...colorRgb, r };
                setColorRgb(newRgb);
                setFormData(prev => ({ ...prev, color: rgbToHex(newRgb.r, newRgb.g, newRgb.b) }));
              }}
              color="#ef4444"
              label="Vermelho"
              trackColor="#ef4444"
              isDark={isDark}
            />
            <ColorSlider
              value={colorRgb.g}
              onValueChange={(g) => {
                const newRgb = { ...colorRgb, g };
                setColorRgb(newRgb);
                setFormData(prev => ({ ...prev, color: rgbToHex(newRgb.r, newRgb.g, newRgb.b) }));
              }}
              color="#22c55e"
              label="Verde"
              trackColor="#22c55e"
              isDark={isDark}
            />
            <ColorSlider
              value={colorRgb.b}
              onValueChange={(b) => {
                const newRgb = { ...colorRgb, b };
                setColorRgb(newRgb);
                setFormData(prev => ({ ...prev, color: rgbToHex(newRgb.r, newRgb.g, newRgb.b) }));
              }}
              color="#3b82f6"
              label="Azul"
              trackColor="#3b82f6"
              isDark={isDark}
            />
          </View>

          <View style={styles.colorInputContainer}>
            <Text style={[styles.colorInputLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
              Código Hex
            </Text>
            <Input
              value={formData.color || '#16a34a'}
              onChangeText={(text) => {
                if (/^#[0-9A-Fa-f]{0,6}$/.test(text)) {
                  setFormData(prev => ({ ...prev, color: text }));
                  if (text.length === 7) {
                    setColorRgb(hexToRgb(text));
                  }
                }
              }}
              placeholder="#000000"
              style={styles.colorHexInput}
            />
          </View>

          <View style={styles.colorPresetsSection}>
            <Text style={[styles.colorPresetsLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
              Cores Rápidas
            </Text>
            <View style={styles.colorPresets}>
              {['#16a34a', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6', '#a855f7', '#e11d48'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorPreset,
                    { backgroundColor: color },
                    (formData.color || '').toLowerCase() === color.toLowerCase() && styles.colorPresetSelected,
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, color }));
                    setColorRgb(hexToRgb(color));
                  }}
                >
                  {(formData.color || '').toLowerCase() === color.toLowerCase() && (
                    <Ionicons name="checkmark" size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.colorPickerActions}>
            <Button
              variant="secondary"
              onPress={() => setShowColorPicker(false)}
              title="Cancelar"
              style={{ flex: 1 }}
            />
            <Button
              variant="primary"
              onPress={() => setShowColorPicker(false)}
              title="Confirmar"
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      </Modal>
    </Modal>
  );
};

