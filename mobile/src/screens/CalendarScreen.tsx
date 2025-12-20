import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isToday as isTodayFn, addDays, addWeeks, getYear, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header, Modal, Button, SkeletonLoader, Card, BaseSelect } from '../components/shared';
import { CalendarEventModal } from '../components/calendar/CalendarEventModal';
import { calendarService, CalendarEvent, CreateCalendarEventRequest } from '../services/calendar/calendarService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';

type ViewType = 'day' | 'week' | 'month';

export default function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekDaysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const viewOptions = [
    { label: 'Dia', value: 'day' },
    { label: 'Semana', value: 'week' },
    { label: 'Mês', value: 'month' },
  ];

  useEffect(() => {
    loadEvents();
  }, [currentDate, currentView]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      let start: Date;
      let end: Date;
      
      switch (currentView) {
        case 'day':
          start = new Date(currentDate);
          start.setHours(0, 0, 0, 0);
          end = new Date(currentDate);
          end.setHours(23, 59, 59, 999);
          break;
        case 'week':
          const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
          const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
          start = weekStart;
          end = weekEnd;
          end.setHours(23, 59, 59, 999);
          break;
        case 'month':
        default:
          start = startOfMonth(currentDate);
          end = endOfMonth(currentDate);
          end.setHours(23, 59, 59, 999);
          break;
      }
      
      const response = await calendarService.searchEvents({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      if (response.success && response.data) {
        setEvents(response.data);
      } else {
        showError(response.message || 'Erro ao carregar eventos');
      }
    } catch (error: unknown) {
      showError('Erro ao carregar eventos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadEvents();
  }, [currentDate, currentView]);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = parseISO(event.startDate);
      return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const isToday = (date: Date) => {
    return isTodayFn(date);
  };

  const getCurrentDateLabel = () => {
    switch (currentView) {
      case 'day':
        return format(currentDate, "dd/MM/yyyy", { locale: ptBR });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        if (isSameMonth(weekStart, weekEnd)) {
          return `${format(weekStart, 'd')} - ${format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
        }
        return `${format(weekStart, "d 'de' MMMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    }
  };

  const navigateDate = (direction: number) => {
    switch (currentView) {
      case 'day':
        setCurrentDate(addDays(currentDate, direction));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, direction));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, direction));
        break;
    }
  };

  const navigateDateInPicker = (direction: number) => {
    setCurrentDate(addMonths(currentDate, direction));
    setSelectedMonth(getMonth(currentDate) + 1);
    setSelectedYear(getYear(currentDate));
  };

  const selectDateFromPicker = (date: Date) => {
    setCurrentDate(date);
    setShowDatePicker(false);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setShowDatePicker(false);
  };

  const goToSelectedDate = () => {
    const newDate = new Date(selectedYear, selectedMonth - 1, 1);
    setCurrentDate(newDate);
    setShowMonthYearPicker(false);
    setShowDatePicker(false);
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
      setShowEventModal(true);
    } else {
      const startDate = new Date(date);
      startDate.setHours(9, 0, 0, 0);
      setSelectedEvent({
        id: '',
        title: '',
        startDate: startDate.toISOString(),
        endDate: '',
        isAllDay: false,
        reminderMinutes: [],
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as CalendarEvent);
      setShowEventModal(true);
    }
  };

  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (data: CreateCalendarEventRequest) => {
    try {
      setIsSaving(true);
      
      if (selectedEvent && selectedEvent.id) {
        const response = await calendarService.updateEvent(selectedEvent.id, data);
        if (response.success) {
          showSuccess('Evento atualizado com sucesso');
          setShowEventModal(false);
          setSelectedEvent(null);
          loadEvents();
        } else {
          showError(response.message || 'Erro ao atualizar evento');
        }
      } else {
        const response = await calendarService.createEvent(data);
        if (response.success) {
          showSuccess('Evento criado com sucesso');
          setShowEventModal(false);
          setSelectedEvent(null);
          loadEvents();
        } else {
          showError(response.message || 'Erro ao criar evento');
        }
      }
    } catch (error: unknown) {
      showError('Erro ao salvar evento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      const response = await calendarService.deleteEvent(selectedEvent.id);
      if (response.success) {
        showSuccess('Evento deletado com sucesso');
        setShowDeleteModal(false);
        setShowEventModal(false);
        setSelectedEvent(null);
        loadEvents();
      } else {
        showError(response.message || 'Erro ao deletar evento');
      }
    } catch (error: unknown) {
      showError('Erro ao deletar evento');
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const monthEvents = events
    .filter(event => {
      const eventDate = parseISO(event.startDate);
      return eventDate >= monthStart && eventDate <= monthEnd;
    })
    .sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

  const formatEventDate = (event: CalendarEvent) => {
    const startDate = parseISO(event.startDate);
    if (event.isAllDay) {
      return format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    return format(startDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
      gap: 12,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    datePickerContainer: {
      position: 'relative',
      flex: 1,
      zIndex: 1000,
      maxWidth: '100%',
    },
    dateButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: 0,
    },
    dateButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
    },
    navButtons: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderRadius: 8,
      overflow: 'hidden',
    },
    navButton: {
      padding: 8,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
    },
    navButtonBorder: {
      borderLeftWidth: 1,
      borderLeftColor: isDark ? '#374151' : '#e5e7eb',
    },
    todayButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
    todayButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#f9fafb' : '#111827',
    },
    viewSelector: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderRadius: 8,
      padding: 4,
      gap: 4,
      width: '100%',
    },
    viewButton: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewButtonActive: {
      backgroundColor: '#16a34a',
    },
    viewButtonInactive: {
      backgroundColor: 'transparent',
    },
    viewButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    viewButtonTextActive: {
      color: '#ffffff',
    },
    viewButtonTextInactive: {
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    datePickerDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 8,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderRadius: 12,
      padding: 12,
      zIndex: 9999,
      elevation: 9999,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    viewSelectorRow: {
      marginTop: 0,
      marginBottom: 16,
    },
    datePickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    datePickerMonthYear: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
    },
    miniCalendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
    },
    miniCalendarDay: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 6,
    },
    miniCalendarDayText: {
      fontSize: 12,
    },
    calendarContainer: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      overflow: 'hidden',
      marginBottom: 16,
    },
    weekDaysHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    weekDayHeader: {
      flex: 1,
      paddingVertical: 12,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#9ca3af' : '#6b7280',
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.28%',
      minHeight: 80,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      padding: 4,
    },
    dayCellOtherMonth: {
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    dayCellToday: {
      backgroundColor: isDark ? '#14532d' : '#dcfce7',
    },
    dayNumber: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    dayNumberToday: {
      color: '#16a34a',
      fontWeight: '700',
    },
    dayNumberOtherMonth: {
      color: isDark ? '#4b5563' : '#9ca3af',
    },
    dayNumberNormal: {
      color: isDark ? '#f9fafb' : '#111827',
    },
    eventChip: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginBottom: 2,
      borderLeftWidth: 3,
    },
    eventChipText: {
      fontSize: 10,
      fontWeight: '500',
    },
    eventsList: {
      marginTop: 16,
    },
    eventsListTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 12,
    },
    eventCard: {
      marginBottom: 12,
    },
    eventCardContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    eventColorBar: {
      width: 4,
      borderRadius: 2,
      marginRight: 12,
    },
    eventInfo: {
      flex: 1,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 4,
    },
    eventDescription: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 8,
    },
    eventMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    eventMetaText: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 40,
      marginTop: 20,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#6b7280',
      marginTop: 16,
    },
    emptyText: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 8,
      textAlign: 'center',
    },
    modalContent: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      maxHeight: '80%',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Calendário" onThemeToggle={toggleTheme} />
        <SkeletonLoader variant="default" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Calendário" onThemeToggle={toggleTheme} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.leftSection}>
            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(!showDatePicker)}
              >
                <Text style={styles.dateButtonText}>{getCurrentDateLabel()}</Text>
                <Ionicons 
                  name={showDatePicker ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={isDark ? '#9ca3af' : '#6b7280'} 
                />
              </TouchableOpacity>

              {showDatePicker && (
                <View style={styles.datePickerDropdown}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity onPress={() => navigateDateInPicker(-1)}>
                      <Ionicons name="chevron-back" size={20} color={isDark ? '#f9fafb' : '#111827'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowMonthYearPicker(!showMonthYearPicker)}>
                      <Text style={styles.datePickerMonthYear}>
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigateDateInPicker(1)}>
                      <Ionicons name="chevron-forward" size={20} color={isDark ? '#f9fafb' : '#111827'} />
                    </TouchableOpacity>
                  </View>

                  {showMonthYearPicker ? (
                    <View>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        <BaseSelect
                          value={String(selectedMonth)}
                          placeholder="Mês"
                          options={months.map((month, index) => ({ label: month, value: String(index + 1) }))}
                          onChange={(value) => setSelectedMonth(parseInt(value))}
                          style={{ flex: 1 }}
                        />
                        <BaseSelect
                          value={String(selectedYear)}
                          placeholder="Ano"
                          options={Array.from({ length: 21 }, (_, i) => {
                            const year = new Date().getFullYear() - 10 + i;
                            return { label: String(year), value: String(year) };
                          })}
                          onChange={(value) => setSelectedYear(parseInt(value))}
                          style={{ flex: 1 }}
                        />
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={[styles.todayButton, { flex: 1 }]}
                          onPress={goToSelectedDate}
                        >
                          <Text style={styles.todayButtonText}>Ir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.todayButton, { flex: 1 }]}
                          onPress={() => setShowMonthYearPicker(false)}
                        >
                          <Text style={styles.todayButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                        {weekDaysShort.map((day, idx) => (
                          <View key={`mini-weekday-${idx}-${day}`} style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>
                              {day}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.miniCalendarGrid}>
                        {calendarDays.map((day, index) => {
                          const isTodayDay = isToday(day);
                          const isCurrentMonthDay = isSameMonth(day, currentDate);
                          const isSelectedDay = format(day, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
                          
                          return (
                            <TouchableOpacity
                              key={`mini-cal-day-${format(day, 'yyyy-MM-dd')}-${index}`}
                              style={[
                                styles.miniCalendarDay,
                                isTodayDay && { backgroundColor: '#3b82f6' },
                                isSelectedDay && !isTodayDay && { backgroundColor: isDark ? '#374151' : '#f3f4f6' },
                              ]}
                              onPress={() => selectDateFromPicker(day)}
                            >
                              <Text
                                style={[
                                  styles.miniCalendarDayText,
                                  isTodayDay && { color: '#ffffff', fontWeight: '700' },
                                  !isCurrentMonthDay && { color: isDark ? '#4b5563' : '#9ca3af' },
                                  isCurrentMonthDay && !isTodayDay && { color: isDark ? '#f9fafb' : '#111827' },
                                ]}
                              >
                                {format(day, 'd')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
                        <Text style={styles.todayButtonText}>Hoje</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>

            <View style={styles.navButtons}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => navigateDate(-1)}
              >
                <Ionicons name="chevron-back" size={20} color={isDark ? '#f9fafb' : '#111827'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonBorder]}
                onPress={() => navigateDate(1)}
              >
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#f9fafb' : '#111827'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
              <Text style={styles.todayButtonText}>Hoje</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.viewSelectorRow}>
          <View style={styles.viewSelector}>
            {viewOptions.map(view => (
              <TouchableOpacity
                key={view.value}
                style={[
                  styles.viewButton,
                  currentView === view.value ? styles.viewButtonActive : styles.viewButtonInactive,
                ]}
                onPress={() => setCurrentView(view.value as ViewType)}
              >
                <Text
                  style={[
                    styles.viewButtonText,
                    currentView === view.value ? styles.viewButtonTextActive : styles.viewButtonTextInactive,
                  ]}
                >
                  {view.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {currentView === 'month' && (
          <View style={styles.calendarContainer}>
            <View style={styles.weekDaysHeader}>
              {weekDays.map((day, idx) => (
                <Text key={`weekday-${idx}-${day}`} style={styles.weekDayHeader}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isTodayDay = isToday(day);
                const isCurrentMonthDay = isSameMonth(day, currentDate);

                return (
                  <TouchableOpacity
                    key={`cal-day-${format(day, 'yyyy-MM-dd')}-${index}`}
                    style={[
                      styles.dayCell,
                      !isCurrentMonthDay && styles.dayCellOtherMonth,
                      isTodayDay && styles.dayCellToday,
                    ]}
                    onPress={() => handleDatePress(day)}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isTodayDay && styles.dayNumberToday,
                        !isCurrentMonthDay && styles.dayNumberOtherMonth,
                        isCurrentMonthDay && !isTodayDay && styles.dayNumberNormal,
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                    <View>
                      {dayEvents.slice(0, 3).map(event => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.eventChip,
                            {
                              backgroundColor: `${event.color}20`,
                              borderLeftColor: event.color,
                            },
                          ]}
                          onPress={() => handleEventPress(event)}
                        >
                          <Text
                            style={[
                              styles.eventChipText,
                              { color: event.color },
                            ]}
                            numberOfLines={1}
                          >
                            {event.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {dayEvents.length > 3 && (
                        <Text style={{ fontSize: 10, color: isDark ? '#9ca3af' : '#6b7280' }}>
                          +{dayEvents.length - 3} mais
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.eventsList}>
          <Text style={styles.eventsListTitle}>Eventos deste mês</Text>
          <FlatList
            data={monthEvents}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleEventPress(item)}>
                <Card style={styles.eventCard}>
                  <View style={styles.eventCardContent}>
                    <View
                      style={[
                        styles.eventColorBar,
                        { backgroundColor: item.color || '#3b82f6', height: '100%' },
                      ]}
                    />
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{item.title}</Text>
                      {item.description && (
                        <Text style={styles.eventDescription}>{item.description}</Text>
                      )}
                      <View style={styles.eventMeta}>
                        <Text style={styles.eventMetaText}>
                          📅 {formatEventDate(item)}
                        </Text>
                        {item.location && (
                          <Text style={styles.eventMetaText}>
                            📍 {item.location}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Card style={styles.emptyCard}>
                <Ionicons 
                  name="calendar-outline" 
                  size={48} 
                  color={isDark ? '#9ca3af' : '#6b7280'}
                />
                <Text style={styles.emptyTitle}>Nenhum evento este mês</Text>
                <Text style={styles.emptyText}>
                  Toque em um dia para criar um novo evento
                </Text>
              </Card>
            }
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>

      <CalendarEventModal
        visible={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        isEdit={selectedEvent ? !!selectedEvent.id : false}
        onSave={handleSaveEvent}
        onDelete={() => {
          setShowEventModal(false);
          setShowDeleteModal(true);
        }}
        isLoading={isSaving}
      />

      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão"
      >
        <View style={styles.modalContent}>
          <Text style={{ color: isDark ? '#f9fafb' : '#111827', marginBottom: 20 }}>
            Tem certeza que deseja deletar este evento?
          </Text>
          <View style={styles.modalActions}>
            <Button
              variant="secondary"
              onPress={() => setShowDeleteModal(false)}
              title="Cancelar"
            />
            <Button
              variant="danger"
              onPress={handleDeleteEvent}
              title="Deletar"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
