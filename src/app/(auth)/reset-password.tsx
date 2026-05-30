import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../api/client';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { AppLogo } from '../../components/ui/AppLogo';
import { ArrowLeft } from 'lucide-react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [step, setStep] = useState<1 | 2>(1);
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Masukkan kode OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/verify-forgot-password-otp', {
        email: decodeURIComponent(email || ''),
        token: otp,
      });
      setStep(2);
    } catch (e: any) {
      console.log('Verify OTP failed', e);
      setError(e.response?.data?.error || 'Kode OTP salah atau sudah kadaluarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/forgot-password', {
        email: decodeURIComponent(email || ''),
      });
      Alert.alert('Sukses', 'Kode OTP baru telah dikirim ke email Anda.');
      setCountdown(60);
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      console.log('Resend OTP failed', e);
      setError(e.response?.data?.error || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
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
 
        {/* Logo and Title */}
        <View className="items-center mb-8">
          <AppLogo width={280} height={120} className="mb-2" />
          <Text className="font-display text-2xl font-black text-gray-900 dark:text-white text-center mt-4">Atur Ulang Sandi</Text>
          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 text-center mt-2 px-4 leading-normal">
            {step === 1 
              ? `Masukkan kode OTP yang dikirimkan ke `
              : `Langkah Terakhir: Tetapkan kata sandi baru untuk akun `
            }
            <Text className="font-bold text-emerald-500">{decodeURIComponent(email || '')}</Text>
          </Text>
        </View>

        {error ? (
          <View className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl mb-4">
            <Text className="font-sans text-xs text-red-500 text-center">{error}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View className="bg-zen-card dark:bg-zen-cardDark border border-zen-border dark:border-zen-borderDark p-8 rounded-bento shadow-zen">
          {step === 1 ? (
            <>
              <ZenInput
                label="Kode OTP (Token)"
                placeholder="Masukkan 6 digit OTP"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />

              <View className="flex-row justify-between items-center mt-1 mb-6">
                <TouchableOpacity
                  disabled={countdown > 0 || isLoading}
                  onPress={handleResendOTP}
                  className="py-1"
                >
                  <Text className={`font-sans text-xs font-bold ${
                    countdown > 0 ? 'text-gray-400' : 'text-emerald-500'
                  }`}>
                    {countdown > 0 ? `Kirim Ulang (${countdown}s)` : 'Kirim Ulang Kode'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ZenButton
                label="Verifikasi Kode"
                isLoading={isLoading}
                onPress={handleVerifyOTP}
              />
            </>
          ) : (
            <>
              <ZenInput
                label="Password Baru"
                placeholder="Minimal 6 karakter"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoFocus
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
                isLoading={isLoading}
                onPress={handleSubmit}
                className="mt-2"
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
