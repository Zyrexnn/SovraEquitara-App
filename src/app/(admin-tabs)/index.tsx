import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { apiClient, getImageUrl } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { AppLogo } from '../../components/ui/AppLogo';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { WebView } from 'react-native-webview';
import { Search, Shield, Filter, FileText, CheckCircle, Clock, AlertTriangle, Megaphone, MessageSquare, Sparkles, Sun, Moon, Bookmark, ArrowRight } from 'lucide-react-native';
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

  // Admin Dashboard ChartJS HTML String (Monochromatic Theme)
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
        var primaryColor = ${isDark ? "'#ffffff'" : "'#000000'"};

        // 1. Line Chart: Trend
        var trendCtx = document.getElementById('trendChart').getContext('2d');
        var trendGrad = trendCtx.createLinearGradient(0, 0, 0, 150);
        trendGrad.addColorStop(0, ${isDark ? "'rgba(255, 255, 255, 0.35)'" : "'rgba(0, 0, 0, 0.35)'"});
        trendGrad.addColorStop(1, ${isDark ? "'rgba(255, 255, 255, 0.01)'" : "'rgba(0, 0, 0, 0.01)'"});

        new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(trendData.labels)},
            datasets: [{
              data: ${JSON.stringify(trendData.data)},
              borderColor: primaryColor,
              borderWidth: 2.5,
              backgroundColor: trendGrad,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: primaryColor,
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
              backgroundColor: primaryColor,
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
      {/* Premium Sticky Navbar */}
      <View className="pt-14 pb-4 px-5 bg-white dark:bg-zen-cardDark border-b border-zen-border dark:border-zen-borderDark flex-row items-center justify-between shadow-sm z-10">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="flex-1">
            <AppLogo width={120} height={40} className="self-start -ml-2" />
            <Text className="font-sans text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
              Admin Console • {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center gap-2.5">
          <View className="bg-black dark:bg-white px-3 py-1.5 rounded-full border border-gray-900 dark:border-gray-100 flex-row items-center">
            <Shield color={isDark ? "black" : "white"} size={10} className="mr-1.5" />
            <Text className="font-display font-black text-white dark:text-black text-[9px] uppercase tracking-wider">
              {user?.role || 'ADMIN'}
            </Text>
          </View>

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
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Text */}
        <View className="mb-6 mt-2">
          <Text className="font-display text-2xl font-black text-gray-900 dark:text-white">
            Halo, {user?.full_name?.split(' ')[0] || 'Admin'}
          </Text>
          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            Pantau laporan terkini dan bantu warga kota hari ini.
          </Text>
        </View>

        {/* 4-Square Grid Stats */}
        <View className="mb-6">
          <View className="flex-row gap-4 mb-4">
            {/* Total Laporan */}
            <View className="flex-1">
              <BentoCard className="bg-gray-50 dark:bg-zinc-900/50 p-6 h-36 justify-between shadow-none">
                <View className="p-3 bg-white dark:bg-zinc-800 rounded-2xl self-start border border-gray-200 dark:border-zinc-700">
                  <FileText color={isDark ? "white" : "black"} size={18} />
                </View>
                <View>
                  <Text className="font-display text-4xl font-black text-gray-900 dark:text-white">{stats.total}</Text>
                  <Text className="font-sans text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Total Laporan</Text>
                </View>
              </BentoCard>
            </View>

            {/* Pending Review */}
            <View className="flex-1">
              <BentoCard className="bg-gray-50 dark:bg-zinc-900/50 p-6 h-36 justify-between shadow-none">
                <View className="p-3 bg-white dark:bg-zinc-800 rounded-2xl self-start border border-gray-200 dark:border-zinc-700">
                  <Clock color={isDark ? "white" : "black"} size={18} />
                </View>
                <View>
                  <Text className="font-display text-4xl font-black text-gray-900 dark:text-white">{stats.pending}</Text>
                  <Text className="font-sans text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Pending</Text>
                </View>
              </BentoCard>
            </View>
          </View>

          <View className="flex-row gap-4">
            {/* Terverifikasi */}
            <View className="flex-1">
              <BentoCard className="bg-gray-50 dark:bg-zinc-900/50 p-6 h-36 justify-between shadow-none">
                <View className="p-3 bg-white dark:bg-zinc-800 rounded-2xl self-start border border-gray-200 dark:border-zinc-700">
                  <CheckCircle color={isDark ? "white" : "black"} size={18} />
                </View>
                <View>
                  <Text className="font-display text-4xl font-black text-gray-900 dark:text-white">{stats.verified}</Text>
                  <Text className="font-sans text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Diproses</Text>
                </View>
              </BentoCard>
            </View>

            {/* Terselesaikan */}
            <View className="flex-1">
              <BentoCard className="bg-gray-50 dark:bg-zinc-900/50 p-6 h-36 justify-between shadow-none">
                <View className="p-3 bg-white dark:bg-zinc-800 rounded-2xl self-start border border-gray-200 dark:border-zinc-700">
                  <CheckCircle color={isDark ? "white" : "black"} size={18} />
                </View>
                <View>
                  <Text className="font-display text-4xl font-black text-gray-900 dark:text-white">{stats.resolved}</Text>
                  <Text className="font-sans text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Selesai</Text>
                </View>
              </BentoCard>
            </View>
          </View>
        </View>

        {/* Grafik Tren & Spasial Analitis Kota */}
        {reports.length > 0 && (
          <View className="mb-6">
            <BentoCard className="h-[490px] rounded-[32px] p-6 shadow-none border border-gray-200 dark:border-zinc-800">
              <Text className="font-display font-bold text-gray-900 dark:text-white text-base mb-4">Statistik Performa</Text>
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
          <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 pl-1">
            Tindakan Admin
          </Text>
          
          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push('/(admin-tabs)/broadcast' as any)}
              className="flex-1"
            >
              <BentoCard className="bg-gray-50 dark:bg-zinc-900/50 p-5 h-36 justify-between shadow-none rounded-[28px]">
                <View className="p-3 bg-black dark:bg-white rounded-2xl self-start shadow-sm border border-gray-200 dark:border-zinc-700">
                  <Megaphone color={isDark ? "black" : "white"} size={20} />
                </View>
                <View>
                  <Text className="font-display font-bold text-gray-900 dark:text-white text-base">Broadcast</Text>
                  <Text className="font-sans text-gray-500 dark:text-gray-400 text-[10px] mt-1">Kirim pengumuman</Text>
                </View>
              </BentoCard>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push('/(admin-tabs)/helpdesk' as any)}
              className="flex-1"
            >
              <BentoCard className="bg-gray-50 dark:bg-zinc-900/50 p-5 h-36 justify-between shadow-none rounded-[28px]">
                <View className="p-3 bg-black dark:bg-white rounded-2xl self-start shadow-sm border border-gray-200 dark:border-zinc-700">
                  <MessageSquare color={isDark ? "black" : "white"} size={20} />
                </View>
                <View>
                  <Text className="font-display font-bold text-gray-900 dark:text-white text-base">Helpdesk</Text>
                  <Text className="font-sans text-gray-500 dark:text-gray-400 text-[10px] mt-1">Pantau chat warga</Text>
                </View>
              </BentoCard>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => router.push('/admin/ai-assistant' as any)}
            className="w-full"
          >
            <BentoCard className="bg-black dark:bg-white p-6 h-36 flex-row items-center justify-between shadow-none rounded-[28px]">
              <View className="flex-row items-center flex-1 mr-4">
                <View className="p-4 bg-white/10 dark:bg-black/5 rounded-2xl mr-4 shadow-sm border border-white/20 dark:border-black/10">
                  <Sparkles color={isDark ? "black" : "white"} size={24} />
                </View>
                <View className="flex-1">
                  <Text className="font-display font-black text-white dark:text-black text-xl mb-1">AI Assistant</Text>
                  <Text className="font-sans text-gray-400 dark:text-gray-600 text-xs leading-relaxed" numberOfLines={2}>
                    Analisis sentimen dan buat draf tanggapan otomatis.
                  </Text>
                </View>
              </View>
              <ArrowRight color={isDark ? "black" : "white"} size={24} />
            </BentoCard>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}