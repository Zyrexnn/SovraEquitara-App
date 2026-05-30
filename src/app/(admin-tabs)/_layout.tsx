import { Tabs } from 'expo-router';
import { Home, User, Map, FileText, Megaphone, MessageSquare, Sparkles } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

export default function AdminTabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const activeBgClass = isDark ? 'bg-stone-100' : 'bg-stone-900';
  const activeIconColor = isDark ? '#000000' : '#ffffff';
  const inactiveIconColor = isDark ? '#78716c' : '#78716c';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0c0a09' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#292524' : '#e7e5e4',
          elevation: 6,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.35 : 0.02,
          shadowRadius: 10,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
          paddingHorizontal: 4, // Horizontal padding for breathing room
        },
        tabBarActiveTintColor: isDark ? '#ffffff' : '#000000',
        tabBarInactiveTintColor: '#78716c',
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 7.5, // Reduced font size to fit all 7 tabs beautifully
          fontWeight: '900',
          letterSpacing: 0.2,
          marginTop: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home', // Shortened from Dashboard to save massive space
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-8 h-8 rounded-lg items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <Home color={focused ? activeIconColor : inactiveIconColor} size={15} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Arsip',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-8 h-8 rounded-lg items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <FileText color={focused ? activeIconColor : inactiveIconColor} size={15} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Peta',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-8 h-8 rounded-lg items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <Map color={focused ? activeIconColor : inactiveIconColor} size={15} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Chat AI', // New AI Chat tab screen in the exact middle!
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-8 h-8 rounded-lg items-center justify-center ${focused ? (isDark ? 'bg-purple-100' : 'bg-purple-900') : 'bg-transparent'}`}>
              <Sparkles color={focused ? (isDark ? '#000000' : '#ffffff') : '#a855f7'} size={15} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="broadcast"
        options={{
          title: 'Siaran',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-8 h-8 rounded-lg items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <Megaphone color={focused ? activeIconColor : inactiveIconColor} size={15} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="helpdesk"
        options={{
          title: 'Bantuan',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-8 h-8 rounded-lg items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <MessageSquare color={focused ? activeIconColor : inactiveIconColor} size={15} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-8 h-8 rounded-lg items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <User color={focused ? activeIconColor : inactiveIconColor} size={15} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
