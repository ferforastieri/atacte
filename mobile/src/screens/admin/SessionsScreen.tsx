import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, Card, SkeletonLoader, Modal, Button } from '../../components/shared';
import { authService } from '../../services/auth/authService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../../navigation/AppNavigator';

interface Session {
  id: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastUsed: string;
  isTrusted?: boolean;
  isCurrent?: boolean;
}

type SessionsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Sessions'>;

export default function SessionsScreen() {
  const navigation = useNavigation<SessionsScreenNavigationProp>();
  const { isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showError, showSuccess } = useToast();
  const insets = useSafeAreaInsets();

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showUntrustModal, setShowUntrustModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchSessions();
    }
  }, []);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  const fetchSessions = async (page = 1) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * pagination.limit;
      const response = await authService.getSessions(pagination.limit, offset);
      if (response.success && response.data) {
        setSessions(response.data);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            currentPage: page,
            total: response.pagination.total,
            totalPages: Math.ceil(response.pagination.total / prev.limit)
          }));
        }
      } else {
        setSessions([]);
        setPagination(prev => ({ ...prev, totalPages: 1 }));
      }
    } catch (error) {
      showError('Erro ao carregar sessões');
      setSessions([]);
      setPagination(prev => ({ ...prev, totalPages: 1 }));
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchSessions(page);
    }
  };

  const currentSession = sessions.find(s => s.isCurrent);

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await authService.revokeSession(sessionId);
      if (response.success) {
        showSuccess('Sessão revogada com sucesso!');
        await fetchSessions(pagination.currentPage);
      } else {
        showError(response.message || 'Erro ao revogar sessão');
      }
    } catch (error) {
      showError('Erro ao revogar sessão');
    }
  };

  const untrustDevice = async (deviceName: string) => {
    try {
      const response = await authService.untrustDevice(deviceName);
      if (response.success) {
        showSuccess('Confiança removida do dispositivo com sucesso!');
        await fetchSessions(pagination.currentPage);
      } else {
        showError(response.message || 'Erro ao remover confiança');
      }
    } catch (error) {
      showError('Erro ao remover confiança do dispositivo');
    }
  };

  const revokeAllSessions = async () => {
    setIsRevokingAll(true);
    try {
      const sessionsToRevoke = sessions.filter(s => !s.isCurrent);
      await Promise.all(sessionsToRevoke.map(session => authService.revokeSession(session.id)));
      showSuccess('Todas as sessões foram revogadas!');
      await fetchSessions();
    } catch (error) {
      showError('Erro ao revogar sessões');
    } finally {
      setIsRevokingAll(false);
      setShowRevokeModal(false);
    }
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: Math.max(100, insets.bottom + 100),
    },
    revokeAllButton: {
      marginBottom: 20,
      marginTop: 20,
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
    currentSessionCard: {
      marginTop: 0,
      marginBottom: 20,
    },
    currentSessionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    currentSessionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#10b981',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    currentSessionInfo: {
      flex: 1,
    },
    currentSessionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 4,
    },
    currentSessionSubtitle: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    currentSessionBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: '#10b981',
    },
    currentSessionBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    sessionCard: {
      marginBottom: 12,
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    deviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      flex: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    sessionDetails: {
      marginTop: 8,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    detailValue: {
      fontSize: 12,
      color: isDark ? '#d1d5db' : '#374151',
      flex: 1,
      textAlign: 'right',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: 'transparent',
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4,
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
  });

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Header title="Sessões" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
        <View style={styles.content}>
          <Text style={styles.emptyText}>Acesso negado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Sessões" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {currentSession && (
          <Card style={styles.currentSessionCard}>
            <View style={styles.currentSessionHeader}>
              <View style={styles.currentSessionIcon}>
                <Ionicons name="checkmark" size={20} color="#ffffff" />
              </View>
              <View style={styles.currentSessionInfo}>
                <Text style={styles.currentSessionTitle}>Sessão Atual</Text>
                <Text style={styles.currentSessionSubtitle}>
                  {currentSession.deviceName || 'Esta é sua sessão atual'}
                </Text>
              </View>
              <View style={styles.currentSessionBadge}>
                <Text style={styles.currentSessionBadgeText}>Ativa</Text>
              </View>
            </View>
          </Card>
        )}

        {isLoading ? (
          <SkeletonLoader variant="default" />
        ) : sessions.length === 0 ? (
          <Card style={styles.emptyContainer}>
            <Ionicons 
              name="desktop-outline" 
              size={48} 
              color={isDark ? '#6b7280' : '#9ca3af'}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>Nenhuma sessão encontrada</Text>
            <Text style={styles.emptyText}>
              Você não tem sessões ativas.
            </Text>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.deviceName}>
                  {session.deviceName || 'Dispositivo Desconhecido'}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: session.isCurrent ? '#10b981' : '#6b7280' }
                  ]}>
                    <Text style={[styles.statusBadgeText, { color: '#ffffff' }]}>
                      {session.isCurrent ? 'Atual' : 'Ativa'}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: session.isTrusted ? '#3b82f6' : '#f59e0b' }
                  ]}>
                    <Text style={[styles.statusBadgeText, { color: '#ffffff' }]}>
                      {session.isTrusted ? 'Confiável' : 'Não Confiável'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.sessionDetails}>
                {session.ipAddress && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IP:</Text>
                    <Text style={styles.detailValue}>{session.ipAddress}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Criada em:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(session.createdAt)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Última Atividade:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(session.lastUsed)}</Text>
                </View>
              </View>

              <View style={styles.actions}>
                {session.isTrusted && session.deviceName && !session.isCurrent && (
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: '#f59e0b', flex: 1 }]}
                    onPress={() => {
                      setSelectedSession(session);
                      setShowUntrustModal(true);
                    }}
                  >
                    <Ionicons name="shield-outline" size={16} color="#f59e0b" />
                    <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>
                      Remover Confiança
                    </Text>
                  </TouchableOpacity>
                )}
                {!session.isCurrent && (
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: '#dc2626', flex: 1 }]}
                    onPress={() => {
                      setSelectedSession(session);
                      setShowRevokeModal(true);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>
                      Revogar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))
        )}

        {!isLoading && sessions.length > 0 && (
          <View style={styles.revokeAllButton}>
            <Button
              title="Revogar Todas"
              onPress={() => setShowRevokeModal(true)}
              variant="danger"
              loading={isRevokingAll}
            />
          </View>
        )}

        {!isLoading && sessions.length > 0 && pagination.totalPages > 1 && (
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

      <Modal
        visible={showRevokeModal}
        onClose={() => {
          setShowRevokeModal(false);
          setSelectedSession(null);
        }}
        type="confirm"
        title={selectedSession ? "Revogar Sessão" : "Revogar Todas as Sessões"}
        message={
          selectedSession
            ? `Tem certeza que deseja revogar a sessão "${selectedSession.deviceName || 'Desconhecido'}"?`
            : 'Tem certeza que deseja revogar todas as sessões? Você será deslogado.'
        }
        confirmText="Revogar"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={() => {
          if (selectedSession) {
            revokeSession(selectedSession.id);
            setShowRevokeModal(false);
            setSelectedSession(null);
          } else {
            revokeAllSessions();
          }
        }}
      />

      <Modal
        visible={showUntrustModal}
        onClose={() => {
          setShowUntrustModal(false);
          setSelectedSession(null);
        }}
        type="confirm"
        title="Remover Confiança do Dispositivo"
        message={`Tem certeza que deseja remover a confiança do dispositivo "${selectedSession?.deviceName || 'Desconhecido'}"? Na próxima vez que você fizer login neste dispositivo, será necessário confiar novamente.`}
        confirmText="Remover Confiança"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={() => {
          if (selectedSession?.deviceName) {
            untrustDevice(selectedSession.deviceName);
            setShowUntrustModal(false);
            setSelectedSession(null);
          }
        }}
      />
    </View>
  );
}
