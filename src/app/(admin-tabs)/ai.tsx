import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { Send, Sparkles, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useColorScheme } from 'nativewind';

export default function AdminAIScreenTab() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Parse message content to extract [DETAIL_BTN:uuid] or raw UUIDs into interactive buttons
  const renderMessageContent = (content: string, isUserMessage: boolean) => {
    const regex = /\[DETAIL_BTN:([0-9a-fA-F\-]{36})\]/g;
    const parts: { type: 'text' | 'button'; value: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const index = match.index;
      if (index > lastIndex) {
        parts.push({ type: 'text', value: content.substring(lastIndex, index) });
      }
      parts.push({ type: 'button', value: match[1] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', value: content.substring(lastIndex) });
    }

    if (parts.length === 0) {
      // Fallback regex for raw UUIDs
      const uuidRegex = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/g;
      let lastUuidIndex = 0;
      let uuidMatch;
      while ((uuidMatch = uuidRegex.exec(content)) !== null) {
        const idx = uuidMatch.index;
        if (idx > lastUuidIndex) {
          parts.push({ type: 'text', value: content.substring(lastUuidIndex, idx) });
        }
        parts.push({ type: 'button', value: uuidMatch[1] });
        lastUuidIndex = uuidRegex.lastIndex;
      }
      if (lastUuidIndex < content.length) {
        parts.push({ type: 'text', value: content.substring(lastUuidIndex) });
      }
      if (parts.length === 0) {
        parts.push({ type: 'text', value: content });
      }
    }

    return (
      <View>
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            return (
              <Text
                key={idx}
                className={`font-sans text-sm leading-6 ${
                  isUserMessage
                    ? (isSuperAdmin ? 'text-white' : 'text-white dark:text-stone-950')
                    : 'text-stone-850 dark:text-stone-200'
                }`}
              >
                {part.value}
              </Text>
            );
          } else {
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => router.push(`/admin/report/${part.value}` as any)}
                className={`mt-3 py-3 px-4 rounded-xl flex-row items-center justify-between shadow-sm border ${
                  isSuperAdmin
                    ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/40'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                }`}
              >
                <View className="flex-row items-center">
                  <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${isSuperAdmin ? 'bg-purple-105 dark:bg-purple-900/30' : 'bg-stone-200 dark:bg-stone-750'}`}>
                    <Sparkles color={isSuperAdmin ? '#a855f7' : '#78716c'} size={12} />
                  </View>
                  <Text className={`font-display font-bold text-xs ${isSuperAdmin ? 'text-purple-750 dark:text-purple-400' : 'text-stone-700 dark:text-stone-300'}`}>
                    Tinjau Laporan ({part.value.substring(0, 8)}...)
                  </Text>
                </View>
                <Text className={`font-sans font-bold text-xs ${isSuperAdmin ? 'text-purple-500' : 'text-stone-500'}`}>→</Text>
              </TouchableOpacity>
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
        model: aiEngine
      });
      setMessages([...newMessages, {
        id: (Date.now() + 1).toString(),
        text: response.data?.response || response.data?.answer || 'Maaf, saya tidak mengerti.',
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
                : 'text-stone-400 dark:text-stone-500'
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
        <Text className="font-sans text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider">
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
    </KeyboardAvoidingView>
  );
}
