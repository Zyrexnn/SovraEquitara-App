import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { apiClient } from '../../api/client';
import { useRouter } from 'expo-router';
import { Map, RefreshCw } from 'lucide-react-native';

export default function AdminMapScreen() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VALID' | 'RESOLVED' | 'REJECTED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
      } catch (e) {
        console.log('Error fetching GPS initial position', e);
      }
    })();

    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiClient.get('/admin/reports');
      if (res.data?.data) {
        const data = res.data.data;
        setReports(data);
        applyFilter(data, statusFilter);
      }
    } catch (e) {
      console.log('Error fetching admin map reports', e);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const applyFilter = (allReports: any[], filter: string) => {
    if (filter === 'ALL') {
      setFilteredReports(allReports);
    } else {
      setFilteredReports(allReports.filter((r: any) => r.status.toUpperCase() === filter));
    }
  };

  const handleFilterChange = (filter: 'ALL' | 'PENDING' | 'VALID' | 'RESOLVED' | 'REJECTED') => {
    setStatusFilter(filter);
    applyFilter(reports, filter);
  };

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'navigate' && message.reportId) {
        router.push(`/admin/report/${message.reportId}` as any);
      }
    } catch (e) {
      console.error('Error handling WebView message in admin', e);
    }
  };

  const backendUrl = apiClient.defaults.baseURL
    ? apiClient.defaults.baseURL.replace('/api', '')
    : 'http://localhost:3000';

  const centerLat = userLocation?.latitude || -6.200000;
  const centerLng = userLocation?.longitude || 106.816666;
  const zoomLevel = userLocation ? 14 : 11;

  // Leaflet HTML string tailored for Admin moderation console
  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          height: 100%;
          margin: 0;
          padding: 0;
          background: ${isDark ? '#111111' : '#FAFAF9'};
        }
        .leaflet-pane {
          z-index: 1 !important;
        }
        .leaflet-control-zoom {
          display: none !important;
        }
        
        /* Premium custom popup style */
        .leaflet-popup-content-wrapper {
          background: ${isDark ? '#1a1a1a' : '#ffffff'} !important;
          color: ${isDark ? '#fafaf9' : '#1c1917'} !important;
          border-radius: 16px !important;
          border: 1px solid ${isDark ? '#292524' : '#e7e5e4'} !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 12px !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }
        .leaflet-popup-tip-container {
          display: none !important;
        }
        
        /* Pulsing Blue Dot for User Location */
        .user-location-marker {
          background: #6366f1; /* Indigo color for Admin */
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2.5px solid #ffffff;
          box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.4);
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0px rgba(99, 102, 241, 0.7);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
          }
          100% {
            box-shadow: 0 0 0 0px rgba(99, 102, 241, 0);
          }
        }
        
        /* Pin Marker */
        .custom-pin {
          width: 22px;
          height: 22px;
          border-radius: 50% 50% 50% 0;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -11px 0 0 -11px;
          border: 2px solid #FFFFFF;
          box-shadow: 0 3px 6px rgba(0,0,0,0.16);
        }
        .custom-pin::after {
          content: '';
          width: 8px;
          height: 8px;
          margin: 7px 0 0 7px;
          background: #FFFFFF;
          position: absolute;
          border-radius: 50%;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${centerLat}, ${centerLng}], ${zoomLevel});

        var tileUrl = ${isDark ? 
          "'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'" : 
          "'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'"
        };
        
        L.tileLayer(tileUrl, {
          maxZoom: 19
        }).addTo(map);

        if (${userLocation ? 'true' : 'false'}) {
          var userIcon = L.divIcon({
            className: 'user-location-marker-container',
            html: '<div class="user-location-marker"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          L.marker([${userLocation?.latitude || 0}, ${userLocation?.longitude || 0}], { icon: userIcon }).addTo(map);
        }

        var reports = ${JSON.stringify(filteredReports)};

        var statusColors = {
          'PENDING': '#f59e0b',
          'VALID': '#3b82f6',
          'RESOLVED': '#10b981',
          'REJECTED': '#ef4444'
        };

        reports.forEach(function(report) {
          if (!report.latitude || !report.longitude) return;
          
          var pinColor = statusColors[report.status.toUpperCase()] || '#9ca3af';
          var customIcon = L.divIcon({
            className: 'custom-pin-container',
            html: '<div class="custom-pin" style="background: ' + pinColor + '"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 22],
            popupAnchor: [0, -22]
          });

          var marker = L.marker([report.latitude, report.longitude], { icon: customIcon }).addTo(map);

          var catName = (report.category && report.category.name) ? report.category.name : 'Masalah';
          var statusText = report.status === 'PENDING' ? 'DIPROSES' : 
                          report.status === 'VALID' ? 'VALID' : 
                          report.status === 'RESOLVED' ? 'SELESAI' : 'DITOLAK';
          
          var badgeStyle = 'display: inline-block; padding: 2.5px 8px; font-size: 9px; font-weight: 700; border-radius: 9999px; margin-bottom: 6px; text-transform: uppercase;';
          var badgeColors = {
            'PENDING': 'background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);',
            'VALID': 'background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2);',
            'RESOLVED': 'background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);',
            'REJECTED': 'background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);'
          };
          
          var popupHtml = '<div style="width: 220px; font-family: system-ui, -apple-system, sans-serif;">';
          
          if (report.image_urls && report.image_urls.length > 0) {
            popupHtml += '<div style="width: 100%; height: 95px; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">' +
                         '<img src="${backendUrl}' + report.image_urls[0] + '" style="width: 100%; height: 100%; object-fit: cover;" />' +
                         '</div>';
          }
          
          popupHtml += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">' +
                       '<span style="' + badgeStyle + badgeColors[report.status.toUpperCase()] + '">' + statusText + '</span>' +
                       '<span style="font-size: 10px; font-weight: 700; color: ${isDark ? '#a8a29e' : '#78716c'};">' + catName + '</span>' +
                       '</div>';
                       
          popupHtml += '<h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; line-height: 1.35; color: ${isDark ? '#fafaf9' : '#1c1917'}; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">' + report.description + '</h4>';
          popupHtml += '<p style="margin: 0 0 10px 0; font-size: 9.5px; color: ${isDark ? '#a8a29e' : '#78716c'}; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;">📍 ' + report.location_detail + '</p>';
          
          popupHtml += '<button onclick="navigateToReport(\\'' + report.id + '\\')" style="width: 100%; padding: 7px 0; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 10px; font-weight: 700; cursor: pointer; transition: background 0.2s;">Moderasi Aduan →</button>';
          popupHtml += '</div>';

          marker.bindPopup(popupHtml);
        });

        function navigateToReport(id) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'navigate', reportId: id }));
        }
      </script>
    </body>
    </html>
  `;

  const webViewKey = `admin-map-${statusFilter}-${isDark}-${userLocation ? 'loc' : 'noloc'}-${filteredReports.length}`;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-zen-bg dark:bg-zen-darkBg">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-3">Memuat peta moderasi spasial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        key={webViewKey}
        originWhitelist={['*']}
        source={{ html: leafletHTML }}
        style={styles.map}
        onMessage={handleMessage}
        scrollEnabled={true}
        domStorageEnabled={true}
        javaScriptEnabled={true}
      />

      {/* Floating Header */}
      <View className="absolute top-12 left-4 right-4 bg-white/95 dark:bg-black/95 p-4 rounded-2xl shadow-zen border border-gray-100 dark:border-gray-800 flex-row justify-between items-center">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center">
            <Map color="#6366f1" size={16} className="mr-1.5" />
            <Text className="font-display text-base font-bold text-gray-900 dark:text-white">Peta Moderasi</Text>
          </View>
          <Text className="font-sans text-[10px] text-gray-500 dark:text-gray-400" numberOfLines={1}>
            Pantau dan tindak lanjuti aduan wilayah warga
          </Text>
        </View>
        <TouchableOpacity 
          onPress={fetchReports}
          disabled={isRefreshing}
          className="p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded-full"
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <RefreshCw color="#6366f1" size={16} />
          )}
        </TouchableOpacity>
      </View>

      {/* Floating Filters Scrollable */}
      <View className="absolute top-32 left-4 right-4 flex-row justify-between flex-wrap">
        {[
          { key: 'ALL', label: 'Semua', color: 'bg-stone-500' },
          { key: 'VALID', label: 'Valid', color: 'bg-blue-500' },
          { key: 'PENDING', label: 'Diproses', color: 'bg-amber-500' },
          { key: 'RESOLVED', label: 'Selesai', color: 'bg-emerald-500' },
          { key: 'REJECTED', label: 'Ditolak', color: 'bg-red-500' }
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            activeOpacity={0.9}
            onPress={() => handleFilterChange(filter.key as any)}
            className={`flex-1 mx-0.5 py-2 px-1 rounded-xl border flex-row justify-center items-center shadow-sm ${
              statusFilter === filter.key
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900'
                : 'bg-white/95 dark:bg-black/95 border-gray-100 dark:border-gray-800'
            }`}
          >
            <View className={`w-1.5 h-1.5 rounded-full ${filter.color} mr-1`} />
            <Text className={`font-display text-[9px] font-bold ${
              statusFilter === filter.key
                ? 'text-indigo-600 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    opacity: 0.99,
  }
});
