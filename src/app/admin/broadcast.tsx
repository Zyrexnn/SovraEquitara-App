import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { BentoCard } from '../../components/ui/BentoCard';
import { ArrowLeft, Megaphone, Info, AlertTriangle, ShieldAlert } from 'lucide-react-native';

export default function AdminBroadcastScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'INFO' | 'EMERGENCY'>('INFO');
  const [targetRole, setTargetRole] = useState<'ALL' | 'CITIZEN' | 'ADMIN'>('ALL');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!title.trim()) {
      setError('Judul pengumuman wajib diisi');
      return;
    }
    if (!message.trim()) {
      setError('Isi pengumuman wajib diisi');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/admin/notifications', {
        title: title.trim(),
        message: message.trim(),
        type: type,
        target_role: targetRole,
      });

      Alert.alert(
        'Sukses',
        'Pengumuman berhasil disebarluaskan ke seluruh sistem.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      console.log('Error creating broadcast notification', e);
      setError(e.response?.data?.error || 'Gagal mengirimkan pengumuman.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 60, paddingBottom: 40 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
            <ArrowLeft color="#374151" size={20} />
          </TouchableOpacity>
          <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white">Broadcast</Text>
        </View>

        {error ? <Text className="font-sans text-red-500 mb-4 text-center">{error}</Text> : null}

        {/* Info Bento Card */}
        <BentoCard className="p-5 mb-6 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
          <View className="flex-row items-start">
            <View className="p-2 bg-purple-500 rounded-xl mr-3">
              <Megaphone color="white" size={20} />
            </View>
            <View className="flex-1">
              <Text className="font-display font-bold text-purple-900 dark:text-purple-300 text-base">Kirim Pesan Publik</Text>
              <Text className="font-sans text-purple-700 dark:text-purple-400 text-xs leading-relaxed mt-1">
                Pesan yang Anda kirim akan langsung muncul di dasbor Warga/Admin yang ditargetkan. Gunakan dengan bijak untuk pengumuman penting atau darurat.
              </Text>
            </View>
          </View>
        </BentoCard>

        {/* Form Card */}
        <BentoCard className="p-5">
          <ZenInput
            label="Judul Pengumuman"
            placeholder="Contoh: Kerja Bakti Massal RT 05"
            value={title}
            onChangeText={setTitle}
          />

          <ZenInput
            label="Isi Pengumuman"
            placeholder="Tulis pesan lengkap Anda di sini..."
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
            style={{ textAlignVertical: 'top', height: 100 }}
          />

          {/* Type Selection */}
          <Text className="font-sans text-sm text-gray-500 dark:text-gray-400 mb-2">Tingkat Urgensi</Text>
          <View className="flex-row mb-4 justify-between">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setType('INFO')}
              className={`flex-1 flex-row justify-center items-center py-3 rounded-2xl border mr-2 ${
                type === 'INFO'
                  ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
                  : 'bg-gray-100 dark:bg-gray-800 border-transparent'
              }`}
            >
              <Info color={type === 'INFO' ? '#3b82f6' : '#9ca3af'} size={16} className="mr-2" />
              <Text className={`font-sans font-bold text-xs ${type === 'INFO' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                Informasi Umum
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setType('EMERGENCY')}
              className={`flex-1 flex-row justify-center items-center py-3 rounded-2xl border ml-2 ${
                type === 'EMERGENCY'
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-500'
                  : 'bg-gray-100 dark:bg-gray-800 border-transparent'
              }`}
            >
              <AlertTriangle color={type === 'EMERGENCY' ? '#ef4444' : '#9ca3af'} size={16} className="mr-2" />
              <Text className={`font-sans font-bold text-xs ${type === 'EMERGENCY' ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                Darurat / Emergency
              </Text>
            </TouchableOpacity>
          </View>

          {/* Target Role Selection */}
          <Text className="font-sans text-sm text-gray-500 dark:text-gray-400 mb-2">Target Penerima</Text>
          <View className="flex-row mb-6 justify-between">
            {(['ALL', 'CITIZEN', 'ADMIN'] as const).map((role, idx) => (
              <TouchableOpacity 
                key={role}
                activeOpacity={0.8}
                onPress={() => setTargetRole(role)}
                className={`flex-1 py-3 rounded-2xl border justify-center items-center ${
                  idx > 0 ? 'ml-2' : ''
                } ${
                  targetRole === role
                    ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-500'
                    : 'bg-gray-100 dark:bg-gray-800 border-transparent'
                }`}
              >
                <Text className={`font-sans font-bold text-[11px] ${
                  targetRole === role ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'
                }`}>
                  {role === 'ALL' ? 'Semua Pengguna' : role === 'CITIZEN' ? 'Warga Saja' : 'Admin Saja'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ZenButton 
            label="Kirim Broadcast Sekarang" 
            className="bg-purple-600" 
            isLoading={isLoading} 
            onPress={handleSend} 
          />
        </BentoCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
