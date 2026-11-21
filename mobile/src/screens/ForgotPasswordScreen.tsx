import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card, Logo } from '../components/shared';
import { IconTile } from '../components/shared/IconTile';
import { authService } from '../services/auth/authService';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { radii, spacing, typography } from '../theme/tokens';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handleRequestReset = async () => {
    if (isLoading || !email) return;

    setError('');
    setIsLoading(true);
    try {
      const response = await authService.requestPasswordReset(email);
      if (response.success) {
        setStep('reset');
      } else {
        setError('Não foi possível enviar o token.');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível enviar o token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (isLoading || !token || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const response = await authService.resetPassword(token, newPassword);
      if (response.success) {
        navigation.goBack();
      } else {
        setError('Não foi possível redefinir a senha.');
      }
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Não foi possível redefinir a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const errorBanner = error ? (
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
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.screen }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: spacing['2xl'] }}>
          <Logo size={60} showText textSize={28} />
        </View>

        <Card>
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <IconTile size={52}>
              <Ionicons name="key-outline" size={24} color={colors.primarySoftText} />
            </IconTile>
            <Text style={{ marginTop: spacing.md, fontSize: typography.headline, fontWeight: typography.weights.semibold, color: colors.ink }}>
              {step === 'request' ? 'Recuperar Senha' : 'Redefinir Senha'}
            </Text>
            <Text style={{ marginTop: spacing.xs, fontSize: typography.body, color: colors.inkMuted, textAlign: 'center', lineHeight: 20 }}>
              {step === 'request'
                ? 'Digite seu email e você receberá um token para redefinir sua senha.'
                : 'Digite o token recebido e sua nova senha.'}
            </Text>
          </View>

          {errorBanner}

          {step === 'request' ? (
            <>
              <Input
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                disabled={isLoading}
                leftIcon={<Ionicons name="mail-outline" size={19} color={colors.inkSubtle} />}
              />
              <Button
                title="Enviar Token"
                onPress={handleRequestReset}
                loading={isLoading}
                disabled={isLoading || !email}
                size="lg"
              />
              <Button title="Voltar" onPress={() => navigation.goBack()} variant="ghost" disabled={isLoading} style={{ marginTop: spacing.sm }} />
            </>
          ) : (
            <>
              <Input
                label="Token"
                placeholder="Token de recuperação"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                disabled={isLoading}
                leftIcon={<Ionicons name="key-outline" size={19} color={colors.inkSubtle} />}
              />
              <Input
                label="Nova Senha"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoComplete="new-password"
                disabled={isLoading}
                leftIcon={<Ionicons name="lock-closed-outline" size={19} color={colors.inkSubtle} />}
              />
              <Input
                label="Confirmar Senha"
                placeholder="Digite novamente"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
                disabled={isLoading}
                leftIcon={<Ionicons name="lock-closed-outline" size={19} color={colors.inkSubtle} />}
              />
              <Button
                title="Redefinir Senha"
                onPress={handleResetPassword}
                loading={isLoading}
                disabled={isLoading || !token || !newPassword || !confirmPassword}
                size="lg"
              />
              <Button title="Voltar" onPress={() => setStep('request')} variant="ghost" disabled={isLoading} style={{ marginTop: spacing.sm }} />
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
