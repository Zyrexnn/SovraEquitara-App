import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
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
        // RootLayout auth guard will handle role-based redirection automatically
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="items-center mb-10">
          <Text className="font-display text-4xl font-bold text-zen-accent mb-2">SovraEquitara</Text>
          <Text className="font-sans text-gray-500 dark:text-gray-400 text-center">
            Smart Living, Transparent Governance.
          </Text>
        </View>

        <View className="bg-zen-surface dark:bg-zen-darkSurface p-6 rounded-bento shadow-zen">
          <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6">Masuk</Text>
          
          {error ? <Text className="font-sans text-red-500 mb-4 text-center">{error}</Text> : null}

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

          <ZenButton 
            label="Login" 
            className="mt-4" 
            isLoading={isLoading} 
            onPress={handleLogin} 
          />

          <View className="flex-row justify-center mt-6">
            <Text className="font-sans text-gray-500 dark:text-gray-400">Belum punya akun? </Text>
            <Link href="/(auth)/register" asChild>
              <Text className="font-sans font-semibold text-zen-accent">Daftar sekarang</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
