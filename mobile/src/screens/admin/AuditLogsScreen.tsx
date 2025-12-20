import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, BackHandler, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Card, SearchInput, SkeletonLoader } from '../../components/shared';
import { BaseSelect, DatePicker } from '../../components/shared';
import { userService } from '../../services/users/userService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../../navigation/AppNavigator';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    email: string;
  };
}

type AuditLogsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'AuditLogs'>;

export default function AuditLogsScreen() {
  const navigation = useNavigation<AuditLogsScreenNavigationProp>();
  const { isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showError } = useToast();

  const handleBack = () => {
    navigation.jumpTo('Profile');
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
    hasMore: true
  });
  
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  };

  const [filters, setFilters] = useState({
    query: '',
    userId: '',
    action: '',
    startDate: getDefaultStartDate(),
    endDate: new Date(),
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchLogs();
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const timeoutId = setTimeout(() => {
        fetchLogs();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [filters.query, filters.userId, filters.action, filters.startDate, filters.endDate]);

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * pagination.limit;
      const response = await userService.getAuditLogs({
        query: filters.query || undefined,
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        startDate: filters.startDate.toISOString().split('T')[0],
        endDate: filters.endDate.toISOString().split('T')[0],
        limit: pagination.limit,
        offset,
      });
      if (response.success && response.data) {
        setLogs(response.data);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            currentPage: page,
            total: response.pagination.total,
            totalPages: Math.ceil(response.pagination.total / prev.limit),
            hasMore: page < Math.ceil(response.pagination.total / prev.limit)
          }));
        }
      } else {
        setLogs([]);
        setPagination(prev => ({ ...prev, hasMore: false, totalPages: 1 }));
      }
    } catch (error) {
      showError('Erro ao carregar logs de auditoria');
      setLogs([]);
      setPagination(prev => ({ ...prev, hasMore: false }));
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchLogs(page);
    }
  };

  const getActionClass = (action: string) => {
    const classes: Record<string, { bg: string; text: string }> = {
      LOGIN_SUCCESS: { bg: '#10b981', text: '#ffffff' },
      LOGIN_FAILED: { bg: '#dc2626', text: '#ffffff' },
      LOGOUT: { bg: '#6b7280', text: '#ffffff' },
      PASSWORD_CREATED: { bg: '#3b82f6', text: '#ffffff' },
      PASSWORD_UPDATED: { bg: '#f59e0b', text: '#ffffff' },
      PASSWORD_DELETED: { bg: '#dc2626', text: '#ffffff' },
      EXPORT_DATA: { bg: '#6366f1', text: '#ffffff' },
      IMPORT_DATA: { bg: '#06b6d4', text: '#ffffff' },
      NOTE_CREATED: { bg: '#3b82f6', text: '#ffffff' },
      NOTE_UPDATED: { bg: '#f59e0b', text: '#ffffff' },
      NOTE_DELETED: { bg: '#dc2626', text: '#ffffff' },
      PROFILE_UPDATED: { bg: '#8b5cf6', text: '#ffffff' },
      ACCOUNT_DELETED: { bg: '#dc2626', text: '#ffffff' },
      SESSION_REVOKED: { bg: '#f97316', text: '#ffffff' },
      LOCATION_UPDATED: { bg: '#14b8a6', text: '#ffffff' },
    };
    return classes[action] || { bg: '#6b7280', text: '#ffffff' };
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN_SUCCESS: 'Login',
      LOGIN_FAILED: 'Login Falhou',
      LOGOUT: 'Logout',
      PASSWORD_CREATED: 'Criar Senha',
      PASSWORD_UPDATED: 'Atualizar Senha',
      PASSWORD_DELETED: 'Deletar Senha',
      EXPORT_DATA: 'Exportar Dados',
      IMPORT_DATA: 'Importar Dados',
      NOTE_CREATED: 'Criar Nota',
      NOTE_UPDATED: 'Atualizar Nota',
      NOTE_DELETED: 'Deletar Nota',
      PROFILE_UPDATED: 'Atualizar Perfil',
      ACCOUNT_DELETED: 'Deletar Conta',
      SESSION_REVOKED: 'Revogar Sessão',
      LOCATION_UPDATED: 'Atualizar Localização'
    };
    return labels[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDetails = (details: Record<string, unknown> | string | null | undefined) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    if (typeof details === 'object') {
      try {
        return JSON.stringify(details, null, 2);
      } catch {
        return String(details);
      }
    }
    return String(details);
  };

  const actionOptions = [
    { value: '', label: 'Todas as ações' },
    { value: 'LOGIN_SUCCESS', label: 'Login' },
    { value: 'LOGIN_FAILED', label: 'Login Falhou' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'PASSWORD_CREATED', label: 'Criar Senha' },
    { value: 'PASSWORD_UPDATED', label: 'Atualizar Senha' },
    { value: 'PASSWORD_DELETED', label: 'Deletar Senha' },
    { value: 'EXPORT_DATA', label: 'Exportar Dados' },
    { value: 'IMPORT_DATA', label: 'Importar Dados' },
    { value: 'NOTE_CREATED', label: 'Criar Nota' },
    { value: 'NOTE_UPDATED', label: 'Atualizar Nota' },
    { value: 'NOTE_DELETED', label: 'Deletar Nota' },
    { value: 'PROFILE_UPDATED', label: 'Atualizar Perfil' },
    { value: 'ACCOUNT_DELETED', label: 'Deletar Conta' },
    { value: 'SESSION_REVOKED', label: 'Revogar Sessão' },
    { value: 'LOCATION_UPDATED', label: 'Atualizar Localização' },
  ];

  const userOptions = [
    { value: '', label: 'Todos os usuários' },
    ...users.map(user => ({ value: user.id, label: user.email })),
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    content: {
      flexGrow: 1,
      paddingBottom: 100,
    },
    filterCard: {
      marginBottom: 20,
    },
    filterRow: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 12,
    },
    filterItem: {
      flex: 1,
    },
    selectWrapper: {
      height: 40,
      justifyContent: 'center',
    },
    logCard: {
      marginBottom: 12,
      padding: 16,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    logDate: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    actionBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    actionBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    logDetails: {
      marginTop: 8,
    },
    detailRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#9ca3af' : '#6b7280',
      marginRight: 8,
    },
    detailValue: {
      fontSize: 12,
      color: isDark ? '#d1d5db' : '#374151',
      flex: 1,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 4,
    },
    emptyText: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      textAlign: 'center',
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
    },
    paginationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    paginationButtonDisabled: {
      opacity: 0.5,
    },
    paginationButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#d1d5db' : '#374151',
      marginHorizontal: 4,
    },
    paginationButtonTextDisabled: {
      color: isDark ? '#4b5563' : '#9ca3af',
    },
    paginationInfo: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#d1d5db' : '#374151',
    },
  });

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Header title="Logs de Auditoria" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
        <View style={styles.content}>
          <Text style={styles.emptyText}>Acesso negado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Logs de Auditoria" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.filterCard}>
          <SearchInput
            placeholder="Buscar logs..."
            value={filters.query}
            onChangeText={(text) => setFilters({ ...filters, query: text })}
          />
          
          <View style={styles.filterRow}>
            <View style={[styles.filterItem, styles.selectWrapper]}>
              <BaseSelect
                value={filters.userId}
                placeholder="Todos os usuários"
                options={userOptions}
                onChange={(value) => setFilters({ ...filters, userId: value })}
                style={{ marginBottom: 0 }}
              />
            </View>
            
            <View style={[styles.filterItem, styles.selectWrapper]}>
              <BaseSelect
                value={filters.action}
                placeholder="Todas as ações"
                options={actionOptions}
                onChange={(value) => setFilters({ ...filters, action: value })}
                style={{ marginBottom: 0 }}
              />
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <DatePicker
                value={filters.startDate}
                placeholder="Data inicial"
                onChange={(date) => setFilters({ ...filters, startDate: date })}
                style={{ marginBottom: 0 }}
              />
            </View>
            
            <View style={styles.filterItem}>
              <DatePicker
                value={filters.endDate}
                placeholder="Data final"
                onChange={(date) => setFilters({ ...filters, endDate: date })}
                style={{ marginBottom: 0 }}
              />
            </View>
          </View>
        </Card>

        {isLoading ? (
          <SkeletonLoader variant="default" />
        ) : logs.length === 0 ? (
          <Card style={styles.emptyContainer}>
            <Ionicons 
              name="document-text-outline" 
              size={48} 
              color={isDark ? '#6b7280' : '#9ca3af'}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>Nenhum log encontrado</Text>
            <Text style={styles.emptyText}>
              {logs.length === 0 ? 'Você ainda não possui logs de auditoria.' : 'Tente ajustar os filtros de busca.'}
            </Text>
          </Card>
        ) : (
          logs.map((log) => {
            const actionClass = getActionClass(log.action);
            return (
              <Card key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={[styles.actionBadge, { backgroundColor: actionClass.bg }]}>
                    <Text style={[styles.actionBadgeText, { color: actionClass.text }]}>
                      {getActionLabel(log.action)}
                    </Text>
                  </View>
                  <Text style={styles.logDate}>{formatDateTime(log.createdAt)}</Text>
                </View>
                
                <View style={styles.logDetails}>
                  {log.user && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Usuário:</Text>
                      <Text style={styles.detailValue}>{log.user.email}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Detalhes:</Text>
                    <Text style={styles.detailValue} numberOfLines={3}>
                      {formatDetails(log.details)}
                    </Text>
                  </View>
                  {log.ipAddress && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>IP:</Text>
                      <Text style={styles.detailValue}>{log.ipAddress}</Text>
                    </View>
                  )}
                  {log.userAgent && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>User Agent:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {log.userAgent}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            );
          })
        )}

        {!isLoading && logs.length > 0 && pagination.totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, pagination.currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => goToPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <Ionicons name="chevron-back" size={20} color={pagination.currentPage === 1 ? (isDark ? '#4b5563' : '#9ca3af') : (isDark ? '#d1d5db' : '#374151')} />
              <Text style={[styles.paginationButtonText, pagination.currentPage === 1 && styles.paginationButtonTextDisabled]}>
                Anterior
              </Text>
            </TouchableOpacity>

            <Text style={styles.paginationInfo}>
              Página {pagination.currentPage} de {pagination.totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.paginationButton, pagination.currentPage === pagination.totalPages && styles.paginationButtonDisabled]}
              onPress={() => goToPage(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <Text style={[styles.paginationButtonText, pagination.currentPage === pagination.totalPages && styles.paginationButtonTextDisabled]}>
                Próxima
              </Text>
              <Ionicons name="chevron-forward" size={20} color={pagination.currentPage === pagination.totalPages ? (isDark ? '#4b5563' : '#9ca3af') : (isDark ? '#d1d5db' : '#374151')} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
