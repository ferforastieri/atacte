import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../shared/Card';
import { IconTile } from '../shared/IconTile';
import { Pill } from '../shared/Pill';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing, touch, typography } from '../../theme/tokens';

interface SecureNote {
  id: string;
  title: string;
  content: string;
  folder?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SecureNoteCardProps {
  note: SecureNote;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onView: () => void;
  isTogglingFavorite?: boolean;
  isDeleting?: boolean;
}

export const SecureNoteCard: React.FC<SecureNoteCardProps> = ({
  note,
  onPress,
  onEdit,
  onDelete,
  onToggleFavorite,
  onView,
  isTogglingFavorite = false,
  isDeleting = false,
}) => {
  const { colors } = useTheme();

  const smallAction = (label: string, ionicon: keyof typeof Ionicons.glyphMap, onPress: () => void, color?: string, busy = false) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy }}
      style={{
        width: touch.minimum,
        height: touch.minimum,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceMuted,
        opacity: busy ? 0.55 : 1,
      }}
      onPress={onPress}
      disabled={busy}
      activeOpacity={0.75}
    >
      {busy ? <ActivityIndicator size="small" color={color || colors.inkMuted} /> : <Ionicons name={ionicon} size={18} color={color || colors.inkMuted} />}
    </TouchableOpacity>
  );

  return (
    <Card style={{ marginBottom: spacing.md }}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Abrir nota ${note.title}`} onPress={onPress} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
          <IconTile>
            <Ionicons name="document-text-outline" size={20} color={colors.primarySoftText} />
          </IconTile>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text numberOfLines={1} style={{ flex: 1, color: colors.ink, fontSize: typography.bodyLarge, fontWeight: typography.weights.semibold }}>
                {note.title}
              </Text>
              {note.isFavorite ? <Ionicons name="star" size={15} color={colors.warning} /> : null}
            </View>
            <Text numberOfLines={3} style={{ marginTop: spacing.xs, color: colors.inkMuted, fontSize: typography.body, lineHeight: 20 }}>
              {note.content}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm }}>
              {note.folder ? <Pill label={note.folder} icon={<Ionicons name="folder-outline" size={12} color={colors.inkMuted} />} /> : null}
              <Pill label={new Date(note.updatedAt).toLocaleDateString('pt-BR')} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

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
        {smallAction('Excluir nota', 'trash-outline', onDelete, colors.dangerText, isDeleting)}
        {smallAction('Editar nota', 'create-outline', onEdit)}
        {smallAction(
          note.isFavorite ? 'Remover das favoritas' : 'Marcar como favorita',
          note.isFavorite ? 'star' : 'star-outline',
          onToggleFavorite,
          note.isFavorite ? colors.warning : colors.inkMuted,
          isTogglingFavorite,
        )}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Ver nota"
          style={{
            flex: 1,
            minHeight: touch.minimum,
            borderRadius: radii.md,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
          }}
          onPress={onView}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={16} color={colors.onPrimary} />
          <Text style={{ color: colors.onPrimary, fontSize: typography.label, fontWeight: typography.weights.semibold }}>
            Ver nota
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};
