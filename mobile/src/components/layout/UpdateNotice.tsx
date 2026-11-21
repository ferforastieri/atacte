import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, shadows, spacing, touch, typography } from '../../theme/tokens';

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  supported: boolean;
  autoUpdate: boolean;
  busy: boolean;
  state: { status: 'running' | 'success' | 'error'; version: string | null; updatedAt: string | null } | null;
}

const IDLE_POLL = 30 * 60 * 1000;
const BUSY_POLL = 5 * 1000;

export default function UpdateNotice() {
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [release, setRelease] = useState<UpdateInfo | null>(null);
  const attempted = useRef<string | null>(null);
  const dismissed = useRef<string | null>(null);
  const fastUntil = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      try {
        const { data } = await api.get('/updates');
        if (!active) return;
        const info = data.data as UpdateInfo;
        const stateIsRelevant = Boolean(
          info.state
          && (
            !info.state.version
            || !info.latestVersion
            || info.state.version === info.latestVersion
            || info.state.version === attempted.current
          ),
        );

        if (!info.updateAvailable || (stateIsRelevant && info.state?.status === 'success')) {
          setRelease(null);
        } else if (dismissed.current !== info.latestVersion) {
          setRelease(info);
        }

        if (info.busy) {
          fastUntil.current = Date.now() + 5 * 60 * 1000;
        } else if (stateIsRelevant && info.state?.status === 'error' && attempted.current === info.latestVersion) {
          fastUntil.current = 0;
        } else if (info.updateAvailable && info.supported && info.autoUpdate && info.latestVersion && attempted.current !== info.latestVersion) {
          attempted.current = info.latestVersion;
          fastUntil.current = Date.now() + 5 * 60 * 1000;
          try {
            await api.post('/updates/apply', {});
          } catch {
            // 409 means another client already requested the same update.
          }
        }
      } catch {
        // The API is offline while the host updater restarts it.
      }

      if (!active) return;
      const delay = Date.now() < fastUntil.current ? BUSY_POLL : IDLE_POLL;
      timer = setTimeout(() => { void check(); }, delay);
    };

    void check();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated]);

  if (!release) return null;

  const auto = release.supported && release.autoUpdate;
  const stateIsRelevant = Boolean(
    release.state
    && (
      !release.state.version
      || !release.latestVersion
      || release.state.version === release.latestVersion
      || release.state.version === attempted.current
    ),
  );
  const failed = stateIsRelevant && release.state?.status === 'error';
  const description = failed
    ? 'A atualização não foi concluída. Confira o log no servidor.'
    : auto
      ? 'O servidor está sendo atualizado automaticamente.'
      : 'Este servidor não atualiza sozinho. Baixe a release e atualize manualmente.';
  const accent = failed ? colors.danger : auto ? colors.primary : colors.warning;
  const accentSoft = failed ? colors.dangerSoft : auto ? colors.primarySoft : colors.warningSoft;

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 72 }]} pointerEvents="box-none">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={[styles.accent, { backgroundColor: accent }]} />

        <View style={styles.body}>
          <View style={[styles.icon, { backgroundColor: accentSoft }]}>
            {auto && !failed ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Ionicons name={failed ? 'alert-circle-outline' : 'cloud-download-outline'} size={22} color={accent} />
            )}
          </View>

          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.ink }]}>
                {failed ? 'Falha na atualização' : auto ? 'Atualizando o servidor' : 'Nova versão disponível'}
              </Text>
              {release.latestVersion ? (
                <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.badgeText, { color: colors.inkMuted }]}>v{release.latestVersion}</Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.versions, { color: colors.inkMuted }]}>
              v{release.currentVersion} → v{release.latestVersion}
            </Text>
            <Text style={[styles.description, { color: failed ? colors.dangerText : colors.inkMuted }]}>
              {description}
            </Text>

            {auto && !failed ? (
              <View style={[styles.progressTrack, { backgroundColor: colors.line }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.accent }]} />
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Dispensar aviso de atualização"
            style={styles.close}
            onPress={() => {
              dismissed.current = release.latestVersion;
              setRelease(null);
            }}
          >
            <Ionicons name="close" size={18} color={colors.inkSubtle} />
          </TouchableOpacity>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.line }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: accent }]} />
            <Text style={[styles.statusText, { color: colors.inkMuted }]}>
              {failed ? 'Atualização interrompida' : auto ? 'Atualização automática' : 'Ação manual necessária'}
            </Text>
          </View>

          <View style={styles.actions}>
            {release.releaseUrl && release.releaseUrl.startsWith('https://github.com/ferforastieri/atacte/releases/tag/') ? (
              <TouchableOpacity style={{ minHeight: touch.minimum, justifyContent: 'center' }} onPress={() => { void Linking.openURL(release.releaseUrl!); }}>
                <Text style={[styles.actionText, { color: colors.primaryText }]}>Ver release</Text>
              </TouchableOpacity>
            ) : null}
            {failed ? (
              <TouchableOpacity
                style={{ minHeight: touch.minimum, justifyContent: 'center' }}
                onPress={() => {
                  attempted.current = null;
                  fastUntil.current = Date.now() + 60 * 1000;
                  setRelease((current) => current ? { ...current, state: null } : current);
                }}
              >
                <Text style={[styles.actionText, { color: colors.primaryText }]}>Tentar novamente</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: spacing.md, right: spacing.md },
  card: {
    overflow: 'hidden',
    borderRadius: radii.xl,
    borderWidth: 1,
    ...shadows.pop,
  },
  accent: { height: 3 },
  body: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, paddingBottom: 10 },
  icon: { width: 40, height: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  title: { fontSize: typography.body, fontWeight: typography.weights.bold },
  badge: { borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: typography.weights.semibold, fontFamily: typography.mono },
  versions: { marginTop: 3, fontSize: typography.caption, fontFamily: typography.mono },
  description: { marginTop: 4, fontSize: typography.label, lineHeight: 17 },
  progressTrack: { marginTop: 9, height: 4, borderRadius: radii.pill, overflow: 'hidden' },
  progressFill: { width: '38%', height: '100%', borderRadius: radii.pill },
  close: { width: touch.minimum, height: touch.minimum, alignItems: 'center', justifyContent: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: typography.caption, fontWeight: typography.weights.medium },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionText: { fontSize: typography.caption, fontWeight: typography.weights.bold },
});
