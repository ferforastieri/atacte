import React, { useEffect, useState } from 'react';
import { BackHandler, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BaseSelect,
  Button,
  Card,
  EmptyState,
  Header,
  Input,
  Modal,
  Pagination,
  SkeletonTable,
} from '../../components/shared';
import { IconTile } from '../../components/shared/IconTile';
import { Pill } from '../../components/shared/Pill';
import { userService } from '../../services/users/userService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { MainTabParamList } from '../../navigation/AppNavigator';
import { radii, spacing, touch, typography } from '../../theme/tokens';

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  lastLogin?: string;
}

type UsersScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Users'>;

export default function UsersScreen() {
  const navigation = useNavigation<UsersScreenNavigationProp>();
  const { isAdmin } = useAuth();
  const { colors, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<AdminUser> & { isActive: boolean }>({
    id: '',
    email: '',
    name: '',
    phoneNumber: '',
    role: 'USER',
    isActive: true,
  });
  const [editingUserPassword, setEditingUserPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0, limit: 10 });

  const handleBack = () => navigation.jumpTo('Profile');

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation]),
  );

  useEffect(() => {
    if (isAdmin) void fetchUsers(1);
  }, []);

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * pagination.limit;
      const response = await userService.getAllUsers(pagination.limit, offset);
      if (response.success && response.data) {
        setUsers(response.data as AdminUser[]);
        const responsePagination = response.pagination;
        if (responsePagination) {
          setPagination((previous) => ({
            ...previous,
            currentPage: page,
            total: responsePagination.total,
            totalPages: Math.max(1, Math.ceil(responsePagination.total / previous.limit)),
          }));
        }
      } else {
        setUsers([]);
        setPagination((previous) => ({ ...previous, totalPages: 1 }));
      }
    } catch {
      setUsers([]);
      setPagination((previous) => ({ ...previous, totalPages: 1 }));
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setEditingUser({
      id: user.id,
      email: user.email,
      name: user.name || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      isActive: user.isActive,
    });
    setEditingUserPassword('');
    setFormError('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditingUser({ id: '', email: '', name: '', phoneNumber: '', role: 'USER', isActive: true });
    setEditingUserPassword('');
  };

  const saveUser = async () => {
    if (!editingUser.id || isSaving) return;
    setFormError('');

    if (!editingUser.email?.trim()) {
      setFormError('Email é obrigatório.');
      return;
    }
    if (editingUserPassword && editingUserPassword.length < 8) {
      setFormError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setIsSaving(true);
    try {
      await userService.updateUser(editingUser.id, {
        email: editingUser.email,
        name: editingUser.name,
        phoneNumber: editingUser.phoneNumber,
        role: editingUser.role,
        isActive: editingUser.isActive,
      });
      if (editingUserPassword) {
        await userService.changeUserPassword(editingUser.id, editingUserPassword);
      }
      closeEditModal();
      await fetchUsers(pagination.currentPage);
      showSuccess('Usuário atualizado.');
    } catch {
      setFormError('Não foi possível salvar o usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const openPasswordModal = (user: AdminUser) => {
    setSelectedUser(user);
    setNewPassword('');
    setFormError('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setNewPassword('');
  };

  const changePassword = async () => {
    if (!selectedUser || !newPassword || isChangingPassword) return;
    setFormError('');
    if (newPassword.length < 8) {
      setFormError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await userService.changeUserPassword(selectedUser.id, newPassword);
      if (response.success) {
        closePasswordModal();
        showSuccess('Senha do usuário alterada.');
      } else {
        setFormError('Não foi possível alterar a senha.');
      }
    } catch {
      setFormError('Não foi possível alterar a senha.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const openDeleteModal = (user: AdminUser) => {
    setDeletingUserId(user.id);
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingUserId(null);
    setSelectedUser(null);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUserId || isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await userService.deleteUser(deletingUserId);
      if (response.success) {
        closeDeleteModal();
        await fetchUsers(pagination.currentPage);
        showSuccess('Usuário deletado.');
      } else {
        showError('Não foi possível deletar o usuário.');
      }
    } catch {
      showError('Não foi possível deletar o usuário.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const roleOptions = [
    { value: 'USER', label: 'Usuário' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Header title="Usuários" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
        <View style={{ padding: spacing.screen }}>
          <EmptyState icon="lock-closed-outline" title="Acesso negado" description="Esta área é exclusiva de administradores." />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title="Usuários"
        subtitle="Gerenciar Usuários"
        showBackButton
        onBack={handleBack}
        onThemeToggle={toggleTheme}
        icon={<Ionicons name="people-outline" size={22} color={colors.primarySoftText} />}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: Math.max(48, insets.bottom + 48) }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : users.length === 0 ? (
          <EmptyState icon="people-outline" title="Nenhum usuário encontrado" description="Ainda não há contas cadastradas." />
        ) : (
          <View style={{ gap: spacing.md }}>
            {users.map((user) => (
              <Card key={user.id}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                  <IconTile variant="muted">
                    <Ionicons name="person-outline" size={20} color={colors.inkMuted} />
                  </IconTile>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: typography.bodyLarge, fontWeight: typography.weights.semibold, color: colors.ink }}>
                      {user.email}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm }}>
                      <Pill label={user.role === 'ADMIN' ? 'Admin' : 'Usuário'} tone={user.role === 'ADMIN' ? 'accent' : 'neutral'} />
                      <Pill label={user.isActive ? 'Ativo' : 'Inativo'} tone={user.isActive ? 'success' : 'danger'} />
                    </View>
                    <View style={{ marginTop: spacing.sm, gap: 4 }}>
                      {user.name ? <Text style={{ fontSize: typography.label, color: colors.inkMuted }}>Nome: {user.name}</Text> : null}
                      <Text style={{ fontSize: typography.label, color: colors.inkMuted }}>Último login: {formatDate(user.lastLogin)}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line }}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Editar usuário"
                    style={{ flex: 1, minHeight: touch.minimum, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }}
                    onPress={() => openEditModal(user)}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.inkMuted} />
                    <Text style={{ fontSize: typography.label, fontWeight: typography.weights.medium, color: colors.inkMuted }}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Alterar senha"
                    style={{ flex: 1, minHeight: touch.minimum, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }}
                    onPress={() => openPasswordModal(user)}
                  >
                    <Ionicons name="key-outline" size={16} color={colors.inkMuted} />
                    <Text style={{ fontSize: typography.label, fontWeight: typography.weights.medium, color: colors.inkMuted }}>Senha</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Deletar usuário"
                    style={{ flex: 1, minHeight: touch.minimum, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: radii.md, backgroundColor: colors.dangerSoft }}
                    onPress={() => openDeleteModal(user)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.dangerText} />
                    <Text style={{ fontSize: typography.label, fontWeight: typography.weights.medium, color: colors.dangerText }}>Deletar</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {!isLoading && users.length > 0 ? (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPrevious={() => void fetchUsers(pagination.currentPage - 1)}
            onNext={() => void fetchUsers(pagination.currentPage + 1)}
            busy={isLoading}
          />
        ) : null}
      </ScrollView>

      <Modal
        visible={showEditModal}
        onClose={() => {
          if (isSaving) return;
          closeEditModal();
        }}
        title="Editar Usuário"
        subtitle="Atualize os dados e o acesso desta conta"
        icon={<Ionicons name="create-outline" size={22} color={colors.primarySoftText} />}
        size="lg"
        footer={(
          <>
            <Button title="Cancelar" onPress={closeEditModal} variant="ghost" style={{ flex: 1 }} disabled={isSaving} />
            <Button title="Salvar" onPress={saveUser} loading={isSaving} disabled={isSaving} style={{ flex: 1 }} />
          </>
        )}
      >
        {formError ? (
          <View style={{ marginBottom: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.dangerSoft }}>
            <Text style={{ fontSize: typography.body, color: colors.dangerText }}>{formError}</Text>
          </View>
        ) : null}
        <Input label="Email" value={editingUser.email || ''} onChangeText={(text) => setEditingUser({ ...editingUser, email: text })} keyboardType="email-address" autoCapitalize="none" disabled={isSaving} leftIcon={<Ionicons name="mail-outline" size={19} color={colors.inkSubtle} />} />
        <Input label="Nome" value={editingUser.name || ''} onChangeText={(text) => setEditingUser({ ...editingUser, name: text })} disabled={isSaving} leftIcon={<Ionicons name="person-outline" size={19} color={colors.inkSubtle} />} />
        <Input label="Telefone" value={editingUser.phoneNumber || ''} onChangeText={(text) => setEditingUser({ ...editingUser, phoneNumber: text })} keyboardType="phone-pad" disabled={isSaving} leftIcon={<Ionicons name="call-outline" size={19} color={colors.inkSubtle} />} />
        <BaseSelect label="Role" value={editingUser.role} options={roleOptions} onChange={(value) => setEditingUser({ ...editingUser, role: value as 'USER' | 'ADMIN' })} disabled={isSaving} />
        <Input label="Nova Senha (opcional)" value={editingUserPassword} onChangeText={setEditingUserPassword} secureTextEntry placeholder="Deixe em branco para não alterar" helperText="A senha deve ter pelo menos 8 caracteres" disabled={isSaving} leftIcon={<Ionicons name="lock-closed-outline" size={19} color={colors.inkSubtle} />} />
        <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: typography.body, color: colors.ink }}>Usuário Ativo</Text>
          <Switch value={editingUser.isActive} onValueChange={(value) => setEditingUser({ ...editingUser, isActive: value })} trackColor={{ false: colors.lineStrong, true: colors.primary }} thumbColor={colors.onPrimary} disabled={isSaving} />
        </View>
      </Modal>

      <Modal
        visible={showPasswordModal}
        onClose={() => {
          if (isChangingPassword) return;
          closePasswordModal();
        }}
        title="Alterar Senha"
        subtitle={selectedUser?.email ? `Conta: ${selectedUser.email}` : undefined}
        icon={<Ionicons name="key-outline" size={22} color={colors.primarySoftText} />}
        size="sm"
        footer={(
          <>
            <Button title="Cancelar" onPress={closePasswordModal} variant="ghost" style={{ flex: 1 }} disabled={isChangingPassword} />
            <Button title="Alterar Senha" onPress={changePassword} loading={isChangingPassword} disabled={isChangingPassword || !newPassword} style={{ flex: 1 }} />
          </>
        )}
      >
        {formError ? (
          <View style={{ marginBottom: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.dangerSoft }}>
            <Text style={{ fontSize: typography.body, color: colors.dangerText }}>{formError}</Text>
          </View>
        ) : null}
        <Input label="Nova Senha" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Mínimo 8 caracteres" helperText="A senha deve ter pelo menos 8 caracteres" disabled={isChangingPassword} leftIcon={<Ionicons name="lock-closed-outline" size={19} color={colors.inkSubtle} />} />
      </Modal>

      <Modal
        visible={showDeleteModal}
        onClose={() => {
          if (isDeleting) return;
          closeDeleteModal();
        }}
        title="Deletar Usuário"
        type="confirm"
        message={`Tem certeza que deseja deletar o usuário ${selectedUser?.email || ''}? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmDeleteUser}
        loading={isDeleting}
      />
    </View>
  );
}
