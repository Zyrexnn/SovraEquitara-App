import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { MapPin, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({ pending: 0, resolved: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/reports/stats');
      if (res.data) setStats(res.data);
    } catch (e) {
      // Handle error or use mock data if backend isn't ready
      console.log('Failed to fetch stats', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ScrollView 
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
      contentContainerStyle={{ padding: 16, paddingTop: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="mb-6 flex-row justify-between items-center">
        <View>
          <Text className="font-sans text-gray-500 dark:text-gray-400">Selamat datang kembali,</Text>
          <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            {user?.full_name || 'Warga'}
          </Text>
        </View>
        <View className="bg-zen-accent/10 px-3 py-1 rounded-full">
          <Text className="font-sans font-bold text-zen-accent">{user?.points || 0} Pts</Text>
        </View>
      </View>

      {/* Bento Grid */}
      <View className="flex-row flex-wrap justify-between">
        
        {/* Large Card: Make a Report */}
        <TouchableOpacity 
          className="w-full mb-4" 
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/create-report')}
        >
          <BentoCard className="bg-zen-accent justify-between flex-row items-center">
            <View>
              <Text className="font-display text-xl font-bold text-white mb-1">Lapor Masalah</Text>
              <Text className="font-sans text-emerald-100 text-sm">Bantu kota menjadi lebih baik</Text>
            </View>
            <View className="bg-white/20 p-3 rounded-full">
              <AlertTriangle color="white" size={24} />
            </View>
          </BentoCard>
        </TouchableOpacity>

        {/* Medium Cards */}
        <TouchableOpacity 
          className="w-[48%] mb-4"
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/map')}
        >
          <BentoCard className="items-center py-8">
            <MapPin color="#3b82f6" size={32} className="mb-3" />
            <Text className="font-display font-semibold text-gray-800 dark:text-gray-100">Peta Interaktif</Text>
            <Text className="font-sans text-xs text-gray-500 text-center mt-1">Lihat laporan di sekitarmu</Text>
          </BentoCard>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-[48%] mb-4"
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/chat')}
        >
          <BentoCard className="items-center py-8">
            <MessageSquare color="#f59e0b" size={32} className="mb-3" />
            <Text className="font-display font-semibold text-gray-800 dark:text-gray-100">Tanya AI</Text>
            <Text className="font-sans text-xs text-gray-500 text-center mt-1">Asisten pintar kotamu</Text>
          </BentoCard>
        </TouchableOpacity>

        {/* Small Stat Cards */}
        <View className="w-[48%] mb-4">
          <BentoCard>
            <Text className="font-sans text-gray-500 text-sm">Laporan Selesai</Text>
            <View className="flex-row items-end mt-2">
              <Text className="font-display text-3xl font-bold text-zen-accent">{stats.resolved}</Text>
              <CheckCircle color="#10b981" size={16} className="ml-2 mb-2" />
            </View>
          </BentoCard>
        </View>

        <View className="w-[48%] mb-4">
          <BentoCard>
            <Text className="font-sans text-gray-500 text-sm">Sedang Diproses</Text>
            <View className="flex-row items-end mt-2">
              <Text className="font-display text-3xl font-bold text-status-pending">{stats.pending}</Text>
            </View>
          </BentoCard>
        </View>

        {/* Full width button to Feed */}
        <TouchableOpacity 
          className="w-full mb-4 mt-2" 
          activeOpacity={0.9}
          onPress={() => router.push('/feed' as any)}
        >
          <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl flex-row justify-between items-center">
            <Text className="font-display font-bold text-gray-800 dark:text-gray-100">Semua Laporan Publik</Text>
            <Text className="font-sans font-bold text-zen-accent">→</Text>
          </View>
        </TouchableOpacity>


      </View>
    </ScrollView>
  );
}
