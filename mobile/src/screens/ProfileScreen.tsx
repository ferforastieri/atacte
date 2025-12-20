import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/AppNavigator';
import { Card, Header, Button, SkeletonLoader, Modal } from '../components/shared';
import { useAuth } from '../contexts/AuthContext';
import { passwordService } from '../services/passwords/passwordService';
import { userService } from '../services/users/userService';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/useToast';

interface User {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  isActive?: boolean;
  role?: 'USER' | 'ADMIN';
}

interface ProfileStats {
  totalPasswords: number;
  favoritePasswords: number;
  totpPasswords: number;
}

type ProfileScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Profile'>;

export default function ProfileScreen() {
  const { user, logout, refreshUser, isAdmin } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalPasswords: 0,
    favoritePasswords: 0,
    totpPasswords: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { showError } = useToast();

  useEffect(() => {
    loadProfileData();
    loadStats();
  }, []);

 
  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      const response = await userService.getUserProfile();
      if (response.success && response.data) {
        setProfileData(response.data);
      }
    } catch (error) {
      showError('Erro ao carregar dados do perfil');
     
      setProfileData(user);
    }
  };

  const loadStats = async () => {
    try {
      const response = await passwordService.getPasswords({ limit: 1000 });
      
      if (response.success && response.data) {
        const passwords = Array.isArray(response.data) ? response.data : [];
        const favoritePasswords = passwords.filter((p: { isFavorite?: boolean }) => p.isFavorite).length;
        const totpPasswords = passwords.filter((p: { totpEnabled?: boolean }) => p.totpEnabled).length;
        
        setStats({
          totalPasswords: passwords.length,
          favoritePasswords,
          totpPasswords,
        });
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await logout();
    setShowLogoutModal(false);
  };

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
      paddingBottom: 24,
    },
    profileCard: {
      marginBottom: 20,
    },
    profileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    profileHeaderLeft: {
      flex: 1,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#22c55e',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    userName: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
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
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#f9fafb' : '#111827',
    },
    statsCard: {
      marginBottom: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#22c55e',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      textAlign: 'center',
    },
    actionsCard: {
      marginBottom: 20,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      marginBottom: 12,
      minHeight: 56,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#f9fafb' : '#111827',
      marginLeft: 12,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#22c55e',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginTop: 20,
      gap: 8,
    },
    editButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    logoutButton: {
    },
    logoutButtonText: {
      color: isDark ? '#f9fafb' : '#111827',
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
        <Header title="Perfil" onThemeToggle={toggleTheme} />
        <SkeletonLoader variant="profile" />
      </View>
    );
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <Header title="Perfil" onThemeToggle={toggleTheme} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileHeaderLeft}>
              <Text style={styles.userName}>
                {profileData?.name || profileData?.email?.split('@')[0] || 'Usuário'}
              </Text>
              <Text style={styles.userEmail}>
                {profileData?.email || 'N/A'}
              </Text>
            </View>
            {profileData?.profilePicture ? (
              <Image 
                source={{ uri: profileData.profilePicture }} 
                style={styles.avatarImage}
                defaultSource={require('../../assets/logo.png')}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profileData?.name ? getInitials(profileData.name) : (profileData?.email ? getInitials(profileData.email) : 'U')}
                </Text>
              </View>
            )}
          </View>

          <View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">{profileData?.id || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profileData?.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{profileData?.name || 'Não informado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{profileData?.phoneNumber || 'Não informado'}</Text>
            </View>
            {profileData?.role && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Função</Text>
                <Text style={styles.infoValue}>{profileData.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: profileData?.isActive ? '#22c55e' : '#ef4444' }]} />
                <Text style={styles.infoValue}>{profileData?.isActive ? 'Ativo' : 'Inativo'}</Text>
              </View>
            </View>
            {profileData?.createdAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Data de Criação</Text>
                <Text style={styles.infoValue}>
                  {new Date(profileData.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}
            {profileData?.lastLogin && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Último Login</Text>
                <Text style={styles.infoValue}>
                  {new Date(profileData.lastLogin).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}
            {profileData?.updatedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Última Atualização</Text>
                <Text style={styles.infoValue}>
                  {new Date(profileData.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color="#ffffff" />
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        </Card>

        {}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalPasswords}</Text>
              <Text style={styles.statLabel}>Total de Senhas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.favoritePasswords}</Text>
              <Text style={styles.statLabel}>Favoritas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totpPasswords}</Text>
              <Text style={styles.statLabel}>Com TOTP</Text>
            </View>
          </View>
        </Card>

        {isAdmin && (
          <Card style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Administração</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AuditLogs')}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={styles.actionButtonText}>Logs de Auditoria</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Sessions')}
              activeOpacity={0.7}
            >
              <Ionicons name="desktop-outline" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={styles.actionButtonText}>Sessões</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Users')}
              activeOpacity={0.7}
            >
              <Ionicons name="people-outline" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={styles.actionButtonText}>Usuários</Text>
            </TouchableOpacity>
          </Card>
        )}

        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={styles.actionButtonText}>Configurações</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton, { marginBottom: 0 }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="exit-outline" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Sair</Text>
          </TouchableOpacity>
        </Card>

      </ScrollView>

      <Modal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        type="confirm"
        title="Confirmar Logout"
        message="Tem certeza que deseja sair?"
        confirmText="Sair"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmLogout}
      />
    </View>
  );
}
