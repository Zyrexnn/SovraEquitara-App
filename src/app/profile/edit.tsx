import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { apiClient, getImageUrl } from '../../api/client';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { BentoCard } from '../../components/ui/BentoCard';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, User as UserIcon } from 'lucide-react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(''); // Fetching profile details or phone if added
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin galeri untuk mengganti foto profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadAvatar(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Error picking image', e);
      Alert.alert('Error', 'Gagal memilih gambar.');
    }
  };

  const uploadAvatar = async (uri: string) => {
    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      const uriParts = uri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      const fileType = fileName.split('.').pop();

      formData.append('avatar', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: fileName,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      } as any);

      await apiClient.post('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await fetchProfile(); // Reload global profile to sync photo instantly
      Alert.alert('Sukses', 'Foto profil berhasil diperbarui.');
    } catch (e: any) {
      console.log('Error uploading avatar', e);
      setError(e.response?.data?.error || 'Gagal mengunggah foto profil.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName) {
      setError('Nama lengkap wajib diisi');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Endpoint expects PUT /api/profile
      const payload: any = {
        full_name: fullName,
      };

      if (phoneNumber) {
        payload.phone = phoneNumber;
      }
      if (password) {
        payload.password = password;
      }

      await apiClient.put('/profile', payload);
      await fetchProfile(); // Reload global store profile
      
      Alert.alert('Sukses', 'Profil Anda berhasil diperbarui.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      console.log('Error saving profile details', e);
      setError(e.response?.data?.error || 'Gagal memperbarui profil.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 60 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
            <ArrowLeft color="#374151" size={20} />
          </TouchableOpacity>
          <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white">Edit Profil</Text>
        </View>

        {error ? <Text className="font-sans text-red-500 mb-4 text-center">{error}</Text> : null}

        {/* Avatar Bento Card */}
        <BentoCard className="items-center py-6 mb-6">
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={pickImage}
            disabled={isUploading}
            className="relative"
          >
            <View className="w-28 h-28 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700 justify-center items-center">
              {user?.avatar_url ? (
                <Image 
                  source={{ uri: getImageUrl(user.avatar_url) }} 
                  className="w-full h-full" 
                />
              ) : (
                <UserIcon color="#9ca3af" size={56} />
              )}
            </View>
            <View className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full shadow-lg border border-white dark:border-gray-900">
              {isUploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Camera color="white" size={16} />
              )}
            </View>
          </TouchableOpacity>
          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-3 font-semibold">Ketuk tombol kamera untuk mengganti foto</Text>
        </BentoCard>

        {/* Text Form Card */}
        <BentoCard className="p-5 mb-6">
          <ZenInput
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            value={fullName}
            onChangeText={setFullName}
          />

          <ZenInput
            label="Nomor Telepon (Opsional)"
            placeholder="Masukkan nomor telepon"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <ZenInput
            label="Password Baru (Opsional)"
            placeholder="Masukkan password baru untuk mengganti"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <ZenButton 
            label="Simpan Perubahan" 
            className="mt-4 bg-indigo-500" 
            isLoading={isLoading} 
            onPress={handleSave} 
          />
        </BentoCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
