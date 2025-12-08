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
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Modal, Input, SkeletonLoader } from '../components/shared';
import { FamilyMap, FamilyMembersList, ZoneManager } from '../components/family';
import { locationService, FamilyMemberLocation } from '../services/location/locationService';
import { geofenceService, GeofenceZone, CreateGeofenceZoneData, UpdateGeofenceZoneData } from '../services/geofence/geofenceService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function FamilyDetailScreen({ route }: any) {
  const navigation = useNavigation();
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
   
  };

  const handleMemberPress = (member: FamilyMemberLocation) => {
    
   
    if (activeTab === 'map') {
     
      setFocusOnMember({ latitude: member.latitude, longitude: member.longitude });
    } else {
     
      setActiveTab('map');
     
      setTimeout(() => {
        setFocusOnMember({ latitude: member.latitude, longitude: member.longitude });
      }, 100);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <Header 
          title={familyName} 
          showBackButton={true} 
          onBack={navigation.goBack}
          showThemeToggle={true}
          onThemeToggle={toggleTheme}
        />
        
        <View style={styles.content}>
          <SkeletonLoader />
        </View>
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
      />

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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
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