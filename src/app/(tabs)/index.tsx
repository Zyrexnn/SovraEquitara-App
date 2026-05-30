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
  Clock, Sun, Moon, User as UserIcon, ThumbsUp, FileText, ChevronRight, ArrowRight
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
  const pendingCount = myReports.filter(r => {
    const s = (r.status || '').toUpperCase();
    return s === 'PENDING' || s === 'WAITING_APPROVAL';
  }).length;
  const resolvedCount = myReports.filter(r => (r.status || '').toUpperCase() === 'RESOLVED').length;
  const inProcessCount = myReports.filter(r => (r.status || '').toUpperCase() === 'VALID').length;
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

  // ChartJS Doughnut HTML (Monochromatic Theme)
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
            labels: ['Menunggu', 'Diproses', 'Selesai'],
            datasets: [{
              data: [${pendingCount}, ${inProcessCount}, ${resolvedCount}],
              backgroundColor: ['#A1A1AA', '#52525B', ${isDark ? "'#FFFFFF'" : "'#000000'"}],
              borderWidth: ${isDark ? 2 : 2},
              borderColor: ${isDark ? "'#0C0C0E'" : "'#FFFFFF'"},
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
                  color: ${isDark ? "'#F5F5F0'" : "'#1C1917'"},
                  font: { weight: 'bold', size: 11 },
                  boxWidth: 10, padding: 12
                }
              },
              tooltip: { enabled: true }
            },
            cutout: '70%'
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
              Warga • {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center gap-2.5">
          <View className="bg-gray-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-800 flex-row items-center">
            <Text className="font-display font-black text-gray-900 dark:text-white text-[10px] tracking-wider">{user?.points || 0} PTS</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleColorScheme}
            className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800"
          >
            {isDark ? <Sun color="#A1A1AA" size={16} /> : <Moon color="#787774" size={16} />}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/notifications' as any)}
            className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800"
          >
            <Bell color={isDark ? "#A1A1AA" : "#787774"} size={16} />
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
            Halo, {user?.full_name?.split(' ')[0] || 'Warga'}
          </Text>
          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            Mari bersama membangun kota yang lebih baik, responsif, dan nyaman untuk ditinggali.
          </Text>
        </View>

        {/* Bento Grid Layout */}
      <View>

        {/* Large Card: Lapor Masalah */}
        <TouchableOpacity
          className="w-full mb-4"
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/create-report')}
        >
          <BentoCard className="bg-black dark:bg-white border-0 p-8 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="font-display text-3xl font-black text-white dark:text-black">Lapor Masalah</Text>
              <Text className="font-sans text-gray-400 dark:text-gray-600 text-xs mt-2 leading-relaxed">
                Bantu kota mendeteksi infrastruktur rusak, sampah, dan keluhan secara instan.
              </Text>
            </View>
            <View className="p-4 bg-white/10 dark:bg-black/5 rounded-2xl">
              <ArrowRight color={isDark ? "black" : "white"} size={28} />
            </View>
          </BentoCard>
        </TouchableOpacity>

        {/* Medium Cards Grid */}
        <View className="flex-row gap-4 mb-4">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/map')}
          >
            <BentoCard className="items-center py-8 px-4 h-44 justify-between bg-white dark:bg-zinc-950">
              <View className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-2xl">
                <MapPin color={isDark ? '#F5F5F0' : '#1C1917'} size={24} />
              </View>
              <View className="items-center mt-4">
                <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Peta Interaktif</Text>
                <Text className="font-sans text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1">Laporan wilayah sekitarmu</Text>
              </View>
            </BentoCard>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1"
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <BentoCard className="items-center py-8 px-4 h-44 justify-between bg-white dark:bg-zinc-950">
              <View className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-2xl">
                <MessageSquare color={isDark ? '#F5F5F0' : '#1C1917'} size={24} />
              </View>
              <View className="items-center mt-4">
                <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Tanya AI</Text>
                <Text className="font-sans text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1">Asisten pintar warga kota</Text>
              </View>
            </BentoCard>
          </TouchableOpacity>
        </View>

        {/* Stat Cards: Laporan Saya */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <BentoCard className="bg-gray-50 dark:bg-zinc-900/50 p-5 h-32 justify-between">
              <CheckCircle color={isDark ? '#A1A1AA' : '#787774'} size={18} />
              <View>
                <Text className="font-display text-3xl font-black text-gray-900 dark:text-white">{resolvedCount}</Text>
                <Text className="font-sans text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Selesai</Text>
              </View>
            </BentoCard>
          </View>

          <View className="flex-1">
            <BentoCard className="bg-gray-50 dark:bg-zinc-900/50 p-5 h-32 justify-between">
              <Clock color={isDark ? '#A1A1AA' : '#787774'} size={18} />
              <View>
                <Text className="font-display text-3xl font-black text-gray-900 dark:text-white">{inProcessCount}</Text>
                <Text className="font-sans text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Proses</Text>
              </View>
            </BentoCard>
          </View>

          <View className="flex-1">
            <BentoCard className="bg-gray-50 dark:bg-zinc-900/50 p-5 h-32 justify-between">
              <FileText color={isDark ? '#A1A1AA' : '#787774'} size={18} />
              <View>
                <Text className="font-display text-3xl font-black text-gray-900 dark:text-white">{totalCount}</Text>
                <Text className="font-sans text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Total</Text>
              </View>
            </BentoCard>
          </View>
        </View>

        {/* Chart Card — Proporsi Status Laporan Saya */}
        <View className="w-full mb-6">
          <BentoCard className="p-6">
            <Text className="font-display font-bold text-gray-900 dark:text-white text-sm mb-4">Statistik Laporan Anda</Text>
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
              <View className="h-40 items-center justify-center bg-gray-50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <FileText color={isDark ? '#52525B' : '#E5E5E5'} size={28} />
                <Text className="font-sans text-xs text-gray-400 dark:text-gray-500 text-center px-6 mt-3 leading-relaxed">
                  Belum ada aduan yang Anda kirimkan untuk dianalisis.
                </Text>
              </View>
            )}
          </BentoCard>
        </View>

        {/* Warga Teladan Leaderboard */}
        <View className="w-full mb-6">
          <BentoCard className="p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-display font-bold text-gray-900 dark:text-white text-sm">Warga Teladan</Text>
              <Text className="font-sans font-bold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">Top 10</Text>
            </View>

            {leaderboard.length === 0 ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color={isDark ? "#ffffff" : "#000000"} />
              </View>
            ) : (
              <View className="gap-5">
                {leaderboard.slice(0, 10).map((item, index) => (
                  <View key={item.id || index} className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-3">
                      <Text className="font-display font-bold text-xs text-gray-400 dark:text-gray-600 w-5">
                        {index + 1}.
                      </Text>
                      <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 items-center justify-center mr-3 overflow-hidden">
                        {item.avatar_url ? (
                          <Image source={{ uri: getImageUrl(item.avatar_url) }} className="w-full h-full" />
                        ) : (
                          <UserIcon color={isDark ? "#A1A1AA" : "#787774"} size={14} />
                        )}
                      </View>
                      <Text className="font-sans text-sm font-semibold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
                        {item.full_name}
                      </Text>
                    </View>
                    <Text className="font-sans font-black text-xs text-gray-900 dark:text-white">{item.points || 0} pt</Text>
                  </View>
                ))}
              </View>
            )}
          </BentoCard>
        </View>

        {/* Public Feed Section */}
        <View className="w-full mb-6">
          <View className="flex-row justify-between items-center mb-4 pl-1">
            <Text className="font-display text-sm font-bold text-gray-900 dark:text-white">
              Aduan Publik
            </Text>
            <TouchableOpacity onPress={() => router.push('/feed' as any)} activeOpacity={0.7}>
              <Text className="font-sans text-xs font-bold text-gray-500 dark:text-gray-400">Lihat Semua →</Text>
            </TouchableOpacity>
          </View>

          {isLoading && publicFeed.length === 0 ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color={isDark ? "#ffffff" : "#000000"} />
            </View>
          ) : publicFeed.length === 0 ? (
            <BentoCard className="p-6 items-center">
              <Text className="font-sans text-xs text-gray-400 dark:text-gray-500 text-center">Belum ada laporan publik.</Text>
            </BentoCard>
          ) : (
            <View className="gap-4">
              {publicFeed.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/(tabs)/reports/${report.id}` as any)}
                >
                  <BentoCard className="p-5">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1 mr-3">
                        <Text className="font-sans text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                          {report.category?.name || 'Laporan Umum'}
                        </Text>
                        <Text className="font-display font-bold text-gray-900 dark:text-white text-sm" numberOfLines={1}>
                          {report.profile?.full_name || report.user?.full_name || 'Anonim'}
                        </Text>
                      </View>
                      <StatusBadge status={report.status} />
                    </View>

                    <Text className="font-sans text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4" numberOfLines={2}>
                      {report.description}
                    </Text>

                    <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
                      <View className="flex-row items-center flex-1 mr-2">
                        <MapPin color={isDark ? "#64748b" : "#9ca3af"} size={14} />
                        <Text className="font-sans text-[11px] text-gray-500 dark:text-gray-400 ml-1.5" numberOfLines={1}>
                          {report.location_detail || 'Lokasi tidak spesifik'}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <ThumbsUp color={isDark ? "#F5F5F0" : "#1C1917"} size={12} />
                        <Text className="font-display text-xs font-black text-gray-900 dark:text-white ml-1.5">{report.vote_count || 0}</Text>
                      </View>
                    </View>
                  </BentoCard>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

      </View>
    </ScrollView>
    </View>
  );
}