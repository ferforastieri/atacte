import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../shared/Card';
import { IconTile } from '../shared/IconTile';
import { Pill } from '../shared/Pill';
import { Skeleton } from '../shared/Skeleton';
import { TotpCode } from './TotpCode';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing, touch, typography } from '../../theme/tokens';
import { totpService } from '../../services/totp/totpService';

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

interface TotpCardProps {
  password: PasswordEntry;
  isNew?: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onCopyPassword: () => void;
  onCopyUsername: () => void;
  isCopyingPassword?: boolean;
  isCopyingUsername?: boolean;
  isTogglingFavorite?: boolean;
  isDeleting?: boolean;
}

export const TotpCard: React.FC<TotpCardProps> = ({
  password,
  isNew = false,
  onPress,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyPassword,
  onCopyUsername,
  isCopyingPassword = false,
  isCopyingUsername = false,
  isTogglingFavorite = false,
  isDeleting = false,
}) => {
  const { colors } = useTheme();
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [isLoadingTotp, setIsLoadingTotp] = useState(false);

  useEffect(() => {
    let active = true;
    if (!password.totpEnabled) {
      setTotpSecret(null);
      return undefined;
    }
    setIsLoadingTotp(true);
    totpService.getTotpSecret(password.id)
      .then((response) => {
        if (active && response.success && response.data?.secret) {
          setTotpSecret(response.data.secret);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsLoadingTotp(false);
      });
    return () => {
      active = false;
    };
  }, [password.id, password.totpEnabled]);

  const actionButton = (
    label: string,
    ionicon: keyof typeof Ionicons.glyphMap,
    onAction: () => void,
    options?: { color?: string; background?: string; busy?: boolean },
  ) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: touch.minimum,
        height: touch.minimum,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: options?.background || colors.surfaceMuted,
        opacity: options?.busy ? 0.55 : 1,
      }}
      onPress={onAction}
      disabled={options?.busy}
      activeOpacity={0.75}
    >
      {options?.busy ? (
        <ActivityIndicator size="small" color={options?.color || colors.inkMuted} />
      ) : (
        <Ionicons name={ionicon} size={18} color={options?.color || colors.inkMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <Card
      style={{
        marginBottom: spacing.md,
        borderColor: isNew ? colors.primary : colors.line,
        borderWidth: isNew ? 2 : 1,
      }}
    >
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Abrir ${password.name}`} onPress={onPress} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
          <IconTile>
            <Ionicons name="lock-closed-outline" size={20} color={colors.primarySoftText} />
          </IconTile>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Text numberOfLines={1} style={{ flexShrink: 1, color: colors.ink, fontSize: typography.bodyLarge, fontWeight: typography.weights.semibold }}>
                {password.name}
              </Text>
              {isNew ? <Pill label="NOVA" tone="accent" /> : null}
              {password.isFavorite ? (
                <Ionicons name="heart" size={15} color={colors.danger} />
              ) : null}
            </View>
            {password.website ? (
              <Text numberOfLines={1} style={{ marginTop: 3, color: colors.inkMuted, fontSize: typography.body }}>
                {password.website}
              </Text>
            ) : null}
            {password.username ? (
              <Text numberOfLines={1} style={{ marginTop: 1, color: colors.inkSubtle, fontSize: typography.label }}>
                {password.username}
              </Text>
            ) : null}
            {password.folder ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm }}>
                <Pill label={password.folder} icon={<Ionicons name="folder-outline" size={12} color={colors.inkMuted} />} />
              </View>
            ) : null}
          </View>

          {password.totpEnabled ? (
            <Pill label="TOTP" tone="info" style={{ flexShrink: 0 }} icon={<Ionicons name="shield-checkmark-outline" size={12} color={colors.infoText} />} />
          ) : null}
        </View>
      </TouchableOpacity>

      {password.totpEnabled ? (
        <View style={{ marginTop: spacing.md }}>
          {isLoadingTotp ? (
            <View style={{ backgroundColor: colors.hero, borderRadius: radii['2xl'], padding: spacing.xl, gap: spacing.sm }}>
              <Skeleton width="34%" height={10} />
              <Skeleton width="66%" height={32} />
              <Skeleton width="100%" height={6} />
            </View>
          ) : (
            <TotpCode secret={totpSecret || undefined} />
          )}
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        {actionButton('Excluir senha', 'trash-outline', onDelete, { color: colors.dangerText, busy: isDeleting })}
        {actionButton('Editar senha', 'create-outline', onEdit)}
        {password.username ? actionButton('Copiar usuário', 'person-outline', onCopyUsername, { busy: isCopyingUsername }) : null}
        {actionButton(
          password.isFavorite ? 'Remover das favoritas' : 'Marcar como favorita',
          password.isFavorite ? 'heart' : 'heart-outline',
          onToggleFavorite,
          { color: password.isFavorite ? colors.danger : colors.inkMuted, busy: isTogglingFavorite },
        )}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Copiar senha"
          onPress={onCopyPassword}
          disabled={isCopyingPassword}
          activeOpacity={0.8}
          style={{
            flex: 1,
            minHeight: touch.minimum,
            borderRadius: radii.md,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
            opacity: isCopyingPassword ? 0.6 : 1,
          }}
        >
          {isCopyingPassword ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Ionicons name="copy-outline" size={16} color={colors.onPrimary} />
          )}
          <Text style={{ color: colors.onPrimary, fontSize: typography.label, fontWeight: typography.weights.semibold }}>
            Copiar senha
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};
