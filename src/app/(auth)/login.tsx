import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { AppLogo } from '../../components/ui/AppLogo';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data?.access_token && response.data?.user) {
        await login(response.data.access_token, response.data.user);
      } else {
        setError('Respons server tidak valid');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal login. Periksa kembali kredensial Anda.');
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
            Smart Living · Transparent Governance
          </Text>
        </View>

        <View className="bg-zen-card dark:bg-zen-cardDark border border-zen-border dark:border-zen-borderDark p-8 rounded-bento shadow-zen">
          <Text className="font-display text-2xl font-black text-gray-900 dark:text-white mb-6">Masuk</Text>
          
          {error ? <Text className="font-sans text-xs font-bold text-red-500 mb-4 text-center">{error}</Text> : null}

          <ZenInput
            label="Email"
            placeholder="nama@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
          
          <ZenInput
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/(auth)/forgot-password' as any)}
            className="self-end mt-1 mb-6"
          >
            <Text className="font-sans text-xs font-bold text-emerald-500 dark:text-emerald-400">Lupa Kata Sandi?</Text>
          </TouchableOpacity>

          <ZenButton 
            label="Masuk Ke Akun" 
            isLoading={isLoading} 
            onPress={handleLogin} 
          />

          <View className="flex-row justify-center mt-8 pt-6 border-t border-gray-100 dark:border-zinc-900/50">
            <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">Belum memiliki akun? </Text>
            <Link href="/(auth)/register" asChild>
              <Text className="font-sans text-xs font-bold text-emerald-500 dark:text-emerald-400">Daftar sekarang</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
