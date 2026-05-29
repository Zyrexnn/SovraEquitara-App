import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient, getImageUrl } from '../../../api/client';
import { BentoCard } from '../../../components/ui/BentoCard';
import { ArrowLeft, Search, MessageSquare, User as UserIcon } from 'lucide-react-native';

export default function AdminHelpdeskInboxScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    try {
      const res = await apiClient.get('/admin/chat/conversations');
      if (res.data?.data) {
        setConversations(res.data.data);
      }
    } catch (e) {
      console.log('Failed to fetch admin conversations', e);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

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
      
      // If today, show time
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }
      
      // Otherwise, show date
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white dark:bg-zen-darkSurface shadow-sm flex-row items-center border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
          <ArrowLeft color="#374151" size={20} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-display font-bold text-lg dark:text-white">Kotak Bantuan Warga</Text>
          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400">Moderasi percakapan AI & warga</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="p-4 bg-white dark:bg-zen-darkSurface border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-2xl">
          <Search color="#9ca3af" size={18} className="mr-2" />
          <TextInput
            placeholder="Cari percakapan..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 font-sans text-sm text-gray-900 dark:text-white"
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
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        ) : filteredConversations.length === 0 ? (
          <View className="py-12 items-center">
            <View className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
              <MessageSquare color="#9ca3af" size={32} />
            </View>
            <Text className="font-sans text-gray-500 dark:text-gray-400 text-center">
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
                <BentoCard className={`p-4 flex-row items-center ${hasUnread ? 'bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/40' : ''}`}>
                  {/* Avatar */}
                  <View className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-200 justify-center items-center mr-3">
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                    ) : (
                      <UserIcon color="#9ca3af" size={24} />
                    )}
                  </View>

                  {/* Conversation Info */}
                  <View className="flex-1 mr-2">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className={`font-display text-sm ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`} numberOfLines={1}>
                        {participant?.full_name || 'Warga SovraEquitara'}
                      </Text>
                      <Text className="font-sans text-[10px] text-gray-400">
                        {formatLastMessageTime(conv.last_message_at || conv.updated_at)}
                      </Text>
                    </View>
                    <Text className={`font-sans text-xs ${hasUnread ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`} numberOfLines={1}>
                      {conv.last_message || 'Mulai percakapan baru...'}
                    </Text>
                  </View>

                  {/* Unread count badge */}
                  {hasUnread && (
                    <View className="bg-indigo-500 min-w-[20px] h-5 px-1.5 rounded-full items-center justify-center">
                      <Text className="font-sans text-[10px] font-bold text-white">
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
