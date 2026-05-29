import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient, getImageUrl } from '../api/client';
import { BentoCard } from '../components/ui/BentoCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ArrowLeft, MapPin, ThumbsUp } from 'lucide-react-native';

export default function MyReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await apiClient.get('/my-reports');
      if (res.data?.data) {
        setReports(res.data.data);
      }
    } catch (e) {
      console.log('Error fetching my reports', e);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      {/* Header */}
      <View className="pt-12 pb-4 px-4 flex-row items-center bg-white dark:bg-zen-darkBg shadow-sm z-10">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text className="font-display text-xl font-bold text-gray-900 dark:text-white">Riwayat Laporan Saya</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {reports.length === 0 ? (
            <View className="py-10 items-center">
              <Text className="font-sans text-gray-500">Anda belum membuat laporan.</Text>
            </View>
          ) : (
            reports.map((report) => (
              <TouchableOpacity 
                key={report.id} 
                activeOpacity={0.9}
                onPress={() => router.push(`/(tabs)/reports/${report.id}` as any)}
                className="mb-4"
              >
                <BentoCard className="p-0 overflow-hidden shadow-sm">
                  {(report.image_urls && report.image_urls.length > 0) || report.image_url ? (
                    <Image 
                      source={{ uri: getImageUrl(report.image_urls?.[0] || report.image_url) }} 
                      className="w-full h-40 bg-gray-200" 
                    />
                  ) : (
                    <View className="w-full h-40 bg-gray-100 dark:bg-gray-800 items-center justify-center">
                      <Text className="font-sans text-gray-400">Tidak ada foto</Text>
                    </View>
                  )}
                  <View className="p-4">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="font-display text-lg font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                          {report.category?.name || 'Laporan Umum'}
                        </Text>
                        <Text className="font-sans text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleDateString('id-ID')}
                        </Text>
                      </View>
                      <StatusBadge status={report.status} />
                    </View>
                    <Text className="font-sans text-gray-700 dark:text-gray-300 mb-3" numberOfLines={2}>
                      {report.description}
                    </Text>
                    <View className="flex-row items-center justify-between mt-1">
                      <View className="flex-row items-center flex-1 mr-2">
                        <MapPin color="#9ca3af" size={14} className="mr-1" />
                        <Text className="font-sans text-xs text-gray-500" numberOfLines={1}>
                          {report.location_detail || 'Lokasi tidak spesifik'}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <ThumbsUp color="#10b981" size={14} className="mr-1" />
                        <Text className="font-sans text-xs font-bold text-zen-accent">{report.vote_count || 0}</Text>
                      </View>
                    </View>
                  </View>
                </BentoCard>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
