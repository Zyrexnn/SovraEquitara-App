import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Camera, MapPin, HardHat, Leaf, Building, ShieldAlert, Search } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { apiClient } from '../../api/client';

export default function CreateReportScreen() {
  const [description, setDescription] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [categoryId, setCategoryId] = useState(1); // Default Infrastruktur
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: -6.2088,
    longitude: 106.8456,
  });
  
  const webViewRef = useRef<WebView>(null);

  const router = useRouter();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi butuh akses lokasi untuk fitur ini.');
        return;
      }
      
      let enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert('GPS Mati', 'Mohon aktifkan GPS atau cari & geser penanda lokasi di peta secara manual.');
        setCoords({ lat: -6.2088, lng: 106.8456 }); // Default Jakarta
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setCoords({ lat, lng });
      setMapRegion({ latitude: lat, longitude: lng });
      webViewRef.current?.injectJavaScript(`window.updateMap(${lat}, ${lng}); true;`);
      Alert.alert('Sukses', 'Titik lokasi berhasil didapatkan!');
    } catch (error) {
      Alert.alert('GPS Bermasalah', 'Gagal mendapatkan lokasi otomatis. Silakan cari lokasi di peta secara manual.');
      setCoords({ lat: -6.2088, lng: 106.8456 }); // Default Jakarta
      webViewRef.current?.injectJavaScript(`window.updateMap(-6.2088, 106.8456); true;`);
    }
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=ID&limit=1&accept-language=id`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCoords({ lat, lng });
        setMapRegion({ latitude: lat, longitude: lng });
        webViewRef.current?.injectJavaScript(`window.updateMap(${lat}, ${lng}); true;`);
      } else {
        Alert.alert('Tidak Ditemukan', 'Lokasi tidak ditemukan di Indonesia.');
      }
    } catch (err) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat mencari lokasi. Periksa koneksi internet Anda.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!description || !coords || !image) {
      Alert.alert('Error', 'Deskripsi, foto, dan lokasi wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app with Expo, you'd upload the image as multipart/form-data
      // We'll simulate it or use a base64 for now depending on API support.
      // Assuming the backend expects multipart/form-data for image_url
      const formData = new FormData();
      formData.append('description', description);
      formData.append('location_detail', locationDetail);
      formData.append('latitude', coords.lat.toString());
      formData.append('longitude', coords.lng.toString());
      formData.append('category_id', categoryId.toString());
      
      const filename = image.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      
      // @ts-ignore
      formData.append('images', { uri: image, name: filename, type });

      await apiClient.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      Alert.alert('Sukses', 'Laporan berhasil dikirim!');
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Terjadi kesalahan saat mengirim laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-zen-bg dark:bg-zen-darkBg" contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
      <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6">Buat Laporan Baru</Text>

      <View className="bg-zen-surface dark:bg-zen-darkSurface p-5 rounded-bento shadow-zen mb-6">
        <Text className="font-display font-semibold text-lg mb-4 dark:text-white">1. Foto Bukti</Text>
        <TouchableOpacity 
          onPress={pickImage}
          className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl justify-center items-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700"
        >
          {image ? (
            <Image source={{ uri: image }} className="w-full h-full" />
          ) : (
            <>
              <Camera color="#9ca3af" size={32} className="mb-2" />
              <Text className="font-sans text-gray-500">Tap untuk unggah foto</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View className="bg-zen-surface dark:bg-zen-darkSurface p-5 rounded-bento shadow-zen mb-6">
        <Text className="font-display font-semibold text-lg mb-4 dark:text-white">Pilih Kategori Aduan</Text>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {[
            { id: 1, name: 'Infrastruktur', icon: HardHat, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
            { id: 2, name: 'Lingkungan', icon: Leaf, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
            { id: 3, name: 'Fasilitas Umum', icon: Building, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
            { id: 4, name: 'Keamanan', icon: ShieldAlert, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
          ].map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = categoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                activeOpacity={0.8}
                className={`flex-row items-center p-3 rounded-2xl border ${
                  isSelected 
                    ? 'bg-emerald-500/10 border-emerald-500 dark:border-emerald-400' 
                    : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700'
                }`}
                style={{ width: '48%' }}
              >
                <View className={`p-2 rounded-xl mr-2.5 ${cat.color}`}>
                  <IconComponent size={16} color={isSelected ? '#10b981' : '#6b7280'} />
                </View>
                <Text 
                  className={`font-sans font-bold text-[11px] flex-1 ${
                    isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="bg-zen-surface dark:bg-zen-darkSurface p-5 rounded-bento shadow-zen mb-6">
        <Text className="font-display font-semibold text-lg mb-4 dark:text-white">2. Lokasi</Text>
        
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1">
            <ZenInput
              placeholder="Cari Kota/Daerah..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            onPress={handleSearchLocation}
            disabled={isSearching}
            className="w-12 h-12 bg-zen-primary rounded-2xl items-center justify-center shadow-sm"
          >
            <Search color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        <View className="h-48 rounded-2xl overflow-hidden mb-4 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            style={{ flex: 1, backgroundColor: 'transparent' }}
            scrollEnabled={false}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.lat && data.lng) {
                  setCoords({ lat: data.lat, lng: data.lng });
                  setMapRegion({ latitude: data.lat, longitude: data.lng });
                }
              } catch (e) {}
            }}
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                  <style>
                    body { padding: 0; margin: 0; }
                    html, body, #map { height: 100%; width: 100%; background: transparent; }
                  </style>
                </head>
                <body>
                  <div id="map"></div>
                  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                  <script>
                    const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${mapRegion.latitude}, ${mapRegion.longitude}], 15);
                    
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                      subdomains: 'abcd',
                      crossOrigin: true
                    }).addTo(map);

                    let marker = L.marker([${mapRegion.latitude}, ${mapRegion.longitude}], { draggable: true }).addTo(map);

                    marker.on('dragend', function(e) {
                      const position = marker.getLatLng();
                      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: position.lat, lng: position.lng }));
                    });

                    map.on('click', function(e) {
                      marker.setLatLng(e.latlng);
                      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
                    });
                    
                    window.updateMap = function(lat, lng) {
                      map.setView([lat, lng], 15);
                      marker.setLatLng([lat, lng]);
                    };
                  </script>
                </body>
                </html>
              `
            }}
          />
        </View>

        <ZenButton 
          variant={coords ? 'secondary' : 'primary'}
          label={coords ? "Gunakan Lokasi Saat Ini (GPS)" : "Dapatkan Titik Lokasi"} 
          onPress={getLocation}
        />
        <View className="mt-4">
          <ZenInput
            placeholder="Detail Patokan (Misal: Depan Indomaret)"
            value={locationDetail}
            onChangeText={setLocationDetail}
          />
        </View>
      </View>

      <View className="bg-zen-surface dark:bg-zen-darkSurface p-5 rounded-bento shadow-zen mb-6">
        <Text className="font-display font-semibold text-lg mb-4 dark:text-white">3. Deskripsi</Text>
        <ZenInput
          placeholder="Jelaskan masalahnya secara rinci..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
          className="h-32"
        />
      </View>

      <ZenButton 
        label="Kirim Laporan" 
        onPress={handleSubmit} 
        isLoading={isLoading} 
        className="mb-8"
      />
    </ScrollView>
  );
}
