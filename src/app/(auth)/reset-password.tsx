import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../api/client';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { BentoCard } from '../../components/ui/BentoCard';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!otp) {
      setError('Masukkan kode OTP');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/reset-password', {
        email: decodeURIComponent(email || ''),
        token: otp,
        new_password: newPassword,
      });

      Alert.alert('Sukses', res.data?.message || 'Kata sandi Anda berhasil diperbarui.', [
        { 
          text: 'Login Sekarang', 
          onPress: () => router.replace('/(auth)/login')
        }
      ]);
    } catch (e: any) {
      console.log('Reset password request failed', e);
      setError(e.response?.data?.error || 'Gagal mereset sandi. Kode OTP salah atau kedaluwarsa.');
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
        <View className="items-center mb-6">
          <View className="p-4 bg-emerald-500 rounded-3xl mb-4 shadow-sm">
            <ShieldCheck color="white" size={36} />
          </View>
          <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white text-center">Atur Ulang Sandi</Text>
          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 text-center mt-2 px-4 leading-normal">
            Masukkan kode OTP yang dikirimkan ke <Text className="font-bold text-indigo-500">{decodeURIComponent(email || '')}</Text> beserta kata sandi baru Anda.
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
            label="Kode OTP (Token)"
            placeholder="Masukkan 6 digit OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />

          <ZenInput
            label="Password Baru"
            placeholder="Minimal 6 karakter"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <ZenInput
            label="Konfirmasi Password Baru"
            placeholder="Ketik ulang password baru"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <ZenButton
            label="Perbarui Kata Sandi"
            className="mt-4 bg-emerald-500"
            isLoading={isLoading}
            onPress={handleSubmit}
          />
        </BentoCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
