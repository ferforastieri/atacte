import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Button, Card, Header, HeroCard, Modal, SkeletonLoader } from '../components/shared';
import { IconTile } from '../components/shared/IconTile';
import { Pill } from '../components/shared/Pill';
import { useAuth } from '../contexts/AuthContext';
import { passwordService } from '../services/passwords/passwordService';
import { userService } from '../services/users/userService';
import { useTheme } from '../contexts/ThemeContext';
import { MainTabParamList } from '../navigation/AppNavigator';
import { radii, spacing, typography } from '../theme/tokens';

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
  const { user, logout, isAdmin } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ totalPasswords: 0, favoritePasswords: 0, totpPasswords: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    void loadProfileData();
    void loadStats();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadProfileData();
    }, []),
  );

  const loadProfileData = async () => {
    try {
      const response = await userService.getUserProfile();
      if (response.success && response.data) setProfileData(response.data);
    } catch {
      setProfileData(user);
    }
  };

  const loadStats = async () => {
    try {
      const response = await passwordService.getPasswords({ limit: 1000 });
      if (response.success && response.data) {
        const passwords = Array.isArray(response.data) ? response.data : [];
        setStats({
          totalPasswords: passwords.length,
          favoritePasswords: passwords.filter((entry: { isFavorite?: boolean }) => entry.isFavorite).length,
          totpPasswords: passwords.filter((entry: { totpEnabled?: boolean }) => entry.totpEnabled).length,
        });
      }
    } catch {
      // Keep the empty stat values.
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Header title="Perfil" onThemeToggle={toggleTheme} icon={<Ionicons name="person-outline" size={22} color={colors.primarySoftText} />} />
        <SkeletonLoader variant="profile" />
      </View>
    );
  }

  const getInitials = (value?: string) => {
    if (!value) return 'U';
    const parts = value.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
    return value.charAt(0).toUpperCase();
  };

  const actionRow = (label: string, ionicon: keyof typeof Ionicons.glyphMap, onPress: () => void, tone: 'default' | 'danger' = 'default') => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: tone === 'danger' ? colors.dangerSoft : colors.surfaceMuted,
      }}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <IconTile variant={tone === 'danger' ? 'danger' : 'muted'} size={38}>
        <Ionicons name={ionicon} size={19} color={tone === 'danger' ? colors.dangerText : colors.inkMuted} />
      </IconTile>
      <Text style={{ flex: 1, fontSize: typography.body, fontWeight: typography.weights.medium, color: tone === 'danger' ? colors.dangerText : colors.ink }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.inkSubtle} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title="Perfil"
        subtitle="Sua conta e o resumo do cofre"
        onThemeToggle={toggleTheme}
        icon={<Ionicons name="person-outline" size={22} color={colors.primarySoftText} />}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <HeroCard padding="md" style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            {profileData?.profilePicture ? (
              <Image source={{ uri: profileData.profilePicture }} style={{ width: 72, height: 72, borderRadius: radii.xl }} />
            ) : (
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: radii.xl,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.heroBar,
                  borderWidth: 1,
                  borderColor: colors.heroBorder,
                }}
              >
                <Text style={{ color: colors.heroText, fontSize: 24, fontWeight: typography.weights.bold }}>
                  {getInitials(profileData?.name || profileData?.email)}
                </Text>
              </View>
            )}

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: colors.heroText, fontSize: typography.headline, fontWeight: typography.weights.semibold }}>
                {profileData?.name || profileData?.email?.split('@')[0] || 'Usuário'}
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 3, color: colors.heroMuted, fontSize: typography.body }}>
                {profileData?.email || 'N/A'}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <Pill label={profileData?.role === 'ADMIN' ? 'Administrador' : 'Usuário'} tone="accent" />
                <Pill label={profileData?.isActive === false ? 'Inativo' : 'Ativo'} tone={profileData?.isActive === false ? 'danger' : 'success'} />
              </View>
            </View>
          </View>
        </HeroCard>

        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.md }}>Informações Pessoais</Text>
          <View style={{ gap: spacing.sm }}>
            {[
              { label: 'ID', value: profileData?.id || 'N/A', mono: true },
              { label: 'Email', value: profileData?.email || 'N/A' },
              { label: 'Nome', value: profileData?.name || 'Não informado' },
              { label: 'Telefone', value: profileData?.phoneNumber || 'Não informado' },
              { label: 'Função', value: profileData?.role === 'ADMIN' ? 'Administrador' : 'Usuário' },
            ].map((row) => (
              <View key={row.label} style={{ padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }}>
                <Text style={{ fontSize: typography.caption, fontWeight: typography.weights.semibold, letterSpacing: 0.6, color: colors.inkSubtle }}>{row.label.toUpperCase()}</Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={{ marginTop: 3, fontSize: typography.body, color: colors.ink, fontFamily: row.mono ? typography.mono : undefined }}
                >
                  {row.value}
                </Text>
              </View>
            ))}
            <View style={{ padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }}>
              <Text style={{ fontSize: typography.caption, fontWeight: typography.weights.semibold, letterSpacing: 0.6, color: colors.inkSubtle }}>STATUS</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: profileData?.isActive ? colors.success : colors.danger }} />
                <Text style={{ fontSize: typography.body, color: colors.ink }}>{profileData?.isActive ? 'Ativo' : 'Inativo'}</Text>
              </View>
            </View>
            {profileData?.createdAt ? (
              <View style={{ padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }}>
                <Text style={{ fontSize: typography.caption, fontWeight: typography.weights.semibold, letterSpacing: 0.6, color: colors.inkSubtle }}>DATA DE CRIAÇÃO</Text>
                <Text style={{ marginTop: 3, fontSize: typography.body, color: colors.ink }}>{new Date(profileData.createdAt).toLocaleString('pt-BR')}</Text>
              </View>
            ) : null}
            {profileData?.lastLogin ? (
              <View style={{ padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }}>
                <Text style={{ fontSize: typography.caption, fontWeight: typography.weights.semibold, letterSpacing: 0.6, color: colors.inkSubtle }}>ÚLTIMO LOGIN</Text>
                <Text style={{ marginTop: 3, fontSize: typography.body, color: colors.ink }}>{new Date(profileData.lastLogin).toLocaleString('pt-BR')}</Text>
              </View>
            ) : null}
          </View>

          <Button
            title="Editar Perfil"
            onPress={() => navigation.navigate('Settings')}
            style={{ marginTop: spacing.lg }}
            icon={<Ionicons name="create-outline" size={18} color={colors.onPrimary} />}
          />
        </Card>

        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.md }}>Estatísticas</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[
              { value: stats.totalPasswords, label: 'Total de Senhas', color: colors.primaryText },
              { value: stats.favoritePasswords, label: 'Favoritas', color: colors.danger },
              { value: stats.totpPasswords, label: 'Com TOTP', color: colors.info },
            ].map((stat) => (
              <View key={stat.label} style={{ flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surfaceMuted }}>
                <Text style={{ fontSize: 24, fontWeight: typography.weights.bold, color: stat.color }}>{stat.value}</Text>
                <Text style={{ marginTop: 3, fontSize: typography.caption, color: colors.inkMuted, textAlign: 'center' }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {isAdmin ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.md }}>Administração</Text>
            <View style={{ gap: spacing.sm }}>
              {actionRow('Logs de Auditoria', 'document-text-outline', () => navigation.navigate('AuditLogs'))}
              {actionRow('Sessões', 'desktop-outline', () => navigation.navigate('Sessions'))}
              {actionRow('Usuários', 'people-outline', () => navigation.navigate('Users'))}
            </View>
          </Card>
        ) : null}

        <Card>
          <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.md }}>Ações</Text>
          <View style={{ gap: spacing.sm }}>
            {actionRow('Configurações', 'settings-outline', () => navigation.navigate('Settings'))}
            {actionRow('Sair', 'exit-outline', () => setShowLogoutModal(true), 'danger')}
          </View>
        </Card>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        onClose={() => {
          if (isLoggingOut) return;
          setShowLogoutModal(false);
        }}
        title="Confirmar Logout"
        type="confirm"
        message="Tem certeza que deseja sair?"
        confirmText="Sair"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmLogout}
        loading={isLoggingOut}
      />
    </View>
  );
}
