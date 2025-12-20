import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, Card, SkeletonLoader, Modal, Input, Button, BaseSelect } from '../../components/shared';
import { userService } from '../../services/users/userService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../../navigation/AppNavigator';

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
  const { isDark, toggleTheme } = useTheme();
  const { showError, showSuccess } = useToast();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    navigation.jumpTo('Profile');
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );
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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers(1);
    }
  }, []);

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * pagination.limit;
      const response = await userService.getAllUsers(pagination.limit, offset);
      if (response.success && response.data) {
        setUsers(response.data);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            currentPage: page,
            total: response.pagination.total,
            totalPages: Math.ceil(response.pagination.total / prev.limit)
          }));
        }
      } else {
        setUsers([]);
        setPagination(prev => ({ ...prev, totalPages: 1 }));
      }
    } catch (error) {
      showError('Erro ao carregar usuários');
      setUsers([]);
      setPagination(prev => ({ ...prev, totalPages: 1 }));
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchUsers(page);
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
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditingUser({
      id: '',
      email: '',
      name: '',
      phoneNumber: '',
      role: 'USER',
      isActive: true,
    });
    setEditingUserPassword('');
  };

  const saveUser = async () => {
    if (!editingUser.id) return;

    if (editingUserPassword && editingUserPassword.length < 8) {
      showError('A senha deve ter pelo menos 8 caracteres');
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

      showSuccess('Usuário atualizado com sucesso');
      closeEditModal();
      await fetchUsers();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      showError(errorMessage || 'Erro ao atualizar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const openPasswordModal = (user: AdminUser) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setNewPassword('');
  };

  const changePassword = async () => {
    if (!selectedUser || !newPassword) {
      showError('A senha é obrigatória');
      return;
    }

    if (newPassword.length < 8) {
      showError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await userService.changeUserPassword(selectedUser.id, newPassword);
      if (response.success) {
        showSuccess('Senha alterada com sucesso');
        closePasswordModal();
      } else {
        showError(response.message || 'Erro ao alterar senha');
      }
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      showError(errorMessage || 'Erro ao alterar senha');
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
    if (!deletingUserId) return;

    setIsDeleting(true);
    try {
      const response = await userService.deleteUser(deletingUserId);
      if (response.success) {
        showSuccess('Usuário deletado com sucesso');
        closeDeleteModal();
        await fetchUsers(pagination.currentPage);
      } else {
        showError(response.message || 'Erro ao deletar usuário');
      }
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      showError(errorMessage || 'Erro ao deletar usuário');
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
      minute: '2-digit'
    });
  };

  const roleOptions = [
    { value: 'USER', label: 'Usuário' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: Math.max(100, insets.bottom + 100),
    },
    titleCard: {
      marginBottom: 20,
      padding: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#f9fafb' : '#111827',
    },
    userCard: {
      marginBottom: 12,
    },
    userHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    userEmail: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      flex: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    userDetails: {
      marginTop: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    detailValue: {
      fontSize: 12,
      color: isDark ? '#d1d5db' : '#374151',
      flex: 1,
      textAlign: 'right',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#4b5563' : '#d1d5db',
      backgroundColor: 'transparent',
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#f9fafb' : '#111827',
      marginLeft: 4,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 4,
    },
    emptyText: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      textAlign: 'center',
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
    },
    paginationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    paginationButtonDisabled: {
      opacity: 0.5,
    },
    paginationButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#d1d5db' : '#374151',
      marginHorizontal: 4,
    },
    paginationButtonTextDisabled: {
      color: isDark ? '#4b5563' : '#9ca3af',
    },
    paginationInfo: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#d1d5db' : '#374151',
    },
    modalContent: {
      padding: 0,
    },
    formRow: {
      marginBottom: 16,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    switchLabel: {
      fontSize: 14,
      color: isDark ? '#f9fafb' : '#111827',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
    },
  });

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Header title="Usuários" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
        <View style={styles.content}>
          <Text style={styles.emptyText}>Acesso negado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Usuários" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.titleCard}>
          <Text style={styles.title}>Gerenciar Usuários</Text>
        </Card>

        {isLoading ? (
          <SkeletonLoader variant="default" />
        ) : users.length === 0 ? (
          <Card style={styles.emptyContainer}>
            <Ionicons 
              name="people-outline" 
              size={48} 
              color={isDark ? '#6b7280' : '#9ca3af'}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>Nenhum usuário encontrado</Text>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.badgeRow}>
                  <View style={[
                    styles.badge,
                    { backgroundColor: user.role === 'ADMIN' ? '#8b5cf6' : '#6b7280' }
                  ]}>
                    <Text style={[styles.badgeText, { color: '#ffffff' }]}>
                      {user.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                    </Text>
                  </View>
                  <View style={[
                    styles.badge,
                    { backgroundColor: user.isActive ? '#10b981' : '#dc2626' }
                  ]}>
                    <Text style={[styles.badgeText, { color: '#ffffff' }]}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.userDetails}>
                {user.name && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nome:</Text>
                    <Text style={styles.detailValue}>{user.name}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Último Login:</Text>
                  <Text style={styles.detailValue}>{formatDate(user.lastLogin)}</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1 }]}
                  onPress={() => openEditModal(user)}
                >
                  <Ionicons name="create-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1 }]}
                  onPress={() => openPasswordModal(user)}
                >
                  <Ionicons name="key-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text style={styles.actionButtonText}>Senha</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1 }]}
                  onPress={() => openDeleteModal(user)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Deletar</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {!isLoading && users.length > 0 && pagination.totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, pagination.currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => goToPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <Ionicons name="chevron-back" size={20} color={pagination.currentPage === 1 ? (isDark ? '#4b5563' : '#9ca3af') : (isDark ? '#d1d5db' : '#374151')} />
              <Text style={[styles.paginationButtonText, pagination.currentPage === 1 && styles.paginationButtonTextDisabled]}>
                Anterior
              </Text>
            </TouchableOpacity>

            <Text style={styles.paginationInfo}>
              Página {pagination.currentPage} de {pagination.totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.paginationButton, pagination.currentPage === pagination.totalPages && styles.paginationButtonDisabled]}
              onPress={() => goToPage(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <Text style={[styles.paginationButtonText, pagination.currentPage === pagination.totalPages && styles.paginationButtonTextDisabled]}>
                Próxima
              </Text>
              <Ionicons name="chevron-forward" size={20} color={pagination.currentPage === pagination.totalPages ? (isDark ? '#4b5563' : '#9ca3af') : (isDark ? '#d1d5db' : '#374151')} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showEditModal}
        onClose={closeEditModal}
        type="default"
        title="Editar Usuário"
        size="lg"
      >
        <View style={styles.modalContent}>
          <View style={styles.formRow}>
            <Input
              label="Email"
              value={editingUser.email || ''}
              onChangeText={(text) => setEditingUser({ ...editingUser, email: text })}
              keyboardType="email-address"
              leftIcon={<Ionicons name="mail-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
            />
          </View>

          <View style={styles.formRow}>
            <Input
              label="Nome"
              value={editingUser.name || ''}
              onChangeText={(text) => setEditingUser({ ...editingUser, name: text })}
              leftIcon={<Ionicons name="person-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
            />
          </View>

          <View style={styles.formRow}>
            <Input
              label="Telefone"
              value={editingUser.phoneNumber || ''}
              onChangeText={(text) => setEditingUser({ ...editingUser, phoneNumber: text })}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
            />
          </View>

          <View style={styles.formRow}>
            <BaseSelect
              label="Role"
              value={editingUser.role}
              options={roleOptions}
              onChange={(value) => setEditingUser({ ...editingUser, role: value as 'USER' | 'ADMIN' })}
            />
          </View>

          <View style={styles.formRow}>
            <Input
              label="Nova Senha (opcional)"
              value={editingUserPassword}
              onChangeText={setEditingUserPassword}
              secureTextEntry
              placeholder="Deixe em branco para não alterar a senha"
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Usuário Ativo</Text>
            <Switch
              value={editingUser.isActive}
              onValueChange={(value) => setEditingUser({ ...editingUser, isActive: value })}
              trackColor={{ false: '#767577', true: '#16a34a' }}
              thumbColor={editingUser.isActive ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              onPress={closeEditModal}
              variant="ghost"
              style={{ flex: 1 }}
            />
            <Button
              title="Salvar"
              onPress={saveUser}
              variant="primary"
              loading={isSaving}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPasswordModal}
        onClose={closePasswordModal}
        type="default"
        title="Alterar Senha"
      >
        <View style={styles.modalContent}>
          <View style={styles.formRow}>
            <Text style={[styles.detailLabel, { marginBottom: 8 }]}>
              Usuário: {selectedUser?.email}
            </Text>
            <Input
              label="Nova Senha"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="A senha deve ter pelo menos 8 caracteres"
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              onPress={closePasswordModal}
              variant="ghost"
              style={{ flex: 1 }}
            />
            <Button
              title="Alterar Senha"
              onPress={changePassword}
              variant="primary"
              loading={isChangingPassword}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        onClose={closeDeleteModal}
        type="confirm"
        title="Deletar Usuário"
        message={`Tem certeza que deseja deletar o usuário ${selectedUser?.email}? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmDeleteUser}
        loading={isDeleting}
      />
    </View>
  );
}
