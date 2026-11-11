import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { isDark } = useTheme();
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
        } else if (
          info.updateAvailable
          && info.supported
          && info.autoUpdate
          && info.latestVersion
          && attempted.current !== info.latestVersion
        ) {
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
  const borderColor = failed ? '#ef4444' : auto ? '#16a34a' : '#f59e0b';
  const iconColor = failed ? '#ef4444' : auto ? '#16a34a' : '#d97706';

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 70 }]} pointerEvents="box-none">
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderColor: isDark ? '#374151' : '#e5e7eb',
          },
        ]}
      >
        <View style={[styles.accent, { backgroundColor: borderColor }]} />

        <View style={styles.body}>
          <View style={[styles.icon, { backgroundColor: `${iconColor}18` }]}>
            {auto && !failed ? (
              <ActivityIndicator size="small" color={iconColor} />
            ) : (
              <Ionicons name={failed ? 'alert-circle-outline' : 'cloud-download-outline'} size={22} color={iconColor} />
            )}
          </View>

          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: isDark ? '#f9fafb' : '#111827' }]}>
                {failed ? 'Falha na atualização' : auto ? 'Atualizando o servidor' : 'Nova versão disponível'}
              </Text>
              {release.latestVersion ? (
                <View style={[styles.badge, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                  <Text style={[styles.badgeText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>v{release.latestVersion}</Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.versions, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              v{release.currentVersion} → v{release.latestVersion}
            </Text>
            <Text style={[styles.description, { color: failed ? (isDark ? '#fca5a5' : '#dc2626') : (isDark ? '#9ca3af' : '#6b7280') }]}>
              {description}
            </Text>

            {auto && !failed ? (
              <View style={[styles.progressTrack, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <View style={styles.progressFill} />
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.close}
            onPress={() => {
              dismissed.current = release.latestVersion;
              setRelease(null);
            }}
            accessibilityLabel="Dispensar aviso de atualização"
          >
            <Ionicons name="close" size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        <View style={[styles.footer, { borderTopColor: isDark ? '#374151' : '#f3f4f6' }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: failed ? '#ef4444' : auto ? '#16a34a' : '#f59e0b' }]} />
            <Text style={[styles.statusText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {failed ? 'Atualização interrompida' : auto ? 'Atualização automática' : 'Ação manual necessária'}
            </Text>
          </View>

          <View style={styles.actions}>
            {release.releaseUrl && release.releaseUrl.startsWith('https://github.com/ferforastieri/atacte/releases/tag/') ? (
              <TouchableOpacity onPress={() => { void Linking.openURL(release.releaseUrl!); }}>
                <Text style={[styles.actionText, { color: iconColor }]}>Ver release</Text>
              </TouchableOpacity>
            ) : null}
            {failed ? (
              <TouchableOpacity
                onPress={() => {
                  attempted.current = null;
                  fastUntil.current = Date.now() + 60 * 1000;
                  setRelease((current) => current ? { ...current, state: null } : current);
                }}
              >
                <Text style={[styles.actionText, { color: iconColor }]}>Tentar novamente</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  card: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  accent: {
    height: 3,
  },
  body: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    paddingBottom: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  versions: {
    marginTop: 3,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  progressTrack: {
    marginTop: 9,
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    width: '38%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#16a34a',
  },
  close: {
    padding: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
