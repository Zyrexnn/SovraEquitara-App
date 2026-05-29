import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { BentoCard } from '../../components/ui/BentoCard';
import { ArrowLeft, KeyRound } from 'lucide-react-native';

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
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        {/* Back Link */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="absolute top-14 left-6 p-2 bg-gray-50 dark:bg-gray-800 rounded-full"
        >
          <ArrowLeft color="#374151" size={20} />
        </TouchableOpacity>

        {/* Title */}
        <View className="items-center mb-8">
          <View className="p-4 bg-indigo-500 rounded-3xl mb-4 shadow-sm">
            <KeyRound color="white" size={36} />
          </View>
          <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white text-center">Pulihkan Sandi</Text>
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
        <BentoCard className="p-5">
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
            className="mt-4 bg-indigo-500"
            isLoading={isLoading}
            onPress={handleSubmit}
          />
        </BentoCard>

        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-6 items-center"
        >
          <Text className="font-sans font-bold text-xs text-indigo-500 dark:text-indigo-400">Kembali ke Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
