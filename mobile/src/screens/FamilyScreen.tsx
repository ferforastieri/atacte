import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Header, Modal, Input, Button, Card } from '../components/shared';
import { familyService, Family } from '../services/family/familyService';
import { locationService, FamilyMemberLocation } from '../services/location/locationService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';
import FamilyMap from '../components/family/FamilyMap';
import ZoneManager from '../components/family/ZoneManager';
import { geofenceService, GeofenceZone, CreateGeofenceZoneData, UpdateGeofenceZoneData } from '../services/geofence/geofenceService';
import { useAuth } from '../contexts/AuthContext';
import * as Clipboard from 'expo-clipboard';

interface FamilyScreenProps {
  navigation: {
    navigate: (screen: string, params?: { userId: string; userName: string }) => void;
  };
}

export default function FamilyScreen({ navigation }: FamilyScreenProps) {
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [locations, setLocations] = useState<FamilyMemberLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const snapPoints = [200, 500];
  const translateY = useRef(new Animated.Value(snapPoints[0])).current;
  const currentSnapIndex = useRef(0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditFamilyModal, setShowEditFamilyModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [editFamilyName, setEditFamilyName] = useState('');
  const [editFamilyDescription, setEditFamilyDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [isSavingZone, setIsSavingZone] = useState(false);
  const [zoneCoordinatesCallback, setZoneCoordinatesCallback] = useState<((lat: number, lng: number) => void) | null>(null);
  const [focusOnMember, setFocusOnMember] = useState<{ latitude: number; longitude: number } | undefined>();
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    family: false,
    zones: false,
    userActions: false,
  });
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const { checkAndStartTracking, sendCurrentLocation } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    loadFamilyData();
    translateY.setValue(snapPoints[0]);
  }, []);

  useEffect(() => {
    if (selectedFamily) {
      loadZones();
    }
  }, [selectedFamily]);


  useEffect(() => {
    if (selectedFamily) {
      loadZones();
    }
  }, [selectedFamily]);

  useFocusEffect(
    React.useCallback(() => {
      loadFamilyData();
    }, [])
  );

  const loadFamilyData = async () => {
    try {
      setIsLoading(true);
      const response = await familyService.getFamilies();
      
      if (response.success && response.data && response.data.length > 0) {
        const family = response.data[0];
        setSelectedFamily(family);
        await loadFamilyLocations(family.id);
      } else {
        setSelectedFamily(null);
        setLocations([]);
      }
    } catch (error) {
      showError('Erro ao carregar família');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadFamilyLocations = async (familyId: string) => {
    try {
      const response = await locationService.getFamilyLocations(familyId);
      if (response.success && response.data) {
        const members = response.data.members || [];
        setLocations(members);
      }
    } catch (error) {
      showError('Erro ao carregar localizações');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const newY = gestureState.dy;
        const currentValue = snapPoints[currentSnapIndex.current];
        const newValue = currentValue - newY;
        
        const minValue = snapPoints[0];
        const maxValue = snapPoints[snapPoints.length - 1];
        
        if (newValue >= minValue && newValue <= maxValue) {
          translateY.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        
        if (dy > 50 || vy > 0.3) {
          const nextSnapIndex = Math.max(0, currentSnapIndex.current - 1);
          currentSnapIndex.current = nextSnapIndex;
        } else if (dy < -50 || vy < -0.3) {
          const nextSnapIndex = Math.min(snapPoints.length - 1, currentSnapIndex.current + 1);
          currentSnapIndex.current = nextSnapIndex;
        }

        Animated.spring(translateY, {
          toValue: snapPoints[currentSnapIndex.current],
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }).start();
      },
    })
  ).current;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await sendCurrentLocation();
      if (selectedFamily) {
        await loadFamilyLocations(selectedFamily.id);
      }
    } catch (error) {
      showError('Erro ao atualizar');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMemberPress = (member: FamilyMemberLocation) => {
    setFocusOnMember({ latitude: member.latitude, longitude: member.longitude });
    currentSnapIndex.current = 0;
    Animated.spring(translateY, {
      toValue: snapPoints[0],
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  };

  const loadZones = async () => {
    if (!selectedFamily) return;
    try {
      const zonesData = await geofenceService.getUserZones(false, selectedFamily.id);
      setZones(zonesData.data || []);
    } catch (error) {
      showError('Erro ao carregar zonas');
    }
  };

  const handleCreateZone = async (data: CreateGeofenceZoneData) => {
    if (!selectedFamily) return;
    try {
      setIsSavingZone(true);
      await geofenceService.createZone({
        ...data,
        familyId: selectedFamily.id,
      });
      await loadZones();
      showSuccess('Zona criada com sucesso!');
      setIsCreatingZone(false);
    } catch (error) {
      showError('Erro ao criar zona');
    } finally {
      setIsSavingZone(false);
    }
  };

  const handleUpdateZone = async (id: string, data: UpdateGeofenceZoneData) => {
    try {
      setIsSavingZone(true);
      await geofenceService.updateZone(id, data);
      await loadZones();
      showSuccess('Zona atualizada com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar zona');
    } finally {
      setIsSavingZone(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    try {
      await geofenceService.deleteZone(id);
      await loadZones();
      showSuccess('Zona excluída com sucesso!');
    } catch (error) {
      showError('Erro ao excluir zona');
    }
  };

  const handleStartCreatingZone = () => {
    setIsCreatingZone(true);
  };

  const handleCancelCreatingZone = () => {
    setIsCreatingZone(false);
  };

  const handleRequestMapForZone = (callback: (lat: number, lng: number) => void) => {
    setZoneCoordinatesCallback(() => callback);
    setIsCreatingZone(true);
    setShowSettingsModal(false);
  };

  const handleMapPress = (latitude: number, longitude: number) => {
    if (isCreatingZone && zoneCoordinatesCallback) {
      zoneCoordinatesCallback(latitude, longitude);
      setZoneCoordinatesCallback(null);
      setIsCreatingZone(false);
      setShowSettingsModal(true);
    }
  };

  const handleEditFamily = () => {
    if (selectedFamily) {
      setEditFamilyName(selectedFamily.name);
      setEditFamilyDescription(selectedFamily.description || '');
      setShowEditFamilyModal(true);
    }
  };

  const handleSaveEditFamily = async () => {
    if (!selectedFamily || !editFamilyName.trim()) {
      showError('Nome da família é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const response = await familyService.updateFamily(selectedFamily.id, {
        name: editFamilyName.trim(),
        description: editFamilyDescription.trim() || undefined,
      });
      if (response.success) {
        showSuccess('Família atualizada com sucesso!');
        setShowEditFamilyModal(false);
        await loadFamilyData();
      } else {
        showError(response.message || 'Erro ao atualizar família');
      }
    } catch (error) {
      showError('Erro ao atualizar família');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFamily = async () => {
    if (!selectedFamily) return;

    setIsSaving(true);
    try {
      const response = await familyService.deleteFamily(selectedFamily.id);
      if (response.success) {
        showSuccess('Família excluída com sucesso!');
        setShowDeleteConfirmModal(false);
        setShowSettingsModal(false);
        await loadFamilyData();
      } else {
        showError(response.message || 'Erro ao excluir família');
      }
    } catch (error) {
      showError('Erro ao excluir família');
    } finally {
      setIsSaving(false);
    }
  };

  const isFamilyOwner = () => {
    return selectedFamily && user && selectedFamily.createdById === user.id;
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
        await loadFamilyData();
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
        await loadFamilyData();
        await checkAndStartTracking();
      } else {
        showError(response.message || 'Erro ao entrar na família');
      }
    } catch (error) {
      showError('Erro ao entrar na família');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyInviteCode = async () => {
    if (!selectedFamily?.inviteCode) return;
    try {
      await Clipboard.setStringAsync(selectedFamily.inviteCode);
      showSuccess('Código de convite copiado!');
    } catch (error) {
      showError('Erro ao copiar código de convite');
    }
  };

  const handleLeaveFamily = async () => {
    if (!selectedFamily) return;
    
    Alert.alert(
      'Sair da Família',
      `Tem certeza que deseja sair da família "${selectedFamily.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await familyService.leaveFamily(selectedFamily.id);
              
              if (response.success) {
                showSuccess('Você saiu da família!');
                await loadFamilyData();
              } else {
                showError(response.message || 'Erro ao sair da família');
              }
            } catch (error) {
              showError('Erro ao sair da família');
            }
          },
        },
      ]
    );
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return `${Math.floor(diff / 86400000)}d atrás`;
  };

  const getMemberStatusColor = (member: FamilyMemberLocation) => {
    if (member.isMoving) return '#16a34a';
    if (member.batteryLevel && member.batteryLevel < 0.2) return '#dc2626';
    return '#2563eb';
  };

  if (isLoading && !selectedFamily) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <Header title="Família" showThemeToggle={true} onThemeToggle={toggleTheme} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Carregando família...
          </Text>
        </View>
      </View>
    );
  }

  if (!selectedFamily) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <Header title="Família" showThemeToggle={true} onThemeToggle={toggleTheme} />
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={isDark ? '#4b5563' : '#d1d5db'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Nenhuma família encontrada
          </Text>
          <Text style={[styles.emptyText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
            Crie uma nova família ou entre em uma existente usando um código de convite
          </Text>
          
          <View style={styles.emptyActions}>
            <Button
              title="Entrar na Família"
              onPress={() => setShowJoinModal(true)}
              variant="secondary"
              style={styles.emptyButton}
            />
            <Button
              title="Criar Família"
              onPress={() => setShowCreateModal(true)}
              variant="primary"
              style={styles.emptyButton}
            />
          </View>
        </View>

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
              leftIcon={<Ionicons name="key-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
      <Header 
        title={selectedFamily.name}
        showThemeToggle={true}
        onThemeToggle={toggleTheme}
        showRefreshButton={true}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        showSettingsButton={true}
        onSettingsPress={() => setShowSettingsModal(true)}
      />

      <View style={styles.mapContainer}>
        <FamilyMap
          locations={locations}
          zones={zones}
          focusOnMember={focusOnMember}
          onMapPress={handleMapPress}
          isCreatingZone={isCreatingZone}
        />
        
        <Animated.View
          style={[
            styles.membersBar,
            {
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              height: translateY,
            },
          ]}
        >
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: isDark ? '#6b7280' : '#d1d5db' }]} />
          </View>
          
          <View style={[styles.bottomSheetHeader, { borderBottomColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <Text style={[styles.bottomSheetTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
              Membros ({locations.length})
            </Text>
          </View>
          
          <ScrollView
            style={styles.membersList}
            contentContainerStyle={styles.membersListContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            bounces={false}
            alwaysBounceVertical={false}
          >
              {locations.map((member, index) => (
                <View
                  key={member.userId}
                  style={[
                    styles.memberCard, 
                    { backgroundColor: isDark ? '#374151' : '#f9fafb' },
                    index === locations.length - 1 && { marginBottom: 0 }
                  ]}
                >
                <TouchableOpacity
                  style={styles.memberTouchable}
                  onPress={() => handleMemberPress(member)}
                  activeOpacity={0.7}
                >
                  <View style={styles.memberHeader}>
                    {member.profilePicture ? (
                      <Image 
                        source={{ uri: member.profilePicture }} 
                        style={styles.memberAvatarImage}
                      />
                    ) : (
                      <View style={[styles.memberAvatar, { 
                        backgroundColor: getMemberStatusColor(member)
                      }]}>
                        <Text style={styles.memberAvatarText}>
                          {(member.nickname || member.userName || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, { color: isDark ? '#f9fafb' : '#111827' }]}>
                        {member.nickname || member.userName}
                      </Text>
                      <Text style={[styles.memberStatus, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Última localização: {formatLastUpdate(member.timestamp)}
                      </Text>
                      {member.lastInteraction && (
                        <Text style={[styles.memberStatus, { color: isDark ? '#9ca3af' : '#6b7280', marginTop: 2 }]}>
                          Última interação: {formatLastUpdate(member.lastInteraction)}
                        </Text>
                      )}
                      {member.address && (
                        <Text style={[styles.memberAddress, { color: isDark ? '#6b7280' : '#9ca3af' }]} numberOfLines={1}>
                          📍 {member.address}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.historyButton, { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                  onPress={() => {
                    navigation.navigate('MemberHistory', {
                      userId: member.userId,
                      userName: member.nickname || member.userName,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={18} color="#16a34a" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

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

      <Modal
        visible={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          setExpandedSections({ family: false, zones: false, userActions: false });
        }}
        title="Configurações"
        size="lg"
      >
        <View style={styles.settingsContent}>
          <Card style={styles.settingsSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedSections({ ...expandedSections, family: !expandedSections.family })}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderContent}>
                <Ionicons name="people-outline" size={24} color={isDark ? '#f9fafb' : '#111827'} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
                  Família: {selectedFamily?.name}
                </Text>
              </View>
              <Ionicons 
                name={expandedSections.family ? 'chevron-up' : 'chevron-down'} 
                size={24} 
                color={isDark ? '#9ca3af' : '#6b7280'} 
              />
            </TouchableOpacity>
            
            {expandedSections.family && (
              <View style={[styles.sectionContent, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}>
                {isFamilyOwner() && (
                  <>
                    <TouchableOpacity
                      style={[styles.settingsOption, { backgroundColor: isDark ? '#374151' : '#f9fafb' }]}
                      onPress={() => {
                        setShowSettingsModal(false);
                        handleEditFamily();
                      }}
                    >
                      <Ionicons name="create-outline" size={20} color={isDark ? '#f9fafb' : '#111827'} />
                      <Text style={[styles.settingsOptionText, { color: isDark ? '#f9fafb' : '#111827' }]}>
                        Editar Família
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.settingsOption, { backgroundColor: isDark ? '#374151' : '#f9fafb' }]}
                      onPress={() => {
                        setShowSettingsModal(false);
                        setShowDeleteConfirmModal(true);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      <Text style={[styles.settingsOptionText, { color: '#ef4444' }]}>
                        Excluir Família
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                  </>
                  )}

                  <TouchableOpacity
                    style={[styles.settingsOption, { backgroundColor: isDark ? '#374151' : '#f9fafb' }]}
                    onPress={() => setExpandedSections({ ...expandedSections, zones: !expandedSections.zones })}
                  >
                    <Ionicons name="location-outline" size={20} color={isDark ? '#f9fafb' : '#111827'} />
                    <Text style={[styles.settingsOptionText, { color: isDark ? '#f9fafb' : '#111827' }]}>
                      Zonas de Geocerca
                    </Text>
                    <Ionicons 
                      name={expandedSections.zones ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={isDark ? '#9ca3af' : '#6b7280'} 
                    />
                  </TouchableOpacity>

                  {expandedSections.zones && (
                    <View style={[styles.zonesSubsection, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}>
                      <ZoneManager
                        zones={zones}
                        onCreateZone={handleCreateZone}
                        onUpdateZone={handleUpdateZone}
                        onDeleteZone={handleDeleteZone}
                        onStartCreatingZone={handleStartCreatingZone}
                        onCancelCreatingZone={handleCancelCreatingZone}
                        isCreatingZone={isCreatingZone}
                        isSavingZone={isSavingZone}
                        onRequestMapForZone={handleRequestMapForZone}
                      />
                    </View>
                  )}
                </View>
              )}
            </Card>

          <Card style={StyleSheet.flatten([styles.settingsSection, { marginBottom: 0 }])}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedSections({ ...expandedSections, userActions: !expandedSections.userActions })}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderContent}>
                <Ionicons name="person-outline" size={24} color={isDark ? '#f9fafb' : '#111827'} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
                  Ações do Usuário
                </Text>
              </View>
              <Ionicons 
                name={expandedSections.userActions ? 'chevron-up' : 'chevron-down'} 
                size={24} 
                color={isDark ? '#9ca3af' : '#6b7280'} 
              />
            </TouchableOpacity>
            
            {expandedSections.userActions && (
              <View style={[styles.sectionContent, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <TouchableOpacity
                  style={[styles.settingsOption, { backgroundColor: isDark ? '#374151' : '#f9fafb' }]}
                  onPress={() => {
                    setShowSettingsModal(false);
                    setShowCreateModal(true);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#16a34a" />
                  <Text style={[styles.settingsOptionText, { color: isDark ? '#f9fafb' : '#111827' }]}>
                    Criar Nova Família
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsOption, { backgroundColor: isDark ? '#374151' : '#f9fafb' }]}
                  onPress={() => {
                    setShowSettingsModal(false);
                    setShowJoinModal(true);
                  }}
                >
                  <Ionicons name="log-in-outline" size={20} color="#2563eb" />
                  <Text style={[styles.settingsOptionText, { color: isDark ? '#f9fafb' : '#111827' }]}>
                    Entrar em Outra Família
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>
      </Modal>

      <Modal
        visible={showEditFamilyModal}
        onClose={() => setShowEditFamilyModal(false)}
        title="Editar Família"
        size="sm"
      >
        <View style={styles.modalContent}>
          <Input
            label="Nome da Família"
            placeholder="Digite o nome da família"
            value={editFamilyName}
            onChangeText={setEditFamilyName}
            leftIcon={<Ionicons name="people-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
          />
          <Input
            label="Descrição (opcional)"
            placeholder="Digite uma descrição"
            value={editFamilyDescription}
            onChangeText={setEditFamilyDescription}
            multiline
            numberOfLines={3}
            leftIcon={<Ionicons name="document-text-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />}
          />

          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              onPress={() => setShowEditFamilyModal(false)}
              variant="ghost"
              style={styles.modalButton}
            />
            <Button
              title="Salvar"
              onPress={handleSaveEditFamily}
              variant="primary"
              loading={isSaving}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        title="Excluir Família"
        size="sm"
      >
        <View style={styles.modalContent}>
          <Text style={[styles.deleteConfirmText, { color: isDark ? '#f9fafb' : '#111827' }]}>
            Tem certeza que deseja excluir a família "{selectedFamily?.name}"? Esta ação não pode ser desfeita.
          </Text>

          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              onPress={() => setShowDeleteConfirmModal(false)}
              variant="ghost"
              style={styles.modalButton}
            />
            <Button
              title="Excluir"
              onPress={handleDeleteFamily}
              variant="danger"
              loading={isSaving}
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  membersBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 8,
    minHeight: 200,
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  handleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  bottomSheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  membersList: {
    flexShrink: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  membersListContent: {
    paddingBottom: 0,
    flexGrow: 0,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  memberTouchable: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  memberAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: 14,
    marginBottom: 2,
  },
  memberAddress: {
    fontSize: 12,
    marginTop: 4,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyActions: {
    width: '100%',
    gap: 12,
  },
  emptyButton: {
    width: '100%',
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
  settingsContent: {
    gap: 16,
  },
  settingsSection: {
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  lastSettingsSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  zonesSubsection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  zonesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingsOptionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  zonesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  deleteConfirmText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
});
