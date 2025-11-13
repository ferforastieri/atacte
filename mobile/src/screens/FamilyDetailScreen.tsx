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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Modal, Input } from '../components/shared';
import { FamilyMap, FamilyMembersList, ZoneManager } from '../components/family';
import { locationService, FamilyMemberLocation } from '../services/location/locationService';
import { geofenceService, GeofenceZone, CreateGeofenceZoneData, UpdateGeofenceZoneData } from '../services/geofence/geofenceService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';

const { width, height } = Dimensions.get('window');

export default function FamilyDetailScreen({ route, navigation }: any) {
  const { familyId, familyName } = route.params;
  const [locations, setLocations] = useState<FamilyMemberLocation[]>([]);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'members' | 'zones'>('map');
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [isSavingZone, setIsSavingZone] = useState(false);
  const [focusOnMember, setFocusOnMember] = useState<{ latitude: number; longitude: number } | undefined>();
  const [zoneCoordinatesCallback, setZoneCoordinatesCallback] = useState<((lat: number, lng: number) => void) | null>(null);

  const { showSuccess, showError } = useToast();
  const { isDark } = useTheme();
  const { currentLocation, sendCurrentLocation } = useLocation();

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, [familyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadFamilyLocations(),
        loadZones()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro ao carregar dados da família');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFamilyLocations = async () => {
    try {
      const familyData = await locationService.getFamilyLocations(familyId);
      setLocations(familyData.data?.members || []);
    } catch (error) {
      console.error('Erro ao carregar localizações:', error);
      showError('Erro ao carregar localizações da família');
    }
  };

  const loadZones = async () => {
    try {
      const zonesData = await geofenceService.getUserZones(false, familyId);
      setZones(zonesData.data || []);
    } catch (error) {
      console.error('Erro ao carregar zonas:', error);
      showError('Erro ao carregar zonas');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Atualizar própria localização primeiro
      await sendCurrentLocation();
      
      // Solicitar atualização forçada para a família (notifica outros membros)
      const result = await locationService.requestFamilyLocationUpdate(familyId);
      
      if (result.success) {
        showSuccess('Família notificada para atualizar localização');
      }
      
      // Recarregar dados após um pequeno delay para dar tempo dos outros atualizarem
      setTimeout(async () => {
        await loadData();
        setIsRefreshing(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
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
      console.error('Erro ao criar zona:', error);
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
      console.error('Erro ao atualizar zona:', error);
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
      console.error('Erro ao excluir zona:', error);
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
    // Implementar lógica para editar zona
  };

  const handleMemberPress = (member: FamilyMemberLocation) => {
    
    // Focar no membro no mapa
    if (activeTab === 'map') {
      // Definir coordenadas para focar
      setFocusOnMember({ latitude: member.latitude, longitude: member.longitude });
    } else {
      // Se não estiver na aba do mapa, mudar para ela
      setActiveTab('map');
      // Aguardar um pouco e então focar no membro
      setTimeout(() => {
        setFocusOnMember({ latitude: member.latitude, longitude: member.longitude });
      }, 100);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <SafeAreaView style={styles.header} edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={20} color={isDark ? '#f9fafb' : '#111827'} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{familyName}</Text>
            </View>
          </View>
        </SafeAreaView>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Carregando dados da família...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={isDark ? '#f9fafb' : '#111827'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>{familyName}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons 
              name="refresh" 
              size={20} 
              color={isDark ? '#9ca3af' : '#6b7280'} 
              style={isRefreshing ? styles.refreshing : undefined}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Tabs de navegação */}
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
          style={[styles.tab, activeTab === 'members' && [styles.activeTab, { backgroundColor: isDark ? '#374151' : '#f0fdf4' }]]}
          onPress={() => setActiveTab('members')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === 'members' ? '#16a34a' : (isDark ? '#9ca3af' : '#6b7280')} 
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'members' ? '#16a34a' : (isDark ? '#9ca3af' : '#6b7280') }
          ]}>
            Membros
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
      </View>

      {/* Conteúdo das tabs */}
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
            
            {/* Lista de membros na parte de baixo do mapa */}
            <View style={[styles.membersListContainer, { 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderTopColor: isDark ? '#374151' : '#e5e7eb'
            }]}>
              <FamilyMembersList
                members={locations}
                onMemberPress={handleMemberPress}
                compact={true}
              />
            </View>
          </View>
        )}

        {activeTab === 'members' && (
          <FamilyMembersList
            members={locations}
            onMemberPress={handleMemberPress}
          />
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  refreshButton: {
    padding: 8,
  },
  refreshing: {
    transform: [{ rotate: '180deg' }],
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#f0fdf4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  membersListContainer: {
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
});