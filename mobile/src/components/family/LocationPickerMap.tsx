import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface LocationPickerMapProps {
  initialLocation?: { latitude: number; longitude: number };
  onLocationSelect: (latitude: number, longitude: number) => void;
}

export default function LocationPickerMap({ 
  initialLocation,
  onLocationSelect
}: LocationPickerMapProps) {
  const webViewRef = useRef<WebView>(null);

 
  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Selecionar Localização</title>
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
        .location-marker {
          background: #16a34a;
          border: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .instruction {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.95);
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 1000;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }
        .dark .instruction {
          background: rgba(31, 41, 55, 0.95);
          color: #f9fafb;
        }
      </style>
    </head>
    <body>
      <div class="instruction">Toque no mapa para selecionar a localização</div>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        let map;
        let marker = null;
        const initialLat = ${initialLocation?.latitude || -23.5505};
        const initialLng = ${initialLocation?.longitude || -46.6333};
        
        function initMap() {
          map = L.map('map').setView([initialLat, initialLng], 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
         
          if (initialLat && initialLng) {
            marker = L.marker([initialLat, initialLng], {
              icon: L.divIcon({
                className: 'location-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              }),
              draggable: true
            }).addTo(map);
            
            marker.on('dragend', function(e) {
              const position = marker.getLatLng();
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'locationSelect',
                  latitude: position.lat,
                  longitude: position.lng
                }));
              }
            });
          }
          
         
          map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            
           
            if (marker) {
              map.removeLayer(marker);
            }
            
           
            marker = L.marker([lat, lng], {
              icon: L.divIcon({
                className: 'location-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              }),
              draggable: true
            }).addTo(map);
            
           
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelect',
                latitude: lat,
                longitude: lng
              }));
            }
            
           
            marker.on('dragend', function(e) {
              const position = marker.getLatLng();
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'locationSelect',
                  latitude: position.lat,
                  longitude: position.lng
                }));
              }
            });
          });
        }
        
       
        document.addEventListener('DOMContentLoaded', function() {
          initMap();
        });
      </script>
    </body>
    </html>
  `;

 
  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type?: string; latitude?: number; longitude?: number };
      
      if (data.type === 'locationSelect') {
        onLocationSelect(data.latitude, data.longitude);
      }
    } catch (error) {
     
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: leafletHTML }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  map: {
    flex: 1,
    width: '100%',
  },
});

