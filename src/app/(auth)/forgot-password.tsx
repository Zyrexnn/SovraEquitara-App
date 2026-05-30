import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { AppLogo } from '../../components/ui/AppLogo';
import { ArrowLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      setError('Masukkan email Anda');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      Alert.alert('Sukses', res.data?.message || 'Kode OTP reset sandi telah dikirim ke email Anda.', [
        { 
          text: 'Lanjutkan', 
          onPress: () => router.push(`/(auth)/reset-password?email=${encodeURIComponent(email)}` as any)
        }
      ]);
    } catch (e: any) {
      console.log('Forgot password request failed', e);
      setError(e.response?.data?.error || 'Gagal memproses permintaan reset sandi. Pastikan email terdaftar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Link */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="absolute top-14 left-6 p-3 bg-white dark:bg-zen-cardDark rounded-full border border-zen-border dark:border-zen-borderDark shadow-sm"
        >
          <ArrowLeft color="#10b981" size={20} />
        </TouchableOpacity>

        {/* Logo */}
        <View className="items-center mb-8">
          <AppLogo width={280} height={120} className="mb-2" />
          <Text className="font-display text-2xl font-black text-gray-900 dark:text-white text-center mt-4">Pulihkan Sandi</Text>
          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 text-center mt-2 px-4 leading-normal">
            Masukkan alamat email Anda untuk menerima kode OTP pemulihan keamanan akun.
          </Text>
        </View>

        {error ? (
          <View className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl mb-4">
            <Text className="font-sans text-xs text-red-500 text-center">{error}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View className="bg-zen-card dark:bg-zen-cardDark border border-zen-border dark:border-zen-borderDark p-8 rounded-bento shadow-zen">
          <ZenInput
            label="Email Terdaftar"
            placeholder="contoh@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <ZenButton
            label="Kirim Kode Pemulihan"
            isLoading={isLoading}
            onPress={handleSubmit}
            className="mt-2"
          />
        </View>

        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-8 items-center"
        >
          <Text className="font-sans font-bold text-xs text-emerald-500 dark:text-emerald-400">Kembali ke Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
