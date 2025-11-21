import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../shared';
import { useTheme } from '../../contexts/ThemeContext';

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
}

export const SecureNoteCard: React.FC<SecureNoteCardProps> = ({
  note,
  onPress,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const { isDark } = useTheme();

  const styles = StyleSheet.create({
    card: {
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 4,
    },
    content: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 8,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
    },
    folder: {
      fontSize: 12,
      color: isDark ? '#6b7280' : '#9ca3af',
    },
    date: {
      fontSize: 12,
      color: isDark ? '#6b7280' : '#9ca3af',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    favoriteIcon: {
      marginLeft: 8,
    },
  });

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress}>
        <View style={styles.header}>
          <View style={styles.info}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.title}>{note.title}</Text>
              {note.isFavorite && (
                <Ionicons 
                  name="star" 
                  size={16} 
                  color="#fbbf24" 
                  style={styles.favoriteIcon}
                />
              )}
            </View>
            <Text 
              style={styles.content}
              numberOfLines={3}
            >
              {note.content}
            </Text>
            <View style={styles.meta}>
              {note.folder && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="folder-outline" size={14} color={isDark ? '#6b7280' : '#9ca3af'} />
                  <Text style={styles.folder}> {note.folder}</Text>
                </View>
              )}
              <Text style={styles.date}>
                {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onToggleFavorite}
        >
          <Ionicons
            name={note.isFavorite ? 'star' : 'star-outline'}
            size={20}
            color={note.isFavorite ? '#fbbf24' : (isDark ? '#9ca3af' : '#6b7280')}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onEdit}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={isDark ? '#9ca3af' : '#6b7280'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onDelete}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color="#dc2626"
          />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

