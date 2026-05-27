import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Send } from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function ChatScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<{id: string, text: string, sender: 'user' | 'ai'}[]>([
    { id: '1', text: `Halo ${user?.full_name || 'Warga'}! Saya adalah Asisten AI SovraEquitara. Ada yang bisa saya bantu terkait pelaporan masalah kota hari ini?`, sender: 'ai' }
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
      // In the actual backend, endpoint is /ai-assistant
      const response = await apiClient.post('/ai-assistant', { prompt: userMessage });
      
      setMessages([...newMessages, { 
        id: (Date.now() + 1).toString(), 
        text: response.data?.response || response.data?.answer || 'Maaf, saya tidak mengerti.', 
        sender: 'ai' 
      }]);
    } catch (e: any) {
      setMessages([...newMessages, { 
        id: (Date.now() + 1).toString(), 
        text: 'Maaf, server AI sedang sibuk atau tidak tersedia.', 
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-zen-bg dark:bg-zen-darkBg"
    >
      <View className="px-4 pt-12 pb-4 bg-white dark:bg-zen-darkSurface shadow-sm z-10 flex-row items-center border-b border-gray-100 dark:border-gray-800">
        <View className="w-10 h-10 bg-zen-accent/20 rounded-full items-center justify-center mr-3">
          <Text className="text-xl">🤖</Text>
        </View>
        <View>
          <Text className="font-display font-bold text-lg dark:text-white">Tanya AI</Text>
          <Text className="font-sans text-xs text-zen-accent">Selalu online</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            className={`mb-4 max-w-[80%] rounded-2xl p-4 ${
              msg.sender === 'user' 
                ? 'bg-zen-accent self-end rounded-tr-sm' 
                : 'bg-white dark:bg-zen-darkSurface self-start rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-800'
            }`}
          >
            <Text className={`font-sans text-base leading-6 ${
              msg.sender === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-200'
            }`}>
              {msg.text}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View className="bg-white dark:bg-zen-darkSurface self-start rounded-2xl rounded-tl-sm p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <Text className="font-sans text-gray-500">AI sedang mengetik...</Text>
          </View>
        )}
      </ScrollView>

      <View className="p-4 bg-white dark:bg-zen-darkSurface border-t border-gray-100 dark:border-gray-800 flex-row items-center">
        <TextInput
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-full font-sans mr-2"
          placeholder="Tanyakan sesuatu..."
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity 
          onPress={sendMessage}
          disabled={!input.trim() || isLoading}
          className={`w-12 h-12 rounded-full items-center justify-center ${
            input.trim() && !isLoading ? 'bg-zen-accent' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <Send color={input.trim() && !isLoading ? 'white' : '#9ca3af'} size={20} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
