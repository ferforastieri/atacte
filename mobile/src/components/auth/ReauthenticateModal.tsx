import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, Text, TextInput, DeviceEventEmitter } from 'react-native';
import { Button } from '../shared';
import api from '../../lib/axios';
export default function ReauthenticateModal() {
  const [visible, setVisible] = useState(false), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const resolve = useRef<((ok: boolean) => void) | undefined>(undefined);
  const close = (ok: boolean) => { setVisible(false); setPassword(''); resolve.current?.(ok); resolve.current = undefined; };
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('reauthentication-required', (callback: (ok: boolean) => void) => { resolve.current = callback; setPassword(''); setError(''); setVisible(true); });
    return () => { listener.remove(); resolve.current?.(false); };
  }, []);
  return <Modal visible={visible} transparent onRequestClose={() => close(false)}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0008' }}><View style={{ padding: 24, borderRadius: 16, backgroundColor: 'white' }}>
      <Text style={{ color: '#111827', fontSize: 20 }}>Confirme sua identidade</Text>
      <Text style={{ color: '#111827' }}>A confirmação vale por 5 minutos.</Text>
      <TextInput accessibilityLabel="Senha mestra" secureTextEntry value={password} onChangeText={setPassword} style={{ padding: 12, color: '#111827' }} />
      <Text style={{ color: '#b91c1c' }}>{error}</Text>
      <Button title="Confirmar" loading={busy} onPress={async () => { setBusy(true); try { await api.post('/auth/reauthenticate', { password }); close(true); } catch { setError('Não foi possível confirmar a senha'); } finally { setBusy(false); } }} />
      <Button title="Cancelar" variant="ghost" onPress={() => close(false)} />
    </View></View>
  </Modal>;
}
