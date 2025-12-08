import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Modal, Input } from '../components/shared';
import { geofenceService, GeofenceZone } from '../services/geofence/geofenceService';
import { familyService } from '../services/family/familyService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';

export default function GeofenceScreen() {
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState<GeofenceZone | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    radius: '100',
    notifyOnEnter: true,
    notifyOnExit: true,
  });

  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setIsLoading(true);
      const response = await geofenceService.getUserZones(false);
      
      if (response.success && response.data) {
        setZones(response.data);
      } else {
        showError(response.message || 'Erro ao carregar zonas');
      }
    } catch (error) {
      showError('Erro ao carregar zonas');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const openCreateModal = () => {
    setEditingZone(null);
    setFormData({
      name: '',
      description: '',
      latitude: '',
      longitude: '',
      radius: '100',
      notifyOnEnter: true,
      notifyOnExit: true,
    });
    setShowCreateModal(true);
  };

  const openEditModal = (zone: GeofenceZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      description: zone.description || '',
      latitude: zone.latitude.toString(),
      longitude: zone.longitude.toString(),
      radius: zone.radius.toString(),
      notifyOnEnter: zone.notifyOnEnter,
      notifyOnExit: zone.notifyOnExit,
    });
    setShowCreateModal(true);
  };

  const handleSaveZone = async () => {
    if (!formData.name.trim()) {
      showError('Digite o nome da zona');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      showError('Digite a latitude e longitude');
      return;
    }

    const latitude = parseFloat(formData.latitude);
    const longitude = parseFloat(formData.longitude);
    const radius = parseFloat(formData.radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
      showError('Valores numéricos inválidos');
      return;
    }

    if (radius < 50 || radius > 10000) {
      showError('O raio deve estar entre 50 e 10000 metros');
      return;
    }

    try {
      setIsSaving(true);

      if (editingZone) {
        const response = await geofenceService.updateZone(editingZone.id, {
          name: formData.name,
          description: formData.description || undefined,
          latitude,
          longitude,
          radius,
          notifyOnEnter: formData.notifyOnEnter,
          notifyOnExit: formData.notifyOnExit,
        });

        if (response.success) {
          showSuccess('Zona atualizada com sucesso!');
          setShowCreateModal(false);
          loadZones();
        } else {
          showError(response.message || 'Erro ao atualizar zona');
        }
      } else {
       
        const familiesResponse = await familyService.getFamilies();
        if (!familiesResponse.success || !familiesResponse.data || familiesResponse.data.length === 0) {
          showError('Você precisa estar em uma família para criar zonas');
          return;
        }

        const firstFamily = familiesResponse.data[0];
        const response = await geofenceService.createZone({
          familyId: firstFamily.id,
          name: formData.name,
          description: formData.description || undefined,
          latitude,
          longitude,
          radius,
          notifyOnEnter: formData.notifyOnEnter,
          notifyOnExit: formData.notifyOnExit,
        });

        if (response.success) {
          showSuccess('Zona criada com sucesso!');
          setShowCreateModal(false);
          loadZones();
        } else {
          showError(response.message || 'Erro ao criar zona');
        }
      }
    } catch (error) {
      showError('Erro ao salvar zona');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = (zone: GeofenceZone) => {
    Alert.alert(
      'Deletar Zona',
      `Tem certeza que deseja deletar a zona "${zone.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await geofenceService.deleteZone(zone.id);
              
              if (response.success) {
                showSuccess('Zona deletada com sucesso!');
                loadZones();
              } else {
                showError(response.message || 'Erro ao deletar zona');
              }
            } catch (error) {
              showError('Erro ao deletar zona');
            }
          },
        },
      ]
    );
  };

  const toggleZoneActive = async (zone: GeofenceZone) => {
    try {
      const response = await geofenceService.updateZone(zone.id, {
        isActive: !zone.isActive,
      });

      if (response.success) {
        showSuccess(zone.isActive ? 'Zona desativada' : 'Zona ativada');
        loadZones();
      } else {
        showError(response.message || 'Erro ao atualizar zona');
      }
    } catch (error) {
      showError('Erro ao atualizar zona');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    scrollContent: {
      flexGrow: 1,
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
    zoneCard: {
      marginBottom: 16,
    },
    zoneHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    zoneInfo: {
      flex: 1,
    },
    zoneName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 4,
    },
    zoneDescription: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginBottom: 8,
    },
    zoneDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    detailIcon: {
      marginRight: 4,
    },
    detailText: {
      fontSize: 12,
      color: isDark ? '#d1d5db' : '#374151',
    },
    zoneActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
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
    modalContent: {
      gap: 16,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    checkboxLabel: {
      fontSize: 16,
      color: isDark ? '#f9fafb' : '#111827',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    modalButton: {
      flex: 1,
    },
    activeIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginLeft: 8,
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
      <Header 
        title="Geofences" 
        showThemeToggle={true} 
        onThemeToggle={toggleTheme}
        showBackButton={true}
      />
      
      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadZones();
              }}
              tintColor="#16a34a"
            />
          }
        >
          {zones.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color={isDark ? '#4b5563' : '#d1d5db'} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Nenhuma zona criada</Text>
              <Text style={styles.emptyText}>
                Crie zonas geográficas como Casa, Trabalho, Escola e receba notificações ao entrar ou sair delas
              </Text>
            </View>
          ) : (
            zones.map((zone) => (
              <Card key={zone.id} style={styles.zoneCard}>
                <View style={styles.zoneHeader}>
                  <View style={styles.zoneInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.zoneName}>{zone.name}</Text>
                      <View
                        style={[
                          styles.activeIndicator,
                          { backgroundColor: zone.isActive ? '#16a34a' : '#6b7280' },
                        ]}
                      />
                    </View>
                    {zone.description && (
                      <Text style={styles.zoneDescription}>{zone.description}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.zoneDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="resize-outline" size={14} color={isDark ? '#9ca3af' : '#6b7280'} style={styles.detailIcon} />
                    <Text style={styles.detailText}>Raio: {zone.radius}m</Text>
                  </View>
                  
                  {zone.notifyOnEnter && (
                    <View style={styles.detailItem}>
                      <Ionicons name="enter-outline" size={14} color="#16a34a" style={styles.detailIcon} />
                      <Text style={styles.detailText}>Notificar entrada</Text>
                    </View>
                  )}
                  
                  {zone.notifyOnExit && (
                    <View style={styles.detailItem}>
                      <Ionicons name="exit-outline" size={14} color="#dc2626" style={styles.detailIcon} />
                      <Text style={styles.detailText}>Notificar saída</Text>
                    </View>
                  )}
                </View>

                <View style={styles.zoneActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => toggleZoneActive(zone)}
                  >
                    <Ionicons
                      name={zone.isActive ? 'pause' : 'play'}
                      size={20}
                      color={isDark ? '#9ca3af' : '#6b7280'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(zone)}
                  >
                    <Ionicons name="create-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteZone(zone)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>

      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingZone ? 'Editar Zona' : 'Nova Zona'}
        size="lg"
      >
        <View style={styles.modalContent}>
          <Input
            label="Nome"
            placeholder="Ex: Casa, Trabalho, Escola"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Input
            label="Descrição (opcional)"
            placeholder="Descrição da zona"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
          />

          <Input
            label="Latitude"
            placeholder="-23.5505"
            value={formData.latitude}
            onChangeText={(text) => setFormData({ ...formData, latitude: text })}
            keyboardType="numeric"
          />

          <Input
            label="Longitude"
            placeholder="-46.6333"
            value={formData.longitude}
            onChangeText={(text) => setFormData({ ...formData, longitude: text })}
            keyboardType="numeric"
          />

          <Input
            label="Raio (metros)"
            placeholder="100"
            value={formData.radius}
            onChangeText={(text) => setFormData({ ...formData, radius: text })}
            keyboardType="numeric"
          />

          <View style={styles.checkboxRow}>
            <Text style={styles.checkboxLabel}>Notificar ao entrar</Text>
            <TouchableOpacity
              onPress={() =>
                setFormData({ ...formData, notifyOnEnter: !formData.notifyOnEnter })
              }
            >
              <Ionicons
                name={formData.notifyOnEnter ? 'checkbox' : 'square-outline'}
                size={24}
                color="#16a34a"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxRow}>
            <Text style={styles.checkboxLabel}>Notificar ao sair</Text>
            <TouchableOpacity
              onPress={() =>
                setFormData({ ...formData, notifyOnExit: !formData.notifyOnExit })
              }
            >
              <Ionicons
                name={formData.notifyOnExit ? 'checkbox' : 'square-outline'}
                size={24}
                color="#16a34a"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              onPress={() => setShowCreateModal(false)}
              variant="ghost"
              style={styles.modalButton}
            />
            <Button
              title={editingZone ? 'Atualizar' : 'Criar'}
              onPress={handleSaveZone}
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

