import React, { useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Modal } from '../shared';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography } from '../../theme/tokens';
import api from '../../lib/axios';

export default function ReauthenticateModal() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const resolve = useRef<((ok: boolean) => void) | undefined>(undefined);

  const close = (ok: boolean) => {
    setVisible(false);
    setPassword('');
    resolve.current?.(ok);
    resolve.current = undefined;
  };

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('reauthentication-required', (callback: (ok: boolean) => void) => {
      resolve.current = callback;
      setPassword('');
      setError('');
      setVisible(true);
    });
    return () => {
      listener.remove();
      resolve.current?.(false);
    };
  }, []);

  return (
    <Modal
      visible={visible}
      onClose={() => close(false)}
      title="Confirme sua identidade"
      subtitle="A confirmação vale por 5 minutos."
      icon={<Ionicons name="shield-checkmark-outline" size={22} color={colors.primarySoftText} />}
      size="sm"
      loading={busy}
      footer={(
        <>
          <Button title="Cancelar" variant="ghost" onPress={() => close(false)} style={{ flex: 1 }} disabled={busy} />
          <Button
            title="Confirmar"
            loading={busy}
            disabled={busy}
            onPress={async () => {
              if (busy) return;
              setBusy(true);
              setError('');
              try {
                await api.post('/auth/reauthenticate', { password });
                close(true);
              } catch {
                setError('Não foi possível confirmar a senha');
              } finally {
                setBusy(false);
              }
            }}
            style={{ flex: 1 }}
          />
        </>
      )}
    >
      <Text style={{ fontSize: typography.body, lineHeight: 21, color: colors.inkMuted, marginBottom: spacing.lg }}>
        Digite sua senha para autorizar esta ação. A confirmação vale por 5 minutos.
      </Text>
      <Input
        label="Senha mestra"
        placeholder="Digite sua senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={error || undefined}
        disabled={busy}
      />
    </Modal>
  );
}
