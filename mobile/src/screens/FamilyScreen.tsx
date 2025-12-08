import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Modal, Input, Header } from '../components/shared';
import { familyService, Family } from '../services/family/familyService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';
import * as Clipboard from 'expo-clipboard';

export default function FamilyScreen({ navigation }: any) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const { checkAndStartTracking, isTrackingActive, sendCurrentLocation } = useLocation();

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      setIsLoading(true);
      const response = await familyService.getFamilies();
      
      if (response.success && response.data) {
        setFamilies(response.data);
      } else {
        showError(response.message || 'Erro ao carregar famílias');
      }
    } catch (error) {
      showError('Erro ao carregar famílias');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) {
      showError('Digite o nome da família');
      return;
    }

    try {
      setIsSaving(true);
      const response = await familyService.createFamily({ name: newFamilyName });
      
      if (response.success) {
        showSuccess('Família criada com sucesso!');
        setNewFamilyName('');
        setShowCreateModal(false);
        loadFamilies();
        await checkAndStartTracking();
      } else {
        showError(response.message || 'Erro ao criar família');
      }
    } catch (error) {
      showError('Erro ao criar família');
    } finally {
      setIsSaving(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      showError('Digite o código de convite');
      return;
    }

    try {
      setIsSaving(true);
      
      const response = await familyService.joinFamily({ inviteCode });
      
      if (response.success) {
        showSuccess('Você entrou na família!');
        setInviteCode('');
        setShowJoinModal(false);
        loadFamilies();
        await checkAndStartTracking();
      } else {
        showError(response.message || 'Erro ao entrar na família');
      }
    } catch (error) {
      console.error('Join family error:', error);
      showError('Erro ao entrar na família');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewMap = (family: Family) => {
    navigation.navigate('FamilyDetail', { familyId: family.id, familyName: family.name });
  };

  const handleCopyInviteCode = async (inviteCode: string) => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      showSuccess('Código de convite copiado!');
    } catch (error) {
      showError('Erro ao copiar código de convite');
    }
  };

  const handleLeaveFamily = async (familyId: string, familyName: string) => {
    try {
      const response = await familyService.leaveFamily(familyId);
      
      if (response.success) {
        showSuccess('Você saiu da família!');
        loadFamilies();
      } else {
        showError(response.message || 'Erro ao sair da família');
      }
    } catch (error) {
      console.error('Leave family error:', error);
      showError('Erro ao sair da família');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: isDark ? '#6b7280' : '#9ca3af',
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    familyCard: {
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderRadius: 12,
      padding: 16,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    familyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    familyInfo: {
      flex: 1,
    },
    familyName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 4,
    },
    familyMembers: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    leaveButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
    },
    inviteCodeContainer: {
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    inviteCodeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    inviteCodeLabel: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    copyButton: {
      padding: 4,
      borderRadius: 8,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
    },
    inviteCode: {
      fontSize: 16,
      fontWeight: '700',
      color: '#16a34a',
      fontFamily: 'monospace',
    },
    actions: {
      marginTop: 0,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      flexDirection: 'row',
      gap: 12,
    },
    fabButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    fabPrimary: {
      backgroundColor: '#16a34a',
    },
    fabSecondary: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
    modalContent: {
      gap: 16,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    modalButton: {
      flex: 1,
    },
  });

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Família" showThemeToggle={true} onThemeToggle={toggleTheme} />
      
      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadFamilies();
              }}
              tintColor="#16a34a"
            />
          }
        >
          {families.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={isDark ? '#4b5563' : '#d1d5db'} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Nenhuma família encontrada</Text>
              <Text style={styles.emptyText}>
                Crie uma nova família ou entre em uma existente usando um código de convite
              </Text>
            </View>
          ) : (
            families.map((family) => (
              <TouchableOpacity 
                key={family.id} 
                style={styles.familyCard}
                onPress={() => handleViewMap(family)}
              >
                <View style={styles.familyHeader}>
                  <View style={styles.familyInfo}>
                    <Text style={styles.familyName}>{family.name}</Text>
                    <Text style={styles.familyMembers}>
                      {family.members.length} {family.members.length === 1 ? 'membro' : 'membros'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.leaveButton}
                    onPress={() => handleLeaveFamily(family.id, family.name)}
                  >
                    <Ionicons name="exit-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inviteCodeContainer}>
                  <View style={styles.inviteCodeHeader}>
                    <Text style={styles.inviteCodeLabel}>Código de Convite</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyInviteCode(family.inviteCode)}
                    >
                      <Ionicons name="copy-outline" size={16} color="#16a34a" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.inviteCode}>{family.inviteCode}</Text>
                </View>

              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>


      <View style={styles.fab}>
        <TouchableOpacity
          style={[styles.fabButton, styles.fabSecondary]}
          onPress={() => setShowJoinModal(true)}
        >
          <Ionicons name="enter-outline" size={24} color="#16a34a" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fabButton, styles.fabPrimary]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Modal Criar Família */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nova Família"
        size="sm"
      >
        <View style={styles.modalContent}>
          <Input
            label="Nome da Família"
            placeholder="Digite o nome da família"
            value={newFamilyName}
            onChangeText={setNewFamilyName}
          />

          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              onPress={() => setShowCreateModal(false)}
              variant="ghost"
              style={styles.modalButton}
            />
            <Button
              title="Criar"
              onPress={handleCreateFamily}
              variant="primary"
              loading={isSaving}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Entrar na Família */}
      <Modal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Entrar na Família"
        size="sm"
      >
        <View style={styles.modalContent}>
          <Input
            label="Código de Convite"
            placeholder="Digite o código"
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase())}
          />

          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              onPress={() => setShowJoinModal(false)}
              variant="ghost"
              style={styles.modalButton}
            />
            <Button
              title="Entrar"
              onPress={handleJoinFamily}
              variant="primary"
              loading={isSaving}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}
