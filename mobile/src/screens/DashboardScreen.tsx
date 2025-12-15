import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, PasswordGeneratorModal, SearchInput, SkeletonLoader } from '../components/shared';
import { Modal } from '../components/shared/Modal';
import { Input } from '../components/shared/Input';
import { Switch } from 'react-native';
import { TotpCard } from '../components/totp/TotpCard';
import { passwordService } from '../services/passwords/passwordService';
import { authService } from '../services/auth/authService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as Clipboard from 'expo-clipboard';

interface PasswordEntry {
  id: string;
  name: string;
  website?: string;
  username?: string;
  password: string;
  folder?: string;
  isFavorite: boolean;
  totpEnabled: boolean;
}

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasswordGeneratorModal, setShowPasswordGeneratorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [deletingPassword, setDeletingPassword] = useState<PasswordEntry | null>(null);
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
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpSecret, setShowTotpSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    listStyle: {
      flex: 1,
    },
    listContainer: {
      flexGrow: 1,
    },
    searchContainer: {
      paddingTop: 20,
      marginBottom: 20,
    },
    searchInput: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#16a34a',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
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
    totpSecretHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    helpText: {
      fontSize: 12,
      lineHeight: 16,
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
    passwordCard: {
      marginBottom: 12,
    },
    passwordHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    passwordInfo: {
      flex: 1,
    },
    passwordName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
    },
    passwordWebsite: {
      fontSize: 14,
      color: '#16a34a',
      marginTop: 2,
    },
    passwordUsername: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 2,
    },
    passwordFolder: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 4,
    },
    passwordActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    copyButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    favoriteButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    editButton: {
      flex: 1,
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#6b7280',
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 8,
      textAlign: 'center',
    },
    loadingMore: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    loadingText: {
      color: isDark ? '#9ca3af' : '#6b7280',
      fontSize: 14,
    },
  });

  useEffect(() => {
    loadUser();
    loadPasswords();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentOffset(0);
      loadPasswords(0, false);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadUser = async () => {
    const userData = await authService.getStoredUser();
    setUser(userData);
  };

  const loadPasswords = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await passwordService.getPasswords({
        query: searchQuery,
        offset: offset,
        limit: 50,
      });
      
      if (response.success && response.data) {
        if (append) {
          setPasswords(prev => {
            
            const existingIds = new Set(prev.map(p => p.id));
            const newPasswords = response.data!.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPasswords];
          });
        } else {
          setPasswords(response.data);
        }
        
        if (response.pagination) {
          const currentTotal = offset + response.data.length;
          const hasMoreData = currentTotal < response.pagination.total;
          setHasMore(hasMoreData);
          setCurrentOffset(offset + response.data.length);
        } else {
          setHasMore(false);
          setCurrentOffset(offset + response.data.length);
        }
      } else {
        if (!append) {
          setPasswords([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      if (!append) {
        setPasswords([]);
      }
      setHasMore(false);
      Alert.alert('Erro', 'Erro ao carregar senhas');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [searchQuery]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setCurrentOffset(0);
    await loadPasswords(0, false);
  }, [loadPasswords]);

  
  const handleSearch = useCallback(async (query: string) => {
    try {
      setSearchQuery(query);
      setCurrentOffset(0);
      await loadPasswords(0, false);
    } catch (error) {
      showError('Erro ao buscar senhas');
    }
  }, [loadPasswords]);

  const handleSearchClear = useCallback(async () => {
    try {
      setSearchQuery('');
      setCurrentOffset(0);
      await loadPasswords(0, false);
    } catch (error) {
      showError('Erro ao limpar busca');
    }
  }, [loadPasswords]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && passwords.length > 0) {
      loadPasswords(currentOffset, true);
    }
  }, [isLoadingMore, hasMore, currentOffset, loadPasswords, passwords.length]);

  const handlePasswordPress = (password: PasswordEntry) => {
    navigation.navigate('PasswordDetail', { passwordId: password.id });
  };

  const copyToClipboard = async (text: string, label: string = 'Texto') => {
    try {
      await Clipboard.setStringAsync(text);
      showSuccess(`${label} copiado para a área de transferência`);
    } catch (error) {
      showError('Erro ao copiar texto');
    }
  };

  const toggleFavorite = async (password: PasswordEntry) => {
    try {
      const response = await passwordService.updatePassword(password.id, {
        isFavorite: !password.isFavorite,
      });
      
      if (response.success && response.data) {
        setPasswords(prev => 
          prev.map(p => 
            p.id === password.id 
              ? { ...p, isFavorite: !p.isFavorite }
              : p
          )
        );
        showSuccess(response.data.isFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
      } else {
        showError(response.message || 'Erro ao atualizar favorito');
      }
    } catch (error) {
      showError('Erro ao atualizar favorito');
    }
  };

  const handleCreatePassword = () => {
    setEditingPassword(null);
    setFormData({
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
    setShowPasswordModal(true);
  };

  const handleEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setFormData({
      name: password.name,
      website: password.website || '',
      username: password.username || '',
      password: password.password,
      folder: password.folder || '',
      notes: '',
      isFavorite: password.isFavorite,
      totpEnabled: password.totpEnabled,
      totpSecret: '',
    });
    setShowPasswordModal(true);
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
    if (!formData.name || !formData.password) {
      showError('Nome e senha são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      let response;
      
      
      const passwordData: any = {
        name: formData.name.trim(),
        password: formData.password,
        totpEnabled: formData.totpEnabled,
        isFavorite: formData.isFavorite
      };
      
      if (formData.website.trim()) {
        passwordData.website = formData.website.trim();
      }
      
      if (formData.username.trim()) {
        passwordData.username = formData.username.trim();
      }
      
      if (formData.folder.trim()) {
        passwordData.folder = formData.folder.trim();
      }
      
      if (formData.notes.trim()) {
        passwordData.notes = formData.notes.trim();
      }
      
      if (formData.totpEnabled && formData.totpSecret.trim()) {
        passwordData.totpSecret = formData.totpSecret.trim();
      }
      
      if (editingPassword) {
        response = await passwordService.updatePassword(editingPassword.id, passwordData);
      } else {
        response = await passwordService.createPassword(passwordData);
      }

      if (response.success) {
        showSuccess(editingPassword ? 'Senha atualizada!' : 'Senha criada!');
        handlePasswordSaved();
      } else {
        showError(response.message || 'Erro ao salvar senha');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSaved = () => {
    setShowPasswordModal(false);
    setEditingPassword(null);
    loadPasswords(0, false);
  };

  const handleDeletePassword = (password: PasswordEntry) => {
    setDeletingPassword(password);
    setShowDeleteModal(true);
  };

  const confirmDeletePassword = async () => {
    if (!deletingPassword) return;
    
    try {
      const response = await passwordService.deletePassword(deletingPassword.id);
      if (response.success) {
        showSuccess('Senha excluída!');
        loadPasswords(0, false);
      } else {
        showError(response.message || 'Erro ao excluir senha');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setShowDeleteModal(false);
      setDeletingPassword(null);
    }
  };

  const renderPasswordItem = ({ item }: { item: PasswordEntry }) => (
    <TotpCard
      password={item}
      onPress={() => handlePasswordPress(item)}
      onEdit={() => handleEditPassword(item)}
      onDelete={() => handleDeletePassword(item)}
      onToggleFavorite={() => toggleFavorite(item)}
      onCopyPassword={() => copyToClipboard(item.password, 'Senha')}
      onCopyUsername={() => copyToClipboard(item.username!, 'Usuário')}
    />
  );

  const renderFooter = () => {
    if (!isLoadingMore && hasMore) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>Puxe para carregar mais senhas</Text>
        </View>
      );
    }
    
    if (isLoadingMore) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>Carregando mais senhas...</Text>
        </View>
      );
    }
    
    if (!hasMore && passwords.length > 0) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>Todas as senhas foram carregadas</Text>
        </View>
      );
    }
    
    return null;
  };

  const renderEmpty = () => (
    <Card style={styles.emptyCard}>
      <Ionicons name="key-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>Nenhuma senha encontrada</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Tente ajustar sua busca' : 'Adicione sua primeira senha'}
      </Text>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Dashboard" onThemeToggle={toggleTheme} />
        <SkeletonLoader variant="dashboard" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Dashboard" onThemeToggle={toggleTheme} />
      
      <View style={styles.content}>
        {}
        <View style={styles.searchContainer}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSearch={handleSearch}
            onClear={handleSearchClear}
            placeholder="Buscar senhas..."
            debounceMs={300}
            minLength={2}
          />
        </View>

        {}
        <FlatList
          data={passwords}
          renderItem={renderPasswordItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          style={styles.listStyle}
          contentContainerStyle={styles.listContainer}
          contentInsetAdjustmentBehavior="automatic"
        />
      </View>

      {}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePassword}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {}
      <Modal
        visible={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setEditingPassword(null);
        }}
        title={editingPassword ? 'Editar Senha' : 'Nova Senha'}
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

          {}
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
                <Text style={[styles.helpText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Cole a chave secreta do seu app autenticador (Google Authenticator, Authy, etc.)
                </Text>
              </View>
            )}
          </View>

          {}
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
                onPress={() => {
                  setShowPasswordModal(false);
                  setEditingPassword(null);
                }}
                variant="ghost"
                style={styles.cancelButton}
              />
              <Button
                title={editingPassword ? 'Atualizar' : 'Criar'}
                onPress={handleSavePassword}
                loading={isSaving}
                variant="primary"
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {}
      <PasswordGeneratorModal
        visible={showPasswordGeneratorModal}
        onClose={() => setShowPasswordGeneratorModal(false)}
        onPasswordGenerated={handlePasswordGenerated}
        initialPassword={formData.password}
      />

      {}
      <Modal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingPassword(null);
        }}
        title="Excluir Senha"
        type="confirm"
        message="Tem certeza que deseja excluir esta senha?"
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmDeletePassword}
      />
    </View>
  );
}