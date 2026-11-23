import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  BaseSelect,
  Card,
  DatePicker,
  EmptyState,
  Header,
  Pagination,
  SearchInput,
  SkeletonTable,
} from '../../components/shared';
import { Pill, type PillTone } from '../../components/shared/Pill';
import { userService } from '../../services/users/userService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MainTabParamList } from '../../navigation/AppNavigator';
import { spacing, typography } from '../../theme/tokens';

interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { email: string };
}

type AuditLogsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'AuditLogs'>;

export default function AuditLogsScreen() {
  const navigation = useNavigation<AuditLogsScreenNavigationProp>();
  const { isAdmin } = useAuth();
  const { colors, toggleTheme } = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0, limit: 10 });
  const requestId = useRef(0);

  const handleBack = () => navigation.jumpTo('Profile');

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation]),
  );

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
      void fetchUsers();
      void fetchLogs();
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const timeoutId = setTimeout(() => { void fetchLogs(); }, 300);
    return () => clearTimeout(timeoutId);
  }, [filters.query, filters.userId, filters.action, filters.startDate, filters.endDate]);

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.success && response.data) setUsers(response.data);
    } catch {
      // The user filter is optional.
    }
  };

  const fetchLogs = async (page = 1) => {
    const currentRequest = ++requestId.current;
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
      if (currentRequest !== requestId.current) return;

      if (response.success && response.data) {
        setLogs(response.data as AuditLog[]);
        if (response.pagination) {
          const totalPages = Math.max(1, Math.ceil(response.pagination.total / pagination.limit));
          setPagination((previous) => ({ ...previous, currentPage: page, total: response.pagination!.total, totalPages }));
        }
      } else {
        setLogs([]);
        setPagination((previous) => ({ ...previous, totalPages: 1 }));
      }
    } catch {
      if (currentRequest === requestId.current) {
        setLogs([]);
        setPagination((previous) => ({ ...previous, totalPages: 1 }));
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  };

  const actionTones: Record<string, PillTone> = {
    LOGIN_SUCCESS: 'success',
    LOGIN_FAILED: 'danger',
    LOGOUT: 'neutral',
    PASSWORD_CREATED: 'info',
    PASSWORD_UPDATED: 'warning',
    PASSWORD_DELETED: 'danger',
    EXPORT_DATA: 'accent',
    IMPORT_DATA: 'info',
    NOTE_CREATED: 'info',
    NOTE_UPDATED: 'warning',
    NOTE_DELETED: 'danger',
    PROFILE_UPDATED: 'accent',
    ACCOUNT_DELETED: 'danger',
    SESSION_REVOKED: 'warning',
    LOCATION_UPDATED: 'neutral',
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
      LOCATION_UPDATED: 'Atualizar Localização',
    };
    return labels[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatDetails = (details: Record<string, unknown> | string | null | undefined) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    try {
      return JSON.stringify(details);
    } catch {
      return String(details);
    }
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
    ...users.map((user) => ({ value: user.id, label: user.email })),
  ];

  const hasActiveFilters = Boolean(filters.query || filters.userId || filters.action);

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Header title="Logs de Auditoria" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
        <View style={{ padding: spacing.screen }}>
          <EmptyState icon="lock-closed-outline" title="Acesso negado" description="Esta área é exclusiva de administradores." />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title="Logs de Auditoria"
        subtitle="Acessos e alterações do cofre"
        showBackButton
        onBack={handleBack}
        onThemeToggle={toggleTheme}
        icon={<Ionicons name="shield-checkmark-outline" size={22} color={colors.primarySoftText} />}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <SearchInput
            placeholder="Buscar logs..."
            value={filters.query}
            onChangeText={(text) => setFilters((current) => ({ ...current, query: text }))}
            onSearch={(text) => setFilters((current) => ({ ...current, query: text }))}
          />

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <BaseSelect
                value={filters.userId}
                placeholder="Todos os usuários"
                options={userOptions}
                onChange={(value) => setFilters((current) => ({ ...current, userId: value }))}
                style={{ marginBottom: 0 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <BaseSelect
                value={filters.action}
                placeholder="Todas as ações"
                options={actionOptions}
                onChange={(value) => setFilters((current) => ({ ...current, action: value }))}
                style={{ marginBottom: 0 }}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <DatePicker
                value={filters.startDate}
                placeholder="Data inicial"
                onChange={(date) => setFilters((current) => ({ ...current, startDate: date }))}
                style={{ marginBottom: 0 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <DatePicker
                value={filters.endDate}
                placeholder="Data final"
                onChange={(date) => setFilters((current) => ({ ...current, endDate: date }))}
                style={{ marginBottom: 0 }}
              />
            </View>
          </View>
        </View>

        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Nenhum log encontrado"
            description={hasActiveFilters ? 'Tente ajustar os filtros de busca.' : 'Você ainda não possui logs de auditoria.'}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {logs.map((log) => (
              <Card key={log.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md }}>
                  <Pill label={getActionLabel(log.action)} tone={actionTones[log.action] || 'neutral'} />
                  <Text style={{ fontSize: typography.caption, color: colors.inkMuted }}>{formatDateTime(log.createdAt)}</Text>
                </View>

                <View style={{ gap: 5 }}>
                  {log.user ? (
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <Text style={{ minWidth: 70, fontSize: typography.caption, fontWeight: typography.weights.semibold, color: colors.inkMuted }}>Usuário</Text>
                      <Text style={{ flex: 1, fontSize: typography.caption, color: colors.ink }}>{log.user.email}</Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Text style={{ minWidth: 70, fontSize: typography.caption, fontWeight: typography.weights.semibold, color: colors.inkMuted }}>Detalhes</Text>
                    <Text numberOfLines={3} style={{ flex: 1, fontFamily: typography.mono, fontSize: typography.caption, lineHeight: 17, color: colors.inkMuted }}>
                      {formatDetails(log.details)}
                    </Text>
                  </View>
                  {log.ipAddress ? (
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <Text style={{ minWidth: 70, fontSize: typography.caption, fontWeight: typography.weights.semibold, color: colors.inkMuted }}>IP</Text>
                      <Text style={{ flex: 1, fontSize: typography.caption, color: colors.inkMuted }}>{log.ipAddress}</Text>
                    </View>
                  ) : null}
                  {log.userAgent ? (
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <Text style={{ minWidth: 70, fontSize: typography.caption, fontWeight: typography.weights.semibold, color: colors.inkMuted }}>User Agent</Text>
                      <Text numberOfLines={1} style={{ flex: 1, fontSize: typography.caption, color: colors.inkMuted }}>{log.userAgent}</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        )}

        {!isLoading && logs.length > 0 ? (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPrevious={() => void fetchLogs(pagination.currentPage - 1)}
            onNext={() => void fetchLogs(pagination.currentPage + 1)}
            busy={isLoading}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
