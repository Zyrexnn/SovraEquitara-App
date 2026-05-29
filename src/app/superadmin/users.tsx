import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  Image, 
  TextInput 
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient, getImageUrl } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { ArrowLeft, Search, User, Mail, Calendar, Trophy, ChevronRight, X, BarChart3 } from 'lucide-react-native';

export default function UsersDirectoryScreen() {
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection & Details Modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState<{ total: number; pending: number; resolved: number } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchUsers = async (query = '') => {
    try {
      setIsLoading(true);
      // Backend api endpoint to search profiles
      const res = await apiClient.get(`/profiles?search=${encodeURIComponent(query)}&role=citizen`);
      if (res.data?.data) {
        setUsers(res.data.data);
      } else if (Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (e) {
      console.log('Failed to fetch users', e);
      Alert.alert('Error', 'Gagal memuat direktori warga kota.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = () => {
    fetchUsers(searchQuery);
  };

  const handleSelectUser = async (user: any) => {
    setSelectedUser(user);
    setModalVisible(true);
    setStats(null);
    setIsLoadingStats(true);
    
    try {
      // Fetch stats for this user
      const res = await apiClient.get(`/superadmin/profiles/${user.id}/stats`);
      if (res.data) {
        setStats({
          total: res.data.total || 0,
          pending: res.data.pending || 0,
          resolved: res.data.resolved || 0
        });
      }
    } catch (e) {
      console.log('Failed to fetch user stats', e);
      // Fallback
      setStats({ total: 0, pending: 0, resolved: 0 });
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 bg-white dark:bg-zen-cardBg border-b border-gray-100 dark:border-gray-800 flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mr-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-full"
        >
          <ArrowLeft color="#374151" size={20} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-display text-xl font-bold text-gray-900 dark:text-white">Direktori Warga</Text>
          <Text className="font-sans text-[10px] text-gray-500">Database & Statistik Warga Kota</Text>
        </View>
        <View className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-full">
          <User color="#10b981" size={18} />
        </View>
      </View>

      {/* Search Bar */}
      <View className="p-4 flex-row items-center">
        <View className="flex-1 flex-row items-center bg-white dark:bg-zen-cardBg px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 mr-2 shadow-sm">
          <Search color="#9ca3af" size={16} className="mr-2" />
          <TextInput
            placeholder="Cari warga berdasarkan nama..."
            placeholderTextColor="#9ca3af"
            className="flex-1 font-sans text-gray-900 dark:text-white py-0.5 text-xs"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchUsers(''); }}>
              <X color="#9ca3af" size={16} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity 
          onPress={handleSearch}
          className="bg-emerald-500 py-3 px-4 rounded-2xl"
        >
          <Text className="font-sans font-bold text-white text-xs">Cari</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 40 }}>
          <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 pl-1">
            Warga Terdaftar ({users.length})
          </Text>

          {users.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <User color="#9ca3af" size={48} className="opacity-40 mb-3" />
              <Text className="font-sans font-bold text-gray-400 text-center">Warga tidak ditemukan.</Text>
              <Text className="font-sans text-xs text-gray-400 text-center mt-1">Coba kata kunci pencarian yang lain.</Text>
            </View>
          ) : (
            users.map((userItem) => (
              <TouchableOpacity
                key={userItem.id}
                activeOpacity={0.9}
                onPress={() => handleSelectUser(userItem)}
                className="mb-4"
              >
                <BentoCard className="p-4 flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center mr-2">
                    <View className="w-11 h-11 bg-emerald-500/10 dark:bg-emerald-500/25 rounded-full items-center justify-center mr-3 overflow-hidden border border-gray-100 dark:border-gray-800">
                      {userItem.avatar_url ? (
                        <Image
                          source={{ uri: getImageUrl(userItem.avatar_url) }}
                          className="w-full h-full"
                        />
                      ) : (
                        <User color="#10b981" size={18} />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-display font-bold text-gray-900 dark:text-white text-sm" numberOfLines={1}>
                        {userItem.full_name}
                      </Text>
                      <View className="flex-row items-center mt-0.5">
                        <Mail color="#9ca3af" size={10} className="mr-1" />
                        <Text className="font-sans text-[10px] text-gray-400" numberOfLines={1}>
                          {userItem.email}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <ChevronRight color="#d1d5db" size={18} />
                </BentoCard>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Selected User Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white dark:bg-zen-cardBg rounded-t-[32px] p-6 pb-12 border-t border-gray-100 dark:border-gray-800 shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <BarChart3 color="#10b981" size={20} className="mr-2" />
                <Text className="font-display text-lg font-bold text-gray-900 dark:text-white">Detail & Kontribusi</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full"
              >
                <X color="#374151" size={18} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View>
                {/* Profile Overview */}
                <View className="flex-row items-center mb-6">
                  <View className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/25 rounded-2xl items-center justify-center mr-4 overflow-hidden border border-gray-100 dark:border-gray-800">
                    {selectedUser.avatar_url ? (
                      <Image
                        source={{ uri: getImageUrl(selectedUser.avatar_url) }}
                        className="w-full h-full"
                      />
                    ) : (
                      <User color="#10b981" size={28} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-display font-bold text-gray-900 dark:text-white text-base">
                      {selectedUser.full_name}
                    </Text>
                    <Text className="font-sans text-xs text-gray-400 mt-0.5">{selectedUser.email}</Text>
                    
                    <View className="flex-row items-center mt-2 flex-wrap">
                      <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md mr-2 mb-1">
                        <Calendar color="#6b7280" size={10} className="mr-1" />
                        <Text className="font-sans text-[9px] text-gray-600 dark:text-gray-300">
                          Joined {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' }) : 'Baru'}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-md mb-1">
                        <Trophy color="#d97706" size={10} className="mr-1" />
                        <Text className="font-sans text-[9px] text-amber-700 dark:text-amber-400 font-bold">
                          {selectedUser.points || 0} Points
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Stats Section */}
                <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1">
                  Kontribusi Laporan
                </Text>

                {isLoadingStats ? (
                  <View className="py-8 justify-center items-center">
                    <ActivityIndicator size="small" color="#10b981" />
                    <Text className="font-sans text-xs text-gray-400 mt-2">Memuat statistik kontribusi...</Text>
                  </View>
                ) : stats ? (
                  <View className="flex-row justify-between mb-6 flex-wrap">
                    {/* Bento Cards for Stats */}
                    <View className="w-[31%] bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl items-center border border-gray-100 dark:border-gray-800/80 mb-2">
                      <Text className="font-display text-lg font-black text-gray-800 dark:text-white">
                        {stats.total}
                      </Text>
                      <Text className="font-sans text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-1">
                        Total Aduan
                      </Text>
                    </View>

                    <View className="w-[31%] bg-amber-50 dark:bg-amber-950/10 p-3 rounded-2xl items-center border border-amber-100 dark:border-amber-900/20 mb-2">
                      <Text className="font-display text-lg font-black text-amber-600 dark:text-amber-400">
                        {stats.pending}
                      </Text>
                      <Text className="font-sans text-[9px] text-amber-500 dark:text-amber-500 font-bold uppercase tracking-wider mt-1">
                        Pending
                      </Text>
                    </View>

                    <View className="w-[31%] bg-emerald-50 dark:bg-emerald-950/10 p-3 rounded-2xl items-center border border-emerald-100 dark:border-emerald-900/20 mb-2">
                      <Text className="font-display text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {stats.resolved}
                      </Text>
                      <Text className="font-sans text-[9px] text-emerald-500 dark:text-emerald-500 font-bold uppercase tracking-wider mt-1">
                        Selesai
                      </Text>
                    </View>
                  </View>
                ) : null}

                <ZenButton
                  label="Tutup Detail"
                  variant="secondary"
                  className="w-full mt-2"
                  onPress={() => setModalVisible(false)}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
