import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { AppLogo } from '../../components/ui/AppLogo';
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <AppLogo width={280} height={120} className="mb-2" />
          <Text className="font-sans text-xs font-bold text-gray-400 dark:text-gray-500 text-center tracking-widest uppercase">
            Mulai Bergabung Untuk Perubahan
          </Text>
        </View>

        <View className="bg-zen-card dark:bg-zen-cardDark border border-zen-border dark:border-zen-borderDark p-8 rounded-bento shadow-zen">
          <Text className="font-display text-2xl font-black text-gray-900 dark:text-white mb-6">Daftar Akun</Text>
          
          {error ? <Text className="font-sans text-xs font-bold text-red-500 mb-4 text-center">{error}</Text> : null}
          {success ? <Text className="font-sans text-xs font-bold text-emerald-500 mb-4 text-center">{success}</Text> : null}

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
            label="Buat Akun Baru" 
            isLoading={isLoading} 
            onPress={handleRegister} 
            className="mt-2"
          />

          <View className="flex-row justify-center mt-8 pt-6 border-t border-gray-100 dark:border-zinc-900/50">
            <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">Sudah punya akun? </Text>
            <Link href="/(auth)/login" asChild>
              <Text className="font-sans text-xs font-bold text-emerald-500 dark:text-emerald-400">Masuk</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
