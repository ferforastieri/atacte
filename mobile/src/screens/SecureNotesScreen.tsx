import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Header, Modal, SearchInput, Card, SkeletonLoader } from '../components/shared';
import { SecureNoteCard, FolderSelector, SecureNoteFormModal } from '../components/secureNotes';
import { secureNoteService } from '../services/secureNotes/secureNoteService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';

interface SecureNote {
  id: string;
  title: string;
  content: string;
  folder?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SecureNotesScreen() {
  const navigation = useNavigation();
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [allNotes, setAllNotes] = useState<SecureNote[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SecureNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<SecureNote | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    folder: '',
    isFavorite: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    loadFolders();
    loadNotes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allNotes, searchQuery, selectedFolder]);

  const loadFolders = async () => {
    try {
      const response = await secureNoteService.getFolders();
      if (response.success && response.data) {
        setFolders(response.data.sort());
      }
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
    }
  };

  const loadNotes = async () => {
    try {
      const filters: {
        limit?: number;
        folder?: string;
        query?: string;
      } = {
        limit: 1000,
      };
      
      if (selectedFolder) {
        filters.folder = selectedFolder;
      }
      
      if (searchQuery) {
        filters.query = searchQuery;
      }

      const response = await secureNoteService.getNotes(filters);
      
      if (response.success && response.data) {
        const notesList = Array.isArray(response.data) ? response.data : [];
        setAllNotes(notesList);
      } else {
        setAllNotes([]);
      }
    } catch (error) {
      setAllNotes([]);
      showError('Erro ao carregar notas');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allNotes];

    if (selectedFolder) {
      filtered = filtered.filter(note => note.folder === selectedFolder);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    }

    setNotes(filtered);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadFolders(), loadNotes()]);
    setIsRefreshing(false);
  };

  const handleCreateNote = () => {
    setFormData({
      title: '',
      content: '',
      folder: '',
      isFavorite: false,
    });
    setEditingNote(null);
    setShowCreateModal(true);
  };

  const handleEditNote = (note: SecureNote) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      folder: note.folder || '',
      isFavorite: note.isFavorite,
    });
    setShowEditModal(true);
  };

  const handleDeleteNote = (note: SecureNote) => {
    setDeletingNote(note);
    setShowDeleteModal(true);
  };

  const confirmDeleteNote = async () => {
    if (!deletingNote) return;
    
    try {
      const response = await secureNoteService.deleteNote(deletingNote.id);
      if (response.success) {
        showSuccess('Nota excluída!');
        await Promise.all([loadFolders(), loadNotes()]);
      } else {
        showError(response.message || 'Erro ao excluir nota');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setShowDeleteModal(false);
      setDeletingNote(null);
    }
  };

  const handleSaveNote = async () => {
    if (!formData.title.trim()) {
      showError('Título é obrigatório');
      return;
    }

    if (!formData.content.trim()) {
      showError('Conteúdo é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const noteData: {
        title: string;
        content: string;
        isFavorite: boolean;
        folder?: string;
      } = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        isFavorite: formData.isFavorite,
      };
      
      if (formData.folder.trim()) {
        noteData.folder = formData.folder.trim();
      }
      
      let response;
      if (editingNote) {
        response = await secureNoteService.updateNote(editingNote.id, noteData);
      } else {
        response = await secureNoteService.createNote(noteData);
      }

      if (response.success) {
        showSuccess(editingNote ? 'Nota atualizada!' : 'Nota criada!');
        setShowCreateModal(false);
        setShowEditModal(false);
        setEditingNote(null);
        await Promise.all([loadFolders(), loadNotes()]);
      } else {
        showError(response.message || 'Erro ao salvar nota');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async (note: SecureNote) => {
    try {
      const response = await secureNoteService.updateNote(note.id, {
        isFavorite: !note.isFavorite,
      });
      
      if (response.success) {
        showSuccess(
          note.isFavorite 
            ? 'Removido dos favoritos!' 
            : 'Adicionado aos favoritos!'
        );
        await loadNotes();
      } else {
        showError(response.message || 'Erro ao atualizar favorito');
      }
    } catch (error) {
      showError('Erro ao atualizar favorito');
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isLoading) {
        loadNotes();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedFolder]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    listStyle: {
      flex: 1,
    },
    listContainer: {
      flexGrow: 1,
    },
    searchContainer: {
      paddingTop: 20,
      marginBottom: 20,
    },
    filterContainer: {
      marginBottom: 20,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    clearFilterButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#16a34a',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#6b7280',
      marginTop: 16,
    },
    emptyText: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 8,
      textAlign: 'center',
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 40,
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
    modalContent: {
      padding: 20,
    },
    modalText: {
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: 8,
    },
    modalSubtext: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 24,
    },
    deleteButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      borderWidth: 1,
      borderColor: isDark ? '#4b5563' : '#d1d5db',
    },
    deleteButton: {
      backgroundColor: '#dc2626',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#f9fafb' : '#111827',
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#ffffff',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Notas Seguras" onThemeToggle={toggleTheme} />
        <SkeletonLoader variant="secureNotes" />
      </View>
    );
  }

  const handleViewNote = (note: SecureNote) => {
    navigation.navigate('SecureNoteDetail', { noteId: note.id });
  };

  const renderNoteItem = ({ item }: { item: SecureNote }) => (
    <SecureNoteCard
      note={item}
      onPress={() => handleViewNote(item)}
      onEdit={() => handleEditNote(item)}
      onDelete={() => handleDeleteNote(item)}
      onToggleFavorite={() => handleToggleFavorite(item)}
      onView={() => handleViewNote(item)}
    />
  );

  const renderEmpty = () => (
    <Card style={styles.emptyCard}>
      <Ionicons 
        name="document-text-outline" 
        size={48} 
        color="#9ca3af"
      />
      <Text style={styles.emptyTitle}>
        {searchQuery || selectedFolder ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery || selectedFolder
          ? 'Tente ajustar os filtros de busca' 
          : 'Crie sua primeira nota segura para armazenar informações importantes'}
      </Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="Notas Seguras" onThemeToggle={toggleTheme} />
      
      <View style={styles.content}>
        {}
        <View style={styles.searchContainer}>
          <SearchInput
            placeholder="Buscar notas..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {}
        <View style={styles.filterContainer}>
          <FolderSelector
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
          />
          {selectedFolder && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => setSelectedFolder(null)}
            >
              <Ionicons name="close" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          )}
        </View>

        {}
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          style={styles.listStyle}
          contentContainerStyle={styles.listContainer}
          contentInsetAdjustmentBehavior="automatic"
        />
      </View>

      {}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateNote}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      <SecureNoteFormModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        formData={formData}
        onFormDataChange={(data) => setFormData({ ...formData, ...data })}
        folders={folders}
        isEditing={false}
        isLoading={isSaving}
      />

      <SecureNoteFormModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        formData={formData}
        onFormDataChange={(data) => setFormData({ ...formData, ...data })}
        folders={folders}
        isEditing={true}
        isLoading={isSaving}
      />

      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão"
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalText, { color: isDark ? '#f9fafb' : '#111827' }]}>
            Tem certeza que deseja excluir a nota "{deletingNote?.title}"?
          </Text>
          <Text style={[styles.modalSubtext, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Esta ação não pode ser desfeita.
          </Text>
          
          <View style={styles.deleteButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.deleteButton]}
              onPress={confirmDeleteNote}
            >
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
