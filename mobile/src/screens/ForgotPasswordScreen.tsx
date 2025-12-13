import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card, Logo } from '../components/shared';
import { authService } from '../services/auth/authService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const { isDark } = useTheme();
  const navigation = useNavigation();

  const handleRequestReset = async () => {
    if (!email) {
      showError('Por favor, informe seu email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.requestPasswordReset(email);
      
      if (response.success) {
        showSuccess('Se o email existir, você receberá um token de recuperação por email. Verifique sua caixa de entrada.');
        setStep('reset');
      } else {
        showError(response.message || 'Erro ao solicitar recuperação');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !newPassword || !confirmPassword) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 8) {
      showError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(token, newPassword);
      
      if (response.success) {
        showSuccess('Senha redefinida com sucesso!');
        navigation.goBack();
      } else {
        showError(response.message || 'Erro ao redefinir senha');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    subtitle: {
      fontSize: 18,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 8,
      textAlign: 'center',
    },
    formCard: {
      marginBottom: 20,
    },
    formTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      textAlign: 'center',
      marginBottom: 24,
    },
    submitButton: {
      marginTop: 16,
      marginBottom: 12,
    },
    backButton: {
      marginTop: 8,
    },
    infoText: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Logo size={80} showText={true} textSize={36} textColor={isDark ? '#f9fafb' : '#111827'} />
          <Text style={styles.subtitle}>Recuperar Senha</Text>
        </View>

        <Card style={styles.formCard}>
          {step === 'request' ? (
            <>
              <Text style={styles.formTitle}>Solicitar Recuperação</Text>
              <Text style={styles.infoText}>
                Digite seu email e você receberá um token para redefinir sua senha.
              </Text>

              <Input
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Button
                title="Enviar Token"
                onPress={handleRequestReset}
                loading={isLoading}
                style={styles.submitButton}
              />

              <Button
                title="Voltar"
                onPress={() => navigation.goBack()}
                variant="ghost"
                style={styles.backButton}
              />
            </>
          ) : (
            <>
              <Text style={styles.formTitle}>Redefinir Senha</Text>
              <Text style={styles.infoText}>
                Digite o token recebido e sua nova senha.
              </Text>

              <Input
                label="Token"
                placeholder="Token de recuperação"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
              />

              <Input
                label="Nova Senha"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <Input
                label="Confirmar Senha"
                placeholder="Digite novamente"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <Button
                title="Redefinir Senha"
                onPress={handleResetPassword}
                loading={isLoading}
                style={styles.submitButton}
              />

              <Button
                title="Voltar"
                onPress={() => setStep('request')}
                variant="ghost"
                style={styles.backButton}
              />
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

