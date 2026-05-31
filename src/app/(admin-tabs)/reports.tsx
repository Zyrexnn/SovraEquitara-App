import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient, getImageUrl } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Search, Bookmark, FileText, User as UserIcon } from 'lucide-react-native';

export default function AdminReportsTab() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VALID' | 'RESOLVED'>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'SAVED'>('ALL');

  const fetchReports = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/reports');
      if (res.data?.data) {
        setReports(res.data.data);
      }
    } catch (e) {
      console.log('Failed to fetch admin reports in tab', e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchSavedReports = async () => {
    try {
      const res = await apiClient.get('/admin/saved-reports');
      if (res.data?.data) {
        setSavedReports(res.data.data);
      }
    } catch (e) {
      console.log('Failed to fetch saved reports in tab', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchReports(false), fetchSavedReports()]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports(reports.length === 0);
      fetchSavedReports();
      const interval = setInterval(() => {
        fetchReports(false);
        fetchSavedReports();
      }, 8000);

      return () => {
        clearInterval(interval);
      };
    }, [reports.length])
  );

  // Filtered reports
  const currentReportsList = activeTab === 'ALL' ? reports : savedReports;
  const filteredReports = currentReportsList.filter(r => {
    const matchesSearch = searchQuery
      ? r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location_detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesStatus = statusFilter === 'ALL' ? true : r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 bg-white dark:bg-zen-cardDark border-b border-zen-border dark:border-zen-borderDark shadow-sm z-10 flex-row justify-between items-center">
        <View>
          <Text className="font-display text-xl font-bold text-gray-900 dark:text-white">Arsip Laporan Kota</Text>
          <Text className="font-sans text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Moderasi & Manajemen Pengaduan</Text>
        </View>
        <View className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl">
          <FileText color="#6366f1" size={20} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Toggle: Semua Laporan vs Laporan Tersimpan */}
        <View className="flex-row bg-white dark:bg-zen-cardDark p-1.5 rounded-2xl border border-zen-border dark:border-zen-borderDark mb-4 shadow-sm">
          <TouchableOpacity
            onPress={() => setActiveTab('ALL')}
            activeOpacity={0.8}
            className={`flex-1 py-3 rounded-xl items-center justify-center ${
              activeTab === 'ALL' ? 'bg-indigo-500' : 'bg-transparent'
            }`}
          >
            <Text className={`font-display font-bold text-xs ${activeTab === 'ALL' ? 'text-white' : 'text-gray-500'}`}>
              Semua Aduan Warga
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('SAVED')}
            activeOpacity={0.8}
            className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${
              activeTab === 'SAVED' ? 'bg-indigo-500' : 'bg-transparent'
            }`}
          >
            <Bookmark color={activeTab === 'SAVED' ? 'white' : '#6b7280'} size={12} className="mr-1.5" />
            <Text className={`font-display font-bold text-xs ${activeTab === 'SAVED' ? 'text-white' : 'text-gray-500'}`}>
              Tersimpan ({savedReports.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search & Status Filters */}
        <View className="mb-6 bg-white dark:bg-zen-cardDark p-4 rounded-[28px] border border-zen-border dark:border-zen-borderDark shadow-sm">
          <View className="flex-row items-center bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-2xl mb-3 border border-zen-border/30 dark:border-zen-borderDark/40">
            <Search color="#9ca3af" size={18} className="mr-2" />
            <TextInput
              placeholder="Cari laporan..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 font-sans text-sm text-gray-900 dark:text-white"
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {(['ALL', 'PENDING', 'VALID', 'RESOLVED'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl mr-2 flex-row items-center border ${
                  statusFilter === status
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'bg-gray-50 dark:bg-gray-800 border-zen-border dark:border-zen-borderDark'
                }`}
              >
                <Text 
                  className={`font-sans font-bold text-xs ${
                    statusFilter === status
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {status === 'ALL' ? 'Semua' : status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Reports List */}
        <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1">Laporan Masuk ({filteredReports.length})</Text>

        {isLoading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        ) : filteredReports.length === 0 ? (
          <View className="py-10 items-center">
            <Text className="font-sans text-gray-500">Tidak ada laporan yang sesuai.</Text>
          </View>
        ) : (
          filteredReports.map((report) => (
            <TouchableOpacity 
              key={report.id} 
              activeOpacity={0.9}
              onPress={() => router.push(`/admin/report/${report.id}` as any)}
              className="mb-4"
            >
              <BentoCard className="p-0 overflow-hidden shadow-sm flex-row h-28 border border-gray-100 dark:border-gray-800/80 rounded-3xl">
                {(report.image_urls && report.image_urls.length > 0) || report.image_url ? (
                  <Image 
                    source={{ uri: getImageUrl(report.image_urls?.[0] || report.image_url) }} 
                    className="w-28 h-full bg-gray-200" 
                  />
                ) : (
                  <View className="w-28 h-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
                    <Text className="font-sans text-gray-400 text-xs">Tidak ada foto</Text>
                  </View>
                )}
                <View className="flex-1 p-3 justify-between">
                  <View>
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="font-display font-bold text-gray-900 dark:text-white text-sm flex-1 mr-1" numberOfLines={1}>
                        {report.category?.name || 'Laporan Umum'}
                      </Text>
                      <StatusBadge status={report.status} />
                    </View>
                    <Text className="font-sans text-gray-600 dark:text-gray-300 text-xs" numberOfLines={2}>
                      {report.description}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-1">
                    <View className="flex-row items-center flex-1 mr-1">
                      <View className="w-5 h-5 rounded-full bg-gray-100 dark:bg-zinc-800 items-center justify-center mr-1.5 overflow-hidden">
                        {report.profile?.avatar_url || report.user?.avatar_url ? (
                          <Image 
                            source={{ uri: getImageUrl(report.profile?.avatar_url || report.user?.avatar_url) }} 
                            className="w-full h-full" 
                          />
                        ) : (
                          <UserIcon color={isDark ? "#A1A1AA" : "#787774"} size={10} />
                        )}
                      </View>
                      <Text className="font-sans text-gray-400 text-[10px] flex-1" numberOfLines={1}>
                        Oleh: {report.profile?.full_name || report.user?.full_name || 'Warga'}
                      </Text>
                    </View>
                    <Text className="font-sans text-[10px] font-bold text-indigo-500">Moderasi →</Text>
                  </View>
                </View>
              </BentoCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
