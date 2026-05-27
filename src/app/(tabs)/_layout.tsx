import { Tabs } from 'expo-router';
import { Home, Map as MapIcon, PlusCircle, MessageSquare, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FAFAF9',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#10b981', // Emerald 500
        tabBarInactiveTintColor: '#9ca3af', // Gray 400
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 10,
          marginTop: -4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Peta',
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create-report"
        options={{
          title: 'Lapor',
          tabBarIcon: ({ color, size }) => (
            <PlusCircle color={color} size={size + 8} strokeWidth={2.5} style={{ marginBottom: 4 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat AI',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
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
