import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { apiClient, getImageUrl } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { AppLogo } from '../../components/ui/AppLogo';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { WebView } from 'react-native-webview';
import {
  MapPin, CheckCircle, AlertTriangle, MessageSquare, Bell,
  Clock, Sun, Moon, User as UserIcon, ThumbsUp, FileText, ChevronRight,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // --- State ---
  const [myReports, setMyReports] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [publicFeed, setPublicFeed] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Derived stats from my reports (client-side calculation — 100% accurate)
  const pendingCount = myReports.filter(r => r.status === 'pending').length;
  const resolvedCount = myReports.filter(r => r.status === 'resolved').length;
  const verifiedCount = myReports.filter(r => r.status === 'verified').length;
  const totalCount = myReports.length;

  // --- Fetching ---
  const fetchMyReports = async () => {
    try {
      const res = await apiClient.get('/my-reports');
      if (res.data?.data) setMyReports(res.data.data);
      else if (Array.isArray(res.data)) setMyReports(res.data);
    } catch (e) {
      console.log('Failed to fetch my reports', e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await apiClient.get('/leaderboard');
      if (res.data?.data) setLeaderboard(res.data.data);
      else if (Array.isArray(res.data)) setLeaderboard(res.data);
    } catch (e) {
      console.log('Failed to fetch leaderboard', e);
    }
  };

  const fetchPublicFeed = async () => {
    try {
      const res = await apiClient.get('/public-reports?sort=recent&limit=3');
      if (res.data?.data) setPublicFeed(res.data.data.slice(0, 3));
      else if (Array.isArray(res.data)) setPublicFeed(res.data.slice(0, 3));
    } catch (e) {
      console.log('Failed to fetch public feed', e);
    }
  };

  const loadAll = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    await Promise.all([fetchMyReports(), fetchLeaderboard(), fetchPublicFeed()]);
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  // ChartJS Doughnut HTML
  const chartHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        html, body {
          margin: 0; padding: 0;
          background: transparent;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          height: 100%; overflow: hidden;
        }
        #chart-container {
          position: relative; height: 100%; width: 100%;
          display: flex; align-items: center; justify-content: center;
        }
      </style>
    </head>
    <body>
      <div id="chart-container"><canvas id="myChart"></canvas></div>
      <script>
        var ctx = document.getElementById('myChart').getContext('2d');
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Menunggu', 'Terverifikasi', 'Selesai'],
            datasets: [{
              data: [${pendingCount}, ${verifiedCount}, ${resolvedCount}],
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
                  font: { weight: 'bold', size: 11 },
                  boxWidth: 10, padding: 8
                }
              },
              tooltip: { enabled: true }
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
          <AppLogo width={160} height={60} className="self-start -ml-3" />
          <Text className="font-sans text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
            Selamat beraktivitas, {user?.full_name || 'Warga'}.
          </Text>
        </View>
        <View className="flex-row items-center gap-2.5">
          <View className="bg-zen-surface dark:bg-zen-darkSurface px-3 py-1.5 rounded-full border border-zen-border dark:border-zen-borderDark">
            <Text className="font-sans font-bold text-gray-500 dark:text-gray-400 text-[10px] uppercase">
              {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </View>

          <View className="bg-emerald-500/10 dark:bg-emerald-500/20 px-3.5 py-1.5 rounded-full border border-emerald-500/10">
            <Text className="font-display font-black text-emerald-600 dark:text-emerald-400 text-xs tracking-wider">{user?.points || 0} PTS</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleColorScheme}
            className="p-2.5 bg-white dark:bg-zen-cardDark rounded-full border border-zen-border dark:border-zen-borderDark shadow-sm"
          >
            {isDark ? <Sun color="#f59e0b" size={18} /> : <Moon color="#6366f1" size={18} />}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/notifications' as any)}
            className="p-2.5 bg-white dark:bg-zen-cardDark rounded-full border border-zen-border dark:border-zen-borderDark shadow-sm"
          >
            <Bell color="#10b981" size={18} />
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
            <BentoCard className="items-center py-6 px-4 h-40 justify-between shadow-none">
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
            <BentoCard className="items-center py-6 px-4 h-40 justify-between shadow-none">
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

        {/* Stat Cards: Laporan Saya */}
        <View className="flex-row gap-4 mb-5">
          <View className="flex-1">
            <BentoCard className="bg-emerald-50/70 border border-emerald-100/10 dark:bg-emerald-950/20 dark:border-emerald-900/15 p-4 rounded-3xl h-28 justify-between shadow-none">
              <View className="p-2 bg-white dark:bg-zinc-900 rounded-xl self-start shadow-sm">
                <CheckCircle color="#10b981" size={16} />
              </View>
              <View>
                <Text className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">{resolvedCount}</Text>
                <Text className="font-sans text-[9px] font-bold text-emerald-700/80 dark:text-emerald-300/85 uppercase tracking-wider mt-0.5">Laporan Selesai</Text>
              </View>
            </BentoCard>
          </View>

          <View className="flex-1">
            <BentoCard className="bg-amber-50/70 border border-amber-100/10 dark:bg-amber-950/20 dark:border-amber-900/15 p-4 rounded-3xl h-28 justify-between shadow-none">
              <View className="p-2 bg-white dark:bg-zinc-900 rounded-xl self-start shadow-sm">
                <Clock color="#d97706" size={16} />
              </View>
              <View>
                <Text className="font-display text-2xl font-black text-[#d97706] dark:text-amber-400">{pendingCount}</Text>
                <Text className="font-sans text-[9px] font-bold text-amber-700/80 dark:text-amber-300/85 uppercase tracking-wider mt-0.5">Sedang Diproses</Text>
              </View>
            </BentoCard>
          </View>

          <View className="flex-1">
            <BentoCard className="bg-blue-50/70 border border-blue-100/10 dark:bg-blue-950/20 dark:border-blue-900/15 p-4 rounded-3xl h-28 justify-between shadow-none">
              <View className="p-2 bg-white dark:bg-zinc-900 rounded-xl self-start shadow-sm">
                <FileText color="#3b82f6" size={16} />
              </View>
              <View>
                <Text className="font-display text-2xl font-black text-blue-600 dark:text-blue-400">{totalCount}</Text>
                <Text className="font-sans text-[9px] font-bold text-blue-700/80 dark:text-blue-300/85 uppercase tracking-wider mt-0.5">Total Laporan</Text>
              </View>
            </BentoCard>
          </View>
        </View>

        {/* Chart Card — Proporsi Status Laporan Saya */}
        <View className="w-full mb-5">
          <BentoCard className="p-5 shadow-none">
            <Text className="font-display font-bold text-gray-900 dark:text-white text-sm mb-3">Proporsi Status Laporan Saya</Text>
            {totalCount > 0 ? (
              <View style={{ height: 200, width: '100%' }}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: chartHtml }}
                  style={{ backgroundColor: 'transparent', flex: 1, opacity: 0.99 }}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <View className="h-40 items-center justify-center bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700/50">
                <FileText color={isDark ? '#4b5563' : '#d1d5db'} size={28} />
                <Text className="font-sans text-xs text-gray-400 dark:text-gray-600 text-center px-6 mt-3 leading-relaxed">
                  Belum ada aduan yang Anda kirimkan untuk dianalisis statistiknya.
                </Text>
              </View>
            )}
          </BentoCard>
        </View>

        {/* Warga Teladan Leaderboard */}
        <View className="w-full mb-5">
          <BentoCard className="rounded-3xl p-5 shadow-none">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Warga Teladan Kota</Text>
              <View className="bg-blue-500 px-2 py-0.5 rounded-md">
                <Text className="font-sans font-black text-[9px] text-white tracking-wider">TOP 10</Text>
              </View>
            </View>

            {leaderboard.length === 0 ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#10b981" />
              </View>
            ) : (
              <View className="gap-3.5">
                {leaderboard.slice(0, 10).map((item, index) => (
                  <View key={item.id || index} className="flex-row items-center justify-between pb-2 border-b border-gray-50 dark:border-zinc-900/50">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className={`w-6 h-6 rounded-full items-center justify-center mr-2.5 ${
                        index === 0 ? 'bg-amber-500/15' :
                        index === 1 ? 'bg-blue-500/15' :
                        index === 2 ? 'bg-emerald-500/15' : 'bg-transparent'
                      }`}>
                        <Text className={`font-display font-black text-xs ${
                          index === 0 ? 'text-amber-600 dark:text-amber-400' :
                          index === 1 ? 'text-blue-600 dark:text-blue-400' :
                          index === 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-zinc-600'
                        }`}>
                          {index + 1}
                        </Text>
                      </View>
                      <View className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/25 items-center justify-center mr-2.5 overflow-hidden border border-gray-100 dark:border-gray-800">
                        {item.avatar_url ? (
                          <Image source={{ uri: getImageUrl(item.avatar_url) }} className="w-full h-full" />
                        ) : (
                          <UserIcon color="#10b981" size={14} />
                        )}
                      </View>
                      <Text className="font-sans text-xs font-bold text-gray-700 dark:text-gray-200 flex-1" numberOfLines={1}>
                        {item.full_name}
                      </Text>
                    </View>
                    <View className="bg-amber-50 dark:bg-amber-950/20 px-2.5 py-0.5 rounded-full border border-amber-100/10">
                      <Text className="font-sans font-black text-[9px] text-amber-700 dark:text-amber-400">{item.points || 0} PTS</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </BentoCard>
        </View>

        {/* Public Feed Section — Top 3 Laporan Terkini */}
        <View className="w-full mb-5">
          <View className="flex-row justify-between items-center mb-3 pl-1">
            <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Laporan Terkini Warga
            </Text>
            <TouchableOpacity onPress={() => router.push('/feed' as any)} activeOpacity={0.7}>
              <Text className="font-sans text-xs font-bold text-emerald-500">Lihat Semua →</Text>
            </TouchableOpacity>
          </View>

          {isLoading && publicFeed.length === 0 ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#10b981" />
            </View>
          ) : publicFeed.length === 0 ? (
            <BentoCard className="p-5 items-center shadow-none">
              <Text className="font-sans text-xs text-gray-400 dark:text-gray-600 text-center">Belum ada laporan publik.</Text>
            </BentoCard>
          ) : (
            <View className="gap-3">
              {publicFeed.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/(tabs)/reports/${report.id}` as any)}
                >
                  <BentoCard className="p-4 shadow-none">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="font-display font-bold text-gray-900 dark:text-white text-sm" numberOfLines={1}>
                          {report.category?.name || 'Laporan Umum'}
                        </Text>
                        <Text className="font-sans text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {report.profile?.full_name || report.user?.full_name || 'Anonim'}
                        </Text>
                      </View>
                      <StatusBadge status={report.status} />
                    </View>

                    <Text className="font-sans text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2.5" numberOfLines={2}>
                      {report.description}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <MapPin color="#9ca3af" size={12} />
                        <Text className="font-sans text-[10px] text-gray-400 dark:text-gray-500 ml-1" numberOfLines={1}>
                          {report.location_detail || 'Lokasi tidak spesifik'}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <ThumbsUp color="#10b981" size={12} />
                        <Text className="font-sans text-[10px] font-bold text-zen-accent ml-1">{report.vote_count || 0}</Text>
                      </View>
                    </View>
                  </BentoCard>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Full Width Button to Feed */}
        <TouchableOpacity
          className="w-full mb-4 mt-1"
          activeOpacity={0.9}
          onPress={() => router.push('/feed' as any)}
        >
          <View className="bg-gray-100/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-800/80 p-4 rounded-2xl flex-row justify-between items-center shadow-none">
            <Text className="font-display font-bold text-gray-700 dark:text-gray-300 text-sm">Semua Laporan Publik Kota</Text>
            <ChevronRight color={isDark ? '#6b7280' : '#9ca3af'} size={18} />
          </View>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}
