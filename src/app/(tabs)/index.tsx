import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { WebView } from 'react-native-webview';
import { MapPin, CheckCircle, AlertTriangle, MessageSquare, Bell, Clock } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({ pending: 0, resolved: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/reports/stats');
      if (res.data?.data) {
        setStats(res.data.data);
      } else if (res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.log('Failed to fetch stats', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const verifiedCount = Math.max(0, stats.total - stats.pending - stats.resolved);

  // ChartJS Doughnut configuration HTML string
  const chartHtml = `
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
          overflow: hidden;
        }
        #chart-container {
          position: relative;
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div id="chart-container">
        <canvas id="myChart"></canvas>
      </div>
      <script>
        var ctx = document.getElementById('myChart').getContext('2d');
        var myChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Diproses', 'Terverifikasi', 'Selesai'],
            datasets: [{
              data: [${stats.pending}, ${verifiedCount}, ${stats.resolved}],
              backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
              borderWidth: ${isDark ? 2 : 1},
              borderColor: ${isDark ? "'#1c1917'" : "'#ffffff'"},
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: ${isDark ? "'#d6d3d1'" : "'#44403c'"},
                  font: {
                    weight: 'bold',
                    size: 11
                  },
                  boxWidth: 10,
                  padding: 8
                }
              },
              tooltip: {
                enabled: true
              }
            },
            cutout: '60%'
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <ScrollView 
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
      contentContainerStyle={{ padding: 16, paddingTop: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Header */}
      <View className="mb-6 flex-row justify-between items-center">
        <View className="flex-1 mr-3">
          <Text className="font-sans text-gray-500 dark:text-gray-400">Selamat datang kembali,</Text>
          <Text className="font-display text-2xl font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {user?.full_name || 'Warga'}
          </Text>
        </View>
        <View className="flex-row items-center gap-2.5">
          <View className="bg-zen-accent/10 px-3 py-1.5 rounded-full">
            <Text className="font-sans font-bold text-zen-accent">{user?.points || 0} Pts</Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/notifications' as any)} 
            className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full"
          >
            <Bell color="#10b981" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bento Grid */}
      <View className="flex-row flex-wrap justify-between">
        
        {/* Large Card: Make a Report */}
        <TouchableOpacity 
          className="w-full mb-4" 
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/create-report')}
        >
          <BentoCard className="bg-zen-accent justify-between flex-row items-center">
            <View>
              <Text className="font-display text-xl font-bold text-white mb-1">Lapor Masalah</Text>
              <Text className="font-sans text-emerald-100 text-sm">Bantu kota menjadi lebih baik</Text>
            </View>
            <View className="bg-white/20 p-3 rounded-full">
              <AlertTriangle color="white" size={24} />
            </View>
          </BentoCard>
        </TouchableOpacity>

        {/* Medium Cards */}
        <TouchableOpacity 
          className="w-[48%] mb-4"
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/map')}
        >
          <BentoCard className="items-center py-8">
            <MapPin color="#3b82f6" size={32} className="mb-3" />
            <Text className="font-display font-semibold text-gray-800 dark:text-gray-100">Peta Interaktif</Text>
            <Text className="font-sans text-xs text-gray-500 text-center mt-1">Lihat laporan di sekitarmu</Text>
          </BentoCard>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-[48%] mb-4"
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/chat')}
        >
          <BentoCard className="items-center py-8">
            <MessageSquare color="#f59e0b" size={32} className="mb-3" />
            <Text className="font-display font-semibold text-gray-800 dark:text-gray-100">Tanya AI</Text>
            <Text className="font-sans text-xs text-gray-500 text-center mt-1">Asisten pintar kotamu</Text>
          </BentoCard>
        </TouchableOpacity>

        {/* Small Stat Cards */}
        <View className="w-[48%] mb-4">
          <BentoCard className="bg-emerald-50/70 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 p-4 rounded-3xl h-28 justify-between shadow-none">
            <View className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg self-start shadow-sm">
              <CheckCircle color="#10b981" size={14} />
            </View>
            <View>
              <Text className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.resolved}</Text>
              <Text className="font-sans text-[9px] font-bold text-emerald-700/80 dark:text-emerald-300/85 uppercase tracking-wider mt-0.5">Laporan Selesai</Text>
            </View>
          </BentoCard>
        </View>

        <View className="w-[48%] mb-4">
          <BentoCard className="bg-amber-50/70 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 p-4 rounded-3xl h-28 justify-between shadow-none">
            <View className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg self-start shadow-sm">
              <Clock color="#d97706" size={14} />
            </View>
            <View>
              <Text className="font-display text-2xl font-black text-[#d97706] dark:text-amber-400">{stats.pending}</Text>
              <Text className="font-sans text-[9px] font-bold text-amber-700/80 dark:text-amber-300/85 uppercase tracking-wider mt-0.5">Sedang Diproses</Text>
            </View>
          </BentoCard>
        </View>

        {/* Chart Card */}
        <View className="w-full mb-4">
          <BentoCard className="h-56">
            <Text className="font-display font-bold text-gray-900 dark:text-white text-sm mb-2">Proporsi Status Laporan Saya</Text>
            {stats.total > 0 ? (
              <View className="flex-1 w-full bg-transparent">
                <WebView
                  originWhitelist={['*']}
                  source={{ html: chartHtml }}
                  style={{ backgroundColor: 'transparent', flex: 1, opacity: 0.99 }}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <View className="flex-1 items-center justify-center py-6">
                <Text className="font-sans text-xs text-gray-500 text-center px-4 leading-normal">
                  Belum ada aduan yang Anda kirimkan untuk dianalisis statistiknya.
                </Text>
              </View>
            )}
          </BentoCard>
        </View>

        {/* Full width button to Feed */}
        <TouchableOpacity 
          className="w-full mb-4 mt-2" 
          activeOpacity={0.9}
          onPress={() => router.push('/feed' as any)}
        >
          <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl flex-row justify-between items-center">
            <Text className="font-display font-bold text-gray-800 dark:text-gray-100">Semua Laporan Publik</Text>
            <Text className="font-sans font-bold text-zen-accent">→</Text>
          </View>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}
