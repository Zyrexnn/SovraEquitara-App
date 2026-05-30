import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { BentoCard } from '../../components/ui/BentoCard';
import { apiClient, getImageUrl } from '../../api/client';
import { LogOut, User as UserIcon, Shield, Settings, ShieldAlert, Award } from 'lucide-react-native';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout, fetchProfile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Keluar', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Auth guard will automatically redirect
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
      contentContainerStyle={{ padding: 16, paddingTop: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="mb-6 flex-row justify-between items-center">
        <Text className="font-display text-2xl font-black text-stone-900 dark:text-white">
          {user?.role?.toLowerCase() === 'super_admin' || user?.role?.toLowerCase() === 'superadmin' ? 'Profil Super Admin' : 'Profil Admin'}
        </Text>
        <TouchableOpacity onPress={handleLogout} className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
          <LogOut color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>

      <BentoCard className="items-center mb-6 py-8">
        <View className="w-24 h-24 bg-indigo-500/10 rounded-full items-center justify-center mb-4 overflow-hidden border border-gray-100 dark:border-gray-800">
          {user?.avatar_url ? (
            <Image 
              source={{ uri: getImageUrl(user.avatar_url) }} 
              className="w-full h-full" 
            />
          ) : (
            <UserIcon color="#6366f1" size={48} />
          )}
        </View>
        <Text className="font-display text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</Text>
        <Text className="font-sans text-gray-500 mb-4">{user?.email}</Text>
        
        <View className="flex-row items-center bg-indigo-100 dark:bg-indigo-900/30 px-4 py-2 rounded-full">
          <Shield color="#6366f1" size={16} className="mr-2" />
          <Text className="font-sans font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest text-xs">
            {user?.role || 'ADMIN'}
          </Text>
        </View>
      </BentoCard>

      <TouchableOpacity 
        className="w-full mb-6" 
        activeOpacity={0.9}
        onPress={() => router.push('/profile/edit' as any)}
      >
        <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl flex-row justify-between items-center">
          <Text className="font-display font-bold text-gray-800 dark:text-gray-100">Edit Profil Saya</Text>
          <Settings color="#6366f1" size={18} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        className="w-full mb-6" 
        activeOpacity={0.9}
        onPress={() => router.push('/admin/leaderboard' as any)}
      >
        <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl flex-row justify-between items-center">
          <Text className="font-display font-bold text-gray-800 dark:text-gray-100">Peringkat Warga (Leaderboard)</Text>
          <Award color="#6366f1" size={18} />
        </View>
      </TouchableOpacity>

      {/* Super Admin Console Shortcut */}
      {(user?.role?.toLowerCase() === 'super_admin' || user?.role?.toLowerCase() === 'superadmin') && (
        <TouchableOpacity 
          className="w-full mb-6" 
          activeOpacity={0.9}
          onPress={() => router.push('/superadmin' as any)}
        >
          <BentoCard className="bg-amber-500 dark:bg-amber-950/20 border border-amber-400/30 p-4 h-24 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="p-2.5 bg-white/20 dark:bg-amber-500/20 rounded-xl mr-3">
                <ShieldAlert color="white" size={22} />
              </View>
              <View className="flex-1">
                <Text className="font-display font-bold text-white text-base">Konsol Super Admin</Text>
                <Text className="font-sans text-amber-100 dark:text-amber-300 text-[10px] mt-0.5" numberOfLines={1}>
                  Kelola Akses Admin & Direktori Warga Kota
                </Text>
              </View>
            </View>
            <Text className="font-sans text-white font-bold text-lg">→</Text>
          </BentoCard>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        className="w-full mb-6" 
        activeOpacity={0.9}
        onPress={handleLogout}
      >
        <View className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex-row justify-between items-center">
          <Text className="font-display font-bold text-red-600 dark:text-red-400">Keluar dari Akun</Text>
          <LogOut color="#ef4444" size={18} />
        </View>
      </TouchableOpacity>

      <BentoCard className="p-6 mb-6">
        <Text className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">Konsol Admin</Text>
        <Text className="font-sans text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          Anda masuk sebagai Administrator SovraEquitara. Anda memiliki otoritas untuk memoderasi laporan publik yang dikirimkan oleh warga, memverifikasi kevalidannya, dan menandainya sebagai terselesaikan setelah tindak lanjut dilakukan.
        </Text>
      </BentoCard>

      <View className="mt-8 mb-8">
        <Text className="font-sans text-center text-gray-400 text-xs">
          SovraEquitara Mobile App v1.0.0 (Console)
        </Text>
      </View>
    </ScrollView>
  );
}
