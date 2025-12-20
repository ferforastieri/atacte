import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, SkeletonLoader, Modal, Input } from '../components/shared';
import { FamilyMap, FamilyMembersList, ZoneManager } from '../components/family';
import { locationService, FamilyMemberLocation } from '../services/location/locationService';
import { geofenceService, GeofenceZone, CreateGeofenceZoneData, UpdateGeofenceZoneData } from '../services/geofence/geofenceService';
import { familyService } from '../services/family/familyService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window');

interface FamilyDetailScreenProps {
  route: {
    params: {
      familyId: string;
      familyName: string;
    };
  };
}

export default function FamilyDetailScreen({ route }: FamilyDetailScreenProps) {
  const navigation = useNavigation();
  const { familyId, familyName } = route.params;

  const handleBack = () => {
    navigation.goBack();
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  const [locations, setLocations] = useState<FamilyMemberLocation[]>([]);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'zones' | 'settings'>('map');
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [isSavingZone, setIsSavingZone] = useState(false);
  const [focusOnMember, setFocusOnMember] = useState<{ latitude: number; longitude: number } | undefined>();
  const [zoneCoordinatesCallback, setZoneCoordinatesCallback] = useState<((lat: number, lng: number) => void) | null>(null);
  const [inviteCodeForFamily, setInviteCodeForFamily] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const { currentLocation, sendCurrentLocation } = useLocation();

 
  useEffect(() => {
    loadData();
  }, [familyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadFamilyLocations(),
        loadZones(),
        loadFamilyInviteCode()
      ]);
    } catch (error) {
      showError('Erro ao carregar dados da família');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFamilyInviteCode = async () => {
    try {
      const response = await familyService.getFamilies();
      if (response.success && response.data) {
        const currentFamily = response.data.find((f: { id: string; inviteCode?: string }) => f.id === familyId);
        if (currentFamily) {
          setInviteCodeForFamily(currentFamily.inviteCode);
        }
      }
    } catch (error) {
    }
  };

  const loadFamilyLocations = async () => {
    try {
      const familyData = await locationService.getFamilyLocations(familyId);
      setLocations(familyData.data?.members || []);
    } catch (error) {
      showError('Erro ao carregar localizações da família');
    }
  };

  const loadZones = async () => {
    try {
      const zonesData = await geofenceService.getUserZones(false, familyId);
      setZones(zonesData.data || []);
    } catch (error) {
      showError('Erro ao carregar zonas');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
     
      await sendCurrentLocation();
      
     
      const result = await locationService.requestFamilyLocationUpdate(familyId);
      
      if (result.success) {
        showSuccess('Família notificada para atualizar localização');
      }
      
     
      setTimeout(async () => {
        await loadData();
        setIsRefreshing(false);
      }, 2000);
    } catch (error) {
      await loadData();
      setIsRefreshing(false);
    }
  };

  const handleCreateZone = async (data: CreateGeofenceZoneData) => {
    try {
      setIsSavingZone(true);
      await geofenceService.createZone({
        ...data,
        familyId,
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

  const handleMapPress = (latitude: number, longitude: number) => {
    if (isCreatingZone && zoneCoordinatesCallback) {
      zoneCoordinatesCallback(latitude, longitude);
      setZoneCoordinatesCallback(null);
      setIsCreatingZone(false);
      setActiveTab('zones');
    }
  };

  const handleRequestMapForZone = (callback: (lat: number, lng: number) => void) => {
    setZoneCoordinatesCallback(() => callback);
    setIsCreatingZone(true);
    setActiveTab('map');
  };

  const handleZoneClick = (zone: GeofenceZone) => {
   
  };

  const handleMemberPress = (member: FamilyMemberLocation) => {
    setActiveTab('map');
    setTimeout(() => {
      setFocusOnMember({ latitude: member.latitude, longitude: member.longitude });
    }, 300);
  };


  const handleLeaveFamily = async () => {
    Alert.alert(
      'Sair da Família',
      `Tem certeza que deseja sair da família "${familyName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await familyService.leaveFamily(familyId);
              
              if (response.success) {
                showSuccess('Você saiu da família!');
                navigation.goBack();
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

  const handleCopyInviteCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCodeForFamily);
      showSuccess('Código de convite copiado!');
    } catch (error) {
      showError('Erro ao copiar código de convite');
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
        navigation.goBack();
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
        navigation.goBack();
      } else {
        showError(response.message || 'Erro ao entrar na família');
      }
    } catch (error) {
      showError('Erro ao entrar na família');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <Header 
          title={familyName} 
          showBackButton={true} 
          onBack={handleBack}
          showThemeToggle={true}
          onThemeToggle={toggleTheme}
        />
        
        <SkeletonLoader variant="familyDetail" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
      <Header 
        title={familyName} 
        showBackButton={true} 
        onBack={navigation.goBack}
        showThemeToggle={true}
        onThemeToggle={toggleTheme}
        showRefreshButton={true}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'map' && [styles.activeTab, { backgroundColor: isDark ? '#374151' : '#f0fdf4' }]]}
          onPress={() => setActiveTab('map')}
        >
          <Ionicons 
            name="map" 
            size={20} 
            color={activeTab === 'map' ? '#16a34a' : (isDark ? '#9ca3af' : '#6b7280')} 
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'map' ? '#16a34a' : (isDark ? '#9ca3af' : '#6b7280') }
          ]}>
            Mapa
          </Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={[styles.tab, activeTab === 'zones' && [styles.activeTab, { backgroundColor: isDark ? '#374151' : '#f0fdf4' }]]}
          onPress={() => setActiveTab('zones')}
        >
          <Ionicons 
            name="location" 
            size={20} 
            color={activeTab === 'zones' ? '#16a34a' : (isDark ? '#9ca3af' : '#6b7280')} 
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'zones' ? '#16a34a' : (isDark ? '#9ca3af' : '#6b7280') }
          ]}>
            Zonas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && [styles.activeTab, { backgroundColor: isDark ? '#374151' : '#f0fdf4' }]]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons 
            name="settings-outline" 
            size={20} 
            color={activeTab === 'settings' ? '#16a34a' : (isDark ? '#9ca3af' : '#6b7280')} 
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'settings' ? '#16a34a' : (isDark ? '#9ca3af' : '#6b7280') }
          ]}>
            Config
          </Text>
        </TouchableOpacity>
      </View>

      {}
      <View style={styles.content}>
        {activeTab === 'map' && (
          <View style={styles.mapContainer}>
            <FamilyMap
              locations={locations}
              zones={zones}
              currentLocation={currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : undefined}
              onZoneClick={handleZoneClick}
              onMapPress={handleMapPress}
              isCreatingZone={isCreatingZone}
              focusOnMember={focusOnMember}
            />
            
            {}
            <View style={[styles.membersListContainer, { 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
            }]}>
              <FamilyMembersList
                members={locations}
                onMemberPress={handleMemberPress}
                compact={true}
              />
            </View>
          </View>
        )}


        {activeTab === 'zones' && (
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
        )}

        {activeTab === 'settings' && (
          <ScrollView style={styles.settingsContent}>
            <Card style={styles.settingsCard}>
              {inviteCodeForFamily && (
                <View style={styles.inviteCodeSection}>
                  <View style={styles.inviteCodeHeader}>
                    <Text style={[styles.inviteCodeLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Código de Convite</Text>
                    <TouchableOpacity
                      style={[styles.copyButton, { backgroundColor: isDark ? '#1f2937' : '#f0fdf4' }]}
                      onPress={handleCopyInviteCode}
                    >
                      <Ionicons name="copy-outline" size={18} color="#16a34a" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.inviteCode}>{inviteCodeForFamily}</Text>
                </View>
              )}

              <Button
                title="Criar Nova Família"
                onPress={() => setShowCreateModal(true)}
                variant="primary"
                style={styles.actionButton}
              />
              
              <Button
                title="Entrar em Outra Família"
                onPress={() => setShowJoinModal(true)}
                variant="secondary"
                style={styles.actionButton}
              />
              
              <Button
                title="Sair da Família"
                onPress={handleLeaveFamily}
                variant="danger"
                style={styles.actionButton}
              />
            </Card>
          </ScrollView>
        )}
      </View>

      {}
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

      {}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#f0fdf4',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  membersListContainer: {
    maxHeight: 200,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  inviteCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteCodeLabel: {
    fontSize: 12,
  },
  copyButton: {
    padding: 6,
    borderRadius: 8,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
    fontFamily: 'monospace',
  },
  settingsContent: {
    flex: 1,
    padding: 16,
  },
  settingsCard: {
    marginTop: 0,
    marginBottom: 0,
  },
  inviteCodeSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  actionButton: {
    width: '100%',
    marginBottom: 12,
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