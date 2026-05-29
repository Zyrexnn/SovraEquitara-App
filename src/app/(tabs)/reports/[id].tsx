import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, getImageUrl } from '../../../api/client';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { BentoCard } from '../../../components/ui/BentoCard';
import { ArrowLeft, MapPin, ThumbsUp } from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  const fetchReportDetails = async () => {
    try {
      // In a real app we'd fetch specific report by ID
      // If endpoint isn't ready we can fetch all public and find by ID
      const res = await apiClient.get('/public-reports');
      if (res.data?.data) {
        const found = res.data.data.find((r: any) => r.id.toString() === id);
        setReport(found);
      }
    } catch (e) {
      console.log('Error fetching report', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!report) return;
    try {
      await apiClient.post(`/reports/${id}/upvote`);
      // Optimistic update
      setReport({ ...report, upvote_count: (report.upvote_count || 0) + 1 });
    } catch (e) {
      console.log('Error upvoting', e);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zen-bg dark:bg-zen-darkBg">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!report) {
    return (
      <View className="flex-1 items-center justify-center bg-zen-bg dark:bg-zen-darkBg px-4">
        <Text className="font-sans text-gray-500 mb-4">Laporan tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => router.back()} className="px-4 py-2 bg-gray-200 rounded-full">
          <Text className="font-sans font-semibold">Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      <View className="relative">
        {(report.image_urls && report.image_urls.length > 0) || report.image_url ? (
          <Image 
            source={{ uri: getImageUrl(report.image_urls?.[0] || report.image_url) }} 
            className="w-full h-64 bg-gray-200" 
          />
        ) : (
          <View className="w-full h-64 bg-gray-200 dark:bg-gray-800 items-center justify-center">
            <Text className="font-sans text-gray-400">Tidak ada foto</Text>
          </View>
        )}
        
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="absolute top-12 left-4 w-10 h-10 bg-black/30 rounded-full items-center justify-center"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
      </View>

      <View className="p-4 -mt-6">
        <BentoCard className="p-5 shadow-zen">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 mr-2">
              <Text className="font-display text-xl font-bold text-gray-900 dark:text-white mb-1">
                {report.category?.name || 'Laporan Umum'}
              </Text>
              <Text className="font-sans text-xs text-gray-500">
                Oleh {report.user?.full_name || 'Anonim'}
              </Text>
            </View>
            <StatusBadge status={report.status} />
          </View>

          <View className="flex-row items-start mt-2 mb-4">
            <MapPin color="#9ca3af" size={16} className="mr-1 mt-0.5" />
            <Text className="font-sans text-gray-600 dark:text-gray-300 flex-1">
              {report.location_detail || 'Lokasi tidak spesifik'}
            </Text>
          </View>

          <View className="h-px w-full bg-gray-100 dark:bg-gray-800 my-4" />

          <Text className="font-sans text-gray-800 dark:text-gray-200 leading-6">
            {report.description}
          </Text>

          <View className="h-px w-full bg-gray-100 dark:bg-gray-800 my-4" />

          <View className="flex-row justify-between items-center">
            <TouchableOpacity 
              onPress={handleUpvote}
              className="flex-row items-center px-4 py-2 bg-zen-accent/10 rounded-full"
            >
              <ThumbsUp color="#10b981" size={18} className="mr-2" />
              <Text className="font-sans font-bold text-zen-accent">
                {report.upvote_count || 0} Dukungan
              </Text>
            </TouchableOpacity>
            
            <Text className="font-sans text-xs text-gray-400">
              {new Date(report.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </Text>
          </View>
        </BentoCard>

        {report.ai_analysis && (
          <View className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <Text className="font-display font-semibold text-blue-800 dark:text-blue-300 mb-2">
              🤖 Analisis AI
            </Text>
            <Text className="font-sans text-sm text-blue-900 dark:text-blue-200 leading-5">
              {report.ai_analysis}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
