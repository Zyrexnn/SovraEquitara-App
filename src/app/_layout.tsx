import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user, isLoading, fetchProfile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin-tabs)';
    const inUserGroup = segments[0] === '(tabs)';
    const inSuperAdminGroup = segments[0] === 'superadmin';

    const navigateSafely = (path: string) => {
      const timer = setTimeout(() => {
        try {
          router.replace(path as any);
        } catch (err) {
          console.warn('Redirect failed:', err);
        }
      }, 0);
      return () => clearTimeout(timer);
    };

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      return navigateSafely('/(auth)/login');
    } else if (user) {
      const roleLower = user.role?.toLowerCase();
      const isAdmin = roleLower === 'admin' || roleLower === 'super_admin' || roleLower === 'superadmin';
      const isSuperAdmin = roleLower === 'super_admin' || roleLower === 'superadmin';

      const accessingAdminOnly = inAdminGroup || segments[0] === 'admin' || inSuperAdminGroup;
      const accessingSuperAdminOnly = inSuperAdminGroup;
      const accessingUserOnly = inUserGroup;

      if (inAuthGroup && segments[1] !== 'reset-password') {
        if (isAdmin) {
          return navigateSafely('/(admin-tabs)');
        } else {
          return navigateSafely('/(tabs)');
        }
      } else {
        if (isAdmin && accessingUserOnly) {
          // Admin shouldn't access user tabs
          return navigateSafely('/(admin-tabs)');
        } else if (!isAdmin && accessingAdminOnly) {
          // Citizens shouldn't access admin tabs/pages
          return navigateSafely('/(tabs)');
        } else if (accessingSuperAdminOnly && !isSuperAdmin) {
          // Non-super-admins cannot access superadmin console
          if (isAdmin) {
            return navigateSafely('/(admin-tabs)');
          } else {
            return navigateSafely('/(tabs)');
          }
        }
      }
    }

    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [user, isLoading, fontsLoaded, segments]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin/report/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="admin/leaderboard" options={{ headerShown: false }} />
        <Stack.Screen name="superadmin/index" options={{ headerShown: false }} />
        <Stack.Screen name="superadmin/admins" options={{ headerShown: false }} />
        <Stack.Screen name="superadmin/users" options={{ headerShown: false }} />
        <Stack.Screen name="superadmin/ai" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
