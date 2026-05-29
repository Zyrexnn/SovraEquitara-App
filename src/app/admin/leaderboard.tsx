import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient, getImageUrl } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { ArrowLeft, Search, Award, User as UserIcon, Shield } from 'lucide-react-native';

export default function AdminLeaderboardScreen() {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await apiClient.get('/leaderboard');
      if (res.data?.data) {
        setLeaderboardData(res.data.data);
      } else if (Array.isArray(res.data)) {
        setLeaderboardData(res.data);
      }
    } catch (e) {
      console.log('Failed to fetch leaderboard in admin console', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredData = leaderboardData.filter(user => {
    const name = user.full_name || '';
    const email = user.email || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white dark:bg-zen-darkSurface shadow-sm flex-row items-center border-b border-gray-100 dark:border-gray-800 z-10">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
          <ArrowLeft color="#374151" size={20} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-display font-bold text-lg dark:text-white">Peringkat Warga</Text>
          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400">Kontribusi Masyarakat SovraEquitara</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="p-4 bg-white dark:bg-zen-darkSurface border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-2xl">
          <Search color="#9ca3af" size={18} className="mr-2" />
          <TextInput
            placeholder="Cari nama warga..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 font-sans text-sm text-gray-900 dark:text-white"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View className="py-12 justify-center items-center">
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        ) : filteredData.length === 0 ? (
          <View className="py-12 items-center">
            <View className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
              <Award color="#9ca3af" size={32} />
            </View>
            <Text className="font-sans text-gray-500 dark:text-gray-400 text-center">
              Tidak ada data peringkat ditemukan.
            </Text>
          </View>
        ) : (
          <View className="gap-3.5">
            {filteredData.map((item, index) => {
              const rank = index + 1;
              const avatarUrl = getImageUrl(item.avatar_url);
              const isTopThree = rank <= 3;
              
              // Top 3 distinct crown styling matching HSL zen web FE
              const rankColorBg = rank === 1 ? 'bg-amber-400/25 border-amber-400/30' 
                                : rank === 2 ? 'bg-slate-300/25 border-slate-300/30' 
                                : rank === 3 ? 'bg-amber-700/20 border-amber-700/25' : 'bg-transparent';
              
              const rankBadgeBg = rank === 1 ? 'bg-amber-500' 
                                : rank === 2 ? 'bg-slate-400' 
                                : rank === 3 ? 'bg-amber-700' : 'bg-gray-100 dark:bg-gray-850';

              const rankBadgeTextColor = rank <= 3 ? 'text-white' : 'text-gray-500 dark:text-gray-400';

              return (
                <BentoCard 
                  key={item.id || index} 
                  className={`p-4 flex-row items-center justify-between rounded-[24px] ${rankColorBg} transition-all`}
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    {/* Rank Badge */}
                    <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${rankBadgeBg} border border-gray-100/10`}>
                      <Text className={`font-display font-black text-xs ${rankBadgeTextColor}`}>
                        {rank}
                      </Text>
                    </View>

                    {/* Avatar */}
                    <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mr-3 overflow-hidden border border-gray-250 dark:border-gray-700/50">
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                      ) : (
                        <UserIcon color="#9ca3af" size={16} />
                      )}
                    </View>

                    {/* Full Name */}
                    <View className="flex-1">
                      <Text className="font-display font-bold text-gray-900 dark:text-white text-sm" numberOfLines={1}>
                        {item.full_name || 'Warga SovraEquitara'}
                      </Text>
                      {item.role && item.role.toLowerCase() !== 'user' && (
                        <View className="flex-row items-center mt-0.5">
                          <Shield color="#3b82f6" size={8} className="mr-0.5" />
                          <Text className="font-sans text-[8px] font-black text-blue-500 uppercase tracking-widest">{item.role}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Points Badge */}
                  <View className="bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full border border-amber-100/10 flex-row items-center">
                    <Award color="#f59e0b" size={12} className="mr-1" />
                    <Text className="font-display font-black text-[10px] text-amber-700 dark:text-amber-400">
                      {item.points || 0} PTS
                    </Text>
                  </View>
                </BentoCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
