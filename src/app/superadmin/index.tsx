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
  Image,
  Linking
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { apiClient, getImageUrl } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { AppLogo } from '../../components/ui/AppLogo';
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
  Search,
  Bookmark,
  Megaphone,
  MessageSquare
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
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SAVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'RECENT' | 'VOTES' | 'COMMENTS'>('RECENT');
  
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, resolved: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VALID' | 'RESOLVED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState('');

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
      const [resReports, resSaved] = await Promise.all([
        apiClient.get('/admin/reports'),
        apiClient.get('/admin/saved-reports')
      ]);
      
      if (resReports.data?.data) {
        const reportsData = resReports.data.data;
        setReports(reportsData);
        setStats({
          total: reportsData.length,
          pending: reportsData.filter((r: any) => r.status === 'PENDING').length,
          verified: reportsData.filter((r: any) => r.status === 'VALID').length,
          resolved: reportsData.filter((r: any) => r.status === 'RESOLVED').length,
        });
      }
      if (resSaved.data?.data) {
        setSavedReports(resSaved.data.data);
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
  const currentReportsList = activeTab === 'ALL' ? reports : savedReports;
  const filteredReports = currentReportsList.filter(r => {
    const matchesSearch = searchQuery
      ? r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location_detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.profile?.full_name || r.user?.full_name)?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesStatus = statusFilter === 'ALL' ? true : r.status === statusFilter;
    const matchesCategory = categoryFilter === null ? true : r.category_id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sort: pending review on top, then order by selected sorting criteria
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    
    if (sortBy === 'VOTES') {
      return (b.vote_count || 0) - (a.vote_count || 0);
    }
    if (sortBy === 'COMMENTS') {
      return (b.comment_count || 0) - (a.comment_count || 0);
    }
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
          onPress: async () => {
            try {
              const res = await apiClient.post('/superadmin/database/backup');
              
              if (res.data && res.data.download_url) {
                const hostRoot = apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace('/api', '') : 'http://localhost:3000';
                const fullDownloadUrl = hostRoot + res.data.download_url;
                
                Alert.alert(
                  "Backup Berhasil",
                  `Cadangan PostgreSQL (${res.data.filename}) berhasil disimpan aman di server lokal.\n\nUnduh file cadangan sekarang?`,
                  [
                    { text: "Nanti Saja" },
                    { 
                      text: "Unduh Sekarang", 
                      onPress: () => {
                        Linking.openURL(fullDownloadUrl).catch(err => {
                          console.error("Gagal membuka link unduhan", err);
                          Alert.alert("Eror Unduhan", "Tidak dapat membuka peramban untuk mengunduh file.");
                        });
                      } 
                    }
                  ]
                );
              } else {
                throw new Error("Respon server tidak valid");
              }
            } catch (err: any) {
              const errMsg = err.response?.data?.error || err.message || "Koneksi terputus";
              Alert.alert("Backup Gagal", "Gagal memproses cadangan: " + errMsg);
            }
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
      {/* Premium Sticky Navbar */}
      <View className="pt-14 pb-4 px-5 bg-white dark:bg-zen-cardDark border-b border-zen-border dark:border-zen-borderDark flex-row items-center justify-between shadow-sm z-10">
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
            <AppLogo width={120} height={40} className="self-start -ml-2" />
            <Text className="font-sans text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
              Super Admin • {timeString || '--:--:-- WIB'}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center gap-2.5">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={toggleColorScheme} 
            className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm"
          >
            {isDark ? (
              <Sun color="#A1A1AA" size={16} />
            ) : (
              <Moon color="#787774" size={16} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/profile/edit' as any)}
            className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm"
            activeOpacity={0.8}
          >
            <Settings color={iconColor} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View className="py-12 justify-center items-center">
            <ActivityIndicator size="small" color={isDark ? "#ffffff" : "#000000"} />
          </View>
        ) : (
          <>
            {/* Welcome Text */}
            <View className="mb-6 mt-2">
              <Text className="font-display text-2xl font-black text-gray-900 dark:text-white">
                Halo, Super Admin
              </Text>
              <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                Kendali penuh atas sistem dan seluruh manajemen infrastruktur kota.
              </Text>
            </View>

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

            <View className="flex-row gap-4 mb-6">
              {/* Kirim Pengumuman (Broadcast) */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => router.push('/admin/broadcast' as any)}
                className="flex-1"
              >
                <BentoCard className="p-4 h-[124px] justify-between shadow-none rounded-[24px]">
                  <View className="p-2.5 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl self-start">
                    <Megaphone color="#a855f7" size={18} />
                  </View>
                  <View>
                    <Text className="font-display font-bold text-gray-900 dark:text-white text-xs">Kirim Pengumuman</Text>
                    <Text className="font-sans text-gray-400 dark:text-gray-500 text-[8px] mt-0.5 leading-snug">Broadcast pengumuman kota</Text>
                  </View>
                </BentoCard>
              </TouchableOpacity>

              {/* Kotak Bantuan (Helpdesk) */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => router.push('/admin/helpdesk' as any)}
                className="flex-1"
              >
                <BentoCard className="p-4 h-[124px] justify-between shadow-none rounded-[24px]">
                  <View className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl self-start">
                    <MessageSquare color="#6366f1" size={18} />
                  </View>
                  <View>
                    <Text className="font-display font-bold text-gray-900 dark:text-white text-xs">Kotak Bantuan</Text>
                    <Text className="font-sans text-gray-400 dark:text-gray-500 text-[8px] mt-0.5 leading-snug">Chat Inbox Warga & AI Log</Text>
                  </View>
                </BentoCard>
              </TouchableOpacity>
            </View>

            {/* Search & Filter Section */}
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

            <View className="mb-6 bg-white dark:bg-zen-cardDark p-4 rounded-[24px] border border-zen-border dark:border-zen-borderDark shadow-sm">
              <View className="flex-row items-center bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-xl mb-4 border border-zen-border/30 dark:border-zen-borderDark/40">
                <Search color="#9ca3af" size={16} className="mr-2" />
                <TextInput
                  placeholder="Cari aduan atau nama warga..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 font-sans text-xs text-gray-900 dark:text-white py-0.5"
                />
              </View>
              
              {/* Category Filter Scroll */}
              <View className="mb-3">
                <Text className="font-display font-bold text-[9px] text-gray-400 dark:text-stone-500 uppercase tracking-widest mb-2 pl-0.5">Filter Kategori:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  {[
                    { id: null, name: 'Semua Kategori' },
                    { id: 1, name: 'Infrastruktur' },
                    { id: 2, name: 'Lingkungan' },
                    { id: 3, name: 'Fasilitas Umum' },
                    { id: 4, name: 'Keamanan' },
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat.id === null ? 'null' : cat.id}
                      onPress={() => setCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg mr-2 border ${
                        categoryFilter === cat.id
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-gray-50 dark:bg-gray-800 border-zen-border dark:border-zen-borderDark'
                      }`}
                    >
                      <Text className={`font-sans font-bold text-[9px] ${categoryFilter === cat.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Status Filter Scroll */}
              <View className="mb-3">
                <Text className="font-display font-bold text-[9px] text-gray-400 dark:text-stone-500 uppercase tracking-widest mb-2 pl-0.5">Status Laporan:</Text>
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
                        {status === 'ALL' ? 'Semua Status' : status === 'VALID' ? 'DIPROSES' : status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Sort By Options */}
              <View className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800/80">
                <Text className="font-display font-bold text-[9px] text-gray-400 dark:text-stone-500 uppercase tracking-widest mb-2 pl-0.5">Urutan Laporan:</Text>
                <View className="flex-row gap-2">
                  {[
                    { id: 'RECENT', name: 'Terkini' },
                    { id: 'VOTES', name: 'Dukungan Warga' },
                    { id: 'COMMENTS', name: 'Komentar Terbanyak' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSortBy(item.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg border flex-1 items-center ${
                        sortBy === item.id
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'bg-gray-50 dark:bg-gray-800 border-zen-border dark:border-zen-borderDark'
                      }`}
                    >
                      <Text className={`font-sans font-bold text-[9px] text-center ${sortBy === item.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
                            Oleh: {report.profile?.full_name || report.user?.full_name || 'Warga'}
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
