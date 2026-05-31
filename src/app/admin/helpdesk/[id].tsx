import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send, ArrowLeft, User as UserIcon, Shield } from 'lucide-react-native';
import { apiClient, getImageUrl } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import { useColorScheme } from 'nativewind';

export default function AdminChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const fetchConversationDetails = async () => {
    try {
      const resConvs = await apiClient.get('/admin/chat/conversations');
      if (resConvs.data?.data) {
        const found = resConvs.data.data.find((c: any) => c.id === id);
        if (found) {
          setConversation(found);
        }
      }
    } catch (e) {
      console.log('Failed to fetch conversation detail', e);
    }
  };

  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await apiClient.get(`/admin/chat/conversations/${id}/messages`);
      if (res.data?.data) {
        setMessages(res.data.data);
      }
    } catch (e) {
      console.log('Failed to fetch chat messages', e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversationDetails();
    fetchMessages(true);

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendReply = async () => {
    if (!input.trim() || isSending) return;

    const replyText = input.trim();
    setInput('');
    setIsSending(true);
    Keyboard.dismiss();

    try {
      const res = await apiClient.post(`/admin/chat/conversations/${id}/reply`, {
        content: replyText,
      });

      if (res.data?.data) {
        setMessages((prev) => [...prev, res.data.data]);
      } else {
        await fetchMessages(false);
      }
    } catch (e) {
      console.log('Failed to send reply message', e);
      alert('Gagal mengirim pesan balasan.');
    } finally {
      setIsSending(false);
    }
  };

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white dark:bg-stone-950 shadow-sm z-10 flex-row items-center border-b border-stone-100 dark:border-stone-900">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-2 bg-stone-100 dark:bg-stone-900 rounded-full border border-stone-200/50 dark:border-stone-800"
        >
          <ArrowLeft color={isDark ? '#ffffff' : '#1c1917'} size={18} />
        </TouchableOpacity>

        {conversation ? (
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full overflow-hidden border border-stone-200/50 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 justify-center items-center mr-3">
              {conversation.participant?.avatar_url ? (
                <Image source={{ uri: getImageUrl(conversation.participant.avatar_url) }} className="w-full h-full" />
              ) : (
                <UserIcon color="#78716c" size={20} />
              )}
            </View>
            <View className="flex-1">
              <Text className="font-display font-black text-base text-stone-900 dark:text-white" numberOfLines={1}>
                {conversation.participant?.full_name || 'Warga'}
              </Text>
              <Text className="font-sans text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-wider">
                {conversation.participant?.email}
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-1">
            <Text className="font-display font-black text-base text-stone-900 dark:text-white">Memuat percakapan...</Text>
          </View>
        )}
      </View>

      {/* Messages list */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#78716c" />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 p-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((msg) => {
            const isAdminMsg = msg.sender_id === user?.id;
            const senderName = msg.sender?.full_name || (isAdminMsg ? 'Admin' : 'Warga');
            const senderAvatar = getImageUrl(msg.sender?.avatar_url);

            // Strict role determination inside helpdesk chat room to display CORRECT roles!
            const rawRole = (msg.sender?.role || (isAdminMsg ? user?.role : 'USER') || '').toLowerCase();
            const isSuper = rawRole === 'super_admin' || rawRole === 'superadmin';
            const isNormalAdmin = rawRole === 'admin';

            return (
              <View
                key={msg.id}
                className={`mb-4 flex-row items-end ${isAdminMsg ? 'justify-end' : 'justify-start'}`}
              >
                {/* User avatar on the left */}
                {!isAdminMsg && (
                  <View className="w-8 h-8 rounded-full overflow-hidden border border-stone-200/50 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 justify-center items-center mr-2 mb-1 shadow-none">
                    {senderAvatar ? (
                      <Image source={{ uri: senderAvatar }} className="w-full h-full" />
                    ) : (
                      <UserIcon color="#78716c" size={16} />
                    )}
                  </View>
                )}

                <View className={`max-w-[78%] rounded-2xl p-4 ${
                  isAdminMsg
                    ? 'bg-stone-900 dark:bg-stone-100 rounded-br-sm'
                    : 'bg-white dark:bg-stone-900 rounded-bl-sm border border-stone-200/60 dark:border-stone-800/80 shadow-none'
                }`}>
                  {/* Role badges on replies for complete role transparency! */}
                  <View className="flex-row items-center mb-1.5 gap-1.5 flex-wrap">
                    {!isAdminMsg && (
                      <Text className="font-display text-[9px] font-black text-stone-900 dark:text-white uppercase">
                        {senderName}
                      </Text>
                    )}
                    {isAdminMsg && (
                      <Text className="font-display text-[9px] font-black text-stone-400 dark:text-stone-600 uppercase">
                        Anda
                      </Text>
                    )}

                    {isSuper && (
                      <View className={`px-1.5 py-0.5 rounded-full flex-row items-center border ${
                        isAdminMsg
                          ? 'bg-stone-800 dark:bg-stone-200 border-stone-700 dark:border-stone-300'
                          : 'bg-stone-900 dark:bg-white border-stone-900 dark:border-white'
                      }`}>
                        <Shield color={isAdminMsg ? '#a8a29e' : '#78716c'} size={7} style={{ marginRight: 2 }} />
                        <Text className={`font-sans text-[6.5px] font-black uppercase tracking-wide ${
                          isAdminMsg ? 'text-stone-300 dark:text-stone-800' : 'text-white dark:text-stone-950'
                        }`}>
                          Super Admin
                        </Text>
                      </View>
                    )}
                    {isNormalAdmin && (
                      <View className="bg-stone-100 dark:bg-stone-850 px-1.5 py-0.5 rounded-full flex-row items-center border border-stone-200 dark:border-stone-800">
                        <Shield color="#78716c" size={7} style={{ marginRight: 2 }} />
                        <Text className="font-sans text-[6.5px] font-black text-stone-750 dark:text-stone-350 uppercase tracking-wide">
                          Admin
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className={`font-sans text-sm leading-6 ${
                    isAdminMsg ? 'text-white dark:text-stone-950' : 'text-stone-850 dark:text-stone-200'
                  }`}>
                    {msg.content}
                  </Text>

                  {/* Timestamp */}
                  <Text className={`font-sans text-[8px] text-right mt-1.5 ${
                    isAdminMsg ? 'text-stone-400 dark:text-stone-500' : 'text-stone-400 dark:text-stone-500'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Input row */}
      <View className="p-4 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-900 flex-row items-center">
        <TextInput
          className="flex-1 bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 px-4.5 py-3 rounded-2xl font-sans text-xs mr-2.5"
          placeholder="Ketik tanggapan bantuan..."
          placeholderTextColor="#78716c"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendReply}
          editable={!isSending}
        />
        <TouchableOpacity
          onPress={sendReply}
          disabled={!input.trim() || isSending}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            input.trim() && !isSending ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-900 border border-stone-300/30 dark:border-stone-850'
          }`}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#78716c" />
          ) : (
            <Send
              color={
                input.trim()
                  ? (isDark ? '#000000' : '#ffffff') // Dynamic high-contrast icon representation
                  : '#78716c'
              }
              size={15}
              style={{ marginLeft: 2 }}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
