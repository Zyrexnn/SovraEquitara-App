import { Tabs } from 'expo-router';
import { Home, User, Map, FileText, Megaphone, MessageSquare } from 'lucide-react-native';
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
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.4 : 0.03,
          shadowRadius: 12,
          height: 72,
          paddingBottom: 14,
          paddingTop: 10,
        },
        tabBarActiveTintColor: isDark ? '#ffffff' : '#000000',
        tabBarInactiveTintColor: '#78716c',
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 8,
          fontWeight: '900',
          letterSpacing: 0.4,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-9 h-9 rounded-xl items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <Home color={focused ? activeIconColor : inactiveIconColor} size={18} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Arsip',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-9 h-9 rounded-xl items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <FileText color={focused ? activeIconColor : inactiveIconColor} size={18} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Peta',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-9 h-9 rounded-xl items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <Map color={focused ? activeIconColor : inactiveIconColor} size={18} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="broadcast"
        options={{
          title: 'Siaran',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-9 h-9 rounded-xl items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <Megaphone color={focused ? activeIconColor : inactiveIconColor} size={18} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="helpdesk"
        options={{
          title: 'Bantuan',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-9 h-9 rounded-xl items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <MessageSquare color={focused ? activeIconColor : inactiveIconColor} size={18} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-9 h-9 rounded-xl items-center justify-center ${focused ? activeBgClass : 'bg-transparent'}`}>
              <User color={focused ? activeIconColor : inactiveIconColor} size={18} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
