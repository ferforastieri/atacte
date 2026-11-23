import { secureRandomInt } from '../utils/secureRandom';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  Button,
  Card,
  Header,
  HeroCard,
  Input,
  Modal,
  PasswordGeneratorModal,
  PasswordStrength,
  SkeletonDetail,
  TotpCode,
  passwordScore,
} from '../components/shared';
import { IconTile } from '../components/shared/IconTile';
import { Pill } from '../components/shared/Pill';
import { passwordService } from '../services/passwords/passwordService';
import { totpService } from '../services/totp/totpService';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { radii, spacing, touch, typography } from '../theme/tokens';

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
  customFields?: Array<{ id: string; name: string; value: string }>;
  createdAt: string;
  updatedAt: string;
}

export default function PasswordDetailScreen() {
  const route = useRoute<PasswordDetailRouteProp>();
  const navigation = useNavigation<PasswordDetailNavigationProp>();
  const { passwordId } = route.params;
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();

  const [password, setPassword] = useState<PasswordEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState<{ code: string; timeRemaining: number; period: number } | null>(null);
  const [isLoadingTotp, setIsLoadingTotp] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordGeneratorModal, setShowPasswordGeneratorModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [copyingField, setCopyingField] = useState<string | null>(null);
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

  useEffect(() => {
    void loadPassword();
  }, [passwordId]);

  useEffect(() => {
    if (password?.totpEnabled) {
      void loadTotpCode();
    }
  }, [password?.totpEnabled]);

  const loadPassword = async () => {
    setIsLoading(true);
    try {
      const response = await passwordService.getPassword(passwordId);
      if (response.success && response.data) {
        setPassword(response.data);
      } else {
        showError('Senha não encontrada.');
      }
    } catch {
      showError('Erro ao carregar senha.');
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
      }
    } catch {
      // Keep the TOTP area in its empty state.
    } finally {
      setIsLoadingTotp(false);
    }
  };

  const copyToClipboard = async (text: string | undefined, fieldId: string, successMessage: string) => {
    if (!text || copyingField) return;
    setCopyingField(fieldId);
    try {
      await Clipboard.setStringAsync(text);
      showSuccess(successMessage);
    } catch {
      showError('Não foi possível copiar.');
    } finally {
      setCopyingField(null);
    }
  };

  const toggleFavorite = async () => {
    if (!password || isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      const response = await passwordService.updatePassword(password.id, { isFavorite: !password.isFavorite });
      if (response.success) {
        setPassword((current) => current ? { ...current, isFavorite: !current.isFavorite } : null);
      } else {
        showError('Não foi possível atualizar a favorita.');
      }
    } catch {
      showError('Não foi possível atualizar a favorita.');
    } finally {
      setIsTogglingFavorite(false);
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

  const confirmDeletePassword = async () => {
    if (!password || isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await passwordService.deletePassword(password.id);
      if (response.success) {
        setShowDeleteModal(false);
        showSuccess('Senha excluída.');
        navigation.goBack();
      } else {
        showError('Não foi possível excluir a senha.');
      }
    } catch {
      showError('Não foi possível excluir a senha.');
    } finally {
      setIsDeleting(false);
    }
  };

  const generateTotpSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let index = 0; index < 32; index += 1) secret += chars.charAt(secureRandomInt(chars.length));
    setFormData((current) => ({ ...current, totpSecret: secret }));
  };

  const handleSavePassword = async () => {
    if (!password || isSaving) return;
    if (!formData.name.trim() || !formData.password.trim()) return;

    setIsSaving(true);
    try {
      const passwordData: Record<string, unknown> = {
        name: formData.name.trim(),
        website: formData.website.trim() || undefined,
        username: formData.username.trim() || undefined,
        password: formData.password.trim(),
        folder: formData.folder.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        isFavorite: formData.isFavorite,
        totpEnabled: formData.totpEnabled,
      };
      if (formData.totpEnabled && formData.totpSecret.trim()) passwordData.totpSecret = formData.totpSecret.trim();

      const response = await passwordService.updatePassword(password.id, passwordData);
      if (response.success && response.data) {
        setPassword(response.data);
        setShowEditModal(false);
        showSuccess('Senha atualizada.');
      } else {
        showError('Não foi possível salvar as alterações.');
      }
    } catch {
      showError('Não foi possível salvar as alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Header title="Detalhes da Senha" showBackButton onBack={() => navigation.goBack()} />
        <SkeletonDetail />
      </View>
    );
  }

  if (!password) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Header title="Detalhes da Senha" showBackButton onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.screen }}>
          <Card>
            <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
              <IconTile variant="danger" size={52}>
                <Ionicons name="alert-circle-outline" size={26} color={colors.dangerText} />
              </IconTile>
              <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink }}>Senha não encontrada</Text>
              <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title={password.name}
        subtitle="Detalhes da credencial"
        showBackButton
        onBack={() => navigation.goBack()}
        icon={<Ionicons name="lock-closed-outline" size={22} color={colors.primarySoftText} />}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <HeroCard padding="md" style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text style={{ color: colors.heroMuted, fontSize: typography.caption, fontWeight: typography.weights.semibold, letterSpacing: 0.8 }}>
              SENHA
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                style={{ width: touch.minimum, height: touch.minimum, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setShowPassword((current) => !current)}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.heroMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Copiar senha"
                style={{
                  minHeight: touch.minimum,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.md,
                  backgroundColor: colors.heroBar,
                  opacity: copyingField === 'password' ? 0.6 : 1,
                }}
                onPress={() => copyToClipboard(password.password, 'password', 'Senha copiada.')}
                disabled={copyingField === 'password'}
              >
                {copyingField === 'password' ? (
                  <ActivityIndicator size="small" color={colors.heroText} />
                ) : (
                  <Ionicons name="copy-outline" size={16} color={colors.heroText} />
                )}
                <Text style={{ color: colors.heroText, fontSize: typography.label, fontWeight: typography.weights.semibold }}>Copiar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text
            style={{
              marginTop: spacing.md,
              minHeight: 44,
              color: colors.heroText,
              fontFamily: typography.mono,
              fontSize: 20,
              lineHeight: 30,
              letterSpacing: 1,
            }}
          >
            {showPassword ? password.password : '••••••••••••••••'}
          </Text>

          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.md }}>
            {password.isFavorite ? <Pill label="Favorita" tone="danger" icon={<Ionicons name="heart" size={12} color={colors.dangerText} />} /> : null}
            {password.totpEnabled ? <Pill label="TOTP ativo" tone="info" /> : null}
            {password.folder ? <Pill label={password.folder} /> : null}
          </View>
        </HeroCard>

        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
            <IconTile>
              <Ionicons name="information-circle-outline" size={20} color={colors.primarySoftText} />
            </IconTile>
            <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink }}>Informações</Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            {[
              { label: 'Nome', value: password.name },
              { label: 'Website', value: password.website },
              { label: 'Usuário', value: password.username },
              { label: 'Pasta', value: password.folder },
              { label: 'TOTP', value: password.totpEnabled ? 'Habilitado' : 'Desabilitado' },
            ].filter((row) => row.value).map((row, index, rows) => (
              <View
                key={row.label}
                style={{
                  paddingVertical: spacing.md,
                  borderBottomWidth: index < rows.length - 1 ? 1 : 0,
                  borderBottomColor: colors.line,
                }}
              >
                <Text style={{ fontSize: typography.caption, fontWeight: typography.weights.semibold, letterSpacing: 0.6, color: colors.inkSubtle }}>
                  {row.label.toUpperCase()}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 }}>
                  <Text style={{ flex: 1, fontSize: typography.body, color: colors.ink }}>{row.value}</Text>
                  {row.label === 'Usuário' && password.username ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Copiar usuário"
                      style={{ width: touch.minimum, height: touch.minimum, alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => copyToClipboard(password.username, 'username', 'Usuário copiado.')}
                      disabled={copyingField === 'username'}
                    >
                      {copyingField === 'username' ? (
                        <ActivityIndicator size="small" color={colors.inkMuted} />
                      ) : (
                        <Ionicons name="copy-outline" size={17} color={colors.inkMuted} />
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {password.totpEnabled ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
              <IconTile>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.primarySoftText} />
              </IconTile>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink }}>Código 2FA</Text>
                <Text style={{ fontSize: typography.label, color: colors.inkMuted }}>Renovado a cada 30 segundos</Text>
              </View>
            </View>
            {isLoadingTotp ? (
              <View style={{ backgroundColor: colors.hero, borderRadius: radii['2xl'], padding: spacing.xl, gap: spacing.sm }}>
                <View style={{ height: 10, width: '32%', borderRadius: radii.sm, backgroundColor: colors.heroBar }} />
                <View style={{ height: 34, width: '70%', borderRadius: radii.sm, backgroundColor: colors.heroBar }} />
                <View style={{ height: 6, width: '100%', borderRadius: radii.pill, backgroundColor: colors.heroBar }} />
              </View>
            ) : totpCode ? (
              <TotpCode
                code={totpCode.code}
                timeRemaining={totpCode.timeRemaining}
                period={totpCode.period}
                onRefresh={loadTotpCode}
                onCopy={() => showSuccess('Código copiado.')}
              />
            ) : (
              <Button title="Carregar código" variant="secondary" onPress={loadTotpCode} loading={isLoadingTotp} />
            )}
          </Card>
        ) : null}

        {password.notes ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
              <IconTile>
                <Ionicons name="document-text-outline" size={20} color={colors.primarySoftText} />
              </IconTile>
              <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink }}>Notas</Text>
            </View>
            <Text style={{ fontSize: typography.body, lineHeight: 22, color: colors.inkMuted }}>{password.notes}</Text>
          </Card>
        ) : null}

        {password.customFields && password.customFields.length > 0 ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
              <IconTile>
                <Ionicons name="options-outline" size={20} color={colors.primarySoftText} />
              </IconTile>
              <Text style={{ fontSize: typography.title, fontWeight: typography.weights.semibold, color: colors.ink }}>Campos Personalizados</Text>
            </View>
            {password.customFields.map((field, index, fields) => (
              <View
                key={field.id}
                style={{
                  paddingVertical: spacing.md,
                  borderBottomWidth: index < fields.length - 1 ? 1 : 0,
                  borderBottomColor: colors.line,
                }}
              >
                <Text style={{ fontSize: typography.caption, fontWeight: typography.weights.semibold, color: colors.inkSubtle }}>{field.name.toUpperCase()}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 }}>
                  <Text style={{ flex: 1, fontFamily: typography.mono, fontSize: typography.body, color: colors.ink }}>{field.value}</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Copiar ${field.name}`}
                    style={{ width: touch.minimum, height: touch.minimum, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => copyToClipboard(field.value, field.id, 'Campo copiado.')}
                    disabled={copyingField === field.id}
                  >
                    {copyingField === field.id ? (
                      <ActivityIndicator size="small" color={colors.inkMuted} />
                    ) : (
                      <Ionicons name="copy-outline" size={17} color={colors.inkMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button title="Editar" onPress={handleEditPassword} style={{ flex: 1 }} />
          <Button
            title={password.isFavorite ? 'Favorita' : 'Favoritar'}
            onPress={toggleFavorite}
            loading={isTogglingFavorite}
            disabled={isTogglingFavorite}
            variant={password.isFavorite ? 'subtle' : 'secondary'}
            style={{ flex: 1 }}
            icon={!isTogglingFavorite ? <Ionicons name={password.isFavorite ? 'heart' : 'heart-outline'} size={16} color={password.isFavorite ? colors.primarySoftText : colors.inkMuted} /> : undefined}
          />
          <Button title="Excluir" onPress={() => setShowDeleteModal(true)} variant="danger" style={{ flex: 1 }} disabled={isDeleting} />
        </View>
      </ScrollView>

      <Modal
        visible={showEditModal}
        onClose={() => {
          if (isSaving) return;
          setShowEditModal(false);
        }}
        title="Editar Senha"
        subtitle="Atualize os dados da credencial"
        icon={<Ionicons name="create-outline" size={22} color={colors.primarySoftText} />}
        size="lg"
        footer={(
          <>
            <Button title="Cancelar" onPress={() => setShowEditModal(false)} variant="ghost" style={{ flex: 1 }} disabled={isSaving} />
            <Button
              title="Atualizar"
              onPress={handleSavePassword}
              loading={isSaving}
              disabled={isSaving || !formData.name.trim() || !formData.password.trim()}
              style={{ flex: 1 }}
            />
          </>
        )}
      >
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
            style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: colors.primarySoft }}
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
        onPasswordGenerated={(generatedPassword) => setFormData((current) => ({ ...current, password: generatedPassword }))}
        initialPassword={formData.password}
      />

      <Modal
        visible={showDeleteModal}
        onClose={() => {
          if (isDeleting) return;
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
