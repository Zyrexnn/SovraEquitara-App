import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { apiClient } from '../api/client';
import { BentoCard } from '../components/ui/BentoCard';
import { ArrowLeft, Bell, AlertTriangle, Info, ShieldAlert } from 'lucide-react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#f3f4f6' : '#374151';

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.data?.data) {
        setNotifications(res.data.data);
      } else if (res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.log('Failed to fetch notifications', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handlePress = (notif: any) => {
    if (notif.action_url) {
      // Check if it redirects to open a specific report (e.g. /history?open=id)
      const match = notif.action_url.match(/open=([a-f0-9\-]+)/i);
      const reportId = match ? match[1] : null;
      if (reportId) {
        router.push(`/(tabs)/reports/${reportId}` as any);
      }
    }
  };

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 bg-white dark:bg-zen-cardDark border-b border-zen-border dark:border-zen-borderDark flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mr-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-full"
        >
          <ArrowLeft color={iconColor} size={20} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-display text-xl font-bold text-gray-900 dark:text-white">Pemberitahuan</Text>
          <Text className="font-sans text-[10px] text-gray-500">Pengumuman & Siaran Kota Resmi</Text>
        </View>
        <View className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-full">
          <Bell color="#10b981" size={18} />
        </View>
      </View>

      {/* List content */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {notifications.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <Bell color="#9ca3af" size={48} className="opacity-40 mb-3" />
              <Text className="font-sans font-bold text-gray-400 text-center">Belum ada pengumuman hari ini.</Text>
              <Text className="font-sans text-xs text-gray-400 text-center mt-1">Anda akan menerima siaran langsung jika ada berita wilayah.</Text>
            </View>
          ) : (
            notifications.map((notif) => {
              const isEmergency = notif.type === 'EMERGENCY' || notif.type === 'WARNING';
              const dateStr = new Date(notif.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <TouchableOpacity
                  key={notif.id}
                  activeOpacity={notif.action_url ? 0.9 : 1}
                  onPress={() => handlePress(notif)}
                  className="mb-4"
                >
                  <BentoCard 
                    className={`p-4 border shadow-none ${
                      isEmergency 
                        ? 'bg-red-50/70 border-red-200 dark:bg-red-950/20 dark:border-red-900/50' 
                        : 'bg-white dark:bg-zen-cardDark border-zen-border dark:border-zen-borderDark'
                    }`}
                  >
                    <View className="flex-row items-start mb-2">
                      <View className={`p-2 rounded-xl mr-3 ${
                        isEmergency 
                          ? 'bg-red-500' 
                          : 'bg-emerald-500'
                      }`}>
                        {isEmergency ? (
                          <ShieldAlert color="white" size={16} />
                        ) : (
                          <Info color="white" size={16} />
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row justify-between items-center flex-wrap">
                          <Text className={`font-display text-[10px] font-black uppercase tracking-widest ${
                            isEmergency ? 'text-red-500' : 'text-emerald-500'
                          }`}>
                            {isEmergency ? 'Darurat / Penting' : 'Pemberitahuan Umum'}
                          </Text>
                          <Text className="font-sans text-[9px] text-gray-400 font-bold">{dateStr}</Text>
                        </View>
                        <Text className="font-display font-bold text-gray-900 dark:text-white text-sm mt-0.5">
                          {notif.title}
                        </Text>
                      </View>
                    </View>

                    <Text className="font-sans text-xs text-gray-600 dark:text-gray-300 leading-normal pl-11">
                      {notif.message}
                    </Text>

                    {notif.action_url && (
                      <View className="mt-3 pt-3 border-t border-zen-border dark:border-zen-borderDark flex-row justify-end pl-11">
                        <Text className={`font-sans font-bold text-[10px] ${
                          isEmergency ? 'text-red-500' : 'text-zen-accent'
                        }`}>
                          Lihat Detail Aduan →
                        </Text>
                      </View>
                    )}
                  </BentoCard>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
