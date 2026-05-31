import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Image, TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { apiClient, getImageUrl } from '../api/client';
import { BentoCard } from '../components/ui/BentoCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ArrowLeft, MapPin, ThumbsUp, Search, X, Clock, Flame, MessageCircle, User as UserIcon } from 'lucide-react-native';

type SortMode = 'recent' | 'votes' | 'comments';

const SORT_TABS: { key: SortMode; label: string; Icon: any }[] = [
  { key: 'recent', label: 'Terbaru', Icon: Clock },
  { key: 'votes', label: 'Terpopuler', Icon: ThumbsUp },
  { key: 'comments', label: 'Teraktif', Icon: Flame },
];

export default function PublicFeedScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async (mode: SortMode = sortMode, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await apiClient.get(`/public-reports?sort=${mode}`);
      if (res.data?.data) {
        setReports(res.data.data);
      } else if (Array.isArray(res.data)) {
        setReports(res.data);
      }
    } catch (e) {
      console.log('Error fetching reports', e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports(sortMode, false);
    setRefreshing(false);
  };

  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    fetchReports(mode, true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports(sortMode, reports.length === 0);
    }, [sortMode])
  );

  // Client-side search filter
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter(r =>
      (r.description || '').toLowerCase().includes(q) ||
      (r.location_detail || '').toLowerCase().includes(q) ||
      (r.category?.name || '').toLowerCase().includes(q) ||
      (r.profile?.full_name || r.user?.full_name || '').toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">

      {/* Header */}
      <View className="pt-12 pb-3 px-4 bg-white dark:bg-zen-darkBg border-b border-zen-border dark:border-zen-borderDark z-10">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-2 bg-gray-100 dark:bg-gray-800/50 rounded-full"
          >
            <ArrowLeft color={isDark ? '#e5e7eb' : '#374151'} size={20} />
          </TouchableOpacity>
          <Text className="font-display text-xl font-bold text-gray-900 dark:text-white flex-1">
            Feed Laporan Publik
          </Text>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl px-4 py-2.5 border border-gray-200/50 dark:border-gray-700/30">
          <Search color={isDark ? '#6b7280' : '#9ca3af'} size={16} />
          <TextInput
            className="flex-1 ml-2.5 font-sans text-sm text-gray-800 dark:text-gray-200"
            placeholder="Cari laporan, lokasi, kategori..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <X color={isDark ? '#6b7280' : '#9ca3af'} size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sorting Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 -mx-1" contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}>
          {SORT_TABS.map(({ key, label, Icon }) => {
            const active = sortMode === key;
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.8}
                onPress={() => handleSortChange(key)}
                className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${
                  active
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-transparent border-gray-200 dark:border-gray-700/60'
                }`}
              >
                <Icon
                  color={active ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')}
                  size={13}
                />
                <Text
                  className={`font-sans font-bold text-xs ${
                    active ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Result count */}
          {searchQuery.length > 0 && (
            <Text className="font-sans text-xs text-gray-400 dark:text-gray-600 mb-3 pl-1">
              {filteredReports.length} hasil untuk "{searchQuery}"
            </Text>
          )}

          {filteredReports.length === 0 ? (
            <View className="py-16 items-center">
              <Search color={isDark ? '#374151' : '#e5e7eb'} size={40} />
              <Text className="font-sans text-gray-400 dark:text-gray-600 mt-3 text-center text-sm font-bold">
                {searchQuery ? 'Tidak ada laporan yang cocok.' : 'Belum ada laporan publik.'}
              </Text>
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} className="mt-3">
                  <Text className="font-sans text-xs font-bold text-emerald-500">Hapus pencarian</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            filteredReports.map((report) => (
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
                      className="w-full h-44 bg-gray-200"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-32 bg-gray-100 dark:bg-gray-800/60 items-center justify-center">
                      <Text className="font-sans text-gray-400 dark:text-gray-600 text-xs">Tidak ada foto</Text>
                    </View>
                  )}

                  <View className="p-4">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 items-center justify-center mr-2.5 overflow-hidden">
                          {report.profile?.avatar_url || report.user?.avatar_url ? (
                            <Image 
                              source={{ uri: getImageUrl(report.profile?.avatar_url || report.user?.avatar_url) }} 
                              className="w-full h-full" 
                            />
                          ) : (
                            <UserIcon color={isDark ? "#A1A1AA" : "#787774"} size={14} />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="font-display text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                            {report.category?.name || 'Laporan Umum'}
                          </Text>
                          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400">
                            Oleh {report.profile?.full_name || report.user?.full_name || 'Anonim'}
                          </Text>
                        </View>
                      </View>
                      <StatusBadge status={report.status} />
                    </View>

                    <Text className="font-sans text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed" numberOfLines={2}>
                      {report.description}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <MapPin color="#9ca3af" size={13} />
                        <Text className="font-sans text-xs text-gray-500 ml-1" numberOfLines={1}>
                          {report.location_detail || 'Lokasi tidak spesifik'}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center">
                          <ThumbsUp color="#10b981" size={13} />
                          <Text className="font-sans text-xs font-bold text-zen-accent ml-1">{report.vote_count || 0}</Text>
                        </View>
                        {(report.comment_count !== undefined || report.comments_count !== undefined) && (
                          <View className="flex-row items-center">
                            <MessageCircle color={isDark ? '#6b7280' : '#9ca3af'} size={13} />
                            <Text className="font-sans text-xs text-gray-400 ml-1">{report.comment_count || report.comments_count || 0}</Text>
                          </View>
                        )}
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
