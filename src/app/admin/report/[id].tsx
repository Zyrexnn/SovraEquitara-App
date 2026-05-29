import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, getImageUrl } from '../../../api/client';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { BentoCard } from '../../../components/ui/BentoCard';
import { ArrowLeft, MapPin, Shield, CheckCircle, HelpCircle, XCircle, Navigation, Bookmark, MessageSquare, Send, User as UserIcon } from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { WebView } from 'react-native-webview';

export default function AdminReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await apiClient.get(`/reports/${id}/comments`);
      if (res.data?.data) {
        setComments(res.data.data);
      } else if (Array.isArray(res.data)) {
        setComments(res.data);
      }
    } catch (e) {
      console.log('Error fetching comments', e);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || isSendingComment) return;
    setIsSendingComment(true);
    try {
      const res = await apiClient.post(`/reports/${id}/comments`, { content: commentText.trim() });
      if (res.status === 200 || res.status === 201) {
        setCommentText('');
        fetchComments(); // Reload comments
      }
    } catch (e) {
      console.log('Error sending comment', e);
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengirim komentar.');
    } finally {
      setIsSendingComment(false);
    }
  };

  const fetchReportDetails = async () => {
    try {
      const res = await apiClient.get('/admin/reports');
      if (res.data?.data) {
        const found = res.data.data.find((r: any) => r.id === id);
        setReport(found);
      }
    } catch (e) {
      console.log('Error fetching admin report details', e);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const res = await apiClient.get('/admin/saved-reports');
      if (res.data?.data) {
        const saved = res.data.data.some((r: any) => r.id === id);
        setIsSaved(saved);
      }
    } catch (e) {
      console.log('Error checking if report is saved', e);
    }
  };

  const handleToggleSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiClient.post(`/admin/reports/${id}/save`);
      if (res.data) {
        setIsSaved(res.data.saved);
        Alert.alert('Sukses', res.data.saved ? 'Laporan berhasil disimpan.' : 'Laporan dihapus dari daftar tersimpan.');
      }
    } catch (e) {
      console.log('Error saving report', e);
      Alert.alert('Error', 'Gagal memproses aksi simpan.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchReportDetails();
    checkIfSaved();
    fetchComments();
  }, [id]);

  const handleVerify = async () => {
    Alert.alert(
      'Verifikasi Laporan',
      'Apakah Anda yakin ingin memverifikasi laporan ini sebagai valid?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Verifikasi',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await apiClient.patch(`/admin/reports/${id}/verify`);
              Alert.alert('Sukses', 'Laporan berhasil diverifikasi sebagai VALID.');
              await fetchReportDetails();
            } catch (e) {
              console.log('Error verifying report', e);
              Alert.alert('Error', 'Gagal memverifikasi laporan.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleResolve = async () => {
    Alert.alert(
      'Selesaikan Laporan',
      'Apakah tindak lanjut laporan ini sudah selesai?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Selesaikan',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await apiClient.patch(`/admin/reports/${id}/resolve`);
              Alert.alert('Sukses', 'Laporan ditandai sebagai SELESAI.');
              await fetchReportDetails();
            } catch (e) {
              console.log('Error resolving report', e);
              Alert.alert('Error', 'Gagal menyelesaikan laporan.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      'Batalkan Status Laporan',
      'Apakah Anda yakin ingin mengembalikan status laporan ini menjadi PENDING?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kembalikan',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await apiClient.patch(`/superadmin/reports/${id}/cancel`);
              Alert.alert('Sukses', 'Status laporan dikembalikan ke PENDING.');
              await fetchReportDetails();
            } catch (e) {
              console.log('Error canceling report', e);
              Alert.alert('Error', 'Gagal mengembalikan status laporan.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zen-bg dark:bg-zen-darkBg">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!report) {
    return (
      <View className="flex-1 items-center justify-center bg-zen-bg dark:bg-zen-darkBg px-4">
        <Text className="font-sans text-gray-500 mb-4">Laporan tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => router.back()} className="px-4 py-2 bg-gray-200 rounded-full">
          <Text className="font-sans font-semibold">Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roleLower = user?.role?.toLowerCase();
  const isSuperAdmin = roleLower === 'super_admin';

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      <ScrollView className="flex-1">
        <View className="relative">
          {(report.image_urls && report.image_urls.length > 0) || report.image_url ? (
            <Image 
              source={{ uri: getImageUrl(report.image_urls?.[0] || report.image_url) }} 
              className="w-full h-72 bg-gray-200" 
            />
          ) : (
            <View className="w-full h-72 bg-gray-200 dark:bg-gray-800 items-center justify-center">
              <Text className="font-sans text-gray-400">Tidak ada foto</Text>
            </View>
          )}
          
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="absolute top-12 left-4 w-10 h-10 bg-black/40 rounded-full items-center justify-center shadow-lg"
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <View className="absolute top-12 right-4 bg-indigo-500 px-3 py-1.5 rounded-full flex-row items-center shadow-lg">
            <Shield color="white" size={14} className="mr-1.5" />
            <Text className="font-sans font-bold text-white text-xs uppercase">MODERASI</Text>
          </View>
        </View>

        <View className="p-4 -mt-6">
          <BentoCard className="p-5 shadow-zen mb-4">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 mr-2">
                <Text className="font-display text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {report.category?.name || 'Laporan Umum'}
                </Text>
                <Text className="font-sans text-xs text-gray-500">
                  Dilaporkan oleh {report.profile?.full_name || report.user?.full_name || 'Warga'} ({report.profile?.email || report.user?.email || ''})
                </Text>
              </View>
              <StatusBadge status={report.status} />
            </View>

            <View className="flex-row items-start mt-2 mb-4">
              <MapPin color="#9ca3af" size={16} className="mr-1 mt-0.5" />
              <Text className="font-sans text-gray-600 dark:text-gray-300 flex-1">
                {report.location_detail || 'Lokasi tidak spesifik'}
              </Text>
            </View>

            <View className="h-px w-full bg-gray-100 dark:bg-gray-800 my-4" />

            <Text className="font-sans text-gray-800 dark:text-gray-200 leading-6 text-base">
              {report.description}
            </Text>

            {/* Map Overview Section */}
            {report.latitude && report.longitude ? (
              <View className="mt-4 mb-2 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
                <View className="h-44 w-full bg-gray-100 dark:bg-gray-900">
                  <WebView
                    originWhitelist={['*']}
                    source={{
                      html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                          <style>
                            html, body, #map {
                              height: 100%;
                              margin: 0;
                              padding: 0;
                              background: #FAFAF9;
                            }
                            .leaflet-pane {
                              z-index: 1 !important;
                            }
                            .leaflet-control-zoom {
                              display: none !important;
                            }
                          </style>
                        </head>
                        <body>
                          <div id="map"></div>
                          <script>
                            var map = L.map('map', {
                              zoomControl: false,
                              attributionControl: false,
                              scrollWheelZoom: false,
                              doubleClickZoom: false,
                              boxZoom: false,
                              touchZoom: false
                            }).setView([${report.latitude}, ${report.longitude}], 16);

                            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                              maxZoom: 19
                            }).addTo(map);

                            L.marker([${report.latitude}, ${report.longitude}]).addTo(map);
                          </script>
                        </body>
                        </html>
                      `
                    }}
                    style={{ width: '100%', height: '100%', opacity: 0.99 }}
                    scrollEnabled={false}
                    nestedScrollEnabled={false}
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    // Universal Google Maps search URL that works perfectly on all devices (iOS, Android app/web) and never crashes
                    const url = `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;
                    Linking.openURL(url).catch((err) => console.error('An error occurred', err));
                  }}
                  className="bg-gray-50 dark:bg-gray-800/50 py-3 flex-row justify-center items-center border-t border-gray-100 dark:border-gray-800"
                >
                  <Navigation color="#6366f1" size={14} className="mr-1.5" />
                  <Text className="font-sans font-bold text-xs text-indigo-500">Petunjuk Arah (Google Maps)</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View className="h-px w-full bg-gray-100 dark:bg-gray-800 my-4" />

            <View className="flex-row justify-between items-center">
              <View className="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full">
                <Text className="font-sans font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                  {report.vote_count || 0} Dukungan Warga
                </Text>
              </View>
              
              <Text className="font-sans text-xs text-gray-400">
                {new Date(report.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })} WIB
              </Text>
            </View>
          </BentoCard>

          {/* AI Analysis */}
          {report.ai_analysis && (
            <View className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
              <Text className="font-display font-semibold text-blue-800 dark:text-blue-300 mb-2">
                🤖 Analisis AI
              </Text>
              <Text className="font-sans text-sm text-blue-900 dark:text-blue-200 leading-5">
                {report.ai_analysis}
              </Text>
            </View>
          )}

          {/* Comments Section */}
          <BentoCard className="p-5 mt-4 shadow-none">
            <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800/80">
              <Text className="font-display font-bold text-gray-900 dark:text-white text-base">Diskusi & Komentar</Text>
              <View className="flex-row items-center gap-1.5">
                <MessageSquare color="#6366f1" size={16} />
                <Text className="font-sans text-xs font-bold text-gray-500">{comments.length} Komentar</Text>
              </View>
            </View>

            {isCommentsLoading ? (
              <ActivityIndicator size="small" color="#6366f1" className="py-4" />
            ) : comments.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="font-sans text-gray-400 text-xs text-center leading-normal">
                  Belum ada diskusi di laporan ini. Kirim komentar Anda untuk berkoordinasi.
                </Text>
              </View>
            ) : (
              <View className="gap-4 max-h-[300px] overflow-y-auto mb-4 pr-1">
                {comments.map((comment) => {
                  const commenter = comment.user || {};
                  const commenterRole = commenter.role?.toLowerCase() || '';
                  const isAdminComment = commenterRole === 'admin' || commenterRole === 'super_admin' || commenterRole === 'superadmin';
                  const isSuperAdminComment = commenterRole === 'super_admin' || commenterRole === 'superadmin';

                  return (
                    <View key={comment.id} className="flex-row items-start border-b border-gray-50 dark:border-zinc-900/10 pb-3 mb-2">
                      <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mr-2.5 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 shrink-0">
                        {commenter.avatar_url ? (
                          <Image source={{ uri: getImageUrl(commenter.avatar_url) }} className="w-full h-full" />
                        ) : (
                          <UserIcon color="#9ca3af" size={14} />
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center flex-wrap mb-1 gap-1">
                          <Text className="font-display text-xs font-bold text-gray-900 dark:text-white">
                            {commenter.full_name || 'Warga SovraEquitara'}
                          </Text>
                          {isSuperAdminComment ? (
                            <View className="bg-amber-500/10 px-1.5 py-0.5 rounded-full flex-row items-center border border-amber-500/20">
                              <Shield color="#f59e0b" size={10} className="mr-0.5" />
                              <Text className="font-sans text-[8px] font-black text-amber-600 uppercase">Super</Text>
                            </View>
                          ) : isAdminComment ? (
                            <View className="bg-blue-500/10 px-1.5 py-0.5 rounded-full flex-row items-center border border-blue-500/20">
                              <Shield color="#3b82f6" size={10} className="mr-0.5" />
                              <Text className="font-sans text-[8px] font-black text-blue-600 uppercase">Admin</Text>
                            </View>
                          ) : null}
                          <Text className="font-sans text-[9px] text-gray-400 dark:text-gray-500 ml-auto">
                            {new Date(comment.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </Text>
                        </View>
                        <Text className="font-sans text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          {comment.content}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Comment input form */}
            <View className="flex-row items-center mt-2 border-t border-gray-100 dark:border-gray-800 pt-3">
              <TextInput
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2.5 rounded-full font-sans text-xs mr-2"
                placeholder="Tulis balasan atau instruksi koordinasi..."
                placeholderTextColor="#9ca3af"
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={handleSendComment}
              />
              <TouchableOpacity 
                onPress={handleSendComment}
                disabled={!commentText.trim() || isSendingComment}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  commentText.trim() && !isSendingComment ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {isSendingComment ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Send color={commentText.trim() ? 'white' : '#9ca3af'} size={14} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            </View>
          </BentoCard>
        </View>
      </ScrollView>

      {/* Moderation Controls sticky footer */}
      <View className="p-4 bg-white dark:bg-zen-darkBg border-t border-gray-100 dark:border-gray-800">
        <Text className="font-display font-bold text-gray-900 dark:text-white text-sm mb-3">Tindakan Moderasi:</Text>
        
        {isUpdating ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity 
              onPress={handleToggleSave}
              disabled={isSaving}
              className={`w-full py-3.5 rounded-2xl flex-row items-center justify-center mb-3 border ${
                isSaved 
                  ? 'bg-amber-500/10 border-amber-500/30 dark:border-amber-400/20' 
                  : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
              } shadow-sm`}
            >
              <Bookmark color={isSaved ? '#f59e0b' : '#6b7280'} fill={isSaved ? '#f59e0b' : 'none'} size={18} className="mr-2" />
              <Text className={`font-display font-bold text-sm ${isSaved ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {isSaved ? 'Tersimpan (Hapus dari Tersimpan)' : 'Simpan Aduan (Saved Reports)'}
              </Text>
            </TouchableOpacity>
            {report.status === 'PENDING' && (
              <TouchableOpacity 
                onPress={handleVerify}
                className="w-full bg-emerald-500 py-3.5 rounded-2xl flex-row items-center justify-center mb-3 shadow-md"
              >
                <CheckCircle color="white" size={18} className="mr-2" />
                <Text className="font-display font-bold text-white text-sm uppercase tracking-wider">Verifikasi Laporan</Text>
              </TouchableOpacity>
            )}

            {report.status === 'VALID' && (
              <TouchableOpacity 
                onPress={handleResolve}
                className="w-full bg-blue-500 py-3.5 rounded-2xl flex-row items-center justify-center mb-3 shadow-md"
              >
                <CheckCircle color="white" size={18} className="mr-2" />
                <Text className="font-display font-bold text-white text-sm uppercase tracking-wider">Tandai Selesai</Text>
              </TouchableOpacity>
            )}

            {report.status !== 'PENDING' && isSuperAdmin && (
              <TouchableOpacity 
                onPress={handleCancel}
                className="w-full bg-red-500 py-3.5 rounded-2xl flex-row items-center justify-center mb-3 shadow-md"
              >
                <XCircle color="white" size={18} className="mr-2" />
                <Text className="font-display font-bold text-white text-sm uppercase tracking-wider">Batalkan Status (Pending)</Text>
              </TouchableOpacity>
            )}

            {report.status === 'RESOLVED' && !isSuperAdmin && (
              <View className="w-full bg-gray-100 dark:bg-gray-800 py-3 rounded-2xl items-center justify-center">
                <Text className="font-sans text-gray-500 text-sm">Laporan telah diselesaikan.</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
