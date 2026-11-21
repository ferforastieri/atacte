import { secureRandomInt } from '../utils/secureRandom';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';
import {
  Button,
  EmptyState,
  Header,
  Input,
  Modal,
  PasswordGeneratorModal,
  PasswordStrength,
  SearchInput,
  SkeletonLoader,
  passwordScore,
} from '../components/shared';
import { TotpCard } from '../components/totp/TotpCard';
import { passwordService } from '../services/passwords/passwordService';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { radii, shadows, spacing, typography } from '../theme/tokens';

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
  const { showSuccess, showError } = useToast();
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copyingPasswordId, setCopyingPasswordId] = useState<string | null>(null);
  const [copyingUsernameId, setCopyingUsernameId] = useState<string | null>(null);
  const [favoritePendingId, setFavoritePendingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const requestGeneration = useRef(0);
  const loadingPage = useRef(false);
  const activeSearchQuery = useRef('');
  const listRef = useRef<FlatList<PasswordEntry>>(null);
  const [recentlyCreatedId, setRecentlyCreatedId] = useState<string | null>(null);
  const recentlyCreatedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors, toggleTheme } = useTheme();

  useEffect(() => {
    loadPasswords();
  }, []);

  useEffect(() => {
    return () => {
      if (recentlyCreatedTimeout.current) clearTimeout(recentlyCreatedTimeout.current);
    };
  }, []);

  const loadPasswords = useCallback(async (offset = 0, append = false, query = activeSearchQuery.current, silent = false) => {
    if (append && loadingPage.current) return;
    if (!append) requestGeneration.current += 1;
    const generation = requestGeneration.current;
    loadingPage.current = true;
    if (offset === 0) {
      if (!silent) setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await passwordService.getPasswords({ query, offset, limit: 50 });
      if (generation !== requestGeneration.current) return;

      if (response.success && response.data) {
        if (append) {
          setPasswords((previous) => {
            const existingIds = new Set(previous.map((password) => password.id));
            return [...previous, ...response.data!.filter((password) => !existingIds.has(password.id))];
          });
        } else {
          setPasswords(response.data);
        }

        if (response.pagination) {
          const currentTotal = offset + response.data.length;
          setHasMore(currentTotal < response.pagination.total);
          setCurrentOffset(currentTotal);
        } else {
          setHasMore(false);
          setCurrentOffset(offset + response.data.length);
        }
      } else if (!append) {
        setPasswords([]);
        setHasMore(false);
      }
    } catch {
      if (generation !== requestGeneration.current) return;
      if (!append) setPasswords([]);
      setHasMore(false);
      Alert.alert('Erro', 'Erro ao carregar senhas');
    } finally {
      if (generation === requestGeneration.current) {
        loadingPage.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setCurrentOffset(0);
    await loadPasswords(0, false);
  }, [loadPasswords]);

  const handleSearch = useCallback(async (query: string) => {
    activeSearchQuery.current = query;
    setCurrentOffset(0);
    await loadPasswords(0, false, query);
  }, [loadPasswords]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && passwords.length > 0) {
      void loadPasswords(currentOffset, true);
    }
  }, [isLoadingMore, hasMore, currentOffset, loadPasswords, passwords.length]);

  const handlePasswordPress = (password: PasswordEntry) => {
    navigation.navigate('PasswordDetail', { passwordId: password.id });
  };

  const copyToClipboard = async (text: string | undefined, id: string, kind: 'password' | 'username') => {
    if (!text) return;
    if (kind === 'password' ? copyingPasswordId : copyingUsernameId) return;

    if (kind === 'password') setCopyingPasswordId(id);
    else setCopyingUsernameId(id);

    try {
      await Clipboard.setStringAsync(text);
      showSuccess(kind === 'password' ? 'Senha copiada para a área de transferência.' : 'Usuário copiado para a área de transferência.');
    } catch {
      showError(kind === 'password' ? 'Não foi possível copiar a senha.' : 'Não foi possível copiar o usuário.');
    } finally {
      if (kind === 'password') setCopyingPasswordId(null);
      else setCopyingUsernameId(null);
    }
  };

  const toggleFavorite = async (password: PasswordEntry) => {
    if (favoritePendingId) return;
    setFavoritePendingId(password.id);
    try {
      const response = await passwordService.updatePassword(password.id, { isFavorite: !password.isFavorite });
      if (response.success && response.data) {
        setPasswords((previous) => previous.map((entry) => (
          entry.id === password.id ? { ...entry, isFavorite: !entry.isFavorite } : entry
        )));
      } else {
        showError('Não foi possível atualizar a favorita.');
      }
    } catch {
      showError('Não foi possível atualizar a favorita.');
    } finally {
      setFavoritePendingId(null);
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
    setFormData((current) => ({ ...current, password: generatedPassword }));
    setShowPasswordGeneratorModal(false);
  };

  const generateTotpSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let index = 0; index < 32; index += 1) {
      secret += chars.charAt(secureRandomInt(chars.length));
    }
    setFormData((current) => ({ ...current, totpSecret: secret }));
  };

  const handleSavePassword = async () => {
    if (isSaving) return;
    if (!formData.name.trim() || !formData.password.trim()) return;

    setIsSaving(true);
    try {
      const passwordData: {
        name: string;
        password: string;
        totpEnabled: boolean;
        isFavorite: boolean;
        website?: string;
        username?: string;
        folder?: string;
        notes?: string;
        totpSecret?: string;
      } = {
        name: formData.name.trim(),
        password: formData.password,
        totpEnabled: formData.totpEnabled,
        isFavorite: formData.isFavorite,
      };

      if (formData.website.trim()) passwordData.website = formData.website.trim();
      if (formData.username.trim()) passwordData.username = formData.username.trim();
      if (formData.folder.trim()) passwordData.folder = formData.folder.trim();
      if (formData.notes.trim()) passwordData.notes = formData.notes.trim();
      if (formData.totpEnabled && formData.totpSecret.trim()) passwordData.totpSecret = formData.totpSecret.trim();

      const response = editingPassword
        ? await passwordService.updatePassword(editingPassword.id, passwordData)
        : await passwordService.createPassword(passwordData);

      if (response.success) {
        await handlePasswordSaved(response.data);
      } else {
        showError('Não foi possível salvar a senha.');
      }
    } catch {
      showError('Não foi possível salvar a senha.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSaved = async (createdPassword?: PasswordEntry) => {
    const wasEditing = Boolean(editingPassword);
    setShowPasswordModal(false);
    setEditingPassword(null);

    if (!wasEditing && createdPassword) {
      setSearchQuery('');
      activeSearchQuery.current = '';
      setCurrentOffset(0);

      await loadPasswords(0, false, '', true);
      setPasswords((previous) => [createdPassword, ...previous.filter((password) => password.id !== createdPassword.id)]);
      setRecentlyCreatedId(createdPassword.id);

      if (recentlyCreatedTimeout.current) clearTimeout(recentlyCreatedTimeout.current);
      recentlyCreatedTimeout.current = setTimeout(() => setRecentlyCreatedId(null), 8000);

      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
      showSuccess(`A senha "${createdPassword.name}" foi criada e está no topo da lista.`);
      return;
    }

    await loadPasswords(0, false);
  };

  const handleDeletePassword = (password: PasswordEntry) => {
    setDeletingPassword(password);
    setShowDeleteModal(true);
  };

  const confirmDeletePassword = async () => {
    if (!deletingPassword || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await passwordService.deletePassword(deletingPassword.id);
      if (response.success) {
        setShowDeleteModal(false);
        setDeletingPassword(null);
        await loadPasswords(0, false);
        showSuccess('Senha excluída.');
      } else {
        showError('Não foi possível excluir a senha.');
      }
    } catch {
      showError('Não foi possível excluir a senha.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderPasswordItem = ({ item }: { item: PasswordEntry }) => (
    <TotpCard
      password={item}
      isNew={item.id === recentlyCreatedId}
      onPress={() => handlePasswordPress(item)}
      onEdit={() => handleEditPassword(item)}
      onDelete={() => handleDeletePassword(item)}
      onToggleFavorite={() => toggleFavorite(item)}
      onCopyPassword={() => copyToClipboard(item.password, item.id, 'password')}
      onCopyUsername={() => copyToClipboard(item.username, item.id, 'username')}
      isCopyingPassword={copyingPasswordId === item.id}
      isCopyingUsername={copyingUsernameId === item.id}
      isTogglingFavorite={favoritePendingId === item.id}
      isDeleting={isDeleting && deletingPassword?.id === item.id}
    />
  );

  const renderFooter = () => {
    if (!isLoadingMore && hasMore) {
      return <Text style={{ paddingVertical: spacing.xl, textAlign: 'center', color: colors.inkMuted, fontSize: typography.body }}>Puxe para carregar mais senhas</Text>;
    }
    if (isLoadingMore) {
      return <Text style={{ paddingVertical: spacing.xl, textAlign: 'center', color: colors.inkMuted, fontSize: typography.body }}>Carregando mais senhas...</Text>;
    }
    if (!hasMore && passwords.length > 0) {
      return <Text style={{ paddingVertical: spacing.xl, textAlign: 'center', color: colors.inkMuted, fontSize: typography.body }}>Todas as senhas foram carregadas</Text>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Header
          title="Dashboard"
          subtitle="Suas senhas em um só lugar"
          onThemeToggle={toggleTheme}
          icon={<Ionicons name="key-outline" size={22} color={colors.primarySoftText} />}
        />
        <SkeletonLoader variant="dashboard" />
      </View>
    );
  }

  const canSave = Boolean(formData.name.trim() && formData.password.trim());

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title="Dashboard"
        subtitle="Guarde, encontre e copie suas credenciais"
        onThemeToggle={toggleTheme}
        icon={<Ionicons name="key-outline" size={22} color={colors.primarySoftText} />}
      />

      <View style={{ flex: 1, paddingHorizontal: spacing.screen }}>
        <View style={{ paddingTop: spacing.lg, marginBottom: spacing.lg }}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Buscar senhas..."
          />
        </View>

        <FlatList
          ref={listRef}
          data={passwords}
          extraData={`${recentlyCreatedId}-${copyingPasswordId}-${favoritePendingId}-${isDeleting}`}
          renderItem={renderPasswordItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.15}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={(
            <EmptyState
              icon="key-outline"
              title="Nenhuma senha encontrada"
              description={searchQuery ? 'Tente ajustar sua busca' : 'Adicione sua primeira senha'}
              actionLabel={searchQuery ? undefined : 'Nova Senha'}
              onAction={searchQuery ? undefined : handleCreatePassword}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 110 }}
        />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Nova senha"
        style={{
          position: 'absolute',
          bottom: spacing['2xl'],
          right: spacing.screen,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.pop,
        }}
        onPress={handleCreatePassword}
        activeOpacity={0.82}
      >
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </TouchableOpacity>

      <Modal
        visible={showPasswordModal}
        onClose={() => {
          if (isSaving) return;
          setShowPasswordModal(false);
          setEditingPassword(null);
        }}
        title={editingPassword ? 'Editar Senha' : 'Nova Senha'}
        subtitle={editingPassword ? 'Atualize os dados da credencial' : 'Guarde uma credencial nova no cofre'}
        icon={<Ionicons name="lock-closed-outline" size={22} color={colors.primarySoftText} />}
        size="lg"
        footer={(
          <>
            <Button
              title="Cancelar"
              onPress={() => {
                setShowPasswordModal(false);
                setEditingPassword(null);
              }}
              variant="ghost"
              style={{ flex: 1 }}
              disabled={isSaving}
            />
            <Button
              title={editingPassword ? 'Atualizar' : 'Criar'}
              onPress={handleSavePassword}
              loading={isSaving}
              disabled={isSaving || !canSave}
              style={{ flex: 1 }}
            />
          </>
        )}
      >
        <Text style={{ fontSize: typography.bodyLarge, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.md }}>
          Informações
        </Text>

        <Input
          label="Nome *"
          placeholder="Nome da senha"
          value={formData.name}
          onChangeText={(text) => setFormData((current) => ({ ...current, name: text }))}
          disabled={isSaving}
        />

        <Input
          label="Website"
          placeholder="https://exemplo.com"
          value={formData.website}
          onChangeText={(text) => setFormData((current) => ({ ...current, website: text }))}
          keyboardType="url"
          autoCapitalize="none"
          disabled={isSaving}
          leftIcon={<Ionicons name="globe-outline" size={19} color={colors.inkSubtle} />}
        />

        <Input
          label="Username"
          placeholder="Nome de usuário"
          value={formData.username}
          onChangeText={(text) => setFormData((current) => ({ ...current, username: text }))}
          autoCapitalize="none"
          disabled={isSaving}
          leftIcon={<Ionicons name="person-outline" size={19} color={colors.inkSubtle} />}
        />

        <View style={{ marginTop: spacing.sm, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: typography.bodyLarge, fontWeight: typography.weights.semibold, color: colors.ink }}>Credencial</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Gerar senha"
            onPress={() => setShowPasswordGeneratorModal(true)}
            disabled={isSaving}
            style={{
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: spacing.md,
              borderRadius: radii.pill,
              backgroundColor: colors.primarySoft,
            }}
          >
            <Ionicons name="sparkles-outline" size={15} color={colors.primarySoftText} />
            <Text style={{ fontSize: typography.label, fontWeight: typography.weights.semibold, color: colors.primarySoftText }}>Gerar senha</Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Senha *"
          placeholder="Digite ou gere uma senha"
          value={formData.password}
          onChangeText={(text) => setFormData((current) => ({ ...current, password: text }))}
          secureTextEntry
          autoCapitalize="none"
          disabled={isSaving}
          leftIcon={<Ionicons name="lock-closed-outline" size={19} color={colors.inkSubtle} />}
        />
        <PasswordStrength score={passwordScore(formData.password)} />

        <Text style={{ marginTop: spacing.xl, marginBottom: spacing.md, fontSize: typography.bodyLarge, fontWeight: typography.weights.semibold, color: colors.ink }}>
          Organização
        </Text>

        <Input
          label="Pasta"
          placeholder="Pasta (opcional)"
          value={formData.folder}
          onChangeText={(text) => setFormData((current) => ({ ...current, folder: text }))}
          disabled={isSaving}
          leftIcon={<Ionicons name="folder-outline" size={19} color={colors.inkSubtle} />}
        />

        <Input
          label="Notas"
          placeholder="Notas adicionais"
          value={formData.notes}
          onChangeText={(text) => setFormData((current) => ({ ...current, notes: text }))}
          multiline
          numberOfLines={3}
          disabled={isSaving}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 }}>
          <Text style={{ fontSize: typography.body, fontWeight: typography.weights.medium, color: colors.ink }}>Marcar como favorita</Text>
          <Switch
            value={formData.isFavorite}
            onValueChange={(value) => setFormData((current) => ({ ...current, isFavorite: value }))}
            trackColor={{ false: colors.lineStrong, true: colors.primary }}
            thumbColor={colors.onPrimary}
            disabled={isSaving}
          />
        </View>

        <View style={{ marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.body, fontWeight: typography.weights.medium, color: colors.ink }}>Autenticação de Dois Fatores (TOTP)</Text>
              <Text style={{ marginTop: 2, fontSize: typography.label, color: colors.inkMuted }}>Gere códigos de 6 dígitos</Text>
            </View>
            <Switch
              value={formData.totpEnabled}
              onValueChange={(value) => setFormData((current) => ({ ...current, totpEnabled: value }))}
              trackColor={{ false: colors.lineStrong, true: colors.primary }}
              thumbColor={colors.onPrimary}
              disabled={isSaving}
            />
          </View>

          {formData.totpEnabled ? (
            <View style={{ marginTop: spacing.sm }}>
              <Input
                label="Chave Secreta TOTP"
                placeholder="Digite a chave secreta do app autenticador"
                value={formData.totpSecret}
                onChangeText={(text) => setFormData((current) => ({ ...current, totpSecret: text }))}
                secureTextEntry
                autoCapitalize="none"
                disabled={isSaving}
                helperText="Cole a chave do seu app autenticador (Google Authenticator, Authy, etc.)"
              />
              <Button
                title="Gerar Chave Secreta"
                onPress={generateTotpSecret}
                variant="secondary"
                size="sm"
                disabled={isSaving}
                icon={<Ionicons name="refresh-outline" size={16} color={colors.inkMuted} />}
              />
            </View>
          ) : null}
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
          if (isDeleting) return;
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
        loading={isDeleting}
      />
    </View>
  );
}
