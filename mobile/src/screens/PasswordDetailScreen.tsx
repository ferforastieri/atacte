import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header, TotpCode, Button, SkeletonLoader, PasswordGeneratorModal } from '../components/shared';
import { Modal } from '../components/shared/Modal';
import { Input } from '../components/shared/Input';
import { passwordService } from '../services/passwords/passwordService';
import { totpService } from '../services/totp/totpService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type PasswordDetailRouteProp = RouteProp<RootStackParamList, 'PasswordDetail'>;
type PasswordDetailNavigationProp = StackNavigationProp<RootStackParamList, 'PasswordDetail'>;

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
  const navigation = useNavigation<PasswordDetailNavigationProp>();
  const { passwordId } = route.params;
  
  const [password, setPassword] = useState<PasswordEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState<{ code: string; timeRemaining: number; period: number } | null>(null);
  const [isLoadingTotp, setIsLoadingTotp] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordGeneratorModal, setShowPasswordGeneratorModal] = useState(false);
  const [showTotpSecret, setShowTotpSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    username: '',
    password: '',
    folder: '',
    notes: '',
    isFavorite: false,
    totpEnabled: false,
    totpSecret: '',
  });
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

  const handleEditPassword = () => {
    if (!password) return;
    
    setFormData({
      name: password.name,
      website: password.website || '',
      username: password.username || '',
      password: password.password,
      folder: password.folder || '',
      notes: password.notes || '',
      isFavorite: password.isFavorite,
      totpEnabled: password.totpEnabled,
      totpSecret: '',
    });
    setShowEditModal(true);
  };

  const handleDeletePassword = () => {
    setShowDeleteModal(true);
  };

  const confirmDeletePassword = async () => {
    if (!password) return;
    
    setIsDeleting(true);
    try {
      const response = await passwordService.deletePassword(password.id);
      if (response.success) {
        showSuccess('Senha excluída!');
        navigation.goBack();
      } else {
        showError(response.message || 'Erro ao excluir senha');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handlePasswordGenerated = (generatedPassword: string) => {
    setFormData({ ...formData, password: generatedPassword });
    setShowPasswordGeneratorModal(false);
  };

  const generateTotpSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, totpSecret: secret });
  };

  const handleSavePassword = async () => {
    if (!password) return;
    
    if (!formData.name.trim()) {
      showError('Nome é obrigatório');
      return;
    }
    
    if (!formData.password.trim()) {
      showError('Senha é obrigatória');
      return;
    }

    setIsSaving(true);
    try {
      const passwordData: any = {
        name: formData.name.trim(),
        website: formData.website.trim() || undefined,
        username: formData.username.trim() || undefined,
        password: formData.password.trim(),
        folder: formData.folder.trim() || undefined,
        isFavorite: formData.isFavorite,
        totpEnabled: formData.totpEnabled,
      };

      if (formData.notes.trim()) {
        passwordData.notes = formData.notes.trim();
      }
      
      if (formData.totpEnabled && formData.totpSecret.trim()) {
        passwordData.totpSecret = formData.totpSecret.trim();
      }

      const response = await passwordService.updatePassword(password.id, passwordData);

      if (response.success && response.data) {
        showSuccess('Senha atualizada!');
        setPassword(response.data);
        setShowEditModal(false);
      } else {
        showError(response.message || 'Erro ao atualizar senha');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSaving(false);
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
      paddingTop: 16,
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
    form: {
      gap: 16,
      paddingBottom: 20,
    },
    passwordSection: {
      gap: 8,
    },
    passwordHeaderForm: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    generateButton: {
      backgroundColor: '#16a34a',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    generateButtonText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '500',
    },
    totpSection: {
      gap: 12,
    },
    totpHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totpSecretSection: {
      gap: 8,
    },
    generateSecretButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      alignSelf: 'flex-start',
    },
    generateSecretButtonText: {
      fontSize: 12,
      fontWeight: '500',
    },
    favoriteSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    actions: {
      marginTop: 8,
    },
    saveActions: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
    },
    saveButton: {
      flex: 1,
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
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          {password.website && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Website</Text>
              <Text style={styles.infoValue}>{password.website}</Text>
            </View>
          )}
          
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

        {password.totpEnabled && totpCode && (
          <TotpCode
            code={totpCode.code}
            timeRemaining={totpCode.timeRemaining}
            period={totpCode.period}
            onRefresh={refreshTotpCode}
            onCopy={handleTotpCopy}
          />
        )}

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

        <View style={styles.actionsContainer}>
          <Button
            title="Editar"
            onPress={handleEditPassword}
            size="md"
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title={password.isFavorite ? "Favorita" : "Favoritar"}
            onPress={toggleFavorite}
            size="md"
            variant={password.isFavorite ? "primary" : "ghost"}
            style={styles.actionButton}
          />
          <Button
            title="Excluir"
            onPress={handleDeletePassword}
            size="md"
            variant="danger"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
        }}
        title="Editar Senha"
        size="lg"
      >
        <View style={styles.form}>
          <Input
            label="Nome *"
            placeholder="Nome da senha"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Input
            label="Website"
            placeholder="https://exemplo.com"
            value={formData.website}
            onChangeText={(text) => setFormData({ ...formData, website: text })}
            keyboardType="url"
            leftIcon={<Ionicons name="globe-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
          />

          <Input
            label="Username"
            placeholder="Nome de usuário"
            value={formData.username}
            onChangeText={(text) => setFormData({ ...formData, username: text })}
            leftIcon={<Ionicons name="person-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
          />

          <View style={styles.passwordSection}>
            <View style={styles.passwordHeaderForm}>
              <Text style={[styles.sectionLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
                Senha *
              </Text>
              <TouchableOpacity onPress={() => setShowPasswordGeneratorModal(true)} style={styles.generateButton}>
                <Text style={styles.generateButtonText}>Gerar</Text>
              </TouchableOpacity>
            </View>
            <Input
              placeholder="Digite ou gere uma senha"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={isDark ? '#9ca3af' : '#6b7280'}
                  />
                </TouchableOpacity>
              }
            />
          </View>

          <Input
            label="Pasta"
            placeholder="Pasta (opcional)"
            value={formData.folder}
            onChangeText={(text) => setFormData({ ...formData, folder: text })}
            leftIcon={<Ionicons name="folder-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
          />

          <Input
            label="Notas"
            placeholder="Notas adicionais"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
            leftIcon={<Ionicons name="document-text-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
          />

          <View style={styles.totpSection}>
            <View style={styles.totpHeader}>
              <Text style={[styles.sectionLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
                Autenticação de Dois Fatores (TOTP)
              </Text>
              <Switch
                value={formData.totpEnabled}
                onValueChange={(value) => setFormData({ ...formData, totpEnabled: value })}
                trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: '#16a34a' }}
                thumbColor={formData.totpEnabled ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            {formData.totpEnabled && (
              <View style={styles.totpSecretSection}>
                <Text style={[styles.sectionLabel, { color: isDark ? '#f9fafb' : '#111827', marginBottom: 8 }]}>
                  Chave Secreta TOTP
                </Text>
                <Input
                  placeholder="Digite a chave secreta do app autenticador"
                  value={formData.totpSecret}
                  onChangeText={(text) => setFormData({ ...formData, totpSecret: text })}
                  secureTextEntry={!showTotpSecret}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowTotpSecret(!showTotpSecret)}>
                      <Ionicons
                        name={showTotpSecret ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={isDark ? '#9ca3af' : '#6b7280'}
                      />
                    </TouchableOpacity>
                  }
                />
                <TouchableOpacity onPress={generateTotpSecret} style={styles.generateSecretButton}>
                  <Ionicons name="refresh-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text style={[styles.generateSecretButtonText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    Gerar Chave Secreta
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.favoriteSection}>
            <Text style={[styles.sectionLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
              Marcar como favorita
            </Text>
            <Switch
              value={formData.isFavorite}
              onValueChange={(value) => setFormData({ ...formData, isFavorite: value })}
              trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: '#16a34a' }}
              thumbColor={formData.isFavorite ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.actions}>
            <View style={styles.saveActions}>
              <Button
                title="Cancelar"
                onPress={() => setShowEditModal(false)}
                variant="ghost"
                style={styles.cancelButton}
              />
              <Button
                title="Atualizar"
                onPress={handleSavePassword}
                loading={isSaving}
                variant="primary"
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <PasswordGeneratorModal
        visible={showPasswordGeneratorModal}
        onClose={() => setShowPasswordGeneratorModal(false)}
        onPasswordGenerated={handlePasswordGenerated}
        initialPassword={formData.password}
      />

      <Modal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
        }}
        title="Excluir Senha"
        type="confirm"
        message="Tem certeza que deseja excluir esta senha?"
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmDeletePassword}
        loading={isDeleting}
      />
    </View>
  );
}
