import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send, ArrowLeft, User as UserIcon } from 'lucide-react-native';
import { apiClient, getImageUrl } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';

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
      // Find the specific conversation details in the list
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

  // Initial load and setup polling
  useEffect(() => {
    fetchConversationDetails();
    fetchMessages(true);

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    // Scroll to bottom when messages change
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
        // Optimistically append new message
        setMessages((prev) => [...prev, res.data.data]);
      } else {
        // Fallback fetch
        await fetchMessages(false);
      }
    } catch (e) {
      console.log('Failed to send reply message', e);
      alert('Gagal mengirim pesan balasan.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white dark:bg-zen-darkSurface shadow-sm z-10 flex-row items-center border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
          <ArrowLeft color="#374151" size={20} />
        </TouchableOpacity>
        
        {conversation ? (
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-200 justify-center items-center mr-3">
              {conversation.participant?.avatar_url ? (
                <Image source={{ uri: getImageUrl(conversation.participant.avatar_url) }} className="w-full h-full" />
              ) : (
                <UserIcon color="#9ca3af" size={20} />
              )}
            </View>
            <View className="flex-1">
              <Text className="font-display font-bold text-base dark:text-white" numberOfLines={1}>
                {conversation.participant?.full_name || 'Warga'}
              </Text>
              <Text className="font-sans text-[10px] text-indigo-500 uppercase font-semibold">
                {conversation.participant?.email}
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-1">
            <Text className="font-display font-bold text-base dark:text-white">Memuat percakapan...</Text>
          </View>
        )}
      </View>

      {/* Messages list */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#6366f1" />
        </View>
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 p-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((msg) => {
            const isAdmin = msg.sender_id === user?.id;
            const senderName = msg.sender?.full_name || (isAdmin ? 'Admin' : 'Warga');
            const senderAvatar = getImageUrl(msg.sender?.avatar_url);

            return (
              <View 
                key={msg.id} 
                className={`mb-4 flex-row items-end ${isAdmin ? 'justify-end' : 'justify-start'}`}
              >
                {/* User avatar on the left */}
                {!isAdmin && (
                  <View className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-200 justify-center items-center mr-2 mb-1 shadow-sm">
                    {senderAvatar ? (
                      <Image source={{ uri: senderAvatar }} className="w-full h-full" />
                    ) : (
                      <UserIcon color="#9ca3af" size={16} />
                    )}
                  </View>
                )}

                <View className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                  isAdmin 
                    ? 'bg-indigo-600 rounded-br-sm' 
                    : 'bg-white dark:bg-zen-darkSurface rounded-bl-sm border border-gray-100 dark:border-gray-800'
                }`}>
                  {/* Sender Name for citizen/AI */}
                  {!isAdmin && (
                    <Text className="font-sans font-bold text-[10px] text-indigo-500 dark:text-indigo-400 mb-1">
                      {senderName}
                    </Text>
                  )}
                  <Text className={`font-sans text-sm leading-5 ${
                    isAdmin ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {msg.content}
                  </Text>
                  
                  {/* Timestamp */}
                  <Text className={`font-sans text-[8px] text-right mt-1.5 ${
                    isAdmin ? 'text-indigo-200' : 'text-gray-400'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Input row */}
      <View className="p-4 bg-white dark:bg-zen-darkSurface border-t border-gray-100 dark:border-gray-800 flex-row items-center">
        <TextInput
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-full font-sans mr-2 text-sm"
          placeholder="Ketik tanggapan bantuan..."
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendReply}
          editable={!isSending}
        />
        <TouchableOpacity 
          onPress={sendReply}
          disabled={!input.trim() || isSending}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            input.trim() && !isSending ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Send color={input.trim() ? 'white' : '#9ca3af'} size={16} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
