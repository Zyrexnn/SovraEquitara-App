import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { Send, User as UserIcon, Shield, MessageSquare } from 'lucide-react-native';
import { apiClient, getImageUrl } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useColorScheme } from 'nativewind';

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
      }, 4000);
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
        const response = await apiClient.post('/ai-assistant', {
          query: userMessage,
          model: 'local'
        });
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
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [aiMessages, adminMessages, chatMode]);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  // Better use local state or direct styling where possible for theme safety

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white dark:bg-stone-950 shadow-sm z-10 flex-row items-center border-b border-stone-100 dark:border-stone-900">
        <View className="w-10 h-10 bg-stone-100 dark:bg-stone-900 rounded-full items-center justify-center mr-3 border border-stone-200/50 dark:border-stone-800">
          <Text className="text-lg">{chatMode === 'AI' ? '🤖' : '💬'}</Text>
        </View>
        <View>
          <Text className="font-display font-black text-lg text-stone-900 dark:text-white">
            {chatMode === 'AI' ? 'Tanya AI' : 'Hubungi Admin'}
          </Text>
          <Text className="font-sans text-[10px] uppercase font-black tracking-wider text-stone-400 dark:text-stone-500">
            Layanan SovraEquitara
          </Text>
        </View>
      </View>

      {/* Premium Zen Segmented Picker */}
      <View className="flex-row mx-4 mt-3 bg-stone-100 dark:bg-stone-900/60 p-1 rounded-2xl border border-stone-200/50 dark:border-stone-800/40">
        <TouchableOpacity
          onPress={() => setChatMode('AI')}
          activeOpacity={0.85}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
            chatMode === 'AI' ? 'bg-stone-900 dark:bg-stone-100' : 'bg-transparent'
          }`}
        >
          <Text className={`font-display font-black text-xs uppercase tracking-wide ${
            chatMode === 'AI' ? 'text-white dark:text-stone-950' : 'text-stone-500 dark:text-stone-450'
          }`}>
            Tanya AI 🤖
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setChatMode('ADMIN')}
          activeOpacity={0.85}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
            chatMode === 'ADMIN' ? 'bg-stone-900 dark:bg-stone-100' : 'bg-transparent'
          }`}
        >
          <Text className={`font-display font-black text-xs uppercase tracking-wide ${
            chatMode === 'ADMIN' ? 'text-white dark:text-stone-950' : 'text-stone-500 dark:text-stone-450'
          }`}>
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
              className={`mb-4 max-w-[82%] rounded-2xl p-4 ${
                msg.sender === 'user'
                  ? 'bg-stone-900 dark:bg-stone-100 self-end rounded-tr-sm'
                  : 'bg-white dark:bg-stone-900 self-start rounded-tl-sm border border-stone-200/60 dark:border-stone-800/80 shadow-none'
              }`}
            >
              <Text className={`font-sans text-sm leading-6 ${
                msg.sender === 'user' ? 'text-white dark:text-stone-950' : 'text-stone-800 dark:text-stone-200'
              }`}>
                {msg.text}
              </Text>
            </View>
          ))
        ) : (
          isAdminLoading ? (
            <View className="py-12 justify-center">
              <ActivityIndicator size="small" color="#a8a29e" />
            </View>
          ) : adminMessages.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <View className="p-4 bg-stone-100 dark:bg-stone-900 rounded-full mb-3 border border-stone-200/50 dark:border-stone-850">
                <MessageSquare color="#78716c" size={28} />
              </View>
              <Text className="font-sans text-stone-500 dark:text-stone-450 text-xs text-center leading-relaxed px-6">
                Belum ada percakapan dengan Admin. Silakan ketik pesan di bawah untuk mulai berkoordinasi secara langsung!
              </Text>
            </View>
          ) : (
            adminMessages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              const senderName = msg.sender?.full_name || 'Admin';
              const senderRole = (msg.sender?.role || '').toLowerCase();

              // Strict and clean check for role labels — prevents any superadmin vs admin confusion!
              const isSuper = senderRole === 'super_admin' || senderRole === 'superadmin';
              const isAdmin = senderRole === 'admin';

              return (
                <View
                  key={msg.id}
                  className={`mb-4 max-w-[82%] rounded-2xl p-4 ${
                    isMine
                      ? 'bg-stone-900 dark:bg-stone-100 self-end rounded-tr-sm'
                      : 'bg-white dark:bg-stone-900 self-start rounded-tl-sm border border-stone-200/60 dark:border-stone-800/80 shadow-none'
                  }`}
                >
                  {!isMine && (
                    <View className="flex-row items-center mb-2 gap-1.5 flex-wrap">
                      <Text className="font-display text-[9px] font-black text-stone-900 dark:text-white uppercase">
                        {senderName}
                      </Text>
                      {isSuper && (
                        <View className="bg-stone-900 dark:bg-white px-2 py-0.5 rounded-full flex-row items-center border border-stone-900 dark:border-white">
                          <Shield color={isMine ? '#ffffff' : '#78716c'} size={8} style={{ marginRight: 3 }} />
                          <Text className="font-sans text-[7px] font-black text-white dark:text-stone-950 uppercase tracking-wide">
                            Super Admin
                          </Text>
                        </View>
                      )}
                      {isAdmin && (
                        <View className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full flex-row items-center border border-stone-200 dark:border-stone-700">
                          <Shield color="#78716c" size={8} style={{ marginRight: 3 }} />
                          <Text className="font-sans text-[7px] font-black text-stone-700 dark:text-stone-300 uppercase tracking-wide">
                            Admin
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  <Text className={`font-sans text-sm leading-6 ${
                    isMine ? 'text-white dark:text-stone-950' : 'text-stone-850 dark:text-stone-200'
                  }`}>
                    {msg.content}
                  </Text>
                  <Text className={`font-sans text-[8px] mt-1.5 ${
                    isMine ? 'text-stone-400 dark:text-stone-600 self-end' : 'text-stone-400 dark:text-stone-500'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </Text>
                </View>
              );
            })
          )
        )}

        {chatMode === 'AI' && isLoading && (
          <View className="bg-white dark:bg-stone-900 self-start rounded-2xl rounded-tl-sm p-4 mb-4 border border-stone-200/50 dark:border-stone-800/80">
            <Text className="font-sans text-stone-400 dark:text-stone-550 text-xs">AI sedang berpikir...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Form */}
      <View className="p-4 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-900 flex-row items-center">
        <TextInput
          className="flex-1 bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 px-4.5 py-3 rounded-2xl font-sans text-xs mr-2.5"
          placeholder={chatMode === 'AI' ? 'Tanyakan sesuatu kepada AI...' : 'Tulis pesan ke admin...'}
          placeholderTextColor="#78716c"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!input.trim() || (chatMode === 'AI' ? isLoading : isAdminSending)}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            input.trim() && !(chatMode === 'AI' ? isLoading : isAdminSending)
              ? 'bg-stone-900 dark:bg-white'
              : 'bg-stone-200 dark:bg-stone-900 border border-stone-300/30 dark:border-stone-850'
          }`}
        >
          {isAdminSending ? (
            <ActivityIndicator size="small" color="#78716c" />
          ) : (
            <Send
              color={
                input.trim() && !(chatMode === 'AI' ? isLoading : isAdminSending)
                  ? (Platform.OS === 'ios' ? '#000000' : 'white') // Simple fallback check representation
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
