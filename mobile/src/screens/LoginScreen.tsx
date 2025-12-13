import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card, Logo } from '../components/shared';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { showSuccess, showError } = useToast();
  const { login, register } = useAuth();
  const { isDark } = useTheme();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !masterPassword) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, masterPassword);
      
      if (result.success) {
        showSuccess('Login realizado com sucesso!');
      } else {
        showError(result.message || 'Erro ao fazer login');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !masterPassword) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(email, masterPassword);
      
      if (result.success) {
        showSuccess('Conta criada com sucesso!');
      } else {
        showError(result.message || 'Erro ao criar conta');
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
      marginBottom: 50,
      marginTop: 20,
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
    toggleButton: {
      marginTop: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Logo size={80} showText={true} textSize={36} textColor={isDark ? '#f9fafb' : '#111827'} />
          <Text style={styles.subtitle}>Segurança Familiar</Text>
        </View>

      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>
          {isRegisterMode ? 'Criar Conta' : 'Fazer Login'}
        </Text>

        <Input
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Input
          label="Senha Mestra"
          placeholder="Sua senha mestra"
          value={masterPassword}
          onChangeText={setMasterPassword}
          secureTextEntry
        />

        <Button
          title={isRegisterMode ? 'Criar Conta' : 'Entrar'}
          onPress={isRegisterMode ? handleRegister : handleLogin}
          loading={isLoading}
          style={styles.submitButton}
        />

        <Button
          title={isRegisterMode ? 'Já tenho uma conta' : 'Criar nova conta'}
          onPress={() => setIsRegisterMode(!isRegisterMode)}
          variant="ghost"
          style={styles.toggleButton}
        />

        <Button
          title="Esqueci minha senha"
          onPress={() => navigation.navigate('ForgotPassword' as any)}
          variant="ghost"
          style={styles.toggleButton}
        />
      </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
