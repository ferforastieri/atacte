import React, { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, SkeletonDetail } from '../shared';
import { IconTile } from '../shared/IconTile';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';
import api from '../../lib/axios';

const BiometricContext = createContext({ enabled: false, changeEnabled: async (_enabled: boolean): Promise<void> => {} });
export const useBiometricLock = () => useContext(BiometricContext);

export default function BiometricLock({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { colors } = useTheme();
  const [enabled, setEnabled] = useState(false), [ready, setReady] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [locked, setLocked] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const authenticating = useRef(false);
  const key = 'atacte:biometric:' + (user?.id || '');

  useEffect(() => {
    let active = true;
    setReady(false);
    setLocked(true);
    setPassword('');
    AsyncStorage.getItem(key)
      .then((value) => {
        if (active) {
          setEnabled(value === 'true');
          setLoadedKey(key);
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setEnabled(true);
          setLoadedKey(key);
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [key, isAuthenticated]);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && !authenticating.current) {
        setLocked(true);
        setPassword('');
      }
    });
    return () => listener.remove();
  }, []);

  const biometric = async () => {
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) {
      throw new Error('Cadastre a biometria nas configurações do celular.');
    }
    authenticating.current = true;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Atacte',
        disableDeviceFallback: true,
        biometricsSecurityLevel: 'strong',
        cancelLabel: 'Cancelar',
      });
      if (!result.success) throw new Error('Biometria não confirmada. Tente novamente ou use sua senha.');
    } finally {
      authenticating.current = false;
    }
  };

  const changeEnabled = async (value: boolean) => {
    await biometric();
    await AsyncStorage.setItem(key, String(value));
    setEnabled(value);
    setLocked(false);
  };

  const unlock = async (withPassword = false) => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      if (withPassword) await api.post('/auth/reauthenticate', { password });
      else await biometric();
      if (AppState.currentState === 'active') setLocked(false);
      setPassword('');
    } catch (error) {
      setMessage(withPassword ? 'Não foi possível confirmar sua senha. Tente novamente ou entre na conta de novo.' : error instanceof Error ? error.message : 'Não foi possível desbloquear.');
    } finally {
      setBusy(false);
    }
  };

  if (isAuthenticated && (!ready || loadedKey !== key)) return <SkeletonDetail showSecret={false} />;

  return (
    <BiometricContext.Provider value={{ enabled, changeEnabled }}>
      {isAuthenticated && enabled && locked ? (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing['2xl'] }}>
            <View style={{ alignItems: 'center', marginBottom: spacing['2xl'] }}>
              <IconTile size={72}>
                <Ionicons name="lock-closed-outline" size={32} color={colors.primarySoftText} />
              </IconTile>
              <Text style={{ marginTop: spacing.lg, fontSize: typography.headline, fontWeight: typography.weights.bold, color: colors.ink, textAlign: 'center' }}>
                Aplicativo bloqueado
              </Text>
              <Text style={{ marginTop: spacing.sm, fontSize: typography.body, lineHeight: 21, color: colors.inkMuted, textAlign: 'center' }}>
                Desbloqueie com biometria ou com a senha da sua conta.
              </Text>
            </View>

            <View
              style={{
                padding: spacing.xl,
                borderRadius: radii['2xl'],
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.surface,
                gap: spacing.md,
              }}
            >
              {message ? (
                <Text style={{ fontSize: typography.body, color: colors.dangerText, lineHeight: 20 }}>{message}</Text>
              ) : null}

              <Input
                label="Senha da conta"
                placeholder="Digite sua senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                disabled={busy}
              />

              <Button title="Desbloquear com biometria" onPress={() => unlock()} loading={busy} icon={<Ionicons name="finger-print-outline" size={18} color={colors.onPrimary} />} />
              <Button title="Desbloquear com senha" variant="secondary" onPress={() => unlock(true)} disabled={busy || !password} />
              <Button title="Entrar novamente" variant="ghost" onPress={logout} disabled={busy} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : children}
    </BiometricContext.Provider>
  );
}
