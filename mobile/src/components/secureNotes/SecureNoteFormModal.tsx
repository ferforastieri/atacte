import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Button, Input } from '../shared';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';

interface SecureNoteFormData {
  title: string;
  content: string;
  folder: string;
  isFavorite: boolean;
}

interface SecureNoteFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: SecureNoteFormData;
  onFormDataChange: (data: Partial<SecureNoteFormData>) => void;
  folders: string[];
  isEditing: boolean;
  isLoading: boolean;
}

export const SecureNoteFormModal: React.FC<SecureNoteFormModalProps> = ({
  visible,
  onClose,
  onSave,
  formData,
  onFormDataChange,
  folders,
  isEditing,
  isLoading,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Editar Nota' : 'Nova Nota'}
      subtitle={isEditing ? 'Atualize o conteúdo da nota' : 'Escreva algo que só você deve ler'}
      icon={<Ionicons name="document-text-outline" size={22} color={colors.primarySoftText} />}
      size="lg"
      footer={(
        <>
          <Button title="Cancelar" onPress={onClose} variant="ghost" style={{ flex: 1 }} disabled={isLoading} />
          <Button
            title={isEditing ? 'Salvar' : 'Criar'}
            onPress={onSave}
            variant="primary"
            loading={isLoading}
            disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
            style={{ flex: 1 }}
          />
        </>
      )}
    >
      <Input
        label="Título *"
        placeholder="Digite o título da nota"
        value={formData.title}
        onChangeText={(text) => onFormDataChange({ title: text })}
        disabled={isLoading}
      />

      <Input
        label="Conteúdo *"
        placeholder="Digite o conteúdo da nota"
        value={formData.content}
        onChangeText={(text) => onFormDataChange({ content: text })}
        disabled={isLoading}
        multiline
        numberOfLines={10}
        inputStyle={{ minHeight: 240 }}
      />

      <Input
        label="Pasta (opcional)"
        placeholder="Digite o nome da pasta"
        value={formData.folder}
        onChangeText={(text) => onFormDataChange({ folder: text })}
        disabled={isLoading}
      />

      {folders.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
          {folders.map((folder) => {
            const active = formData.folder === folder;
            return (
              <TouchableOpacity
                key={folder}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  minHeight: 44,
                  justifyContent: 'center',
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.pill,
                  backgroundColor: active ? colors.primary : colors.surfaceMuted,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.line,
                }}
                onPress={() => onFormDataChange({ folder })}
                disabled={isLoading}
              >
                <Text style={{ fontSize: typography.label, fontWeight: typography.weights.medium, color: active ? colors.onPrimary : colors.inkMuted }}>
                  {folder}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityRole="switch"
        accessibilityLabel="Marcar como favorita"
        accessibilityState={{ checked: formData.isFavorite, disabled: isLoading }}
        style={{
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: formData.isFavorite ? colors.primary : colors.line,
          backgroundColor: formData.isFavorite ? colors.primarySoft : colors.surface,
        }}
        onPress={() => onFormDataChange({ isFavorite: !formData.isFavorite })}
        disabled={isLoading}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Ionicons name={formData.isFavorite ? 'star' : 'star-outline'} size={20} color={formData.isFavorite ? colors.warning : colors.inkMuted} />
          <Text style={{ fontSize: typography.body, fontWeight: typography.weights.medium, color: colors.ink }}>Marcar como favorita</Text>
        </View>
        <View
          style={{
            width: 44,
            height: 26,
            borderRadius: radii.pill,
            backgroundColor: formData.isFavorite ? colors.primary : colors.lineStrong,
            padding: 3,
            alignItems: formData.isFavorite ? 'flex-end' : 'flex-start',
          }}
        >
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.onPrimary }} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
