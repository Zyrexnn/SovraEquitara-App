import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Camera, MapPin } from 'lucide-react-native';
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
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aplikasi butuh akses lokasi untuk fitur ini.');
      return;
    }
    
    let loc = await Location.getCurrentPositionAsync({});
    setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    Alert.alert('Sukses', 'Titik lokasi berhasil didapatkan!');
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
        <Text className="font-display font-semibold text-lg mb-4 dark:text-white">2. Lokasi</Text>
        <ZenButton 
          variant={coords ? 'secondary' : 'primary'}
          label={coords ? "Lokasi Tersimpan ✓" : "Dapatkan Titik Lokasi"} 
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
