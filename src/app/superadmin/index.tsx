import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BentoCard } from '../../components/ui/BentoCard';
import { ArrowLeft, ShieldAlert, Users, UserCheck, Settings, Shield } from 'lucide-react-native';

export default function SuperAdminHub() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 bg-white dark:bg-zen-cardBg border-b border-gray-100 dark:border-gray-800 flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.replace('/(admin-tabs)/profile' as any)} 
          className="mr-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-full"
        >
          <ArrowLeft color="#374151" size={20} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-display text-xl font-bold text-gray-900 dark:text-white">Konsol Super Admin</Text>
          <Text className="font-sans text-[10px] text-gray-500">Pusat Kendali Administrasi Kota</Text>
        </View>
        <View className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-full">
          <ShieldAlert color="#d97706" size={18} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 20 }}>
        {/* Banner Card */}
        <BentoCard className="bg-gradient-to-r from-amber-500 to-orange-600 border-0 p-6 mb-6">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-4">
              <Text className="font-display text-lg font-black text-white uppercase tracking-wider mb-1">
                Akses Kontrol Penuh
              </Text>
              <Text className="font-sans text-xs text-amber-50 leading-relaxed">
                Sebagai Super Administrator, Anda memegang kunci utama pengelolaan tata kelola digital wilayah Anda. Kelola hak akses admin dan lihat direktori kontribusi warga kota.
              </Text>
            </View>
            <View className="p-3 bg-white/20 rounded-2xl">
              <Shield color="white" size={28} />
            </View>
          </View>
        </BentoCard>

        <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 pl-1">
          Menu Administrasi Utama
        </Text>

        {/* Bento Cards for navigation */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => router.push('/superadmin/admins' as any)}
          className="mb-4"
        >
          <BentoCard className="flex-row items-center p-5">
            <View className="p-3.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl mr-4">
              <UserCheck color="#6366f1" size={24} />
            </View>
            <View className="flex-1 mr-2">
              <Text className="font-display font-bold text-gray-900 dark:text-white text-base">
                Kelola Akses Admin
              </Text>
              <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
                Tambah, ubah, dan hapus hak akses Administrator Wilayah.
              </Text>
            </View>
            <Text className="font-sans text-gray-400 font-bold text-lg">→</Text>
          </BentoCard>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => router.push('/superadmin/users' as any)}
          className="mb-6"
        >
          <BentoCard className="flex-row items-center p-5">
            <View className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl mr-4">
              <Users color="#10b981" size={24} />
            </View>
            <View className="flex-1 mr-2">
              <Text className="font-display font-bold text-gray-900 dark:text-white text-base">
                Direktori Warga Kota
              </Text>
              <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
                Cari profil terdaftar dan lihat visual statistik kontribusi aduan.
              </Text>
            </View>
            <Text className="font-sans text-gray-400 font-bold text-lg">→</Text>
          </BentoCard>
        </TouchableOpacity>

        {/* Security & System Info */}
        <BentoCard className="p-5 bg-gray-50 dark:bg-zen-cardBg border border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center mb-3">
            <Settings color="#9ca3af" size={16} className="mr-2" />
            <Text className="font-display font-bold text-gray-700 dark:text-gray-300 text-xs">
              Keamanan & Kebijakan
            </Text>
          </View>
          <Text className="font-sans text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Seluruh tindakan administrasi yang Anda lakukan dicatat ke dalam audit log internal demi transparansi tata kelola digital SovraEquitara. Pastikan untuk menjaga kredensial Anda dan memverifikasi data sebelum membuat perubahan.
          </Text>
        </BentoCard>
      </ScrollView>
    </View>
  );
}
