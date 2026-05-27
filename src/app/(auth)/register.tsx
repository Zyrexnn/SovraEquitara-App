import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { apiClient } from '../../api/client';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Semua kolom wajib diisi');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiClient.post('/auth/register', { 
        full_name: fullName, 
        email, 
        password 
      });
      
      setSuccess('Pendaftaran berhasil. Silakan cek email Anda untuk OTP.');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="items-center mb-6">
          <Text className="font-display text-4xl font-bold text-zen-accent mb-2">Mulai Bergabung</Text>
          <Text className="font-sans text-gray-500 dark:text-gray-400 text-center">
            Suarakan aspirasi Anda untuk kota yang lebih baik.
          </Text>
        </View>

        <View className="bg-zen-surface dark:bg-zen-darkSurface p-6 rounded-bento shadow-zen">
          <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6">Daftar Akun Baru</Text>
          
          {error ? <Text className="font-sans text-red-500 mb-4 text-center">{error}</Text> : null}
          {success ? <Text className="font-sans text-zen-accent mb-4 text-center">{success}</Text> : null}

          <ZenInput
            label="Nama Lengkap"
            placeholder="John Doe"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />

          <ZenInput
            label="Email"
            placeholder="nama@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          
          <ZenInput
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <ZenInput
            label="Konfirmasi Password"
            placeholder="••••••••"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <ZenButton 
            label="Daftar" 
            className="mt-4" 
            isLoading={isLoading} 
            onPress={handleRegister} 
          />

          <View className="flex-row justify-center mt-6">
            <Text className="font-sans text-gray-500 dark:text-gray-400">Sudah punya akun? </Text>
            <Link href="/(auth)/login" asChild>
              <Text className="font-sans font-semibold text-zen-accent">Masuk</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
