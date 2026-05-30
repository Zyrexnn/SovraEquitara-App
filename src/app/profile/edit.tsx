import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../../store/authStore';
import { apiClient, getImageUrl } from '../../api/client';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { BentoCard } from '../../components/ui/BentoCard';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, User as UserIcon, ShieldCheck } from 'lucide-react-native';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isAdminUser = ADMIN_ROLES.includes((user?.role || '').toUpperCase());

  // --- Profile form ---
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // --- Direct password change (Admin/Super Admin only) ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // --- OTP flow (for regular citizens) ---
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);

  // ---- Handlers ----

  const handleRequestPasswordChange = async () => {
    // For citizens only — sends OTP email
    setIsRequestingOtp(true);
    setError('');
    try {
      await apiClient.post('/auth/forgot-password', { email: user?.email });
      Alert.alert(
        'Kode OTP Terkirim',
        `Kode verifikasi OTP telah dikirim ke email Anda (${user?.email}).`,
        [
          {
            text: 'Masukkan OTP',
            onPress: () => {
              router.push({
                pathname: '/(auth)/reset-password',
                params: { email: user?.email },
              } as any);
            },
          },
        ]
      );
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal mengirimkan kode OTP ke email.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleDirectPasswordChange = async () => {
    // For Admin/Super Admin — changes password directly
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Semua kolom kata sandi wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.put('/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      Alert.alert('Berhasil', 'Kata sandi berhasil diperbarui.', [
        {
          text: 'OK',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordForm(false);
          },
        },
      ]);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Gagal memperbarui kata sandi. Periksa kembali kata sandi saat ini.');
    } finally {
      setIsChangingPassword(false);
    }
  };

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
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProfile();
      Alert.alert('Sukses', 'Foto profil berhasil diperbarui.');
    } catch (e: any) {
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
      const payload: any = { full_name: fullName };
      if (phoneNumber) payload.phone = phoneNumber;
      await apiClient.put('/profile', payload);
      await fetchProfile();
      Alert.alert('Sukses', 'Profil Anda berhasil diperbarui.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
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
            <ArrowLeft color={isDark ? '#e5e7eb' : '#374151'} size={20} />
          </TouchableOpacity>
          <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white">Edit Profil</Text>
        </View>

        {error ? (
          <View className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/30">
            <Text className="font-sans text-red-600 dark:text-red-400 text-xs text-center">{error}</Text>
          </View>
        ) : null}

        {/* Avatar Card */}
        <BentoCard className="items-center py-6 mb-6">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={pickImage}
            disabled={isUploading}
            className="relative"
          >
            <View className="w-28 h-28 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700 justify-center items-center">
              {user?.avatar_url ? (
                <Image source={{ uri: getImageUrl(user.avatar_url) }} className="w-full h-full" />
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
          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-3 font-semibold">Ketuk kamera untuk mengganti foto</Text>
        </BentoCard>

        {/* Profile Form Card */}
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
          <ZenButton
            label="Simpan Perubahan"
            className="bg-indigo-500 mt-2"
            isLoading={isLoading}
            onPress={handleSave}
          />
        </BentoCard>

        {/* Security Card */}
        <BentoCard className="p-5 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl mr-3">
              <ShieldCheck color={isDark ? '#818cf8' : '#6366f1'} size={20} />
            </View>
            <View>
              <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Keamanan Akun</Text>
              <Text className="font-sans text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
                {isAdminUser ? 'Ubah sandi langsung tanpa OTP' : 'Perbarui kata sandi akun Anda'}
              </Text>
            </View>
          </View>

          <View className="h-px w-full bg-gray-100 dark:bg-gray-800 mb-4" />

          {isAdminUser ? (
            /* Admin/Super Admin — Direct password change form */
            <>
              {!showPasswordForm ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowPasswordForm(true)}
                  className="w-full p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/10 flex-row items-center justify-center"
                >
                  <ShieldCheck color={isDark ? '#818cf8' : '#6366f1'} size={15} />
                  <Text className="font-sans font-bold text-sm text-indigo-600 dark:text-indigo-400 ml-2">Ubah Kata Sandi</Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <ZenInput
                    label="Kata Sandi Saat Ini"
                    placeholder="Masukkan sandi saat ini"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <ZenInput
                    label="Kata Sandi Baru"
                    placeholder="Minimal 6 karakter"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <ZenInput
                    label="Konfirmasi Sandi Baru"
                    placeholder="Ulangi kata sandi baru"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <View className="flex-row gap-3 mt-2">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setError('');
                      }}
                      className="flex-1 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 items-center"
                    >
                      <Text className="font-sans font-bold text-sm text-gray-500 dark:text-gray-400">Batal</Text>
                    </TouchableOpacity>
                    <ZenButton
                      label="Simpan Sandi"
                      className="flex-1 bg-indigo-500"
                      isLoading={isChangingPassword}
                      onPress={handleDirectPasswordChange}
                    />
                  </View>
                </View>
              )}
            </>
          ) : (
            /* Regular citizen — OTP-based flow */
            <ZenButton
              label="Ubah Kata Sandi (Kirim OTP)"
              className="bg-white dark:bg-zinc-800 border border-indigo-500/30"
              isLoading={isRequestingOtp}
              onPress={handleRequestPasswordChange}
            />
          )}
        </BentoCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
