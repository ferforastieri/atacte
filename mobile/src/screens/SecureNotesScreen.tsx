import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Header, Modal, SearchInput, SkeletonLoader, EmptyState } from '../components/shared';
import { SecureNoteCard, FolderSelector, SecureNoteFormModal } from '../components/secureNotes';
import { secureNoteService } from '../services/secureNotes/secureNoteService';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { MainTabParamList } from '../navigation/AppNavigator';
import { shadows, spacing, touch, typography } from '../theme/tokens';

interface SecureNote {
  id: string;
  title: string;
  content: string;
  folder?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

const NOTES_PAGE_SIZE = 50;

export default function SecureNotesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'SecureNotes'>>();
  const { colors, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SecureNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<SecureNote | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', folder: '', isFavorite: false });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [favoritePendingId, setFavoritePendingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const activeSearchQuery = useRef('');
  const activeFolder = useRef<string | null>(null);
  const requestGeneration = useRef(0);
  const isReplacingNotes = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const loadFolders = async () => {
    try {
      const response = await secureNoteService.getFolders();
      if (response.success && response.data) setFolders(response.data.sort());
    } catch {
      // The folder filter is optional.
    }
  };

  const loadNotes = useCallback(async (
    offset = 0,
    append = false,
    query = activeSearchQuery.current,
    folder = activeFolder.current,
  ) => {
    if (append) {
      if (isReplacingNotes.current || isLoadingMoreRef.current) return;
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
    } else {
      requestGeneration.current += 1;
      isReplacingNotes.current = true;
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
    const currentRequestGeneration = requestGeneration.current;

    try {
      const filters: { limit?: number; offset?: number; folder?: string; query?: string } = {
        limit: NOTES_PAGE_SIZE,
        offset,
      };
      if (folder) filters.folder = folder;
      if (query) filters.query = query;

      const response = await secureNoteService.getNotes(filters);
      if (currentRequestGeneration !== requestGeneration.current) return;

      if (response.success && response.data) {
        const notesList = Array.isArray(response.data) ? response.data : [];
        if (append) {
          setNotes((currentNotes) => {
            const existingIds = new Set(currentNotes.map((note) => note.id));
            return [...currentNotes, ...notesList.filter((note) => !existingIds.has(note.id))];
          });
        } else {
          setNotes(notesList);
        }
        const loadedCount = offset + notesList.length;
        setCurrentOffset(loadedCount);
        setHasMore(response.pagination ? loadedCount < response.pagination.total : false);
      } else {
        if (!append) setNotes([]);
        setHasMore(false);
      }
    } catch {
      if (currentRequestGeneration !== requestGeneration.current) return;
      if (!append) setNotes([]);
      setHasMore(false);
    } finally {
      if (currentRequestGeneration === requestGeneration.current) {
        isReplacingNotes.current = false;
        isLoadingMoreRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadFolders();
    void loadNotes();
  }, [loadNotes]);

  const handleSearch = useCallback(async (query: string) => {
    activeSearchQuery.current = query;
    setCurrentOffset(0);
    await loadNotes(0, false, query, activeFolder.current);
  }, [loadNotes]);

  const handleFolderSelect = useCallback(async (folder: string | null) => {
    activeFolder.current = folder;
    setSelectedFolder(folder);
    setCurrentOffset(0);
    await loadNotes(0, false, activeSearchQuery.current, folder);
  }, [loadNotes]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setCurrentOffset(0);
    await Promise.all([loadFolders(), loadNotes(0, false)]);
    setIsRefreshing(false);
  };

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && notes.length > 0) {
      void loadNotes(currentOffset, true);
    }
  }, [currentOffset, hasMore, isLoadingMore, loadNotes, notes.length]);

  const handleCreateNote = () => {
    setFormData({ title: '', content: '', folder: '', isFavorite: false });
    setEditingNote(null);
    setShowCreateModal(true);
  };

  const handleEditNote = (note: SecureNote) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content, folder: note.folder || '', isFavorite: note.isFavorite });
    setShowEditModal(true);
  };

  const handleDeleteNote = (note: SecureNote) => {
    setDeletingNote(note);
    setShowDeleteModal(true);
  };

  const confirmDeleteNote = async () => {
    if (!deletingNote || isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await secureNoteService.deleteNote(deletingNote.id);
      if (response.success) {
        setShowDeleteModal(false);
        setDeletingNote(null);
        await Promise.all([loadFolders(), loadNotes()]);
        showSuccess('Nota excluída.');
      } else {
        showError('Não foi possível excluir a nota.');
      }
    } catch {
      showError('Não foi possível excluir a nota.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNote = async () => {
    if (isSaving) return;
    if (!formData.title.trim() || !formData.content.trim()) return;

    setIsSaving(true);
    try {
      const noteData: { title: string; content: string; isFavorite: boolean; folder?: string } = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        isFavorite: formData.isFavorite,
      };
      if (formData.folder.trim()) noteData.folder = formData.folder.trim();

      const response = editingNote
        ? await secureNoteService.updateNote(editingNote.id, noteData)
        : await secureNoteService.createNote(noteData);

      if (response.success) {
        setShowCreateModal(false);
        setShowEditModal(false);
        setEditingNote(null);
        await Promise.all([loadFolders(), loadNotes()]);
        showSuccess(editingNote ? 'Nota atualizada.' : 'Nota criada.');
      } else {
        showError('Não foi possível salvar a nota.');
      }
    } catch {
      showError('Não foi possível salvar a nota.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async (note: SecureNote) => {
    if (favoritePendingId) return;
    setFavoritePendingId(note.id);
    try {
      const response = await secureNoteService.updateNote(note.id, { isFavorite: !note.isFavorite });
      if (response.success) {
        await loadNotes();
      } else {
        showError('Não foi possível atualizar a favorita.');
      }
    } catch {
      showError('Não foi possível atualizar a favorita.');
    } finally {
      setFavoritePendingId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Header
          title="Notas Seguras"
          subtitle="Textos privados do seu cofre"
          onThemeToggle={toggleTheme}
          icon={<Ionicons name="document-text-outline" size={22} color={colors.primarySoftText} />}
        />
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
      isTogglingFavorite={favoritePendingId === item.id}
      isDeleting={isDeleting && deletingNote?.id === item.id}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title="Notas Seguras"
        subtitle="Textos privados do seu cofre"
        onThemeToggle={toggleTheme}
        icon={<Ionicons name="document-text-outline" size={22} color={colors.primarySoftText} />}
      />

      <View style={{ flex: 1, paddingHorizontal: spacing.screen }}>
        <View style={{ paddingTop: spacing.lg, marginBottom: spacing.md }}>
          <SearchInput
            placeholder="Buscar notas..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSearch={handleSearch}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.lg }}>
          <FolderSelector folders={folders} selectedFolder={selectedFolder} onSelectFolder={handleFolderSelect} />
          {selectedFolder ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Limpar filtro de pasta"
              style={{
                width: touch.minimum,
                height: touch.minimum,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceMuted,
              }}
              onPress={() => handleFolderSelect(null)}
            >
              <Ionicons name="close" size={20} color={colors.inkMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.15}
          ListFooterComponent={isLoadingMore ? (
            <Text style={{ paddingVertical: spacing.xl, textAlign: 'center', color: colors.inkMuted, fontSize: typography.body }}>Carregando mais notas...</Text>
          ) : null}
          ListEmptyComponent={(
            <EmptyState
              icon="document-text-outline"
              title={searchQuery || selectedFolder ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
              description={searchQuery || selectedFolder
                ? 'Tente ajustar os filtros de busca'
                : 'Crie sua primeira nota segura para armazenar informações importantes'}
              actionLabel={searchQuery || selectedFolder ? undefined : 'Nova Nota'}
              onAction={searchQuery || selectedFolder ? undefined : handleCreateNote}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 110 }}
        />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Nova nota"
        style={{
          position: 'absolute',
          bottom: spacing['2xl'],
          right: spacing.screen,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.pop,
        }}
        onPress={handleCreateNote}
        activeOpacity={0.82}
      >
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </TouchableOpacity>

      <SecureNoteFormModal
        visible={showCreateModal}
        onClose={() => {
          if (isSaving) return;
          setShowCreateModal(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        formData={formData}
        onFormDataChange={(data) => setFormData((current) => ({ ...current, ...data }))}
        folders={folders}
        isEditing={false}
        isLoading={isSaving}
      />

      <SecureNoteFormModal
        visible={showEditModal}
        onClose={() => {
          if (isSaving) return;
          setShowEditModal(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        formData={formData}
        onFormDataChange={(data) => setFormData((current) => ({ ...current, ...data }))}
        folders={folders}
        isEditing
        isLoading={isSaving}
      />

      <Modal
        visible={showDeleteModal}
        onClose={() => {
          if (isDeleting) return;
          setShowDeleteModal(false);
          setDeletingNote(null);
        }}
        title="Excluir Nota"
        type="confirm"
        message={`Tem certeza que deseja excluir a nota "${deletingNote?.title || ''}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmDeleteNote}
        loading={isDeleting}
      />
    </View>
  );
}
