import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Button, Input } from '../shared';
import { useTheme } from '../../contexts/ThemeContext';

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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const { isDark } = useTheme();

  const styles = StyleSheet.create({
    content: {
      padding: 20,
      maxHeight: SCREEN_HEIGHT * 0.85,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    formRow: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 8,
    },
    contentEditor: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      borderRadius: 12,
      minHeight: 300,
      maxHeight: SCREEN_HEIGHT * 0.4,
      padding: 12,
    },
    contentInput: {
      fontSize: 16,
      color: isDark ? '#f9fafb' : '#111827',
      textAlignVertical: 'top',
      flex: 1,
    },
    favoriteRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    folderTags: {
      marginTop: 8,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    folderTag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    folderTagText: {
      fontSize: 12,
    },
    buttons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    button: {
      flex: 1,
    },
  });

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Editar Nota' : 'Nova Nota'}
      size="lg"
    >
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
      >
        <View style={styles.formRow}>
          <Text style={styles.label}>Título *</Text>
          <Input
            placeholder="Digite o título da nota"
            value={formData.title}
            onChangeText={(text) => onFormDataChange({ title: text })}
          />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>Conteúdo *</Text>
          <View style={styles.contentEditor}>
            <TextInput
              style={styles.contentInput}
              placeholder="Digite o conteúdo da nota"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={formData.content}
              onChangeText={(text) => onFormDataChange({ content: text })}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>Pasta (opcional)</Text>
          <Input
            placeholder="Digite o nome da pasta"
            value={formData.folder}
            onChangeText={(text) => onFormDataChange({ folder: text })}
          />
          {folders.length > 0 && (
            <View style={styles.folderTags}>
              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder}
                  style={[
                    styles.folderTag,
                    {
                      backgroundColor: formData.folder === folder 
                        ? '#22c55e' 
                        : (isDark ? '#374151' : '#f3f4f6'),
                    },
                  ]}
                  onPress={() => onFormDataChange({ folder })}
                >
                  <Text style={[
                    styles.folderTagText,
                    {
                      color: formData.folder === folder 
                        ? '#ffffff' 
                        : (isDark ? '#f9fafb' : '#111827'),
                    },
                  ]}>
                    {folder}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.favoriteRow}>
          <Text style={[styles.label, { marginBottom: 0 }]}>Favorito</Text>
          <TouchableOpacity
            onPress={() => onFormDataChange({ isFavorite: !formData.isFavorite })}
          >
            <Ionicons
              name={formData.isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={formData.isFavorite ? '#fbbf24' : (isDark ? '#9ca3af' : '#6b7280')}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.buttons}>
          <View style={styles.button}>
            <Button
              title="Cancelar"
              onPress={onClose}
              variant="ghost"
            />
          </View>
          <View style={styles.button}>
            <Button
              title={isEditing ? 'Salvar' : 'Criar'}
              onPress={onSave}
              variant="primary"
              loading={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

