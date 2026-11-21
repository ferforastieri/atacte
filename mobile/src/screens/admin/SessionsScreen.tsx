import React, { useEffect, useState } from 'react';
import { BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  EmptyState,
  Header,
  HeroCard,
  Modal,
  Pagination,
  SkeletonTable,
} from '../../components/shared';
import { IconTile } from '../../components/shared/IconTile';
import { Pill } from '../../components/shared/Pill';
import { authService } from '../../services/auth/authService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { MainTabParamList } from '../../navigation/AppNavigator';
import { radii, spacing, touch, typography } from '../../theme/tokens';

interface Session {
  id: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastUsed: string;
  isCurrent?: boolean;
}

type SessionsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Sessions'>;

export default function SessionsScreen() {
  const navigation = useNavigation<SessionsScreenNavigationProp>();
  const { isAdmin } = useAuth();
  const { colors, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0, limit: 10 });

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

  useEffect(() => {
    if (isAdmin) void fetchSessions();
  }, []);

  const fetchSessions = async (page = 1) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * pagination.limit;
      const response = await authService.getSessions(pagination.limit, offset);
      if (response.success && response.data) {
        setSessions(response.data);
        if (response.pagination) {
          setPagination((previous) => ({
            ...previous,
            currentPage: page,
            total: response.pagination!.total,
            totalPages: Math.max(1, Math.ceil(response.pagination!.total / previous.limit)),
          }));
        }
      } else {
        setSessions([]);
        setPagination((previous) => ({ ...previous, totalPages: 1 }));
      }
    } catch {
      setSessions([]);
      setPagination((previous) => ({ ...previous, totalPages: 1 }));
    } finally {
      setIsLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (revokingId) return;
    setRevokingId(sessionId);
    try {
      const response = await authService.revokeSession(sessionId);
      if (response.success) {
        setShowRevokeModal(false);
        setSelectedSession(null);
        await fetchSessions(pagination.currentPage);
        showSuccess('Sessão revogada.');
      } else {
        showError('Não foi possível revogar a sessão.');
      }
    } catch {
      showError('Não foi possível revogar a sessão.');
    } finally {
      setRevokingId(null);
    }
  };

  const revokeAllSessions = async () => {
    if (isRevokingAll) return;
    setIsRevokingAll(true);
    try {
      const sessionsToRevoke = sessions.filter((session) => !session.isCurrent);
      await Promise.all(sessionsToRevoke.map((session) => authService.revokeSession(session.id)));
      setShowRevokeModal(false);
      await fetchSessions();
      showSuccess('Sessões revogadas.');
    } catch {
      showError('Não foi possível revogar todas as sessões.');
    } finally {
      setIsRevokingAll(false);
    }
  };

  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const currentSession = sessions.find((session) => session.isCurrent);

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Header title="Sessões" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
        <View style={{ padding: spacing.screen }}>
          <EmptyState icon="lock-closed-outline" title="Acesso negado" description="Esta área é exclusiva de administradores." />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title="Sessões"
        subtitle="Dispositivos com acesso ao cofre"
        showBackButton
        onBack={handleBack}
        onThemeToggle={toggleTheme}
        icon={<Ionicons name="desktop-outline" size={22} color={colors.primarySoftText} />}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: Math.max(48, insets.bottom + 48) }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <>
            <View style={{ backgroundColor: colors.hero, borderRadius: radii['2xl'], padding: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm }}>
              <View style={{ height: 10, width: '28%', borderRadius: radii.sm, backgroundColor: colors.heroBar }} />
              <View style={{ height: 16, width: '52%', borderRadius: radii.sm, backgroundColor: colors.heroBar }} />
            </View>
            <SkeletonTable rows={4} />
          </>
        ) : (
          <>
            {currentSession ? (
              <HeroCard padding="md" style={{ marginBottom: spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                    <IconTile variant="hero" size={44}>
                      <Ionicons name="checkmark-circle-outline" size={22} color={colors.accent} />
                    </IconTile>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: colors.heroMuted, fontSize: typography.caption, fontWeight: typography.weights.semibold, letterSpacing: 0.7 }}>SESSÃO ATUAL</Text>
                      <Text numberOfLines={1} style={{ marginTop: 2, color: colors.heroText, fontSize: typography.body, fontWeight: typography.weights.semibold }}>
                        {currentSession.deviceName || 'Esta é sua sessão atual'}
                      </Text>
                    </View>
                  </View>
                  <Pill label="Ativa" tone="success" />
                </View>
              </HeroCard>
            ) : null}

            {sessions.length === 0 ? (
              <EmptyState icon="desktop-outline" title="Nenhuma sessão encontrada" description="Você não tem sessões ativas." />
            ) : (
              <View style={{ gap: spacing.md }}>
                {sessions.map((session) => (
                  <Card key={session.id}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                      <IconTile variant="muted">
                        <Ionicons name="laptop-outline" size={20} color={colors.inkMuted} />
                      </IconTile>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
                          <Text numberOfLines={1} style={{ flex: 1, fontSize: typography.bodyLarge, fontWeight: typography.weights.semibold, color: colors.ink }}>
                            {session.deviceName || 'Dispositivo Desconhecido'}
                          </Text>
                          <Pill label={session.isCurrent ? 'Atual' : 'Ativa'} tone={session.isCurrent ? 'success' : 'neutral'} />
                        </View>
                        <Text numberOfLines={1} style={{ marginTop: 2, fontSize: typography.caption, color: colors.inkSubtle }}>{session.userAgent || '-'}</Text>

                        <View style={{ marginTop: spacing.md, gap: 5 }}>
                          {[
                            { label: 'IP', value: session.ipAddress || '-' },
                            { label: 'Criada em', value: formatDateTime(session.createdAt) },
                            { label: 'Última atividade', value: formatDateTime(session.lastUsed) },
                          ].map((row) => (
                            <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                              <Text style={{ fontSize: typography.caption, fontWeight: typography.weights.semibold, color: colors.inkMuted }}>{row.label}</Text>
                              <Text style={{ flex: 1, textAlign: 'right', fontSize: typography.caption, color: colors.inkMuted }}>{row.value}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>

                    {!session.isCurrent ? (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Revogar sessão"
                        accessibilityState={{ busy: revokingId === session.id, disabled: Boolean(revokingId) }}
                        style={{
                          marginTop: spacing.md,
                          paddingTop: spacing.md,
                          borderTopWidth: 1,
                          borderTopColor: colors.line,
                          minHeight: touch.minimum,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          borderRadius: radii.md,
                          backgroundColor: colors.dangerSoft,
                          opacity: revokingId && revokingId !== session.id ? 0.5 : 1,
                        }}
                        onPress={() => {
                          setSelectedSession(session);
                          setShowRevokeModal(true);
                        }}
                        disabled={Boolean(revokingId)}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.dangerText} />
                        <Text style={{ fontSize: typography.label, fontWeight: typography.weights.semibold, color: colors.dangerText }}>
                          {revokingId === session.id ? 'Revogando...' : 'Revogar'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </Card>
                ))}
              </View>
            )}

            {sessions.length > 0 ? (
              <>
                <Button
                  title="Revogar Todas"
                  onPress={() => {
                    setSelectedSession(null);
                    setShowRevokeModal(true);
                  }}
                  variant="danger"
                  loading={isRevokingAll}
                  disabled={isRevokingAll}
                  style={{ marginTop: spacing.lg }}
                />
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPrevious={() => void fetchSessions(pagination.currentPage - 1)}
                  onNext={() => void fetchSessions(pagination.currentPage + 1)}
                  busy={isLoading}
                />
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showRevokeModal}
        onClose={() => {
          if (isRevokingAll || revokingId) return;
          setShowRevokeModal(false);
          setSelectedSession(null);
        }}
        title={selectedSession ? 'Revogar Sessão' : 'Revogar Todas as Sessões'}
        type="confirm"
        message={selectedSession
          ? `Tem certeza que deseja revogar a sessão "${selectedSession.deviceName || 'Desconhecido'}"?`
          : 'Tem certeza que deseja revogar todas as sessões? Você será deslogado.'}
        confirmText="Revogar"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={() => {
          if (selectedSession) void revokeSession(selectedSession.id);
          else void revokeAllSessions();
        }}
        loading={isRevokingAll || Boolean(revokingId)}
      />
    </View>
  );
}
