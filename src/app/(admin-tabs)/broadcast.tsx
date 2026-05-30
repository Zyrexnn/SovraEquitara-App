import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient } from '../../api/client';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { BentoCard } from '../../components/ui/BentoCard';
import { Megaphone, Info, AlertTriangle, Trash2, Edit2 } from 'lucide-react-native';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_role: string;
  created_at: string;
}

export default function AdminBroadcastTab() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'INFO' | 'EMERGENCY'>('INFO');
  const [targetRole, setTargetRole] = useState<'ALL' | 'CITIZEN' | 'ADMIN'>('ALL');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsFetching(true);
      const res = await apiClient.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (e) {
      console.log('Failed to fetch notifications in tab', e);
    } finally {
      setIsFetching(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setType('INFO');
    setTargetRole('ALL');
    setEditingId(null);
    setError('');
  };

  const handleEdit = (notif: Notification) => {
    setTitle(notif.title);
    setMessage(notif.message);
    setType(notif.type as 'INFO' | 'EMERGENCY');
    setTargetRole(notif.target_role === 'USER' ? 'CITIZEN' : notif.target_role === 'SUPERADMIN' ? 'ADMIN' : notif.target_role as any);
    setEditingId(notif.id);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Hapus Pengumuman',
      'Apakah Anda yakin ingin menghapus pengumuman ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/admin/notifications/${id}`);
              fetchNotifications();
              if (editingId === id) resetForm();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.error || 'Gagal menghapus notifikasi');
            }
          }
        }
      ]
    );
  };

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
      const payload = {
        title: title.trim(),
        message: message.trim(),
        type: type,
        target_role: targetRole === 'CITIZEN' ? 'USER' : targetRole,
      };

      if (editingId) {
        await apiClient.put(`/admin/notifications/${editingId}`, payload);
        Alert.alert('Sukses', 'Pengumuman berhasil diperbarui.');
      } else {
        await apiClient.post('/admin/notifications', payload);
        Alert.alert('Sukses', 'Pengumuman berhasil disebarluaskan ke seluruh sistem.');
      }
      
      resetForm();
      fetchNotifications();
    } catch (e: any) {
      console.log('Error creating/updating broadcast notification in tab', e);
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
      {/* Header */}
      <View className="pt-14 pb-4 px-4 bg-white dark:bg-zen-cardDark border-b border-zen-border dark:border-zen-borderDark shadow-sm z-10 flex-row justify-between items-center">
        <View>
          <Text className="font-display text-xl font-bold text-gray-900 dark:text-white">Broadcast Pengumuman</Text>
          <Text className="font-sans text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Kirim Notifikasi & Info Darurat</Text>
        </View>
        <View className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl">
          <Megaphone color="#a855f7" size={20} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 40 }}>
        {error ? <Text className="font-sans text-red-500 mb-4 text-center">{error}</Text> : null}

        {/* Info Bento Card */}
        <BentoCard className="p-5 mb-6 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
          <View className="flex-row items-start">
            <View className="p-2 bg-purple-500 rounded-xl mr-3">
              <Megaphone color="white" size={20} />
            </View>
            <View className="flex-1">
              <Text className="font-display font-bold text-purple-900 dark:text-purple-300 text-base">
                {editingId ? 'Edit Pesan Publik' : 'Kirim Pesan Publik'}
              </Text>
              <Text className="font-sans text-purple-700 dark:text-purple-400 text-xs leading-relaxed mt-1">
                Pesan yang Anda kirim akan langsung muncul di dasbor Warga/Admin yang ditargetkan. Gunakan dengan bijak untuk pengumuman penting atau darurat.
              </Text>
            </View>
          </View>
        </BentoCard>

        {/* Form Card */}
        <BentoCard className="p-5 mb-6">
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

          <View className="flex-row gap-2">
            {editingId && (
              <TouchableOpacity 
                onPress={resetForm}
                className="flex-1 bg-gray-200 dark:bg-gray-700 py-4 rounded-2xl items-center justify-center"
              >
                <Text className="font-sans font-bold text-gray-700 dark:text-gray-300">Batal</Text>
              </TouchableOpacity>
            )}
            <ZenButton 
              label={editingId ? "Update Broadcast" : "Kirim Broadcast Sekarang"} 
              className={`flex-1 ${editingId ? 'bg-emerald-600' : 'bg-purple-600'}`}
              isLoading={isLoading} 
              onPress={handleSend} 
            />
          </View>
        </BentoCard>

        {/* History List */}
        <Text className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Riwayat Pengumuman</Text>
        {isFetching ? (
          <ActivityIndicator color="#8b5cf6" />
        ) : notifications.length === 0 ? (
          <Text className="font-sans text-center text-gray-500 dark:text-gray-400">Belum ada pengumuman.</Text>
        ) : (
          notifications.map(notif => (
            <BentoCard key={notif.id} className="p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center mb-1">
                    <Text className="font-display font-bold text-base text-gray-900 dark:text-white flex-1">{notif.title}</Text>
                    {notif.type === 'EMERGENCY' && (
                      <View className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded ml-2">
                        <Text className="font-sans text-[10px] text-red-600 dark:text-red-400 font-bold">EMERGENCY</Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • To: {notif.target_role}
                  </Text>
                </View>
                <View className="flex-row">
                  <TouchableOpacity onPress={() => handleEdit(notif)} className="p-2">
                    <Edit2 size={16} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(notif.id)} className="p-2">
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="font-sans text-sm text-gray-700 dark:text-gray-300" numberOfLines={2}>{notif.message}</Text>
            </BentoCard>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
