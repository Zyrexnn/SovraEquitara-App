import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { apiClient } from '../../api/client';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useRouter } from 'expo-router';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
    
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await apiClient.get('/public-reports');
      if (res.data?.data) {
        setReports(res.data.data);
      }
    } catch (e) {
      console.log('Error fetching map reports', e);
    }
  };

  const initialRegion = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : {
    latitude: -6.200000, // Default to Jakarta
    longitude: 106.816666,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={initialRegion}
        showsUserLocation={true}
      >
        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{ latitude: report.latitude, longitude: report.longitude }}
          >
            <View className={`p-2 rounded-full border-2 border-white shadow-sm ${
              report.status === 'PENDING' ? 'bg-status-pending' :
              report.status === 'VALID' ? 'bg-status-valid' :
              report.status === 'RESOLVED' ? 'bg-status-resolved' : 'bg-status-rejected'
            }`}>
              {/* Optional: Add icon inside marker based on category */}
            </View>
            <Callout onPress={() => router.push(`/(tabs)/reports/${report.id}` as any)}>
              <View style={styles.calloutContainer}>
                <Text className="font-display font-semibold mb-1" numberOfLines={1}>{report.category?.name || 'Laporan'}</Text>
                <Text className="font-sans text-xs text-gray-500 mb-2" numberOfLines={2}>{report.description}</Text>
                <StatusBadge status={report.status} />
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      {/* Floating Header */}
      <View className="absolute top-12 left-4 right-4 bg-white/90 dark:bg-black/90 p-4 rounded-2xl shadow-zen backdrop-blur-md">
        <Text className="font-display text-lg font-bold text-gray-900 dark:text-white">Peta Laporan</Text>
        <Text className="font-sans text-xs text-gray-500">Lihat masalah infrastruktur di sekitarmu</Text>
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
  },
  calloutContainer: {
    width: 200,
    padding: 8,
  }
});
