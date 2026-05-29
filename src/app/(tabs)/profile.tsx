import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { ZenButton } from '../../components/ui/ZenButton';
import { BentoCard } from '../../components/ui/BentoCard';
import { apiClient, getImageUrl } from '../../api/client';
import { LogOut, Award, User as UserIcon, Settings } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await apiClient.get('/leaderboard');
      if (res.data?.data) {
        setLeaderboard(res.data.data.slice(0, 5)); // Top 5
      }
    } catch (e) {
      console.log('Failed to fetch leaderboard', e);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
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
        <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white">Profil Saya</Text>
        <TouchableOpacity onPress={handleLogout} className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
          <LogOut color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>

      <BentoCard className="items-center mb-6 py-8">
        <View className="w-24 h-24 bg-zen-accent/20 rounded-full items-center justify-center mb-4 overflow-hidden border border-gray-100 dark:border-gray-800">
          {user?.avatar_url ? (
            <Image 
              source={{ uri: getImageUrl(user.avatar_url) }} 
              className="w-full h-full" 
            />
          ) : (
            <UserIcon color="#10b981" size={48} />
          )}
        </View>
        <Text className="font-display text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</Text>
        <Text className="font-sans text-gray-500 mb-4">{user?.email}</Text>
        
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
          <Award color="#f59e0b" size={20} className="mr-2" />
          <Text className="font-sans font-bold text-gray-800 dark:text-gray-200">
            {user?.points || 0} Poin Reputasi
          </Text>
        </View>
      </BentoCard>

      <TouchableOpacity 
        className="w-full mb-4" 
        activeOpacity={0.9}
        onPress={() => router.push('/profile/edit' as any)}
      >
        <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl flex-row justify-between items-center">
          <Text className="font-display font-bold text-gray-800 dark:text-gray-100">Edit Profil Saya</Text>
          <Settings color="#10b981" size={18} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        className="w-full mb-6" 
        activeOpacity={0.9}
        onPress={() => router.push('/my-reports' as any)}
      >
        <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl flex-row justify-between items-center">
          <Text className="font-display font-bold text-gray-800 dark:text-gray-100">Riwayat Laporan Saya</Text>
          <Text className="font-sans font-bold text-zen-accent">→</Text>
        </View>
      </TouchableOpacity>

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

      <Text className="font-display text-xl font-bold text-gray-900 dark:text-white mb-4 mt-2">Papan Peringkat (Top 5)</Text>
      
      <BentoCard className="p-0 overflow-hidden">
        {leaderboard.length > 0 ? leaderboard.map((item, index) => (
          <View 
            key={item.id} 
            className={`flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800 ${
              item.id === user?.id ? 'bg-zen-accent/10' : ''
            }`}
          >
            <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
              index === 0 ? 'bg-yellow-400' :
              index === 1 ? 'bg-gray-300' :
              index === 2 ? 'bg-amber-600' : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Text className="font-sans font-bold text-gray-800">{index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-display font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
                {item.full_name} {item.id === user?.id && '(Anda)'}
              </Text>
            </View>
            <Text className="font-sans font-bold text-zen-accent">{item.points} pts</Text>
          </View>
        )) : (
          <View className="p-6 items-center">
            <Text className="font-sans text-gray-500">Belum ada data peringkat.</Text>
          </View>
        )}
      </BentoCard>

      <View className="mt-8 mb-8">
        <Text className="font-sans text-center text-gray-400 text-xs">
          SovraEquitara Mobile App v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
