import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Modal } from 'react-native';
import { Send, Sparkles, Shield, History, Trash2, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useColorScheme } from 'nativewind';

export default function AdminAIScreenTab() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Parse message content to extract [DETAIL_BTN:uuid] or raw UUIDs into interactive buttons
  const renderMessageContent = (content: string, isUserMessage: boolean) => {
    if (isUserMessage) {
      return (
        <Text
          className={`font-sans text-sm leading-6 ${
            isSuperAdmin ? 'text-white' : 'text-white dark:text-stone-950'
          }`}
        >
          {content}
        </Text>
      );
    }

    // 1. Normalize raw UUIDs not already inside [DETAIL_BTN:...] to [DETAIL_BTN:UUID]
    let parsedContent = content.replace(/(?:\[DETAIL_BTN:)?([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]?/g, (match, uuid) => {
      return `[DETAIL_BTN:${uuid}]`;
    });

    // 2. Parse sequential tokens (Text, Report Button, Chart)
    const tokenRegex = /(\[DETAIL_BTN:[0-9a-fA-F\-]{36}\]|\[CHART:(?:bar|line|pie):[^\]]+\])/g;
    const tokens = parsedContent.split(tokenRegex);

    return (
      <View className="w-full">
        {tokens.map((token, idx) => {
          if (!token) return null;

          if (token.startsWith('[DETAIL_BTN:')) {
            const uuid = token.substring(12, 12 + 36);
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => router.push(`/admin/report/${uuid}` as any)}
                className={`mt-3 py-3 px-4 rounded-xl flex-row items-center justify-between shadow-sm border ${
                  isSuperAdmin
                    ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/40'
                    : 'bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-750'
                }`}
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${isSuperAdmin ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-stone-200 dark:bg-stone-750'}`}>
                    <Sparkles color={isSuperAdmin ? '#a855f7' : '#78716c'} size={12} />
                  </View>
                  <Text className={`font-display font-bold text-xs ${isSuperAdmin ? 'text-purple-750 dark:text-purple-400' : 'text-stone-700 dark:text-stone-300'}`} numberOfLines={1}>
                    Tinjau Laporan ({uuid.substring(0, 8)}...)
                  </Text>
                </View>
                <Text className={`font-sans font-bold text-xs ${isSuperAdmin ? 'text-purple-500' : 'text-stone-500'}`}>→</Text>
              </TouchableOpacity>
            );
          } else if (token.startsWith('[CHART:')) {
            const chartMatch = /\[CHART:(bar|line|pie):([^\]]+)\]/.exec(token);
            if (!chartMatch) return null;
            const type = chartMatch[1];
            const dataStr = chartMatch[2];
            const items = dataStr.split('|').map(item => {
              const parts = item.split(',');
              return { label: (parts[0] || '').trim(), value: parseFloat(parts[1]) || 0 };
            });
            const maxVal = Math.max(...items.map(i => i.value), 1);
            const totalVal = items.reduce((acc, curr) => acc + curr.value, 0) || 1;

            return (
              <View 
                key={idx} 
                className="mt-4 mb-4 p-4 rounded-3xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-800 shadow-none flex-col w-full"
              >
                <View className="flex-row items-center justify-between border-b border-stone-200/30 dark:border-stone-850 pb-2 mb-3">
                  <Text className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                    Analisis Grafik {type.toUpperCase()}
                  </Text>
                  <View className="bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-full border border-blue-100/40 dark:border-blue-900/30">
                    <Text className="text-[8px] font-black text-blue-550 dark:text-blue-400 uppercase">AI Chart</Text>
                  </View>
                </View>

                {type === 'bar' && (
                  <View className="gap-2.5">
                    {items.map((item, i) => {
                      const pct = (item.value / maxVal) * 100;
                      return (
                        <View key={i} className="flex-col">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="font-sans font-bold text-xs text-stone-700 dark:text-stone-300">{item.label}</Text>
                            <Text className="font-display font-black text-xs text-stone-850 dark:text-stone-200">{item.value}</Text>
                          </View>
                          <View className="w-full h-2.5 bg-stone-200/50 dark:bg-stone-800 rounded-full overflow-hidden">
                            <View className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {type === 'line' && (
                  <View className="gap-2">
                    {items.map((item, i) => {
                      const pct = (item.value / maxVal) * 100;
                      return (
                        <View key={i} className="flex-row items-center justify-between h-7">
                          <Text className="font-sans font-bold text-xs text-stone-600 dark:text-stone-400 w-24" numberOfLines={1}>
                            {item.label}
                          </Text>
                          <View className="flex-1 h-0.5 bg-stone-200/40 dark:bg-stone-800 mx-3 justify-center relative">
                            <View className="h-3 w-3 rounded-full bg-blue-500 border-2 border-white dark:border-stone-900 absolute" style={{ left: `${pct}%`, transform: [{ translateX: -6 }] }} />
                          </View>
                          <Text className="font-display font-black text-xs text-stone-850 dark:text-stone-200 w-6 text-right">
                            {item.value}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {type === 'pie' && (
                  <View className="flex-col gap-3">
                    <View className="flex-row flex-wrap gap-2 justify-center">
                      {items.map((item, i) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                        const color = colors[i % colors.length];
                        const share = ((item.value / totalVal) * 100).toFixed(0);
                        return (
                          <View key={i} className="flex-row items-center gap-1.5 px-2 py-1 bg-stone-100/50 dark:bg-stone-800/45 rounded-xl border border-stone-200/30 dark:border-stone-800/35">
                            <View className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <Text className="font-sans font-bold text-[10px] text-stone-600 dark:text-stone-400">
                              {item.label} ({share}%)
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          } else {
            return (
              <Text
                key={idx}
                className="font-sans text-sm leading-6 text-stone-850 dark:text-stone-200"
              >
                {token}
              </Text>
            );
          }
        })}
      </View>
    );
  };

  const [messages, setMessages] = useState<{id: string, text: string, sender: 'user' | 'ai'}[]>([
    { 
      id: '1', 
      text: `Halo ${user?.full_name || 'Admin'}! Saya adalah Asisten AI Sistem SovraEquitara. Ada yang bisa saya bantu analisis atau jelaskan terkait laporan aduan warga, data moderasi, atau penugasan staf hari ini?`, 
      sender: 'ai' 
    }
  ]);

  const [aiEngine, setAiEngine] = useState<'local' | 'gemini'>('local');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Threads History States
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const loadThreads = async () => {
    try {
      const response = await apiClient.get('/admin/ai-assistant/threads');
      setThreads(response.data?.data || []);
    } catch (err) {
      console.log('Error loading threads:', err);
    }
  };

  const selectThread = async (id: string) => {
    setActiveThreadId(id);
    setShowHistoryModal(false);
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/admin/ai-assistant/threads/${id}`);
      const fetchedMessages = response.data?.data || [];
      if (fetchedMessages.length === 0) {
        setMessages([
          {
            id: '1',
            text: `Halo ${user?.full_name || 'Admin'}! Saya adalah Asisten AI Sistem SovraEquitara. Ada yang bisa saya bantu analisis atau jelaskan terkait laporan aduan warga, data moderasi, atau penugasan staf hari ini?`,
            sender: 'ai'
          }
        ]);
      } else {
        setMessages(fetchedMessages.map((m: any) => ({
          id: m.id,
          text: m.content,
          sender: m.role === 'user' ? 'user' : 'ai'
        })));
      }
    } catch (err) {
      console.log('Error fetching thread messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteThread = async (id: string) => {
    try {
      await apiClient.delete(`/admin/ai-assistant/threads/${id}`);
      if (activeThreadId === id) {
        setActiveThreadId(null);
        setMessages([
          {
            id: '1',
            text: `Halo ${user?.full_name || 'Admin'}! Saya adalah Asisten AI Sistem SovraEquitara. Ada yang bisa saya bantu analisis atau jelaskan terkait laporan aduan warga, data moderasi, atau penugasan staf hari ini?`,
            sender: 'ai'
          }
        ]);
      }
      loadThreads();
    } catch (err) {
      console.log('Error deleting thread:', err);
    }
  };

  const startNewChat = () => {
    setActiveThreadId(null);
    setMessages([
      {
        id: '1',
        text: `Halo ${user?.full_name || 'Admin'}! Saya adalah Asisten AI Sistem SovraEquitara. Ada yang bisa saya bantu analisis atau jelaskan terkait laporan aduan warga, data moderasi, atau penugasan staf hari ini?`,
        sender: 'ai'
      }
    ]);
    setShowHistoryModal(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    Keyboard.dismiss();

    const newMessages = [...messages, { id: Date.now().toString(), text: userMessage, sender: 'user' as const }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/admin/ai-assistant', {
        query: userMessage,
        model: aiEngine,
        thread_id: activeThreadId
      });
      
      const responseText = response.data?.response || response.data?.answer || 'Maaf, saya tidak mengerti.';
      const newThreadId = response.data?.thread_id;
      
      if (newThreadId && !activeThreadId) {
        setActiveThreadId(newThreadId);
        loadThreads();
      }

      setMessages([...newMessages, {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai'
      }]);
    } catch (e: any) {
      setMessages([...newMessages, {
        id: (Date.now() + 1).toString(),
        text: 'Maaf, server AI sedang sibuk atau tidak tersedia saat ini.',
        sender: 'ai'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isSuperAdmin = user?.role?.toLowerCase() === 'super_admin' || user?.role?.toLowerCase() === 'superadmin';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white dark:bg-stone-950 shadow-sm z-10 flex-row items-center border-b border-stone-100 dark:border-stone-900">
        <View className="w-10 h-10 bg-purple-500/10 dark:bg-purple-500/20 rounded-full items-center justify-center mr-3 border border-purple-200/45 dark:border-purple-800/40">
          <Sparkles color="#a855f7" size={20} />
        </View>
        <View className="flex-1">
          <Text className="font-display font-black text-base text-stone-900 dark:text-white">
            {isSuperAdmin ? 'SuperAI Asisten' : 'Asisten AI Admin'}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isSuperAdmin ? 'bg-purple-500' : 'bg-stone-900 dark:bg-stone-100'}`} />
            <Text className={`font-sans text-[8px] font-black uppercase tracking-wider ${isSuperAdmin ? 'text-purple-650 dark:text-purple-400' : 'text-stone-500 dark:text-stone-400'}`}>
              {isSuperAdmin ? 'Sistem & Analitis Konsol' : 'Analisis Moderasi Kota'}
            </Text>
          </View>
        </View>

        {/* History Toggle Trigger */}
        <TouchableOpacity
          onPress={() => {
            loadThreads();
            setShowHistoryModal(true);
          }}
          className="p-2.5 bg-stone-100 dark:bg-stone-900 rounded-full mr-2 border border-stone-200/50 dark:border-stone-850"
        >
          <History color={isDark ? '#a855f7' : '#7c3aed'} size={16} />
        </TouchableOpacity>

        {/* Dynamic authentic role badge in header */}
        <View className="bg-stone-900 dark:bg-white px-2.5 py-1 rounded-full flex-row items-center border border-stone-900 dark:border-white">
          <Shield color={isDark ? '#000000' : '#ffffff'} size={9} style={{ marginRight: 3 }} />
          <Text className="font-sans text-[7px] font-black text-white dark:text-stone-950 uppercase tracking-wider">
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </Text>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`mb-4 max-w-[82%] rounded-2xl p-4 ${
              msg.sender === 'user'
                ? (isSuperAdmin ? 'bg-purple-650 dark:bg-purple-500 self-end rounded-tr-sm' : 'bg-stone-900 dark:bg-stone-100 self-end rounded-tr-sm')
                : 'bg-white dark:bg-stone-900 self-start rounded-tl-sm border border-stone-200/60 dark:border-stone-800/80 shadow-none'
            }`}
          >
            {/* Sender role indicator on AI reply */}
            {msg.sender === 'ai' && (
              <View className="flex-row items-center mb-1.5 gap-1.5 flex-wrap">
                <Text className={`font-display text-[9px] font-black uppercase tracking-wider ${isSuperAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-stone-900 dark:text-stone-100'}`}>
                  {isSuperAdmin ? 'SuperAI Bot' : 'AI Assistant'}
                </Text>
                <View className={`px-1.5 py-0.5 rounded-full border ${isSuperAdmin ? 'bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-900/40' : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}>
                  <Text className={`font-sans text-[6px] font-black uppercase tracking-wide ${isSuperAdmin ? 'text-purple-700 dark:text-purple-300' : 'text-stone-700 dark:text-stone-300'}`}>
                    ASISTEN AKTIF
                  </Text>
                </View>
              </View>
            )}

            {renderMessageContent(msg.text, msg.sender === 'user')}
            
            <Text className={`font-sans text-[8px] mt-1.5 ${
              msg.sender === 'user'
                ? (isSuperAdmin ? 'text-purple-200 self-end' : 'text-stone-400 dark:text-stone-600 self-end')
                : 'text-stone-400 dark:text-stone-555'
            }`}>
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </Text>
          </View>
        ))}

        {isLoading && (
          <View className="bg-white dark:bg-stone-900 self-start rounded-2xl rounded-tl-sm p-4 mb-4 border border-stone-200/50 dark:border-stone-800/80">
            <Text className="font-sans text-stone-400 dark:text-stone-555 text-xs">AI sedang menganalisis...</Text>
          </View>
        )}
      </ScrollView>

      {/* Model Selector Bar */}
      <View className="px-4 py-2 bg-stone-50 dark:bg-stone-900/40 border-t border-stone-100 dark:border-stone-900 flex-row items-center justify-between">
        <Text className="font-sans text-[9px] font-black text-stone-400 dark:text-stone-555 uppercase tracking-wider">
          Mesin AI:
        </Text>
        <View className="flex-row bg-stone-200/50 dark:bg-stone-850 p-0.5 rounded-lg border border-stone-200/30 dark:border-stone-800">
          <TouchableOpacity
            onPress={() => setAiEngine('local')}
            className={`px-3 py-1 rounded-md ${aiEngine === 'local' ? 'bg-white dark:bg-stone-900 shadow-sm' : ''}`}
          >
            <Text className={`font-display font-black text-[8px] uppercase tracking-wider ${aiEngine === 'local' ? 'text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-555'}`}>
              Qwen Local (Aktif)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAiEngine('gemini')}
            className={`px-3 py-1 rounded-md ${aiEngine === 'gemini' ? (isSuperAdmin ? 'bg-purple-650' : 'bg-stone-900 dark:bg-white') : ''}`}
          >
            <Text className={`font-display font-black text-[8px] uppercase tracking-wider ${aiEngine === 'gemini' ? 'text-white dark:text-stone-900' : 'text-stone-500 dark:text-stone-555'}`}>
              Gemini API
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Input Form */}
      <View className="p-4 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-900 flex-row items-center">
        <TextInput
          className="flex-1 bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 px-4.5 py-3 rounded-2xl font-sans text-xs mr-2.5"
          placeholder="Tanyakan analisis sistem, aduan warga, atau status moderasi..."
          placeholderTextColor="#78716c"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!input.trim() || isLoading}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            input.trim() && !isLoading
              ? (isSuperAdmin ? 'bg-purple-650 dark:bg-purple-500' : 'bg-stone-900 dark:bg-white')
              : 'bg-stone-200 dark:bg-stone-900 border border-stone-300/30 dark:border-stone-850'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#78716c" />
          ) : (
            <Send
              color={
                input.trim()
                  ? (isSuperAdmin ? 'white' : (isDark ? '#000000' : '#ffffff'))
                  : '#78716c'
              }
              size={15}
              style={{ marginLeft: 2 }}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* History Modal Overlay */}
      <Modal
        visible={showHistoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1} 
            onPress={() => setShowHistoryModal(false)}
          />
          <View className="bg-white dark:bg-stone-900 rounded-t-[32px] p-6 max-h-[80%] border-t border-stone-200 dark:border-stone-800">
            <View className="flex-row items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <Text className="font-display font-black text-lg text-stone-900 dark:text-white">
                Riwayat Obrolan
              </Text>
              
              <TouchableOpacity
                onPress={startNewChat}
                className="flex-row items-center gap-1 bg-blue-500 py-1.5 px-3 rounded-xl shadow-sm"
              >
                <Plus color="white" size={12} />
                <Text className="font-sans font-bold text-xs text-white">Baru</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4 gap-2" showsVerticalScrollIndicator={false}>
              {threads.length === 0 ? (
                <Text className="text-center py-10 font-sans text-xs text-stone-400 font-bold">
                  Belum ada sesi obrolan
                </Text>
              ) : (
                threads.map(t => {
                  const isActive = t.id === activeThreadId;
                  return (
                    <View
                      key={t.id}
                      className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
                          : 'bg-stone-50 dark:bg-stone-850 border-stone-150 dark:border-stone-800'
                      }`}
                    >
                      <TouchableOpacity
                        onPress={() => selectThread(t.id)}
                        className="flex-1 mr-2"
                      >
                        <Text 
                          className={`font-sans text-xs font-bold ${
                            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-stone-750 dark:text-stone-300'
                          }`}
                          numberOfLines={1}
                        >
                          {t.title}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => deleteThread(t.id)}
                        className="p-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg"
                      >
                        <Trash2 color="#ef4444" size={12} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => setShowHistoryModal(false)}
              className="mt-6 py-4 bg-stone-100 dark:bg-stone-800 rounded-2xl items-center"
            >
              <Text className="font-display font-black text-xs text-stone-700 dark:text-stone-300 tracking-wider">
                TUTUP
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
