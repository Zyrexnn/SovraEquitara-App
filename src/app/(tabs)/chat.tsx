import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { Send, User as UserIcon, Shield, MessageSquare } from 'lucide-react-native';
import { apiClient, getImageUrl } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function ChatScreen() {
  const { user } = useAuthStore();
  const [chatMode, setChatMode] = useState<'AI' | 'ADMIN'>('AI');
  const [aiMessages, setAiMessages] = useState<{id: string, text: string, sender: 'user' | 'ai'}[]>([
    { id: '1', text: `Halo ${user?.full_name || 'Warga'}! Saya adalah Asisten AI SovraEquitara. Ada yang bisa saya bantu terkait pelaporan masalah kota hari ini?`, sender: 'ai' }
  ]);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isAdminSending, setIsAdminSending] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch admin messages
  const fetchAdminMessages = async (silent = false) => {
    if (!silent) setIsAdminLoading(true);
    try {
      const res = await apiClient.get('/chat/messages');
      if (res.data?.data) {
        setAdminMessages(res.data.data);
      } else if (Array.isArray(res.data)) {
        setAdminMessages(res.data);
      }
    } catch (e) {
      console.log('Error fetching admin messages', e);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Setup Admin chat polling when tab is active
  useEffect(() => {
    let pollInterval: any = null;
    
    if (chatMode === 'ADMIN') {
      fetchAdminMessages();
      pollInterval = setInterval(() => {
        fetchAdminMessages(true);
      }, 4000); // 4 seconds polling interval for parity with web FE
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [chatMode]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    Keyboard.dismiss();

    if (chatMode === 'AI') {
      if (isLoading) return;
      const newMessages = [...aiMessages, { id: Date.now().toString(), text: userMessage, sender: 'user' as const }];
      setAiMessages(newMessages);
      setIsLoading(true);

      try {
        const response = await apiClient.post('/ai-assistant', { prompt: userMessage });
        setAiMessages([...newMessages, { 
          id: (Date.now() + 1).toString(), 
          text: response.data?.response || response.data?.answer || 'Maaf, saya tidak mengerti.', 
          sender: 'ai' 
        }]);
      } catch (e: any) {
        setAiMessages([...newMessages, { 
          id: (Date.now() + 1).toString(), 
          text: 'Maaf, server AI sedang sibuk atau tidak tersedia.', 
          sender: 'ai' 
        }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (isAdminSending) return;
      setIsAdminSending(true);
      
      try {
        const res = await apiClient.post('/chat/send', { content: userMessage });
        if (res.status === 200 || res.status === 201) {
          fetchAdminMessages(true);
        }
      } catch (e) {
        console.log('Error sending message to admin', e);
      } finally {
        setIsAdminSending(false);
      }
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages or mode change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [aiMessages, adminMessages, chatMode]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white dark:bg-zen-darkSurface shadow-sm z-10 flex-row items-center border-b border-gray-100 dark:border-gray-800">
        <View className="w-10 h-10 bg-zen-accent/20 rounded-full items-center justify-center mr-3">
          <Text className="text-xl">{chatMode === 'AI' ? '🤖' : '💬'}</Text>
        </View>
        <View>
          <Text className="font-display font-bold text-lg dark:text-white">
            {chatMode === 'AI' ? 'Tanya AI' : 'Hubungi Admin'}
          </Text>
          <Text className="font-sans text-xs text-zen-accent">Selalu online</Text>
        </View>
      </View>

      {/* Segmented Picker */}
      <View className="flex-row mx-4 mt-3 bg-gray-100 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-100 dark:border-gray-800/20">
        <TouchableOpacity 
          onPress={() => setChatMode('AI')} 
          activeOpacity={0.8}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
            chatMode === 'AI' ? 'bg-emerald-500' : 'bg-transparent'
          }`}
        >
          <Text className={`font-display font-bold text-xs ${chatMode === 'AI' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            Tanya AI 🤖
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setChatMode('ADMIN')} 
          activeOpacity={0.8}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
            chatMode === 'ADMIN' ? 'bg-emerald-500' : 'bg-transparent'
          }`}
        >
          <Text className={`font-display font-bold text-xs ${chatMode === 'ADMIN' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            Chat Admin 💬
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {chatMode === 'AI' ? (
          aiMessages.map((msg) => (
            <View 
              key={msg.id} 
              className={`mb-4 max-w-[80%] rounded-2xl p-4 ${
                msg.sender === 'user' 
                  ? 'bg-emerald-500 self-end rounded-tr-sm' 
                  : 'bg-white dark:bg-zen-darkSurface self-start rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-800'
              }`}
            >
              <Text className={`font-sans text-base leading-6 ${
                msg.sender === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-200'
              }`}>
                {msg.text}
              </Text>
            </View>
          ))
        ) : (
          isAdminLoading ? (
            <View className="py-12 justify-center">
              <ActivityIndicator size="small" color="#10b981" />
            </View>
          ) : adminMessages.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <View className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                <MessageSquare color="#9ca3af" size={32} />
              </View>
              <Text className="font-sans text-gray-500 dark:text-gray-400 text-xs text-center leading-normal px-6">
                Belum ada percakapan dengan Admin. Silakan ketik pesan di bawah untuk mulai berkoordinasi secara langsung!
              </Text>
            </View>
          ) : (
            adminMessages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              const senderName = msg.sender?.full_name || 'Admin';
              const senderRole = msg.sender?.role?.toLowerCase() || '';
              const isSuper = senderRole === 'super_admin' || senderRole === 'superadmin';
              const isAdmin = senderRole === 'admin' || isSuper;

              return (
                <View 
                  key={msg.id}
                  className={`mb-4 max-w-[80%] rounded-[20px] p-4 ${
                    isMine
                      ? 'bg-indigo-500 self-end rounded-tr-sm'
                      : 'bg-white dark:bg-zen-darkSurface self-start rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-800'
                  }`}
                >
                  {!isMine && (
                    <View className="flex-row items-center mb-1.5 gap-1.5 flex-wrap">
                      <Text className="font-display text-[10px] font-black text-gray-900 dark:text-white uppercase">
                        {senderName}
                      </Text>
                      {isSuper ? (
                        <View className="bg-amber-500/10 px-1.5 py-0.5 rounded-full flex-row items-center border border-amber-500/20">
                          <Shield color="#f59e0b" size={8} className="mr-0.5" />
                          <Text className="font-sans text-[7px] font-black text-amber-600 uppercase">Super</Text>
                        </View>
                      ) : isAdmin ? (
                        <View className="bg-blue-500/10 px-1.5 py-0.5 rounded-full flex-row items-center border border-blue-500/20">
                          <Shield color="#3b82f6" size={8} className="mr-0.5" />
                          <Text className="font-sans text-[7px] font-black text-blue-600 uppercase">Admin</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                  <Text className={`font-sans text-base leading-6 ${
                    isMine ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {msg.content}
                  </Text>
                  <Text className={`font-sans text-[8px] mt-1.5 ${
                    isMine ? 'text-indigo-100 self-end' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </Text>
                </View>
              );
            })
          )
        )}
        
        {chatMode === 'AI' && isLoading && (
          <View className="bg-white dark:bg-zen-darkSurface self-start rounded-2xl rounded-tl-sm p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <Text className="font-sans text-gray-500">AI sedang mengetik...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Form */}
      <View className="p-4 bg-white dark:bg-zen-darkSurface border-t border-gray-100 dark:border-gray-800 flex-row items-center">
        <TextInput
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-full font-sans mr-2"
          placeholder={chatMode === 'AI' ? 'Tanyakan sesuatu...' : 'Tulis pesan ke admin...'}
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity 
          onPress={sendMessage}
          disabled={!input.trim() || (chatMode === 'AI' ? isLoading : isAdminSending)}
          className={`w-12 h-12 rounded-full items-center justify-center ${
            input.trim() && !(chatMode === 'AI' ? isLoading : isAdminSending) ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          {isAdminSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Send color={input.trim() && !(chatMode === 'AI' ? isLoading : isAdminSending) ? 'white' : '#9ca3af'} size={20} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
