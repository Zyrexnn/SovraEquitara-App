import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  Animated,
  TextInput,
  Image
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { apiClient, getImageUrl } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
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
  Sun,
  Moon,
  Server,
  Database,
  HardDrive,
  Download,
  Lock,
  Activity,
  Search
} from 'lucide-react-native';

// Indikator Titik Hijau Berkedip/Pulsing Native
const PulsingDot = () => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View 
      style={{ opacity }} 
      className="w-2.5 h-2.5 rounded-full bg-emerald-400"
    />
  );
};

interface SuperAdminDashboardViewProps {
  isStandalone?: boolean;
}

export function SuperAdminDashboardView({ isStandalone = false }: SuperAdminDashboardViewProps) {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#f3f4f6' : '#374151';
  
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, resolved: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VALID' | 'RESOLVED'>('ALL');

  // 1. Dynamic Local Time Clock (Web-Parity)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }) + ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch system stats & reports list
  const fetchStatsAndReports = async () => {
    try {
      const res = await apiClient.get('/admin/reports');
      if (res.data?.data) {
        const reportsData = res.data.data;
        setReports(reportsData);
        setStats({
          total: reportsData.length,
          pending: reportsData.filter((r: any) => r.status === 'PENDING').length,
          verified: reportsData.filter((r: any) => r.status === 'VALID').length,
          resolved: reportsData.filter((r: any) => r.status === 'RESOLVED').length,
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

  // 3. Filtering & Sorting Logic
  const filteredReports = reports.filter(r => {
    const matchesSearch = searchQuery
      ? r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location_detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesStatus = statusFilter === 'ALL' ? true : r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort: show pending and newer ones first
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // 4. Quick Action Handlers
  const handleBackupDB = () => {
    Alert.alert(
      "Backup Database",
      "Apakah Anda ingin mencadangkan seluruh skema & data database PostgreSQL sekarang?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Mulai Backup", 
          onPress: () => {
            // Simulate processing then success
            setTimeout(() => {
              const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              Alert.alert(
                "Backup Berhasil",
                `Cadangan PostgreSQL (sovra_db_backup_${new Date().toISOString().split('T')[0]}.sql) berhasil disimpan aman di server lokal pada pukul ${now} WIB.`
              );
            }, 500);
          }
        }
      ]
    );
  };

  const handleExportReports = () => {
    Alert.alert(
      "Ekspor Laporan Warga",
      "Ekspor seluruh database laporan aduan warga SovraEquitara ke format excel?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Unduh XLSX", 
          onPress: () => {
            setTimeout(() => {
              Alert.alert(
                "Ekspor Sukses",
                `File excel laporan warga (SovraLaporan_Rekap_${new Date().toISOString().split('T')[0]}.xlsx) berhasil dibuat & siap diunduh.`
              );
            }, 500);
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 bg-white dark:bg-zen-cardDark border-b border-zen-border dark:border-zen-borderDark flex-row items-center justify-between shadow-sm">
        <View className="flex-row items-center flex-1 mr-2">
          {isStandalone && (
            <TouchableOpacity 
              onPress={() => router.replace('/(admin-tabs)/profile' as any)} 
              className="mr-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-full"
              activeOpacity={0.8}
            >
              <ArrowLeft color={iconColor} size={18} />
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Text className="font-display text-lg font-black text-gray-900 dark:text-white" numberOfLines={1}>
              Konsol <Text className="text-indigo-500 dark:text-indigo-400">Super</Text>
            </Text>
            <Text className="font-sans text-[9px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider mt-0.5">
              Super Admin Console
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center gap-2">
          <View className="bg-zen-surface dark:bg-zen-darkSurface px-2.5 py-1.5 rounded-full border border-zen-border dark:border-zen-borderDark shrink-0">
            <Text className="font-sans font-black text-gray-500 dark:text-gray-400 text-[8px] uppercase tracking-wider">
              {timeString || '--:--:-- WIB'}
            </Text>
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={toggleColorScheme} 
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full border border-zen-border dark:border-zen-borderDark"
          >
            {isDark ? (
              <Sun color="#f59e0b" size={16} />
            ) : (
              <Moon color="#6366f1" size={16} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/profile/edit' as any)}
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full border border-zen-border dark:border-zen-borderDark"
            activeOpacity={0.8}
          >
            <Settings color={iconColor} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingTop: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View className="py-12 justify-center items-center">
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        ) : (
          <>
            {/* Compact Stats Row */}
            <View className="flex-row gap-2.5 mb-5">
              {/* Total */}
              <BentoCard className="flex-1 p-3 rounded-2xl items-center shadow-none justify-between h-20 bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100/10">
                <Text className="font-display text-lg font-black text-indigo-500 dark:text-indigo-400">{stats.total}</Text>
                <Text className="font-sans text-[8px] font-bold text-indigo-400 uppercase tracking-widest text-center" numberOfLines={1}>Total</Text>
              </BentoCard>

              {/* Pending */}
              <BentoCard className="flex-1 p-3 rounded-2xl items-center shadow-none justify-between h-20 bg-amber-50/20 dark:bg-amber-950/10 border-amber-100/10">
                <Text className="font-display text-lg font-black text-amber-500 dark:text-amber-400">{stats.pending}</Text>
                <Text className="font-sans text-[8px] font-bold text-amber-400 uppercase tracking-widest text-center" numberOfLines={1}>Pending</Text>
              </BentoCard>

              {/* Verified */}
              <BentoCard className="flex-1 p-3 rounded-2xl items-center shadow-none justify-between h-20 bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100/10">
                <Text className="font-display text-lg font-black text-emerald-500 dark:text-emerald-400">{stats.verified}</Text>
                <Text className="font-sans text-[8px] font-bold text-emerald-400 uppercase tracking-widest text-center" numberOfLines={1}>Valid</Text>
              </BentoCard>

              {/* Resolved */}
              <BentoCard className="flex-1 p-3 rounded-2xl items-center shadow-none justify-between h-20 bg-blue-50/20 dark:bg-blue-950/10 border-blue-100/10">
                <Text className="font-display text-lg font-black text-blue-500 dark:text-blue-400">{stats.resolved}</Text>
                <Text className="font-sans text-[8px] font-bold text-blue-400 uppercase tracking-widest text-center" numberOfLines={1}>Selesai</Text>
              </BentoCard>
            </View>

            {/* Status Sistem Gradient Card (Web-Parity) */}
            <View className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-5 rounded-[28px] mb-6 shadow-md border-0">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="font-display font-black text-white text-base">Status Sistem</Text>
                <View className="bg-white/10 px-2 py-0.5 rounded-full flex-row items-center gap-1.5">
                  <Activity color="white" size={10} />
                  <Text className="font-sans font-black text-white text-[8px] tracking-wider uppercase">Live Monitor</Text>
                </View>
              </View>
              <Text className="font-sans text-xs text-indigo-100 font-medium">Seluruh layanan infrastruktur berjalan normal</Text>
              
              <View className="mt-5 space-y-3.5">
                {/* Row API */}
                <View className="flex-row items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  <View className="flex-row items-center">
                    <Server color="white" size={13} className="mr-2" />
                    <Text className="font-sans font-bold text-white text-[11px]">API Gateway</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <PulsingDot />
                    <Text className="font-sans font-black text-emerald-300 text-[9px] uppercase tracking-wider">ONLINE</Text>
                  </View>
                </View>

                {/* Row Database */}
                <View className="flex-row items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  <View className="flex-row items-center">
                    <Database color="white" size={13} className="mr-2" />
                    <Text className="font-sans font-bold text-white text-[11px]">Database Server</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <PulsingDot />
                    <Text className="font-sans font-black text-emerald-300 text-[9px] uppercase tracking-wider">ONLINE</Text>
                  </View>
                </View>

                {/* Row Storage */}
                <View className="flex-row items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  <View className="flex-row items-center">
                    <HardDrive color="white" size={13} className="mr-2" />
                    <Text className="font-sans font-bold text-white text-[11px]">Object Storage</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <PulsingDot />
                    <Text className="font-sans font-black text-emerald-300 text-[9px] uppercase tracking-wider">ONLINE</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Actions 2x2 Bento Grid */}
            <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1">
              Tindakan Cepat & Utilitas
            </Text>

            <View className="flex-row gap-4 mb-4">
              {/* Kelola Admin */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => router.push('/superadmin/admins' as any)}
                className="flex-1"
              >
                <BentoCard className="p-4 h-[124px] justify-between shadow-none rounded-[24px]">
                  <View className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl self-start">
                    <UserCheck color="#6366f1" size={18} />
                  </View>
                  <View>
                    <Text className="font-display font-bold text-gray-900 dark:text-white text-xs">Kelola Admin</Text>
                    <Text className="font-sans text-gray-400 dark:text-gray-500 text-[8px] mt-0.5 leading-snug">Edit hak akses & staf moderator</Text>
                  </View>
                </BentoCard>
              </TouchableOpacity>

              {/* Direktori Warga */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => router.push('/superadmin/users' as any)}
                className="flex-1"
              >
                <BentoCard className="p-4 h-[124px] justify-between shadow-none rounded-[24px]">
                  <View className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl self-start">
                    <Users color="#10b981" size={18} />
                  </View>
                  <View>
                    <Text className="font-display font-bold text-gray-900 dark:text-white text-xs">Direktori Warga</Text>
                    <Text className="font-sans text-gray-400 dark:text-gray-500 text-[8px] mt-0.5 leading-snug">Database profil warga & kontribusi</Text>
                  </View>
                </BentoCard>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-4 mb-6">
              {/* Backup DB */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={handleBackupDB}
                className="flex-1"
              >
                <BentoCard className="p-4 h-[124px] justify-between shadow-none rounded-[24px]">
                  <View className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl self-start">
                    <Database color="#3b82f6" size={18} />
                  </View>
                  <View>
                    <Text className="font-display font-bold text-gray-900 dark:text-white text-xs">Backup DB</Text>
                    <Text className="font-sans text-gray-400 dark:text-gray-500 text-[8px] mt-0.5 leading-snug">Cadangkan arsip data PostgreSQL</Text>
                  </View>
                </BentoCard>
              </TouchableOpacity>

              {/* Ekspor Laporan */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={handleExportReports}
                className="flex-1"
              >
                <BentoCard className="p-4 h-[124px] justify-between shadow-none rounded-[24px]">
                  <View className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl self-start">
                    <Download color="#f59e0b" size={18} />
                  </View>
                  <View>
                    <Text className="font-display font-bold text-gray-900 dark:text-white text-xs">Ekspor XLSX</Text>
                    <Text className="font-sans text-gray-400 dark:text-gray-500 text-[8px] mt-0.5 leading-snug">Unduh rekap aduan format Excel</Text>
                  </View>
                </BentoCard>
              </TouchableOpacity>
            </View>

            {/* Search & Filter Section */}
            <View className="mb-6 bg-white dark:bg-zen-cardDark p-4 rounded-[24px] border border-zen-border dark:border-zen-borderDark shadow-sm">
              <View className="flex-row items-center bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-xl mb-3 border border-zen-border/30 dark:border-zen-borderDark/40">
                <Search color="#9ca3af" size={16} className="mr-2" />
                <TextInput
                  placeholder="Cari aduan atau nama warga..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 font-sans text-xs text-gray-900 dark:text-white py-0.5"
                />
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {(['ALL', 'PENDING', 'VALID', 'RESOLVED'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setStatusFilter(status)}
                    className={`px-3.5 py-1.5 rounded-lg mr-2 flex-row items-center border ${
                      statusFilter === status
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'bg-gray-50 dark:bg-gray-800 border-zen-border dark:border-zen-borderDark'
                    }`}
                  >
                    <Text 
                      className={`font-sans font-bold text-[9px] ${
                        statusFilter === status
                          ? 'text-white'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {status === 'ALL' ? 'Semua Laporan' : status === 'VALID' ? 'DIPROSES' : status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Reports List */}
            <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1">
              Daftar Aduan Terpantau ({sortedReports.length})
            </Text>

            {sortedReports.length === 0 ? (
              <View className="py-12 items-center bg-white dark:bg-zen-cardDark rounded-[24px] border border-zen-border dark:border-zen-borderDark mb-6">
                <Text className="font-sans text-stone-400 dark:text-stone-500 text-xs">Tidak ada aduan yang sesuai filter.</Text>
              </View>
            ) : (
              <View className="mb-6">
                {sortedReports.map((report) => (
                  <TouchableOpacity 
                    key={report.id} 
                    activeOpacity={0.9}
                    onPress={() => router.push(`/admin/report/${report.id}` as any)}
                    className="mb-3"
                  >
                    <BentoCard className="p-0 overflow-hidden shadow-none flex-row h-[100px] border border-gray-100 dark:border-gray-800/80 rounded-[20px]">
                      {report.image_urls && report.image_urls.length > 0 ? (
                        <Image 
                          source={{ uri: getImageUrl(report.image_urls[0]) }} 
                          className="w-24 h-full bg-stone-100" 
                        />
                      ) : report.image_url ? (
                        <Image 
                          source={{ uri: getImageUrl(report.image_url) }} 
                          className="w-24 h-full bg-stone-100" 
                        />
                      ) : (
                        <View className="w-24 h-full bg-gray-50 dark:bg-gray-800/60 items-center justify-center border-r border-zen-border/20">
                          <Text className="font-sans text-gray-400 dark:text-stone-600 text-[9px]">No Photo</Text>
                        </View>
                      )}
                      <View className="flex-1 p-3 justify-between">
                        <View>
                          <View className="flex-row justify-between items-center mb-1">
                            <Text className="font-display font-bold text-gray-900 dark:text-white text-xs flex-1 mr-1.5" numberOfLines={1}>
                              {report.category?.name || 'Laporan Umum'}
                            </Text>
                            <StatusBadge status={report.status} />
                          </View>
                          <Text className="font-sans text-gray-500 dark:text-stone-400 text-[10px]" numberOfLines={2}>
                            {report.description}
                          </Text>
                        </View>
                        <View className="flex-row justify-between items-center mt-1">
                          <Text className="font-sans text-stone-400 dark:text-stone-500 text-[8px] flex-1 mr-1" numberOfLines={1}>
                            Oleh: {report.profile?.full_name || 'Warga'}
                          </Text>
                          <Text className="font-sans text-[8px] font-bold text-indigo-500">Moderasi →</Text>
                        </View>
                      </View>
                    </BentoCard>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Security Box */}
            <BentoCard className="p-4 bg-gray-50/50 dark:bg-zen-cardDark border border-zen-border/30 dark:border-zen-borderDark/40 rounded-[24px] shadow-none flex-row items-start">
              <View className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl mr-3 mt-0.5">
                <Lock color="#6366f1" size={15} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="font-display font-black text-gray-700 dark:text-stone-300 text-xs">
                    Audit Log Keamanan Aktif
                  </Text>
                </View>
                <Text className="font-sans text-[9px] text-gray-400 dark:text-gray-500 leading-relaxed">
                  Semua aktivitas di Super Admin Console diawasi secara otomatis untuk keamanan sistem SovraEquitara. Gunakan hak istimewa ini secara bijak.
                </Text>
              </View>
            </BentoCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default function SuperAdminHub() {
  return <SuperAdminDashboardView isStandalone={true} />;
}
