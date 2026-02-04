import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header, TotpCode, Button, SkeletonLoader } from '../components/shared';
import { passwordService } from '../services/passwords/passwordService';
import { totpService } from '../services/totp/totpService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type PasswordDetailRouteProp = RouteProp<RootStackParamList, 'PasswordDetail'>;

interface PasswordEntry {
  id: string;
  name: string;
  website?: string;
  username?: string;
  password: string;
  folder?: string;
  notes?: string;
  isFavorite: boolean;
  totpEnabled: boolean;
  customFields?: Array<{
    id: string;
    name: string;
    value: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function PasswordDetailScreen() {
  const route = useRoute<PasswordDetailRouteProp>();
  const { passwordId } = route.params;
  
  const [password, setPassword] = useState<PasswordEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState<{ code: string; timeRemaining: number; period: number } | null>(null);
  const [isLoadingTotp, setIsLoadingTotp] = useState(false);
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    loadPassword();
  }, [passwordId]);

  useEffect(() => {
    if (password?.totpEnabled) {
      loadTotpCode();
    }
  }, [password?.totpEnabled]);

  const loadPassword = async () => {
    try {
      const response = await passwordService.getPassword(passwordId);
      
      if (response.success && response.data) {
        setPassword(response.data);
      } else {
        Alert.alert('Erro', 'Senha não encontrada');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTotpCode = async () => {
    if (!password?.totpEnabled) return;
    
    setIsLoadingTotp(true);
    try {
      const response = await totpService.getTotpCode(passwordId);
      if (response.success && response.data) {
        setTotpCode(response.data);
      } else {
        showError(response.message || 'Erro ao carregar código TOTP');
      }
    } catch (error) {
      showError('Erro ao carregar código TOTP');
    } finally {
      setIsLoadingTotp(false);
    }
  };

  const refreshTotpCode = async () => {
    await loadTotpCode();
  };

  const handleTotpCopy = () => {
    showSuccess('Código TOTP copiado!');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showSuccess(`${label} copiado!`);
    } catch (error) {
      showError('Erro ao copiar');
    }
  };

  const toggleFavorite = async () => {
    if (!password) return;

    try {
      const response = await passwordService.updatePassword(password.id, {
        isFavorite: !password.isFavorite,
      });
      
      if (response.success) {
        setPassword(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
        showSuccess(password.isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
      } else {
        showError('Erro ao atualizar favorito');
      }
    } catch (error) {
      showError('Erro ao atualizar favorito');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      padding: 20,
      paddingTop: 0,
    },
    headerCard: {
      marginBottom: 20,
    },
    passwordName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 8,
    },
    passwordWebsite: {
      fontSize: 16,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 16,
    },
    favoriteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: password?.isFavorite ? '#fef3c7' : (isDark ? '#374151' : '#f3f4f6'),
      alignSelf: 'flex-start',
    },
    favoriteButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: password?.isFavorite ? '#92400e' : (isDark ? '#9ca3af' : '#6b7280'),
      marginLeft: 4,
    },
    infoCard: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    infoLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9ca3af' : '#6b7280',
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
      flex: 2,
      textAlign: 'right',
    },
    copyButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      marginLeft: 8,
    },
    passwordValue: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
      flex: 2,
      textAlign: 'right',
      fontFamily: 'monospace',
    },
    notesCard: {
      marginBottom: 20,
    },
    notesText: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
      lineHeight: 20,
    },
    customFieldsCard: {
      marginBottom: 20,
    },
    customFieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    customFieldName: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9ca3af' : '#6b7280',
      flex: 1,
    },
    customFieldValue: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
      flex: 2,
      textAlign: 'right',
      fontFamily: 'monospace',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    actionButton: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 16,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <SkeletonLoader />
        </View>
      </View>
    );
  }

  if (!password) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.loadingText}>Senha não encontrada</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title={password.name}
        showBackButton={true}
        showThemeToggle={true}
      />
      <ScrollView style={styles.content}>
        <Card style={styles.headerCard}>
          {password.website && (
            <Text style={styles.passwordWebsite}>{password.website}</Text>
          )}
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Ionicons 
              name={password.isFavorite ? "heart" : "heart-outline"} 
              size={16} 
              color={password.isFavorite ? "#92400e" : (isDark ? "#9ca3af" : "#6b7280")} 
            />
            <Text style={styles.favoriteButtonText}>
              {password.isFavorite ? 'Favorita' : 'Adicionar aos favoritos'}
            </Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          {password.username && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Usuário</Text>
              <Text style={styles.infoValue}>{password.username}</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyToClipboard(password.username!, 'Usuário')}
              >
                <Ionicons name="copy-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Senha</Text>
            <Text style={styles.passwordValue}>
              {showPassword ? password.password : '••••••••'}
            </Text>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={16} 
                color={isDark ? '#9ca3af' : '#6b7280'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => copyToClipboard(password.password, 'Senha')}
            >
              <Ionicons name="copy-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>
          
          {password.folder && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pasta</Text>
              <Text style={styles.infoValue}>{password.folder}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TOTP</Text>
            <Text style={styles.infoValue}>
              {password.totpEnabled ? 'Habilitado' : 'Desabilitado'}
            </Text>
          </View>
        </Card>

        {password.notes && (
          <Card style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.notesText}>{password.notes}</Text>
          </Card>
        )}

        {password.customFields && password.customFields.length > 0 && (
          <Card style={styles.customFieldsCard}>
            <Text style={styles.sectionTitle}>Campos Personalizados</Text>
            {password.customFields.map((field) => (
              <View key={field.id} style={styles.customFieldRow}>
                <Text style={styles.customFieldName}>{field.name}</Text>
                <Text style={styles.customFieldValue}>{field.value}</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(field.value, field.name)}
                >
                  <Ionicons name="copy-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}

        {password.totpEnabled && totpCode && (
          <TotpCode
            code={totpCode.code}
            timeRemaining={totpCode.timeRemaining}
            period={totpCode.period}
            onRefresh={refreshTotpCode}
            onCopy={handleTotpCopy}
          />
        )}

        <View style={styles.actionsContainer}>
          <Button
            title="Editar"
            onPress={() => Alert.alert('Editar Senha')}
            size="md"
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title="Excluir"
            onPress={() => Alert.alert('Excluir Senha')}
            size="md"
            variant="danger"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}
