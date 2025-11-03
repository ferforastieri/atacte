import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { FamilyMemberLocation } from '../../services/location/locationService';
import { GeofenceZone } from '../../services/geofence/geofenceService';

const { width, height } = Dimensions.get('window');

interface FamilyMapProps {
  locations: FamilyMemberLocation[];
  zones: GeofenceZone[];
  currentLocation?: { latitude: number; longitude: number };
  onZoneClick?: (zone: GeofenceZone) => void;
  onMapPress?: (latitude: number, longitude: number) => void;
  isCreatingZone?: boolean;
  focusOnMember?: { latitude: number; longitude: number };
}

export default function FamilyMap({ 
  locations, 
  zones, 
  currentLocation, 
  onZoneClick,
  onMapPress,
  isCreatingZone = false,
  focusOnMember
}: FamilyMapProps) {
  const webViewRef = useRef<WebView>(null);

  // Focar no membro quando a prop mudar
  useEffect(() => {
    if (focusOnMember && webViewRef.current) {
      const script = `
        window.focusOnMember(${focusOnMember.latitude}, ${focusOnMember.longitude});
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [focusOnMember]);

  // Atualizar modo de criação de zona quando a prop mudar
  useEffect(() => {
    if (webViewRef.current) {
      if (isCreatingZone) {
        const script = `
          if (window.startCreatingZone) {
            window.startCreatingZone();
          }
        `;
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(script);
        }, 500);
      } else {
        const script = `
          if (window.cancelZoneCreation) {
            window.cancelZoneCreation();
          }
        `;
        webViewRef.current.injectJavaScript(script);
      }
    }
  }, [isCreatingZone]);

  // HTML do Leaflet com funcionalidades completas
  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Mapa da Família</title>
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
        .custom-marker {
          background: #16a34a;
          border: 2px solid white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .battery-low { background: #dc2626; }
        .user-location { background: #3b82f6; }
        .moving { background: #16a34a; }
        .zone-circle {
          stroke: #16a34a;
          stroke-width: 3;
          fill: #16a34a;
          fill-opacity: 0.2;
        }
        .zone-popup {
          background: white;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          min-width: 200px;
        }
        .zone-popup h3 {
          margin: 0 0 8px 0;
          font-weight: 600;
          color: #1f2937;
          font-size: 16px;
        }
        .zone-popup p {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #6b7280;
        }
        .zone-popup .zone-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }
        .zone-popup button {
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        .zone-popup button:hover {
          background: #15803d;
        }
        .zone-popup button.danger {
          background: #dc2626;
        }
        .zone-popup button.danger:hover {
          background: #b91c1c;
        }
        .creating-zone {
          cursor: crosshair;
        }
        .creating-zone .leaflet-container {
          cursor: crosshair !important;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        let map;
        let markers = [];
        let zoneCircles = [];
        let tempCircle = null;
        let isCreatingZone = ${isCreatingZone};
        
        function initMap() {
          map = L.map('map').setView([-23.5505, -46.6333], 12);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
          // Eventos do mapa
          map.on('click', onMapClick);
          map.on('mousemove', onMapMouseMove);
          
          // Aplicar cursor de criação se necessário
          if (isCreatingZone) {
            document.body.classList.add('creating-zone');
          }
        }
        
        function onMapClick(e) {
          if (isCreatingZone) {
            const { lat, lng } = e.latlng;
            // Enviar coordenadas para React Native
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'mapClick',
              latitude: lat,
              longitude: lng
            }));
          }
        }
        
        function onMapMouseMove(e) {
          if (isCreatingZone && tempCircle) {
            const { lat, lng } = e.latlng;
            tempCircle.setLatLng([lat, lng]);
          }
        }
        
        function updateMarkers(locations, currentLocation) {
          // Limpar marcadores existentes
          markers.forEach(marker => map.removeLayer(marker));
          markers = [];
          
          // Adicionar marcadores dos membros da família
          locations.forEach(member => {
            const markerColor = getMarkerColor(member);
            const marker = L.marker([member.latitude, member.longitude], {
              icon: L.divIcon({
                className: 'custom-marker',
                html: \`<div class="custom-marker \${markerColor}">\${(member.nickname || member.userName || '?')[0].toUpperCase()}</div>\`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })
            }).bindPopup(\`
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">\${member.nickname || member.userName}</h3>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Última atualização: \${formatTime(member.timestamp)}</p>
                \${member.batteryLevel !== null ? \`<p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Bateria: \${Math.round(member.batteryLevel * 100)}%</p>\` : ''}
                \${member.isMoving ? '<p style="margin: 0; font-size: 14px; color: #16a34a;">🚶 Em movimento</p>' : ''}
                \${member.accuracy ? \`<p style="margin: 0; font-size: 14px; color: #6b7280;">Precisão: ±\${Math.round(member.accuracy)}m</p>\` : ''}
              </div>
            \`);
            
            markers.push(marker);
            marker.addTo(map);
          });
          
          // Adicionar marcador da localização atual do usuário
          if (currentLocation) {
            const userMarker = L.marker([currentLocation.latitude, currentLocation.longitude], {
              icon: L.divIcon({
                className: 'custom-marker user-location',
                html: '<div class="custom-marker user-location">EU</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })
            }).bindPopup('<div style="padding: 8px;"><h3 style="margin: 0; font-weight: 600; color: #1f2937;">Sua localização</h3></div>');
            
            markers.push(userMarker);
            userMarker.addTo(map);
          }
          
          // Ajustar zoom para mostrar todos os marcadores
          if (locations.length > 0 || currentLocation) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
          }
        }
        
        function updateZones(zones) {
          // Limpar círculos existentes
          zoneCircles.forEach(circle => map.removeLayer(circle));
          zoneCircles = [];
          
          // Adicionar círculos das zonas
          zones.forEach(zone => {
            const circle = L.circle([zone.latitude, zone.longitude], {
              radius: zone.radius,
              color: '#16a34a',
              fillColor: '#16a34a',
              fillOpacity: 0.2,
              weight: 3
            }).bindPopup(\`
              <div class="zone-popup">
                <h3>\${zone.name}</h3>
                <p><strong>Descrição:</strong> \${zone.description || 'Sem descrição'}</p>
                <p><strong>Raio:</strong> \${zone.radius}m</p>
                <p><strong>Notificações:</strong> \${zone.notifyOnEnter ? 'Entrada' : ''} \${zone.notifyOnEnter && zone.notifyOnExit ? 'e' : ''} \${zone.notifyOnExit ? 'Saída' : ''}</p>
                <div class="zone-actions">
                  <button onclick="editZone('\${zone.id}')">Editar</button>
                  <button class="danger" onclick="deleteZone('\${zone.id}')">Excluir</button>
                </div>
              </div>
            \`);
            
            zoneCircles.push(circle);
            circle.addTo(map);
          });
        }
        
        function startCreatingZone() {
          isCreatingZone = true;
          document.body.classList.add('creating-zone');
          
          // Mostrar popup de instrução
          map.openPopup(L.popup()
            .setLatLng(map.getCenter())
            .setContent('<div style="text-align: center; padding: 12px;"><h3 style="margin: 0 0 8px 0;">Criar Nova Zona</h3><p style="margin: 0; font-size: 14px; color: #6b7280;">Clique no mapa para definir o centro da zona</p></div>')
            .openOn(map));
        }
        
        function cancelZoneCreation() {
          isCreatingZone = false;
          document.body.classList.remove('creating-zone');
          if (tempCircle) {
            map.removeLayer(tempCircle);
            tempCircle = null;
          }
          map.closePopup();
        }
        
        function editZone(zoneId) {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'editZone',
            zoneId: zoneId
          }));
        }
        
        function deleteZone(zoneId) {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'deleteZone',
            zoneId: zoneId
          }));
        }
        
        function getMarkerColor(member) {
          if (member.isMoving) return 'moving';
          if (member.batteryLevel && member.batteryLevel < 0.2) return 'battery-low';
          return '';
        }
        
        function formatTime(timestamp) {
          const date = new Date(timestamp);
          const now = new Date();
          const diff = now.getTime() - date.getTime();
          
          if (diff < 60000) return 'Agora';
          if (diff < 3600000) return \`\${Math.floor(diff / 60000)}min atrás\`;
          if (diff < 86400000) return \`\${Math.floor(diff / 3600000)}h atrás\`;
          return \`\${Math.floor(diff / 86400000)}d atrás\`;
        }
        
        // Função para focar em um membro específico
        function focusOnMember(latitude, longitude) {
          if (map) {
            map.setView([latitude, longitude], 16);
            // Encontrar e abrir popup do marcador
            markers.forEach(marker => {
              const latLng = marker.getLatLng();
              if (Math.abs(latLng.lat - latitude) < 0.0001 && Math.abs(latLng.lng - longitude) < 0.0001) {
                marker.openPopup();
              }
            });
          }
        }
        
        // Funções globais para comunicação com React Native
        window.startCreatingZone = startCreatingZone;
        window.cancelZoneCreation = cancelZoneCreation;
        window.focusOnMember = focusOnMember;
        window.updateMapData = function(locations, currentLocation, zones) {
          updateMarkers(locations, currentLocation);
          updateZones(zones);
        };
        
        // Inicializar mapa quando a página carregar
        document.addEventListener('DOMContentLoaded', initMap);
      </script>
    </body>
    </html>
  `;

  // Função para enviar dados para o mapa
  const updateMapData = () => {
    const script = `
      window.updateMapData(
        ${JSON.stringify(locations)},
        ${currentLocation ? JSON.stringify(currentLocation) : 'null'},
        ${JSON.stringify(zones)}
      );
    `;
    return script;
  };

  // Função para iniciar criação de zona
  const startCreatingZone = () => {
    const script = `
      window.startCreatingZone();
    `;
    return script;
  };

  // Função para cancelar criação de zona
  const cancelZoneCreation = () => {
    const script = `
      window.cancelZoneCreation();
    `;
    return script;
  };

  // Lidar com mensagens do WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'mapClick':
          if (onMapPress) {
            onMapPress(data.latitude, data.longitude);
          }
          break;
        case 'editZone':
          if (onZoneClick) {
            const zone = zones.find(z => z.id === data.zoneId);
            if (zone) onZoneClick(zone);
          }
          break;
        case 'deleteZone':
          // Implementar exclusão se necessário
          break;
      }
    } catch (error) {
      console.error('Erro ao processar mensagem do WebView:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: leafletHTML }}
        style={styles.map}
        onLoadEnd={() => {
          // Enviar dados para o mapa após carregar
          setTimeout(() => {
            webViewRef.current?.injectJavaScript(updateMapData());
          }, 1000);
        }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            {/* Loading será mostrado pelo WebView */}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
