import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import { BentoCard } from '../../components/ui/BentoCard';
import { ZenInput } from '../../components/ui/ZenInput';
import { ZenButton } from '../../components/ui/ZenButton';
import { ArrowLeft, UserPlus, Shield, Mail, Edit2, Trash2, X, ShieldAlert } from 'lucide-react-native';

export default function AdminsManagementScreen() {
  const router = useRouter();
  
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form fields
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Loading states for actions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/superadmin/admins');
      if (res.data?.data) {
        setAdmins(res.data.data);
      } else if (Array.isArray(res.data)) {
        setAdmins(res.data);
      }
    } catch (e) {
      console.log('Failed to fetch admins', e);
      Alert.alert('Error', 'Gagal memuat daftar admin. Pastikan Anda memiliki hak akses superadmin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openAddModal = () => {
    setEditingAdmin(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setActionError('');
    setModalVisible(true);
  };

  const openEditModal = (admin: any) => {
    setEditingAdmin(admin);
    setFullName(admin.full_name || '');
    setEmail(admin.email || '');
    setPassword(''); // Leave password empty unless resetting
    setActionError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!fullName) {
      setActionError('Nama lengkap wajib diisi');
      return;
    }
    
    if (!editingAdmin) {
      if (!email) {
        setActionError('Email wajib diisi');
        return;
      }
      if (!password || password.length < 6) {
        setActionError('Password wajib diisi & minimal 6 karakter');
        return;
      }
    }

    setIsSubmitting(true);
    setActionError('');

    try {
      if (editingAdmin) {
        // Edit existing admin
        const payload: any = { full_name: fullName };
        if (password) {
          payload.password = password;
        }
        await apiClient.put(`/superadmin/admins/${editingAdmin.id}`, payload);
        Alert.alert('Sukses', 'Profil admin berhasil diperbarui.');
      } else {
        // Create new admin
        await apiClient.post('/superadmin/admins', {
          full_name: fullName,
          email: email,
          password: password
        });
        Alert.alert('Sukses', 'Admin baru berhasil didaftarkan.');
      }
      
      setModalVisible(false);
      fetchAdmins();
    } catch (e: any) {
      console.log('Failed to save admin', e);
      setActionError(e.response?.data?.error || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (admin: any) => {
    Alert.alert(
      'Hapus Admin',
      `Apakah Anda yakin ingin menghapus akses admin untuk ${admin.full_name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await apiClient.delete(`/superadmin/admins/${admin.id}`);
              Alert.alert('Sukses', 'Akses admin berhasil dicabut.');
              fetchAdmins();
            } catch (e: any) {
              console.log('Failed to delete admin', e);
              Alert.alert('Error', e.response?.data?.error || 'Gagal menghapus admin.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
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
          <Text className="font-display text-xl font-bold text-gray-900 dark:text-white">Akses Admin</Text>
          <Text className="font-sans text-[10px] text-gray-500">Kelola Administrator Wilayah</Text>
        </View>
        <TouchableOpacity 
          onPress={openAddModal}
          className="p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded-full"
        >
          <UserPlus color="#6366f1" size={18} />
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View className="flex-row justify-between items-center mb-4 pl-1">
            <Text className="font-display text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Daftar Admin Aktif ({admins.length})
            </Text>
            <TouchableOpacity onPress={openAddModal}>
              <Text className="font-sans text-xs font-bold text-indigo-500 dark:text-indigo-400">+ Tambah Admin</Text>
            </TouchableOpacity>
          </View>

          {admins.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <Shield color="#9ca3af" size={48} className="opacity-40 mb-3" />
              <Text className="font-sans font-bold text-gray-400 text-center">Belum ada admin terdaftar.</Text>
              <Text className="font-sans text-xs text-gray-400 text-center mt-1">Gunakan tombol tambah untuk mengundang admin baru.</Text>
            </View>
          ) : (
            admins.map((admin) => (
              <BentoCard key={admin.id} className="mb-4 p-4 flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center mr-3">
                  <View className="p-3 bg-indigo-50 dark:bg-indigo-950/25 rounded-2xl mr-3">
                    <Shield color="#6366f1" size={18} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-display font-bold text-gray-900 dark:text-white text-sm" numberOfLines={1}>
                      {admin.full_name}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <Mail color="#9ca3af" size={10} className="mr-1" />
                      <Text className="font-sans text-[10px] text-gray-400" numberOfLines={1}>
                        {admin.email}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <TouchableOpacity 
                    onPress={() => openEditModal(admin)}
                    className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl mr-2"
                  >
                    <Edit2 color="#4b5563" size={14} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDelete(admin)}
                    className="p-2 bg-red-50 dark:bg-red-950/30 rounded-xl"
                  >
                    <Trash2 color="#ef4444" size={14} />
                  </TouchableOpacity>
                </View>
              </BentoCard>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal Add/Edit */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="w-full"
          >
            <View className="bg-white dark:bg-zen-cardBg rounded-t-[32px] p-6 pb-10 border-t border-gray-100 dark:border-gray-800 shadow-2xl">
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                  <ShieldAlert color="#6366f1" size={20} className="mr-2" />
                  <Text className="font-display text-lg font-bold text-gray-900 dark:text-white">
                    {editingAdmin ? 'Edit Kredensial Admin' : 'Daftarkan Admin Baru'}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full"
                >
                  <X color="#374151" size={18} />
                </TouchableOpacity>
              </View>

              {actionError ? (
                <View className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl mb-4">
                  <Text className="font-sans text-xs text-red-500 text-center">{actionError}</Text>
                </View>
              ) : null}

              {/* Form fields */}
              <ZenInput
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                value={fullName}
                onChangeText={setFullName}
              />

              {!editingAdmin && (
                <ZenInput
                  label="Email Admin"
                  placeholder="admin@sovra.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              )}

              <ZenInput
                label={editingAdmin ? "Reset Password (Opsional)" : "Password Awal"}
                placeholder={editingAdmin ? "Kosongkan jika tidak diganti" : "Minimal 6 karakter"}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <ZenButton
                label={isSubmitting ? "Menyimpan..." : (editingAdmin ? "Simpan Perubahan" : "Daftarkan Admin")}
                className="mt-4 bg-indigo-500"
                isLoading={isSubmitting}
                onPress={handleSave}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
