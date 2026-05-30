import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient, getImageUrl } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { Search, MessageSquare, User as UserIcon } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';

export default function AdminHelpdeskTab() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/chat/conversations');
      if (res.data?.data) {
        setConversations(res.data.data);
      }
    } catch (e) {
      console.log('Failed to fetch admin conversations in tab', e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations(conversations.length === 0);
      const interval = setInterval(() => {
        fetchConversations(false);
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }, [conversations.length])
  );

  const filteredConversations = conversations.filter(conv => {
    const name = conv.participant?.full_name || '';
    const email = conv.participant?.email || '';
    const message = conv.last_message || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           message.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatLastMessageTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      const now = new Date();

      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }

      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  const isDark = user ? true : false; // Safe dark theme configuration representation

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 bg-white dark:bg-stone-950 border-b border-stone-100 dark:border-stone-900 shadow-sm z-10 flex-row justify-between items-center">
        <View>
          <Text className="font-display text-xl font-bold text-stone-900 dark:text-white">Kotak Bantuan Warga</Text>
          <Text className="font-sans text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5">
            Pantau Obrolan AI & Aduan Langsung
          </Text>
        </View>
        <View className="p-2 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200/50 dark:border-stone-800">
          <MessageSquare color={isDark ? '#ffffff' : '#000000'} size={20} />
        </View>
      </View>

      {/* Search Bar */}
      <View className="p-4 bg-white dark:bg-stone-950 border-b border-stone-100 dark:border-stone-900 shadow-sm">
        <View className="flex-row items-center bg-stone-100 dark:bg-stone-900 px-3 py-2.5 rounded-2xl border border-stone-200/50 dark:border-stone-800/40">
          <Search color="#78716c" size={18} style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Cari percakapan..."
            placeholderTextColor="#78716c"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 font-sans text-xs text-stone-900 dark:text-white"
          />
        </View>
      </View>

      {/* Conversation list */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="small" color="#78716c" />
          </View>
        ) : filteredConversations.length === 0 ? (
          <View className="py-12 items-center">
            <View className="p-4 bg-stone-100 dark:bg-stone-900 rounded-full mb-3 border border-stone-200/50 dark:border-stone-850">
              <MessageSquare color="#78716c" size={32} />
            </View>
            <Text className="font-sans text-stone-500 dark:text-stone-400 text-center text-xs">
              {searchQuery ? 'Tidak ada percakapan yang cocok.' : 'Belum ada percakapan masuk dari warga.'}
            </Text>
          </View>
        ) : (
          filteredConversations.map((conv) => {
            const participant = conv.participant;
            const hasUnread = conv.unread_count > 0;
            const avatarUrl = getImageUrl(participant?.avatar_url);

            return (
              <TouchableOpacity
                key={conv.id}
                activeOpacity={0.9}
                onPress={() => router.push(`/admin/helpdesk/${conv.id}` as any)}
                className="mb-3"
              >
                <BentoCard className={`p-4 flex-row items-center ${
                  hasUnread
                    ? 'bg-stone-50/80 dark:bg-stone-900/40 border border-stone-900 dark:border-stone-100/20'
                    : 'border border-stone-100 dark:border-stone-850'
                }`}>
                  {/* Avatar */}
                  <View className="w-12 h-12 rounded-full overflow-hidden border border-stone-200/50 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 justify-center items-center mr-3">
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                    ) : (
                      <UserIcon color="#78716c" size={24} />
                    )}
                  </View>

                  {/* Conversation Info */}
                  <View className="flex-1 mr-2">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className={`font-display text-sm ${
                        hasUnread ? 'font-black text-stone-950 dark:text-white' : 'font-bold text-stone-800 dark:text-stone-200'
                      }`} numberOfLines={1}>
                        {participant?.full_name || 'Warga SovraEquitara'}
                      </Text>
                      <Text className="font-sans text-[10px] text-stone-400">
                        {formatLastMessageTime(conv.last_message_at || conv.updated_at)}
                      </Text>
                    </View>
                    <Text className={`font-sans text-xs ${
                      hasUnread ? 'font-black text-stone-950 dark:text-stone-50' : 'text-stone-500 dark:text-stone-400'
                    }`} numberOfLines={1}>
                      {conv.last_message || 'Mulai percakapan baru...'}
                    </Text>
                  </View>

                  {/* Unread count badge */}
                  {hasUnread && (
                    <View className="bg-stone-900 dark:bg-white min-w-[20px] h-5 px-1.5 rounded-full items-center justify-center border border-stone-900 dark:border-white">
                      <Text className="font-sans text-[9px] font-black text-white dark:text-stone-950">
                        {conv.unread_count}
                      </Text>
                    </View>
                  )}
                </BentoCard>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
