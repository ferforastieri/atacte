import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDeviceName } from '../utils/deviceName';
import { Button, Input, Card, Logo } from '../components/shared';
import { IconTile } from '../components/shared/IconTile';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { radii, spacing, typography } from '../theme/tokens';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { login } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (isLoading || !email || !masterPassword) return;

    setError('');
    setIsLoading(true);
    try {
      const deviceName = await getDeviceName();
      const result = await login(email, masterPassword, deviceName);
      if (!result.success) {
        setError('Não foi possível entrar. Confira o email e a senha.');
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    Alert.alert('Instalação inicial', 'Crie a primeira conta no navegador depois de autorizar o email no servidor.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.screen }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: spacing['2xl'] }}>
          <Logo size={68} showText textSize={30} />
          <Text style={{ marginTop: spacing.sm, fontSize: typography.body, color: colors.inkMuted, textAlign: 'center' }}>
            Senhas e Notas
          </Text>
        </View>

        <Card>
          <View style={{ alignItems: 'center', marginBottom: spacing['2xl'] }}>
            <IconTile size={56}>
              <Ionicons name="lock-closed-outline" size={26} color={colors.primarySoftText} />
            </IconTile>
            <Text style={{ marginTop: spacing.md, fontSize: typography.headline, fontWeight: typography.weights.semibold, color: colors.ink }}>
              {isRegisterMode ? 'Criar Conta' : 'Fazer Login'}
            </Text>
            <Text style={{ marginTop: spacing.xs, fontSize: typography.body, color: colors.inkMuted, textAlign: 'center' }}>
              Abra seu cofre com email e senha mestra.
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

          <Input
            label="Senha Mestra"
            placeholder="Sua senha mestra"
            value={masterPassword}
            onChangeText={setMasterPassword}
            secureTextEntry
            autoComplete="current-password"
            disabled={isLoading}
            leftIcon={<Ionicons name="lock-closed-outline" size={19} color={colors.inkSubtle} />}
          />

          <Button
            title={isRegisterMode ? 'Criar Conta' : 'Entrar'}
            onPress={isRegisterMode ? handleRegister : handleLogin}
            loading={isLoading}
            disabled={isLoading || !email || !masterPassword}
            size="lg"
            style={{ marginTop: spacing.sm }}
          />

          <Button
            title={isRegisterMode ? 'Já tenho uma conta' : 'Criar nova conta'}
            onPress={() => setIsRegisterMode((current) => !current)}
            variant="ghost"
            disabled={isLoading}
            style={{ marginTop: spacing.sm }}
          />

          <Button
            title="Esqueci minha senha"
            onPress={() => {
              if ('navigate' in navigation && typeof navigation.navigate === 'function') {
                (navigation as { navigate: (screen: string) => void }).navigate('ForgotPassword');
              }
            }}
            variant="ghost"
            disabled={isLoading}
          />
        </Card>

        <Text style={{ marginTop: spacing.xl, fontSize: typography.caption, color: colors.inkSubtle, textAlign: 'center' }}>
          Atacte · cofre self-hosted
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
