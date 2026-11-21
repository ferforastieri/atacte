import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Input, Logo } from '../components/shared';
import { IconTile } from '../components/shared/IconTile';
import { useServer } from '../contexts/ServerContext';
import { useTheme } from '../contexts/ThemeContext';
import { radii, spacing, typography } from '../theme/tokens';
import axios from 'axios';
import { normalizeServerUrl } from '../contexts/ServerContext';

export default function ServerSetupScreen() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { connectToServer } = useServer();
  const { colors } = useTheme();

  const handleConnect = async () => {
    if (isLoading || !url.trim()) return;

    setError('');
    setIsLoading(true);
    try {
      const normalizedUrl = normalizeServerUrl(url);
      const response = await axios.get(`${normalizedUrl}/auth/me`, {
        timeout: 15000,
        validateStatus: (status) => status < 500,
      });

      if (!response.data || typeof response.data !== 'object' || typeof response.data.success !== 'boolean') {
        throw new Error('O endereço informado não aponta para uma API Atacte');
      }

      await connectToServer(normalizedUrl);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Informe uma URL válida');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing['2xl'], paddingVertical: spacing['3xl'] }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: spacing['2xl'] }}>
            <Logo size={72} showText textSize={32} />
          </View>

          <Card>
            <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
              <IconTile size={54}>
                <Ionicons name="server-outline" size={24} color={colors.primarySoftText} />
              </IconTile>
              <Text style={{ marginTop: spacing.md, fontSize: typography.headline, fontWeight: typography.weights.bold, color: colors.ink, textAlign: 'center' }}>
                Conecte ao seu Atacte
              </Text>
              <Text style={{ marginTop: spacing.sm, fontSize: typography.body, lineHeight: 21, color: colors.inkMuted, textAlign: 'center' }}>
                Digite o endereço do seu servidor para continuar.
              </Text>
            </View>

            {error ? (
              <View
                style={{
                  marginBottom: spacing.lg,
                  padding: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.dangerBorder,
                  backgroundColor: colors.dangerSoft,
                }}
                accessibilityRole="alert"
              >
                <Text style={{ fontSize: typography.body, color: colors.dangerText }}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Endereço do servidor"
              placeholder="atacte.exemplo.com"
              value={url}
              onChangeText={(value) => {
                setUrl(value);
                setError('');
              }}
              keyboardType="url"
              autoCapitalize="none"
              autoComplete="url"
              disabled={isLoading}
              error={error || undefined}
              leftIcon={<Ionicons name="globe-outline" size={19} color={colors.inkSubtle} />}
            />

            <Button
              title="Conectar"
              onPress={handleConnect}
              loading={isLoading}
              disabled={isLoading || !url.trim()}
              size="lg"
            />
          </Card>

          <Text style={{ marginTop: spacing.xl, fontSize: typography.label, lineHeight: 18, color: colors.inkMuted, textAlign: 'center' }}>
            Você só precisará informar novamente depois de sair.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
