import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { WebView } from 'react-native-webview';
import { MapPin, CheckCircle, AlertTriangle, MessageSquare, Bell, Clock, Sun, Moon } from 'lucide-react-native';

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
              borderColor: ${isDark ? "'#111111'" : "'#ffffff'"},
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
                  color: ${isDark ? "'#fafaf9'" : "'#1c1917'"},
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
      contentContainerStyle={{ padding: 16, paddingTop: 60, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Header */}
      <View className="mb-8 flex-row justify-between items-center">
        <View className="flex-1 mr-3">
          <Text className="font-sans text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Selamat Datang</Text>
          <Text className="font-display text-3xl font-black text-gray-900 dark:text-white mt-1" numberOfLines={1}>
            {user?.full_name || 'Warga'}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="bg-emerald-500/10 dark:bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/10">
            <Text className="font-display font-black text-emerald-600 dark:text-emerald-400 text-xs tracking-wider">{user?.points || 0} PTS</Text>
          </View>
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={toggleColorScheme} 
            className="p-3 bg-white dark:bg-zen-cardBg rounded-full border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            {isDark ? (
              <Sun color="#f59e0b" size={20} />
            ) : (
              <Moon color="#6366f1" size={20} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/notifications' as any)} 
            className="p-3 bg-white dark:bg-zen-cardBg rounded-full border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <Bell color="#10b981" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bento Grid Layout */}
      <View>
        
        {/* Large Card: Lapor Masalah */}
        <TouchableOpacity 
          className="w-full mb-5" 
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/create-report')}
        >
          <BentoCard className="bg-gradient-to-r from-emerald-500 to-teal-600 border-0 p-6 flex-row items-center justify-between shadow-md">
            <View className="flex-1 mr-4">
              <Text className="font-display text-2xl font-black text-white">Lapor Masalah</Text>
              <Text className="font-sans text-emerald-100 text-xs mt-1.5 leading-relaxed">
                Bantu kota mendeteksi infrastruktur rusak, sampah, dan keluhan wilayah secara instan.
              </Text>
            </View>
            <View className="p-3.5 bg-white/20 rounded-2xl">
              <AlertTriangle color="white" size={26} />
            </View>
          </BentoCard>
        </TouchableOpacity>

        {/* Medium Cards Grid */}
        <View className="flex-row gap-4 mb-5">
          <TouchableOpacity 
            className="flex-1"
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/map')}
          >
            <BentoCard className="items-center py-6 px-4 h-40 justify-between border border-gray-100 dark:border-gray-800/80">
              <View className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-2xl">
                <MapPin color={isDark ? '#60a5fa' : '#3b82f6'} size={24} />
              </View>
              <View className="items-center">
                <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Peta Interaktif</Text>
                <Text className="font-sans text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1 leading-normal">Laporan wilayah sekitarmu</Text>
              </View>
            </BentoCard>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-1"
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <BentoCard className="items-center py-6 px-4 h-40 justify-between border border-gray-100 dark:border-gray-800/80">
              <View className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl">
                <MessageSquare color={isDark ? '#fbbf24' : '#f59e0b'} size={24} />
              </View>
              <View className="items-center">
                <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Tanya AI</Text>
                <Text className="font-sans text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1 leading-normal">Asisten pintar warga kota</Text>
              </View>
            </BentoCard>
          </TouchableOpacity>
        </View>

        {/* Small Stat Cards Grid */}
        <View className="flex-row gap-4 mb-5">
          <View className="flex-1">
            <BentoCard className="bg-emerald-50/70 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 p-4 rounded-3xl h-28 justify-between shadow-none">
              <View className="p-2 bg-white dark:bg-zinc-900 rounded-xl self-start shadow-sm">
                <CheckCircle color="#10b981" size={16} />
              </View>
              <View>
                <Text className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.resolved}</Text>
                <Text className="font-sans text-[9px] font-bold text-emerald-700/80 dark:text-emerald-300/85 uppercase tracking-wider mt-0.5">Laporan Selesai</Text>
              </View>
            </BentoCard>
          </View>

          <View className="flex-1">
            <BentoCard className="bg-amber-50/70 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 p-4 rounded-3xl h-28 justify-between shadow-none">
              <View className="p-2 bg-white dark:bg-zinc-900 rounded-xl self-start shadow-sm">
                <Clock color="#d97706" size={16} />
              </View>
              <View>
                <Text className="font-display text-2xl font-black text-[#d97706] dark:text-amber-400">{stats.pending}</Text>
                <Text className="font-sans text-[9px] font-bold text-amber-700/80 dark:text-amber-300/85 uppercase tracking-wider mt-0.5">Sedang Diproses</Text>
              </View>
            </BentoCard>
          </View>
        </View>

        {/* Chart Card */}
        <View className="w-full mb-5">
          <BentoCard className="h-60 p-5 border border-gray-100 dark:border-gray-800">
            <Text className="font-display font-bold text-gray-900 dark:text-white text-sm mb-3">Proporsi Status Laporan Saya</Text>
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
              <View className="flex-1 items-center justify-center py-6 bg-gray-50 dark:bg-gray-800/10 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                <Text className="font-sans text-xs text-gray-400 dark:text-gray-500 text-center px-4 leading-normal">
                  Belum ada aduan yang Anda kirimkan untuk dianalisis statistiknya.
                </Text>
              </View>
            )}
          </BentoCard>
        </View>

        {/* Full width button to Feed */}
        <TouchableOpacity 
          className="w-full mb-4 mt-1" 
          activeOpacity={0.9}
          onPress={() => router.push('/feed' as any)}
        >
          <View className="bg-gray-100/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-800/80 p-4 rounded-2xl flex-row justify-between items-center shadow-none">
            <Text className="font-display font-bold text-gray-700 dark:text-gray-300 text-sm">Semua Laporan Publik Kota</Text>
            <Text className="font-sans font-bold text-zen-accent">→</Text>
          </View>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}
