import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card, Header, Button, SkeletonLoader } from '../components/shared';
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
}

interface ProfileStats {
  totalPasswords: number;
  favoritePasswords: number;
  totpPasswords: number;
}

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const navigation = useNavigation();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalPasswords: 0,
    favoritePasswords: 0,
    totpPasswords: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
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
        const favoritePasswords = passwords.filter((p: any) => p.isFavorite).length;
        const totpPasswords = passwords.filter((p: any) => p.totpEnabled).length;
        
        setStats({
          totalPasswords: passwords.length,
          favoritePasswords,
          totpPasswords,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      padding: 20,
      paddingTop: 60,
    },
    profileCard: {
      marginBottom: 20,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#22c55e',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
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
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#f9fafb' : '#111827',
      marginLeft: 12,
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
        <View style={styles.content}>
          <SkeletonLoader />
        </View>
      </View>
    );
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <Header title="Perfil" onThemeToggle={toggleTheme} />
      <ScrollView style={styles.content}>
        {/* Profile Info */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profileData?.name ? getInitials(profileData.name) : (profileData?.email ? getInitials(profileData.email) : 'U')}
              </Text>
            </View>
            <Text style={styles.userName}>
              {profileData?.name || profileData?.email?.split('@')[0] || 'Usuário'}
            </Text>
            <Text style={styles.userEmail}>
              {profileData?.email || 'N/A'}
            </Text>
          </View>

          <View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profileData?.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{profileData?.phoneNumber || 'Não informado'}</Text>
            </View>
          </View>
        </Card>

        {/* Statistics */}
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

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Settings' as never)}
        >
            <Ionicons name="settings-outline" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={styles.actionButtonText}>Configurações</Text>
          </TouchableOpacity>
        </Card>

      </ScrollView>
    </View>
  );
}
