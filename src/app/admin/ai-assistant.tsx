import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Send, ArrowLeft, Sparkles, FileText } from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function AdminAIAssistantScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<{ id: string; text: string; sender: 'user' | 'ai' }[]>([
    { 
      id: '1', 
      text: `Halo Admin ${user?.full_name || ''}! Saya adalah Asisten AI Analitis SovraEquitara. Saya siap membantu Anda menganalisis keluhan warga, memetakan persebaran masalah infrastruktur, serta merumuskan tindak lanjut yang optimal hari ini.`, 
      sender: 'ai' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { id: Date.now().toString(), text: userMessage, sender: 'user' as const }];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      // Endpoint is /admin/ai-assistant (requires model: "local" or similar)
      const response = await apiClient.post('/admin/ai-assistant', { 
        query: userMessage,
        model: 'local'
      });
      
      setMessages([...newMessages, { 
        id: (Date.now() + 1).toString(), 
        text: response.data?.response || response.data?.answer || 'Maaf, saya tidak dapat merumuskan analisis.', 
        sender: 'ai' 
      }]);
    } catch (e: any) {
      console.log('Error calling admin ai assistant', e);
      setMessages([...newMessages, { 
        id: (Date.now() + 1).toString(), 
        text: 'Maaf, server analitis AI lokal sedang sibuk atau tidak merespons.', 
        sender: 'ai' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Parse message content to extract [DETAIL_BTN:uuid] into interactive buttons
  const renderMessageContent = (content: string, isAdmin: boolean) => {
    if (isAdmin) {
      return (
        <Text
          className="font-sans text-sm leading-6 text-white"
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
                className="mt-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 py-3 px-4 rounded-xl flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-6 h-6 rounded-full items-center justify-center mr-2 bg-indigo-100 dark:bg-indigo-900/30">
                    <Sparkles color="#6366f1" size={12} />
                  </View>
                  <Text className="font-display font-bold text-xs text-indigo-750 dark:text-indigo-400" numberOfLines={1}>
                    Tinjau Laporan ({uuid.substring(0, 8)}...)
                  </Text>
                </View>
                <Text className="font-sans font-bold text-xs text-indigo-500">→</Text>
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white dark:bg-zen-darkSurface shadow-sm z-10 flex-row items-center border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
          <ArrowLeft color="#374151" size={20} />
        </TouchableOpacity>
        <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/30 rounded-full items-center justify-center mr-3">
          <Sparkles color="#10b981" size={20} />
        </View>
        <View className="flex-1">
          <Text className="font-display font-bold text-base dark:text-white">AI Konsol Analitis</Text>
          <Text className="font-sans text-xs text-emerald-500">Supervised Administrator Mode</Text>
        </View>
      </View>

      {/* Message List */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {messages.map((msg) => {
          const isAdmin = msg.sender === 'user';
          return (
            <View 
              key={msg.id} 
              className={`mb-4 max-w-[80%] rounded-2xl p-4 shadow-sm ${
                isAdmin 
                  ? 'bg-emerald-600 self-end rounded-tr-sm' 
                  : 'bg-white dark:bg-zen-darkSurface self-start rounded-tl-sm border border-gray-100 dark:border-gray-800'
              }`}
            >
              {renderMessageContent(msg.text, isAdmin)}
            </View>
          );
        })}
        {isLoading && (
          <View className="bg-white dark:bg-zen-darkSurface self-start rounded-2xl rounded-tl-sm p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-800 flex-row items-center">
            <ActivityIndicator size="small" color="#10b981" className="mr-2" />
            <Text className="font-sans text-gray-500 text-xs">Sedang menganalisis basis data...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input area */}
      <View className="p-4 bg-white dark:bg-zen-darkSurface border-t border-gray-100 dark:border-gray-800 flex-row items-center">
        <TextInput
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-full font-sans mr-2 text-sm"
          placeholder="Minta analisis kepadatan laporan..."
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          editable={!isLoading}
        />
        <TouchableOpacity 
          onPress={sendMessage}
          disabled={!input.trim() || isLoading}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            input.trim() && !isLoading ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <Send color={input.trim() && !isLoading ? 'white' : '#9ca3af'} size={16} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
