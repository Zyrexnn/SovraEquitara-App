import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { apiClient, getImageUrl } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Search, Shield, Filter, FileText, CheckCircle, Clock, AlertTriangle, Megaphone, MessageSquare, Sparkles } from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VALID' | 'RESOLVED'>('ALL');

  const fetchReports = async () => {
    try {
      const res = await apiClient.get('/admin/reports');
      if (res.data?.data) {
        setReports(res.data.data);
      }
    } catch (e) {
      console.log('Failed to fetch admin reports', e);
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

  // Compute stats on the client side
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'PENDING').length,
    verified: reports.filter(r => r.status === 'VALID').length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
  };

  // Filtered reports
  const filteredReports = reports.filter(r => {
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
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingTop: 60, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="mb-6 flex-row justify-between items-center">
          <View>
            <Text className="font-sans text-gray-500 dark:text-gray-400">Konsol Utama</Text>
            <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white">
              {user?.full_name || 'Admin'}
            </Text>
          </View>
          <View className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full flex-row items-center">
            <Shield color="#6366f1" size={14} className="mr-1.5" />
            <Text className="font-sans font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase">
              {user?.role || 'ADMIN'}
            </Text>
          </View>
        </View>

        {/* Stats Bento Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] mb-4">
            <BentoCard className="bg-indigo-500 justify-between py-6">
              <View className="flex-row justify-between items-center">
                <Text className="font-sans text-indigo-100 text-xs font-bold uppercase tracking-wider">Total Laporan</Text>
                <FileText color="white" size={16} />
              </View>
              <Text className="font-display text-3xl font-bold text-white mt-2">{stats.total}</Text>
            </BentoCard>
          </View>

          <View className="w-[48%] mb-4">
            <BentoCard className="bg-amber-500 justify-between py-6">
              <View className="flex-row justify-between items-center">
                <Text className="font-sans text-amber-100 text-xs font-bold uppercase tracking-wider">Pending</Text>
                <Clock color="white" size={16} />
              </View>
              <Text className="font-display text-3xl font-bold text-white mt-2">{stats.pending}</Text>
            </BentoCard>
          </View>

          <View className="w-[48%] mb-4">
            <BentoCard className="bg-emerald-500 justify-between py-6">
              <View className="flex-row justify-between items-center">
                <Text className="font-sans text-emerald-100 text-xs font-bold uppercase tracking-wider">Terverifikasi</Text>
                <CheckCircle color="white" size={16} />
              </View>
              <Text className="font-display text-3xl font-bold text-white mt-2">{stats.verified}</Text>
            </BentoCard>
          </View>

          <View className="w-[48%] mb-4">
            <BentoCard className="bg-blue-500 justify-between py-6">
              <View className="flex-row justify-between items-center">
                <Text className="font-sans text-blue-100 text-xs font-bold uppercase tracking-wider">Selesai</Text>
                <CheckCircle color="white" size={16} />
              </View>
              <Text className="font-display text-3xl font-bold text-white mt-2">{stats.resolved}</Text>
            </BentoCard>
          </View>
        </View>

        {/* Fitur Administrasi Bento Cards */}
        <View className="mb-6">
          <Text className="font-display text-lg font-bold text-gray-900 dark:text-white mb-3">Tindakan Admin</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push('/admin/broadcast' as any)}
              className="w-[48%]"
            >
              <BentoCard className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 p-4 h-32 justify-between">
                <View className="p-2 bg-purple-500 rounded-xl self-start">
                  <Megaphone color="white" size={20} />
                </View>
                <View>
                  <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Kirim Pengumuman</Text>
                  <Text className="font-sans text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">Broadcast ke semua warga</Text>
                </View>
              </BentoCard>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push('/admin/helpdesk' as any)}
              className="w-[48%]"
            >
              <BentoCard className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 h-32 justify-between">
                <View className="p-2 bg-indigo-500 rounded-xl self-start">
                  <MessageSquare color="white" size={20} />
                </View>
                <View>
                  <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Kotak Bantuan</Text>
                  <Text className="font-sans text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">Pantau chat AI & warga</Text>
                </View>
              </BentoCard>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => router.push('/admin/ai-assistant' as any)}
            className="w-full mt-4"
          >
            <BentoCard className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 h-28 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="p-3 bg-emerald-505 bg-emerald-500 rounded-2xl mr-4 shadow-sm">
                  <Sparkles color="white" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="font-display font-bold text-gray-900 dark:text-white text-base">Asisten AI Analitis</Text>
                  <Text className="font-sans text-gray-500 dark:text-gray-400 text-xs mt-0.5 leading-relaxed" numberOfLines={2}>
                    Analisis kepadatan masalah kota dan rumuskan tanggapan aduan keluhan warga.
                  </Text>
                </View>
              </View>
              <Text className="font-sans text-emerald-500 font-bold text-lg">→</Text>
            </BentoCard>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Section */}
        <View className="mb-6 bg-white dark:bg-zen-cardBg p-4 rounded-3xl border border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-2xl mb-3">
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
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800'
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
        <Text className="font-display text-xl font-bold text-gray-900 dark:text-white mb-4">Laporan Masuk ({filteredReports.length})</Text>

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
              <BentoCard className="p-0 overflow-hidden shadow-sm flex-row h-28">
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
                    <Text className="font-sans text-gray-400 text-[10px] flex-1 mr-1" numberOfLines={1}>
                      Oleh: {report.profile?.full_name || 'Warga'}
                    </Text>
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
