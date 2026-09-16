import React, { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, View, Text, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Button } from '../shared';
import { SkeletonLoader } from '../shared/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';

const BiometricContext = createContext({ enabled: false, changeEnabled: async (_enabled: boolean): Promise<void> => {} });
export const useBiometricLock = () => useContext(BiometricContext);

export default function BiometricLock({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [enabled, setEnabled] = useState(false), [ready, setReady] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [locked, setLocked] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const authenticating = useRef(false);
  const key = 'atacte:biometric:' + (user?.id || '');
  useEffect(() => {
    let active = true;
    setReady(false); setLocked(true); setPassword('');
    AsyncStorage.getItem(key).then(value => { if (active) { setEnabled(value === 'true'); setLoadedKey(key); setReady(true); } })
      .catch(() => { if (active) { setEnabled(true); setLoadedKey(key); setReady(true); } });
    return () => { active = false; };
  }, [key, isAuthenticated]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state !== 'active' && !authenticating.current) { setLocked(true); setPassword(''); }
    });
    return () => listener.remove();
  }, []);
  const biometric = async () => {
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) {
      throw new Error('Cadastre a biometria nas configurações do celular.');
    }
    authenticating.current = true;
    try {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Desbloquear Atacte', disableDeviceFallback: true, biometricsSecurityLevel: 'strong', cancelLabel: 'Cancelar' });
      if (!result.success) throw new Error('Biometria não confirmada. Tente novamente ou use sua senha.');
    } finally { authenticating.current = false; }
  };
  const changeEnabled = async (value: boolean) => {
    await biometric();
    await AsyncStorage.setItem(key, String(value));
    setEnabled(value); setLocked(false);
  };
  const unlock = async (withPassword = false) => {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      if (withPassword) await api.post('/auth/reauthenticate', { password });
      else await biometric();
      if (AppState.currentState === 'active') setLocked(false);
      setPassword('');
    } catch (error) { setMessage(withPassword ? 'Não foi possível confirmar sua senha. Tente novamente ou entre na conta de novo.' : error instanceof Error ? error.message : 'Não foi possível desbloquear.'); }
    finally { setBusy(false); }
  };
  if (isAuthenticated && (!ready || loadedKey !== key)) return <SkeletonLoader variant="dashboard" />;
  return <BiometricContext.Provider value={{ enabled, changeEnabled }}>
    {isAuthenticated && enabled && locked ? <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#111827' }}>
      <Text style={{ color: 'white', fontSize: 22 }}>Aplicativo bloqueado</Text>
      <Text style={{ color: 'white' }}>{message}</Text>
      <Button title="Desbloquear com biometria" onPress={() => unlock()} loading={busy} />
      <TextInput accessibilityLabel="Senha da conta" placeholder="Senha da conta" placeholderTextColor="#9ca3af" secureTextEntry value={password} onChangeText={setPassword} style={{ color: 'white', padding: 12 }} />
      <Button title="Desbloquear com senha" variant="secondary" onPress={() => unlock(true)} disabled={busy || !password} />
      <Button title="Entrar novamente" variant="ghost" onPress={logout} disabled={busy} />
    </View> : children}
  </BiometricContext.Provider>;
}
