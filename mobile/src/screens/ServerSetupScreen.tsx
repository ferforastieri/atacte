import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Logo } from '../components/shared';
import { useServer } from '../contexts/ServerContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ServerSetupScreen() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { connectToServer } = useServer();
  const { isDark } = useTheme();

  const handleConnect = async () => {
    setError('');
    setIsLoading(true);
    try {
      await connectToServer(url);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Informe uma URL válida');
    } finally {
      setIsLoading(false);
    }
  };

  const colors = {
    background: isDark ? '#111827' : '#f9fafb',
    title: isDark ? '#f9fafb' : '#111827',
    muted: isDark ? '#9ca3af' : '#6b7280',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={styles.brand}>
          <Logo size={88} showText textSize={38} textColor={colors.title} />
        </View>

        <View style={styles.form}>
          <Text style={[styles.title, { color: colors.title }]}>Conecte ao seu Atacte</Text>
          <Text style={[styles.description, { color: colors.muted }]}>
            Digite o endereço do seu servidor para continuar.
          </Text>

          <Input
            label="Endereço do servidor"
            placeholder="https://atacte.exemplo.com"
            value={url}
            onChangeText={(value) => {
              setUrl(value);
              setError('');
            }}
            keyboardType="url"
            error={error || undefined}
            leftIcon={<Ionicons name="globe-outline" size={20} color={colors.muted} />}
          />

          <Button
            title="Conectar"
            onPress={handleConnect}
            loading={isLoading}
            disabled={!url.trim()}
            size="lg"
          />
        </View>

        <Text style={[styles.hint, { color: colors.muted }]}>Você só precisará informar novamente depois de sair.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  brand: { alignItems: 'center', marginBottom: 56 },
  form: { width: '100%' },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10, marginBottom: 32 },
  hint: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 28 },
});
