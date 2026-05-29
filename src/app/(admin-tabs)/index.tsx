import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { apiClient, getImageUrl } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { WebView } from 'react-native-webview';
import { Search, Shield, Filter, FileText, CheckCircle, Clock, AlertTriangle, Megaphone, MessageSquare, Sparkles, Sun, Moon, Bookmark } from 'lucide-react-native';
import { SuperAdminDashboardView } from '../superadmin';

export default function AdminDashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VALID' | 'RESOLVED'>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'SAVED'>('ALL');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'super_admin';

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

  const fetchSavedReports = async () => {
    try {
      const res = await apiClient.get('/admin/saved-reports');
      if (res.data?.data) {
        setSavedReports(res.data.data);
      }
    } catch (e) {
      console.log('Failed to fetch saved reports', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchReports(), fetchSavedReports()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      fetchReports();
      fetchSavedReports();
    }
  }, [isSuperAdmin]);

  if (isSuperAdmin) {
    return <SuperAdminDashboardView isStandalone={false} />;
  }

  // Compute stats on the client side
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'PENDING').length,
    verified: reports.filter(r => r.status === 'VALID').length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
  };

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

  // 1. Calculate 7-day trend dynamically
  const trendData = (() => {
    const days = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      days.push(dateString);
      
      const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = new Date(d.setHours(23, 59, 59, 999)).getTime();
      
      const count = reports.filter(r => {
        const t = new Date(r.created_at).getTime();
        return t >= dayStart && t <= dayEnd;
      }).length;
      counts.push(count);
    }
    return { labels: days, data: counts };
  })();

  // 2. Calculate Category Distribution (Top 5) dynamically
  const categoryDistribution = (() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      const catName = r.category?.name || 'Umum';
      counts[catName] = (counts[catName] || 0) + 1;
    });
    
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
      
    return {
      labels: sorted.map(item => item[0]),
      data: sorted.map(item => item[1]),
    };
  })();

  // Admin Dashboard ChartJS HTML String
  const adminChartHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        html, body {
          margin: 0;
          padding: 0;
          background: transparent;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          height: 100%;
          color: ${isDark ? '#fafaf9' : '#1c1917'};
        }
        .chart-box {
          margin-bottom: 24px;
          position: relative;
          height: 175px;
          width: 100%;
        }
        .title {
          font-size: 11px;
          font-weight: 800;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: ${isDark ? '#a8a29e' : '#78716c'};
        }
      </style>
    </head>
    <body>
      <div class="title">Tren Aduan (7 Hari Terakhir)</div>
      <div class="chart-box">
        <canvas id="trendChart"></canvas>
      </div>
      
      <div class="title" style="margin-top: 12px;">Topik Laporan Terbanyak</div>
      <div class="chart-box">
        <canvas id="categoryChart"></canvas>
      </div>

      <script>
        var textColor = ${isDark ? "'#d6d3d1'" : "'#44403c'"};
        var gridColor = ${isDark ? "'rgba(255, 255, 255, 0.08)'" : "'rgba(0, 0, 0, 0.05)'"};

        // 1. Line Chart: Trend
        var trendCtx = document.getElementById('trendChart').getContext('2d');
        var trendGrad = trendCtx.createLinearGradient(0, 0, 0, 150);
        trendGrad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
        trendGrad.addColorStop(1, 'rgba(99, 102, 241, 0.01)');

        new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(trendData.labels)},
            datasets: [{
              data: ${JSON.stringify(trendData.data)},
              borderColor: '#6366f1',
              borderWidth: 2.5,
              backgroundColor: trendGrad,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#6366f1',
              pointRadius: 3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: textColor, font: { weight: 'bold', size: 9 } }
              },
              y: {
                grid: { color: gridColor },
                ticks: { 
                  color: textColor, 
                  font: { weight: 'bold', size: 9 },
                  stepSize: 1,
                  beginAtZero: true
                }
              }
            }
          }
        });

        // 2. Bar Chart: Category
        var catCtx = document.getElementById('categoryChart').getContext('2d');
        new Chart(catCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(categoryDistribution.labels)},
            datasets: [{
              data: ${JSON.stringify(categoryDistribution.data)},
              backgroundColor: '#10b981',
              borderRadius: 6,
              barThickness: 12
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: {
                grid: { color: gridColor },
                ticks: { 
                  color: textColor, 
                  font: { weight: 'bold', size: 9 },
                  stepSize: 1,
                  beginAtZero: true
                }
              },
              y: {
                grid: { display: false },
                ticks: { color: textColor, font: { weight: 'bold', size: 9 } }
              }
            }
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingTop: 60, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="mb-8 flex-row justify-between items-center">
          <View className="flex-1 mr-3">
            <Text className="font-display text-3xl font-black text-gray-900 dark:text-white">
              Konsol <Text className="text-indigo-500 dark:text-indigo-400">Staf</Text>
            </Text>
            <Text className="font-sans text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
              Selamat bertugas, {user?.full_name || 'Admin'}.
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5">
            <View className="bg-zen-surface dark:bg-zen-darkSurface px-3 py-1.5 rounded-full border border-zen-border dark:border-zen-borderDark">
              <Text className="font-sans font-bold text-gray-500 dark:text-gray-400 text-[10px] uppercase">
                {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
            </View>

            <View className="bg-indigo-500/10 dark:bg-indigo-500/20 px-3.5 py-1.5 rounded-full border border-indigo-500/10 flex-row items-center">
              <Shield color="#6366f1" size={12} className="mr-1.5" />
              <Text className="font-display font-black text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider">
                {user?.role || 'ADMIN'}
              </Text>
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={toggleColorScheme} 
              className="p-2.5 bg-white dark:bg-zen-cardDark rounded-full border border-zen-border dark:border-zen-borderDark shadow-sm"
            >
              {isDark ? (
                <Sun color="#f59e0b" size={18} />
              ) : (
                <Moon color="#6366f1" size={18} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Bento Grid */}
        <View className="mb-5">
          <View className="flex-row gap-4 mb-4">
            {/* Total Laporan */}
            <View className="flex-1">
              <BentoCard className="bg-indigo-50/70 border border-indigo-100/10 dark:bg-indigo-950/20 dark:border-indigo-900/15 p-4 rounded-3xl h-32 justify-between shadow-none">
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
              <BentoCard className="bg-amber-50/70 border border-amber-100/10 dark:bg-amber-950/20 dark:border-amber-900/15 p-4 rounded-3xl h-32 justify-between shadow-none">
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
              <BentoCard className="bg-emerald-50/70 border border-emerald-100/10 dark:bg-emerald-950/20 dark:border-emerald-900/15 p-4 rounded-3xl h-32 justify-between shadow-none">
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
              <BentoCard className="bg-blue-50/70 border border-blue-100/10 dark:bg-blue-950/20 dark:border-blue-900/15 p-4 rounded-3xl h-32 justify-between shadow-none">
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

        {/* Grafik Tren & Spasial Analitis Kota */}
        {reports.length > 0 && (
          <View className="mb-6">
            <BentoCard className="h-[490px] rounded-3xl p-5 shadow-none">
              <Text className="font-display font-bold text-gray-900 dark:text-white text-base mb-4">Tren & Distribusi Aduan Wilayah</Text>
              <View className="flex-1 w-full bg-transparent">
                <WebView
                  originWhitelist={['*']}
                  source={{ html: adminChartHtml }}
                  style={{ backgroundColor: 'transparent', flex: 1, opacity: 0.99 }}
                  scrollEnabled={false}
                />
              </View>
            </BentoCard>
          </View>
        )}

        {/* Fitur Administrasi Bento Cards */}
        <View className="mb-6">
          <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1">
            Tindakan Admin
          </Text>
          
          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push('/admin/broadcast' as any)}
              className="flex-1"
            >
              <BentoCard className="bg-purple-50/70 border border-purple-100/10 dark:bg-purple-950/20 dark:border-purple-900/15 p-4 h-32 justify-between shadow-none rounded-3xl">
                <View className="p-2 bg-purple-500 rounded-xl self-start shadow-sm">
                  <Megaphone color="white" size={18} />
                </View>
                <View>
                  <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Kirim Pengumuman</Text>
                  <Text className="font-sans text-gray-500 dark:text-gray-400 text-[9px] mt-0.5 leading-normal">Broadcast ke semua warga kota</Text>
                </View>
              </BentoCard>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push('/admin/helpdesk' as any)}
              className="flex-1"
            >
              <BentoCard className="bg-indigo-50/70 border border-indigo-100/10 dark:bg-indigo-950/20 dark:border-indigo-900/15 p-4 h-32 justify-between shadow-none rounded-3xl">
                <View className="p-2 bg-indigo-500 rounded-xl self-start shadow-sm">
                  <MessageSquare color="white" size={18} />
                </View>
                <View>
                  <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Kotak Bantuan</Text>
                  <Text className="font-sans text-gray-500 dark:text-gray-400 text-[9px] mt-0.5 leading-normal">Pantau chat AI & warga kota</Text>
                </View>
              </BentoCard>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => router.push('/admin/ai-assistant' as any)}
            className="w-full"
          >
            <BentoCard className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100/10 dark:border-emerald-900/15 p-4 h-28 flex-row items-center justify-between shadow-none rounded-3xl">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="p-3 bg-emerald-500 rounded-2xl mr-4 shadow-sm">
                  <Sparkles color="white" size={22} />
                </View>
                <View className="flex-1">
                  <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Asisten AI Analitis</Text>
                  <Text className="font-sans text-gray-500 dark:text-gray-400 text-[10px] mt-0.5 leading-relaxed" numberOfLines={2}>
                    Analisis kepadatan masalah kota dan rumuskan tanggapan aduan keluhan warga secara cerdas.
                  </Text>
                </View>
              </View>
              <Text className="font-sans text-emerald-500 dark:text-emerald-400 font-bold text-base">→</Text>
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
                    <Text className="font-sans text-gray-400 text-[10px] flex-1 mr-1" numberOfLines={1}>
                      Oleh: {report.profile?.full_name || report.user?.full_name || 'Warga'}
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
