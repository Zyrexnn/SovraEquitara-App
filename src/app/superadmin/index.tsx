import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Users, 
  UserCheck, 
  Settings, 
  Shield, 
  FileText, 
  Clock, 
  CheckCircle, 
  Sparkles 
} from 'lucide-react-native';

export default function SuperAdminHub() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#f3f4f6' : '#374151';
  
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, resolved: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatsAndReports = async () => {
    try {
      const res = await apiClient.get('/admin/reports');
      if (res.data?.data) {
        const reports = res.data.data;
        setStats({
          total: reports.length,
          pending: reports.filter((r: any) => r.status === 'PENDING').length,
          verified: reports.filter((r: any) => r.status === 'VALID').length,
          resolved: reports.filter((r: any) => r.status === 'RESOLVED').length,
        });
      }
    } catch (e) {
      console.log('Failed to fetch stats for superadmin', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatsAndReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatsAndReports();
  };

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 bg-white dark:bg-zen-cardBg border-b border-gray-100 dark:border-gray-800/80 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity 
            onPress={() => router.replace('/(admin-tabs)/profile' as any)} 
            className="mr-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-full"
          >
            <ArrowLeft color={iconColor} size={18} />
          </TouchableOpacity>
          <View>
            <Text className="font-sans text-[10px] text-gray-500 font-bold uppercase tracking-wider">Konsol Utama</Text>
            <Text className="font-display text-2xl font-black text-gray-900 dark:text-white">Super Admin</Text>
          </View>
        </View>
        
        <View className="flex-row items-center gap-2">
          <View className="bg-amber-100 dark:bg-amber-950/40 px-3 py-1.5 rounded-full flex-row items-center border border-amber-200/20">
            <ShieldAlert color="#d97706" size={12} className="mr-1" />
            <Text className="font-sans font-black text-[#d97706] text-[9px] tracking-wider uppercase">SUPER_ADMIN</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/profile/edit' as any)}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"
          >
            <Settings color={isDark ? '#d1d5db' : '#4b5563'} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingTop: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View className="py-8 justify-center items-center">
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        ) : (
          /* Stats Grid Layout */
          <View className="mb-5">
            <View className="flex-row gap-4 mb-4">
              {/* Total Laporan */}
              <View className="flex-1">
                <BentoCard className="bg-indigo-50/70 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 p-4 rounded-3xl h-32 justify-between shadow-none">
                  <View className="p-2 bg-white dark:bg-zinc-900 rounded-xl self-start shadow-sm">
                    <FileText color="#6366f1" size={16} />
                  </View>
                  <View>
                    <Text className="font-display text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.total}</Text>
                    <Text className="font-sans text-[10px] font-bold text-indigo-700/80 dark:text-indigo-300/85 uppercase tracking-wider mt-0.5">Total Laporan</Text>
                  </View>
                </BentoCard>
              </View>

              {/* Pending Review */}
              <View className="flex-1">
                <BentoCard className="bg-amber-50/70 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 p-4 rounded-3xl h-32 justify-between shadow-none">
                  <View className="p-2 bg-white dark:bg-zinc-900 rounded-xl self-start shadow-sm">
                    <Clock color="#d97706" size={16} />
                  </View>
                  <View>
                    <Text className="font-display text-2xl font-black text-[#d97706] dark:text-amber-400">{stats.pending}</Text>
                    <Text className="font-sans text-[10px] font-bold text-amber-700/80 dark:text-amber-300/85 uppercase tracking-wider mt-0.5">Pending</Text>
                  </View>
                </BentoCard>
              </View>
            </View>

            <View className="flex-row gap-4">
              {/* Terverifikasi */}
              <View className="flex-1">
                <BentoCard className="bg-emerald-50/70 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 p-4 rounded-3xl h-32 justify-between shadow-none">
                  <View className="p-2 bg-white dark:bg-zinc-900 rounded-xl self-start shadow-sm">
                    <CheckCircle color="#10b981" size={16} />
                  </View>
                  <View>
                    <Text className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.verified}</Text>
                    <Text className="font-sans text-[10px] font-bold text-emerald-700/80 dark:text-emerald-300/85 uppercase tracking-wider mt-0.5">Terverifikasi</Text>
                  </View>
                </BentoCard>
              </View>

              {/* Terselesaikan */}
              <View className="flex-1">
                <BentoCard className="bg-blue-50/70 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 p-4 rounded-3xl h-32 justify-between shadow-none">
                  <View className="p-2 bg-white dark:bg-zinc-900 rounded-xl self-start shadow-sm">
                    <CheckCircle color="#3b82f6" size={16} />
                  </View>
                  <View>
                    <Text className="font-display text-2xl font-black text-blue-600 dark:text-blue-400">{stats.resolved}</Text>
                    <Text className="font-sans text-[10px] font-bold text-blue-700/80 dark:text-blue-300/85 uppercase tracking-wider mt-0.5">Selesai</Text>
                  </View>
                </BentoCard>
              </View>
            </View>
          </View>
        )}

        {/* Menu Navigasi Utama */}
        <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1">
          Menu Kontrol
        </Text>

        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => router.push('/superadmin/admins' as any)}
          className="mb-4"
        >
          <BentoCard className="flex-row items-center p-4 rounded-3xl border border-gray-100 dark:border-gray-800/80">
            <View className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl mr-4">
              <UserCheck color="#6366f1" size={22} />
            </View>
            <View className="flex-1 mr-2">
              <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">
                Kelola Akses Admin
              </Text>
              <Text className="font-sans text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-normal">
                Tambah, ubah, dan hapus hak akses Administrator Wilayah.
              </Text>
            </View>
            <Text className="font-sans text-gray-400 dark:text-gray-500 font-bold text-base">→</Text>
          </BentoCard>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => router.push('/superadmin/users' as any)}
          className="mb-6"
        >
          <BentoCard className="flex-row items-center p-4 rounded-3xl border border-gray-100 dark:border-gray-800/80">
            <View className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl mr-4">
              <Users color="#10b981" size={22} />
            </View>
            <View className="flex-1 mr-2">
              <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">
                Direktori Warga Kota
              </Text>
              <Text className="font-sans text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-normal">
                Cari profil terdaftar dan lihat visual statistik kontribusi aduan.
              </Text>
            </View>
            <Text className="font-sans text-gray-400 dark:text-gray-500 font-bold text-base">→</Text>
          </BentoCard>
        </TouchableOpacity>

        {/* Security & Info */}
        <BentoCard className="p-4 bg-gray-50/50 dark:bg-zen-cardBg border border-gray-100 dark:border-gray-800/85 rounded-3xl">
          <View className="flex-row items-center mb-2">
            <Shield color="#6366f1" size={14} className="mr-2" />
            <Text className="font-display font-bold text-gray-700 dark:text-gray-300 text-xs">
              Audit Log Keamanan Aktif
            </Text>
          </View>
          <Text className="font-sans text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Semua aktivitas di Super Admin Console diawasi secara otomatis untuk keamanan sistem SovraEquitara. Gunakan hak istimewa ini secara bijak.
          </Text>
        </BentoCard>
      </ScrollView>
    </View>
  );
}
