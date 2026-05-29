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
    const regex = /\[DETAIL_BTN:([0-9a-fA-F\-]{36})\]/g;
    const parts = [];
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
      parts.push({ type: 'text', value: content });
    }

    return (
      <View>
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <Text 
                key={index}
                className={`font-sans text-sm leading-6 ${
                  isAdmin ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                {part.value}
              </Text>
            );
          } else {
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => router.push(`/admin/report/${part.value}` as any)}
                className="mt-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 py-3 px-4 rounded-xl flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-row items-center">
                  <FileText color="#6366f1" size={16} className="mr-2" />
                  <Text className="font-sans font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    Tinjau Laporan Aduan
                  </Text>
                </View>
                <Text className="font-sans font-bold text-indigo-500 text-xs">→</Text>
              </TouchableOpacity>
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
