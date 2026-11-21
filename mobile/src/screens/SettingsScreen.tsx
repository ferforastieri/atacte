import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Button, Card, Header, Input, Modal, SkeletonDetail } from '../components/shared';
import { IconTile } from '../components/shared/IconTile';
import { useBiometricLock } from '../components/auth/BiometricLock';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { userService } from '../services/users/userService';
import { radii, spacing, touch, typography } from '../theme/tokens';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { enabled, changeEnabled } = useBiometricLock();
  const { isDark, colors, toggleTheme } = useTheme();
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isChangingBiometric, setIsChangingBiometric] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  const handleBack = () => {
    if ('jumpTo' in navigation) {
      (navigation as { jumpTo: (screen: string) => void }).jumpTo('Profile');
    }
  };

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
    void loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsProfileLoading(true);
    try {
      const response = await userService.getUserProfile();
      if (response.success && response.data) {
        setName(response.data.name || '');
        setPhoneNumber(response.data.phoneNumber || '');
        setProfilePicture(response.data.profilePicture || '');
      }
    } catch {
      if (user) {
        setName(user.name || '');
        setPhoneNumber(user.phoneNumber || '');
        setProfilePicture(user.profilePicture || '');
      }
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (isLoading || !name.trim()) return;

    setIsLoading(true);
    try {
      const response = await userService.updateUserProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        profilePicture: profilePicture.trim() || undefined,
      });
      if (response.success) {
        await refreshUser();
        showSuccess('Perfil atualizado.');
      } else {
        showError('Não foi possível salvar o perfil.');
      }
    } catch {
      showError('Não foi possível salvar o perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestImagePickerPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const handlePickImage = () => {
    if (!isUploadingImage) setShowImagePickerModal(true);
  };

  const handleCameraPick = async () => {
    setShowImagePickerModal(false);
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return;

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) await handleImageSelected(result.assets[0].uri);
  };

  const handleGalleryPick = async () => {
    setShowImagePickerModal(false);
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) await handleImageSelected(result.assets[0].uri);
  };

  const handleImageSelected = async (uri: string) => {
    setIsUploadingImage(true);
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) return;

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const extension = uri.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'gif') mimeType = 'image/gif';
      else if (extension === 'webp') mimeType = 'image/webp';

      setProfilePicture(`data:${mimeType};base64,${base64}`);
    } catch {
      showError('Não foi possível processar a imagem.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleBiometricChange = async (value: boolean) => {
    if (isChangingBiometric) return;
    setIsChangingBiometric(true);
    try {
      await changeEnabled(value);
    } catch (error) {
      Alert.alert('Biometria', error instanceof Error ? error.message : 'Não foi possível alterar a opção.');
    } finally {
      setIsChangingBiometric(false);
    }
  };

  if (isProfileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Header title="Configurações" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
        <SkeletonDetail showSecret={false} />
      </View>
    );
  }

  const settingRow = (
    label: string,
    description: string,
    control: React.ReactNode,
    icon: keyof typeof Ionicons.glyphMap,
  ) => (
    <View style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
      <IconTile variant="muted" size={38}>
        <Ionicons name={icon} size={19} color={colors.inkMuted} />
      </IconTile>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: typography.body, fontWeight: typography.weights.medium, color: colors.ink }}>{label}</Text>
        <Text style={{ marginTop: 1, fontSize: typography.label, lineHeight: 17, color: colors.inkMuted }}>{description}</Text>
      </View>
      {control}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title="Configurações"
        subtitle="Perfil, segurança e aparência"
        showBackButton
        onBack={handleBack}
        onThemeToggle={toggleTheme}
        icon={<Ionicons name="settings-outline" size={22} color={colors.primarySoftText} />}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.md }}>
            Perfil
          </Text>

          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <View style={{ position: 'relative' }}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={{ width: 96, height: 96, borderRadius: radii['2xl'] }} />
              ) : (
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: radii['2xl'],
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 32, fontWeight: typography.weights.bold, color: colors.primarySoftText }}>
                    {(name || user?.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Trocar foto"
                style={{
                  position: 'absolute',
                  right: -6,
                  bottom: -6,
                  width: touch.minimum,
                  height: touch.minimum,
                  borderRadius: 22,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.surface,
                  opacity: isUploadingImage ? 0.6 : 1,
                }}
                onPress={handlePickImage}
                disabled={isUploadingImage}
              >
                <Ionicons name={isUploadingImage ? 'hourglass-outline' : 'camera-outline'} size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={{ marginTop: spacing.sm, fontSize: typography.label, color: colors.inkMuted }}>
              {isUploadingImage ? 'Processando imagem...' : 'Toque para trocar a foto'}
            </Text>
            {profilePicture ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Remover foto"
                style={{ marginTop: spacing.sm, minHeight: 44, justifyContent: 'center' }}
                onPress={() => setProfilePicture('')}
                disabled={isUploadingImage}
              >
                <Text style={{ fontSize: typography.label, fontWeight: typography.weights.semibold, color: colors.dangerText }}>Remover foto</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Input
            label="Nome"
            placeholder="Digite seu nome"
            value={name}
            onChangeText={setName}
            disabled={isLoading}
          />
          <Input
            label="Telefone"
            placeholder="Digite seu telefone"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            disabled={isLoading}
          />

          <Button
            title="Salvar"
            onPress={handleSaveProfile}
            loading={isLoading}
            disabled={isLoading || !name.trim()}
            icon={!isLoading ? <Ionicons name="checkmark" size={18} color={colors.onPrimary} /> : undefined}
          />
        </Card>

        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.sm }}>
            Segurança
          </Text>
          {settingRow(
            'Desbloquear com biometria',
            'Bloqueia este aplicativo ao abrir ou voltar para ele.',
            <Switch
              value={enabled}
              onValueChange={(value) => { void handleBiometricChange(value); }}
              trackColor={{ false: colors.lineStrong, true: colors.primary }}
              thumbColor={colors.onPrimary}
              disabled={isChangingBiometric}
            />,
            'finger-print-outline',
          )}
          <Text style={{ fontSize: typography.label, lineHeight: 17, color: colors.inkMuted }}>
            Você também pode desbloquear com a senha da conta.
          </Text>
        </Card>

        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.sm }}>
            Aparência
          </Text>
          {settingRow(
            'Modo Escuro',
            'Alterna entre o tema claro e o escuro.',
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.lineStrong, true: colors.primary }}
              thumbColor={colors.onPrimary}
            />,
            isDark ? 'moon-outline' : 'sunny-outline',
          )}
        </Card>

        <Card>
          <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.sm }}>
            Sobre
          </Text>
          {settingRow(
            'Versão do App',
            'Atacte mobile',
            <Text style={{ fontSize: typography.body, color: colors.inkMuted }}>
              {Constants.expoConfig?.version || (typeof Constants.expoConfig?.runtimeVersion === 'string' ? Constants.expoConfig.runtimeVersion : 'N/A')}
            </Text>,
            'information-circle-outline',
          )}
        </Card>
      </ScrollView>

      <Modal
        visible={showImagePickerModal}
        onClose={() => setShowImagePickerModal(false)}
        title="Selecionar Foto"
        subtitle="Escolha a origem da imagem"
        icon={<Ionicons name="camera-outline" size={22} color={colors.primarySoftText} />}
        size="sm"
      >
        <TouchableOpacity
          accessibilityRole="button"
          style={{
            minHeight: 56,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.sm,
            borderRadius: radii.lg,
            backgroundColor: colors.surfaceMuted,
          }}
          onPress={handleCameraPick}
        >
          <Ionicons name="camera-outline" size={22} color={colors.primaryText} />
          <Text style={{ fontSize: typography.body, fontWeight: typography.weights.medium, color: colors.ink }}>Câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={{
            minHeight: 56,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingHorizontal: spacing.lg,
            borderRadius: radii.lg,
            backgroundColor: colors.surfaceMuted,
          }}
          onPress={handleGalleryPick}
        >
          <Ionicons name="images-outline" size={22} color={colors.primaryText} />
          <Text style={{ fontSize: typography.body, fontWeight: typography.weights.medium, color: colors.ink }}>Galeria</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default SettingsScreen;
