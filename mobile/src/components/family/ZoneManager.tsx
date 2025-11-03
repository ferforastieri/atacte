import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Modal, Input } from '../shared';
import { GeofenceZone, CreateGeofenceZoneData, UpdateGeofenceZoneData } from '../../services/geofence/geofenceService';
import { useTheme } from '../../contexts/ThemeContext';

interface ZoneManagerProps {
  zones: GeofenceZone[];
  onCreateZone: (data: CreateGeofenceZoneData) => Promise<void>;
  onUpdateZone: (id: string, data: UpdateGeofenceZoneData) => Promise<void>;
  onDeleteZone: (id: string) => Promise<void>;
  onStartCreatingZone: () => void;
  onCancelCreatingZone: () => void;
  isCreatingZone: boolean;
  isSavingZone: boolean;
  onRequestMapForZone?: (callback: (lat: number, lng: number) => void) => void;
}

export default function ZoneManager({
  zones,
  onCreateZone,
  onUpdateZone,
  onDeleteZone,
  onStartCreatingZone,
  onCancelCreatingZone,
  isCreatingZone,
  isSavingZone,
  onRequestMapForZone
}: ZoneManagerProps) {
  const { isDark } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingZone, setEditingZone] = useState<GeofenceZone | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    radius: '100',
    notifyOnEnter: true,
    notifyOnExit: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      latitude: 0,
      longitude: 0,
      radius: '100',
      notifyOnEnter: true,
      notifyOnExit: true,
    });
  };

  const handleCreateZone = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome da zona é obrigatório');
      return;
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      Alert.alert('Erro', 'Clique no mapa para definir a posição da zona');
      return;
    }

    try {
      await onCreateZone({
        name: formData.name.trim(),
        description: formData.description.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: parseInt(formData.radius),
        notifyOnEnter: formData.notifyOnEnter,
        notifyOnExit: formData.notifyOnExit,
      });

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar zona');
    }
  };

  const handleUpdateZone = async () => {
    if (!editingZone || !formData.name.trim()) {
      Alert.alert('Erro', 'Nome da zona é obrigatório');
      return;
    }

    try {
      await onUpdateZone(editingZone.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: parseInt(formData.radius),
        notifyOnEnter: formData.notifyOnEnter,
        notifyOnExit: formData.notifyOnExit,
      });

      setShowEditModal(false);
      setEditingZone(null);
      resetForm();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar zona');
    }
  };

  const handleDeleteZone = (zone: GeofenceZone) => {
    Alert.alert(
      'Excluir Zona',
      `Tem certeza que deseja excluir a zona "${zone.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => onDeleteZone(zone.id)
        }
      ]
    );
  };

  const handleEditZone = (zone: GeofenceZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      description: zone.description || '',
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius: zone.radius.toString(),
      notifyOnEnter: zone.notifyOnEnter,
      notifyOnExit: zone.notifyOnExit,
    });
    setShowEditModal(true);
  };

  const handleStartCreating = () => {
    onStartCreatingZone();
    setShowCreateModal(true);
  };

  const handleCancelCreating = () => {
    onCancelCreatingZone();
    setShowCreateModal(false);
    resetForm();
  };

  return (
    <View style={styles.container}>
      {/* Header com botão de criar zona */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#f9fafb' : '#111827' }]}>
          Zonas de Geofence
        </Text>
        <Button
          title="Nova Zona"
          onPress={handleStartCreating}
          style={styles.createButton}
        />
      </View>

      {/* Lista de zonas */}
      <ScrollView 
        style={styles.zonesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.zonesContent}
      >
        {zones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="location-outline" 
              size={48} 
              color={isDark ? '#6b7280' : '#9ca3af'} 
            />
            <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Nenhuma zona criada
            </Text>
            <Text style={[styles.emptySubtext, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
              Toque em "Nova Zona" para criar sua primeira zona
            </Text>
          </View>
        ) : (
          zones.map((zone) => (
            <Card key={zone.id} style={StyleSheet.flatten([styles.zoneCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }])}>
              <View style={styles.zoneHeader}>
                <View style={styles.zoneInfo}>
                  <Text style={[styles.zoneName, { color: isDark ? '#f9fafb' : '#111827' }]}>
                    {zone.name}
                  </Text>
                  {zone.description && (
                    <Text style={[styles.zoneDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                      {zone.description}
                    </Text>
                  )}
                </View>
                <View style={styles.zoneActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
                    onPress={() => handleEditZone(zone)}
                  >
                    <Ionicons name="pencil" size={16} color="#16a34a" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
                    onPress={() => handleDeleteZone(zone)}
                  >
                    <Ionicons name="trash" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.zoneDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="location" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="radio" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    {zone.radius}m
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="notifications" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text style={[styles.detailText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    {zone.notifyOnEnter && zone.notifyOnExit ? 'Entrada e Saída' :
                     zone.notifyOnEnter ? 'Entrada' :
                     zone.notifyOnExit ? 'Saída' : 'Desabilitado'}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal de criação/edição */}
      <Modal
        visible={showCreateModal || showEditModal}
        onClose={handleCancelCreating}
        title={showEditModal ? 'Editar Zona' : 'Nova Zona'}
      >
        <View style={styles.modalContent}>
          <Input
            label="Nome da Zona"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Ex: Casa, Trabalho, Escola"
            style={styles.input}
          />

          <Input
            label="Descrição (opcional)"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Descrição da zona"
            multiline
            style={styles.input}
          />

          <View style={styles.positionSection}>
            <Text style={[styles.positionLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
              Posição da Zona:
            </Text>
            {formData.latitude === 0 && formData.longitude === 0 ? (
              <View style={styles.positionButton}>
                <Button
                  title="Definir Posição no Mapa"
                  onPress={() => {
                    if (onRequestMapForZone) {
                      onRequestMapForZone((lat: number, lng: number) => {
                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                      });
                    }
                  }}
                  variant="secondary"
                  style={styles.positionButtonStyle}
                />
                <Text style={[styles.positionHint, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Clique no mapa para definir a posição
                </Text>
              </View>
            ) : (
              <View style={[styles.positionInfo, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                <Text style={[styles.positionText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Lat: {formData.latitude.toFixed(4)}, Lng: {formData.longitude.toFixed(4)}
                </Text>
                <Button
                  title="Alterar Posição"
                  onPress={() => {
                    if (onRequestMapForZone) {
                      setFormData(prev => ({ ...prev, latitude: 0, longitude: 0 }));
                      onRequestMapForZone((lat: number, lng: number) => {
                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                      });
                    }
                  }}
                  variant="secondary"
                  style={styles.changePositionButton}
                />
              </View>
            )}
          </View>

          <Input
            label="Raio (metros)"
            value={formData.radius}
            onChangeText={(text) => setFormData({ ...formData, radius: text })}
            placeholder="100"
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.notificationOptions}>
            <Text style={[styles.notificationLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
              Notificações:
            </Text>
            
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFormData({ ...formData, notifyOnEnter: !formData.notifyOnEnter })}
            >
              <Ionicons 
                name={formData.notifyOnEnter ? "checkbox" : "square-outline"} 
                size={20} 
                color={formData.notifyOnEnter ? "#16a34a" : (isDark ? "#6b7280" : "#9ca3af")} 
              />
              <Text style={[styles.checkboxText, { color: isDark ? '#f9fafb' : '#111827' }]}>
                Notificar ao entrar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFormData({ ...formData, notifyOnExit: !formData.notifyOnExit })}
            >
              <Ionicons 
                name={formData.notifyOnExit ? "checkbox" : "square-outline"} 
                size={20} 
                color={formData.notifyOnExit ? "#16a34a" : (isDark ? "#6b7280" : "#9ca3af")} 
              />
              <Text style={[styles.checkboxText, { color: isDark ? '#f9fafb' : '#111827' }]}>
                Notificar ao sair
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              onPress={handleCancelCreating}
              variant="secondary"
              style={styles.modalButton}
            />
            <Button
              title={showEditModal ? 'Salvar' : 'Criar'}
              onPress={showEditModal ? handleUpdateZone : handleCreateZone}
              loading={isSavingZone}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  zonesList: {
    flex: 1,
  },
  zonesContent: {
    padding: 16,
  },
  zoneCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  zoneInfo: {
    flex: 1,
    marginRight: 12,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  zoneDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  zoneActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  zoneDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  modalContent: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  positionSection: {
    marginBottom: 16,
  },
  positionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  positionButton: {
    alignItems: 'center',
  },
  positionButtonStyle: {
    marginBottom: 8,
  },
  positionHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  positionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  positionText: {
    fontSize: 14,
    flex: 1,
  },
  changePositionButton: {
    marginLeft: 12,
  },
  notificationOptions: {
    marginBottom: 24,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxText: {
    fontSize: 14,
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
