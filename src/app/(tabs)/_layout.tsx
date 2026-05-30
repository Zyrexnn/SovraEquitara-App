import { Tabs } from 'expo-router';
import { Home, Map as MapIcon, PlusCircle, MessageSquare, User, FileText } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0B0B0F' : '#FAFAF9',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1E293B' : '#E7E5E4',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.04,
          shadowRadius: 15,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#10b981', // Emerald 500
        tabBarInactiveTintColor: isDark ? '#6b7280' : '#9ca3af',
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
              <Home color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Peta Laporan',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
              <MapIcon color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create-report"
        options={{
          title: 'Buat Laporan',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2.5 rounded-full ${focused ? 'bg-emerald-500/15' : 'bg-transparent'}`} style={{ marginTop: -4 }}>
              <PlusCircle color={focused ? '#10b981' : color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Tanya AI',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
              <MessageSquare color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
              <FileText color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil Saya',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
              <User color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      {/* Hide the reports index/detail from bottom tabs but keep them accessible in the (tabs) layout */}
      <Tabs.Screen
        name="reports/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
