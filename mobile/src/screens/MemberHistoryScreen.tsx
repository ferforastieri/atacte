import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Header, Button } from '../components/shared';
import { locationService, LocationData } from '../services/location/locationService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

export default function MemberHistoryScreen({ route }: any) {
  const { userId, userName } = route.params;
  const navigation = useNavigation();
  const { isDark, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();

  const handleBack = () => {
    (navigation as any).jumpTo('Family');
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
  
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const [startDate, setStartDate] = useState(yesterday);
  const [endDate, setEndDate] = useState(today);
  
  const mapRef = useRef<WebView>(null);
  let map: any = null;
  let markers: any[] = [];
  let polyline: any = null;

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

      if (start > end) {
        showError('Data inicial deve ser anterior à data final');
        setIsLoading(false);
        return;
      }

      const response = await locationService.getMemberLocationHistory(userId, start, end, 1000);
      
      if (response.success && response.data) {
        setLocations(response.data);
        
        if (response.data.length === 0) {
          showError('Nenhuma localização encontrada no período selecionado');
        } else {
          showSuccess(`${response.data.length} localização(ões) encontrada(s)`);
          setTimeout(() => {
            updateMapMarkers(response.data);
          }, 500);
        }
      } else {
        showError(response.message || 'Erro ao carregar histórico');
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Erro ao carregar histórico de localização');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMapMarkers = (locationData: LocationData[]) => {
    if (!mapRef.current || locationData.length === 0) return;

    const latlngs = locationData.map(loc => [loc.latitude, loc.longitude]);
    const colors = ['#16a34a', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

    const markersScript = locationData.map((location, index) => {
      const color = colors[index % colors.length];
      const isFirst = index === 0;
      const isLast = index === locationData.length - 1;

      let iconHtml = '';
      if (isFirst) {
        iconHtml = `<div style="background-color: #16a34a; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`;
      } else if (isLast) {
        iconHtml = `<div style="background-color: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`;
      } else {
        iconHtml = `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
      }

      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${formatDateTime(location.timestamp)}</h3>
          ${location.address ? `<p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: #374151;">📍 ${location.address}</p>` : '<p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; font-style: italic;">Endereço não disponível</p>'}
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Lat: ${location.latitude.toFixed(6)}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Lng: ${location.longitude.toFixed(6)}</p>
            ${location.accuracy ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">Precisão: ${Math.round(location.accuracy)}m</p>` : ''}
          </div>
        </div>
      `;

      return `
        const marker${index} = L.marker([${location.latitude}, ${location.longitude}], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: \`${iconHtml}\`,
            iconSize: ${isFirst || isLast ? '[20, 20]' : '[12, 12]'},
            iconAnchor: ${isFirst || isLast ? '[10, 10]' : '[6, 6]'}
          })
        }).bindPopup(\`${popupContent}\`).addTo(map);
        window.markers.push(marker${index});
      `;
    }).join('\n');

    const script = `
      (function() {
        if (!map) return;
        
        if (window.markers && window.markers.length > 0) {
          window.markers.forEach(marker => {
            if (marker && map.hasLayer(marker)) {
              map.removeLayer(marker);
            }
          });
        }
        window.markers = [];
        
        if (window.polyline && map.hasLayer(window.polyline)) {
          map.removeLayer(window.polyline);
          window.polyline = null;
        }
        
        ${markersScript}
        
        if (window.markers.length > 1) {
          const latlngs = ${JSON.stringify(latlngs)};
          window.polyline = L.polyline(latlngs, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.7
          }).addTo(map);
          
          const group = new L.featureGroup([...window.markers, window.polyline]);
          map.fitBounds(group.getBounds().pad(0.1));
        } else if (window.markers.length === 1) {
          const marker = window.markers[0];
          const latlng = marker.getLatLng();
          map.setView([latlng.lat, latlng.lng], 15);
        }
      })();
      true;
    `;

    mapRef.current.injectJavaScript(script);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const goToLocation = (location: LocationData) => {
    if (!mapRef.current) return;
    
    const script = `
      (function() {
        if (window.markers) {
          const marker = window.markers.find(m => {
            const latlng = m.getLatLng();
            return Math.abs(latlng.lat - ${location.latitude}) < 0.0001 && 
                   Math.abs(latlng.lng - ${location.longitude}) < 0.0001;
          });
          if (marker) {
            map.setView([${location.latitude}, ${location.longitude}], 15);
            marker.openPopup();
          }
        }
      })();
      true;
    `;
    
    mapRef.current.injectJavaScript(script);
  };

  const getLocationColor = (location: LocationData): string => {
    const index = locations.findIndex(l => l.id === location.id);
    const colors = ['#16a34a', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
    return colors[index % colors.length];
  };

  const getInitialMapCenter = (): [number, number] => {
    if (locations.length > 0) {
      const firstLocation = locations[0];
      return [firstLocation.latitude, firstLocation.longitude];
    }
    return [-23.5505, -46.6333];
  };

  const leafletHTML = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Histórico de Localização</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        }
        #map { 
          width: 100%; 
          height: 100vh; 
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        let map;
        let markers = [];
        let polyline = null;
        const initialCenter = ${JSON.stringify(getInitialMapCenter())};
        
        function initMap() {
          map = L.map('map').setView(initialCenter, ${locations.length > 0 ? '13' : '12'});
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
          map.addControl(L.control.zoom({ position: 'topright' }));
          map.addControl(L.control.scale({ position: 'bottomright' }));
        }
        
        document.addEventListener('DOMContentLoaded', function() {
          initMap();
        });
      </script>
    </body>
    </html>
  `, [locations]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
      <Header 
        title={`Histórico - ${userName}`}
        showBackButton={true}
        onBack={handleBack}
        showThemeToggle={true}
        onThemeToggle={toggleTheme}
      />

      <View style={styles.filterContainer}>
        <View style={styles.dateFilters}>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.dateButtonText, { color: isDark ? '#f9fafb' : '#111827' }]}>
              {formatDate(startDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.dateButtonText, { color: isDark ? '#f9fafb' : '#111827' }]}>
              {formatDate(endDate)}
            </Text>
          </TouchableOpacity>

          <Button
            title="Buscar"
            onPress={loadHistory}
            loading={isLoading}
            variant="primary"
            style={styles.searchButton}
          />
        </View>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          ref={mapRef}
          source={{ html: leafletHTML }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoadEnd={() => {
            if (locations.length > 0) {
              setTimeout(() => {
                updateMapMarkers(locations);
              }, 1500);
            }
          }}
          key={locations.length > 0 ? `map-${locations[0]?.latitude}-${locations[0]?.longitude}` : 'map-default'}
        />
      </View>

      <View style={[styles.listContainer, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
            Localizações ({locations.length})
          </Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#16a34a" />
            <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Carregando...
            </Text>
          </View>
        ) : locations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Nenhuma localização encontrada no período selecionado
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
            {locations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={[styles.locationCard, { backgroundColor: isDark ? '#374151' : '#f9fafb' }]}
                onPress={() => goToLocation(location)}
              >
                <View style={styles.locationHeader}>
                  <View style={styles.locationInfo}>
                    <Text style={[styles.locationTime, { color: isDark ? '#f9fafb' : '#111827' }]}>
                      {formatDateTime(location.timestamp)}
                    </Text>
                    {location.address && (
                      <Text style={[styles.locationAddress, { color: isDark ? '#d1d5db' : '#374151' }]} numberOfLines={2}>
                        📍 {location.address}
                      </Text>
                    )}
                    <View style={styles.locationCoords}>
                      <Text style={[styles.coordText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Lat: {location.latitude.toFixed(6)}
                      </Text>
                      <Text style={[styles.coordText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Lng: {location.longitude.toFixed(6)}
                      </Text>
                      {location.accuracy && (
                        <Text style={[styles.coordText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                          Precisão: {Math.round(location.accuracy)}m
                        </Text>
                      )}
                    </View>
                  </View>
                  <View
                    style={[styles.locationDot, { backgroundColor: getLocationColor(location) }]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateFilters: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchButton: {
    paddingHorizontal: 20,
  },
  mapContainer: {
    flex: 1,
    height: 300,
  },
  map: {
    flex: 1,
  },
  listContainer: {
    height: 300,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  locationsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  locationCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  locationTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    marginBottom: 8,
  },
  locationCoords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  coordText: {
    fontSize: 11,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 12,
    marginTop: 4,
  },
});

