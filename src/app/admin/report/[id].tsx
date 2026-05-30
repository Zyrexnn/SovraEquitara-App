import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Linking, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { apiClient, getImageUrl } from '../../../api/client';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { BentoCard } from '../../../components/ui/BentoCard';
import {
  ArrowLeft, MapPin, Shield, CheckCircle, XCircle,
  Navigation, Bookmark, MessageSquare, Send, User as UserIcon,
} from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { WebView } from 'react-native-webview';

export default function AdminReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Comment state
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await apiClient.get(`/reports/${id}/comments`);
      const data = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      setComments(data);
    } catch (e) {
      console.log('Error fetching comments', e);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  // Fixed: fetch single report by ID directly instead of listing all /admin/reports
  const fetchReportDetails = async () => {
    try {
      const res = await apiClient.get(`/reports/${id}`);
      const data = res.data?.data ?? res.data;
      if (data) setReport(data);
    } catch (e) {
      // Fallback: search in admin reports list
      try {
        const res = await apiClient.get('/admin/reports');
        if (res.data?.data) {
          const found = res.data.data.find((r: any) => r.id === id);
          if (found) setReport(found);
        }
      } catch (e2) {
        console.log('Error fetching admin report details', e2);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const res = await apiClient.get('/admin/saved-reports');
      if (res.data?.data) {
        setIsSaved(res.data.data.some((r: any) => r.id === id));
      }
    } catch (e) {
      console.log('Error checking if report is saved', e);
    }
  };

  useEffect(() => {
    fetchReportDetails();
    checkIfSaved();
    fetchComments();
  }, [id]);

  // Optimistic comment send
  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || isSendingComment) return;

    const optimisticComment = {
      id: `optimistic-${Date.now()}`,
      content: text,
      created_at: new Date().toISOString(),
      user: {
        full_name: user?.full_name || 'Admin',
        avatar_url: user?.avatar_url,
        role: user?.role || 'ADMIN',
      },
    };

    setComments(prev => [...prev, optimisticComment]);
    setCommentText('');
    setIsSendingComment(true);

    try {
      await apiClient.post(`/reports/${id}/comments`, { content: text });
      fetchComments();
    } catch (e) {
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setCommentText(text);
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengirim komentar.');
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleToggleSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiClient.post(`/admin/reports/${id}/save`);
      if (res.data) {
        setIsSaved(res.data.saved);
        Alert.alert('Sukses', res.data.saved ? 'Laporan berhasil disimpan.' : 'Laporan dihapus dari tersimpan.');
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal memproses aksi simpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = () => {
    Alert.alert('Verifikasi Laporan', 'Tandai laporan ini sebagai VALID?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Verifikasi',
        onPress: async () => {
          setIsUpdating(true);
          try {
            await apiClient.patch(`/admin/reports/${id}/verify`);
            Alert.alert('Sukses', 'Laporan diverifikasi sebagai VALID.');
            fetchReportDetails();
          } catch (e) {
            Alert.alert('Error', 'Gagal memverifikasi laporan.');
          } finally {
            setIsUpdating(false);
          }
        },
      },
    ]);
  };

  const handleResolve = () => {
    Alert.alert('Selesaikan Laporan', 'Tindak lanjut laporan ini sudah selesai?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Selesaikan',
        onPress: async () => {
          setIsUpdating(true);
          try {
            await apiClient.patch(`/admin/reports/${id}/resolve`);
            Alert.alert('Sukses', 'Laporan ditandai SELESAI.');
            fetchReportDetails();
          } catch (e) {
            Alert.alert('Error', 'Gagal menyelesaikan laporan.');
          } finally {
            setIsUpdating(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Batalkan Status', 'Kembalikan status laporan ke PENDING?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Kembalikan',
        style: 'destructive',
        onPress: async () => {
          setIsUpdating(true);
          try {
            await apiClient.patch(`/superadmin/reports/${id}/cancel`);
            Alert.alert('Sukses', 'Status laporan dikembalikan ke PENDING.');
            fetchReportDetails();
          } catch (e) {
            Alert.alert('Error', 'Gagal mengembalikan status laporan.');
          } finally {
            setIsUpdating(false);
          }
        },
      },
    ]);
  };

  // Memoized map HTML — only recomputes when coordinates change
  const mapHtml = useMemo(() => {
    if (!report?.latitude || !report?.longitude) return null;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; background: ${isDark ? '#111111' : '#FAFAF9'}; }
          .leaflet-pane { z-index: 1 !important; }
          .leaflet-control-zoom { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false, attributionControl: false,
            scrollWheelZoom: false, doubleClickZoom: false,
            boxZoom: false, touchZoom: false
          }).setView([${report.latitude}, ${report.longitude}], 16);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
          L.marker([${report.latitude}, ${report.longitude}]).addTo(map);
        </script>
      </body>
      </html>
    `;
  }, [report?.latitude, report?.longitude]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zen-bg dark:bg-zen-darkBg">
        <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
      </View>
    );
  }

  if (!report) {
    return (
      <View className="flex-1 items-center justify-center bg-zen-bg dark:bg-zen-darkBg px-4">
        <Text className="font-sans text-stone-500 mb-4">Laporan tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => router.back()} className="px-4 py-2 bg-stone-200 dark:bg-stone-800 rounded-full">
          <Text className="font-sans font-semibold text-stone-900 dark:text-white">Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roleLower = user?.role?.toLowerCase();
  const isSuperAdmin = roleLower === 'super_admin';

  return (
    <View className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      <ScrollView className="flex-1">
        {/* Hero Image */}
        <View className="relative">
          {(report.image_urls && report.image_urls.length > 0) || report.image_url ? (
            <Image
              source={{ uri: getImageUrl(report.image_urls?.[0] || report.image_url) }}
              className="w-full h-72 bg-stone-200 dark:bg-stone-900"
            />
          ) : (
            <View className="w-full h-72 bg-stone-100 dark:bg-stone-900 items-center justify-center">
              <Text className="font-sans text-stone-400">Tidak ada foto</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-4 w-10 h-10 bg-black/40 rounded-full items-center justify-center"
          >
            <ArrowLeft color="white" size={22} />
          </TouchableOpacity>

          {/* Admin badge overlay */}
          <View className="absolute top-12 right-4 bg-stone-900 dark:bg-white px-3 py-1.5 rounded-full flex-row items-center">
            <Shield color={isDark ? '#000000' : '#ffffff'} size={13} style={{ marginRight: 5 }} />
            <Text className="font-sans font-black text-white dark:text-black text-[10px] uppercase tracking-wider">
              Moderasi
            </Text>
          </View>
        </View>

        <View className="p-4 -mt-6">
          {/* Report Info */}
          <BentoCard className="p-5 shadow-none mb-4">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 mr-2">
                <Text className="font-display text-xl font-black text-stone-900 dark:text-white mb-1">
                  {report.category?.name || 'Laporan Umum'}
                </Text>
                <Text className="font-sans text-xs text-stone-400 dark:text-stone-500">
                  Dilaporkan oleh {report.profile?.full_name || report.user?.full_name || 'Warga'}{' '}
                  {(report.profile?.email || report.user?.email) ? `(${report.profile?.email || report.user?.email})` : ''}
                </Text>
              </View>
              <StatusBadge status={report.status} />
            </View>

            <View className="flex-row items-start mt-2 mb-4">
              <MapPin color={isDark ? '#6b7280' : '#9ca3af'} size={15} style={{ marginTop: 1, marginRight: 6 }} />
              <Text className="font-sans text-sm text-stone-600 dark:text-stone-300 flex-1 leading-relaxed">
                {report.location_detail || 'Lokasi tidak spesifik'}
              </Text>
            </View>

            <View className="h-px w-full bg-stone-100 dark:bg-stone-800/60 my-4" />

            <Text className="font-sans text-sm text-stone-800 dark:text-stone-200 leading-6">
              {report.description}
            </Text>

            {/* Memoized Map */}
            {mapHtml ? (
              <View className="mt-5 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
                <View style={{ height: 176, width: '100%' }}>
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: mapHtml }}
                    style={{ width: '100%', height: '100%', opacity: 0.99 }}
                    scrollEnabled={false}
                    nestedScrollEnabled={false}
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;
                    Linking.openURL(url).catch(err => console.error('Maps error', err));
                  }}
                  className="bg-stone-50 dark:bg-stone-900/60 py-3 flex-row justify-center items-center border-t border-stone-100 dark:border-stone-800"
                >
                  <Navigation color={isDark ? '#9ca3af' : '#6b7280'} size={14} style={{ marginRight: 6 }} />
                  <Text className="font-sans font-bold text-xs text-stone-600 dark:text-stone-400">
                    Petunjuk Arah (Google Maps)
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View className="h-px w-full bg-stone-100 dark:bg-stone-800/60 my-4" />

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center bg-stone-100 dark:bg-stone-800/60 px-3.5 py-1.5 rounded-full">
                <Text className="font-display font-black text-stone-700 dark:text-stone-300 text-sm">
                  {report.vote_count || 0}
                </Text>
                <Text className="font-sans text-xs text-stone-500 dark:text-stone-400 ml-1.5">
                  Dukungan Warga
                </Text>
              </View>
              <Text className="font-sans text-[11px] text-stone-400 dark:text-stone-500">
                {new Date(report.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })} WIB
              </Text>
            </View>
          </BentoCard>

          {/* AI Analysis */}
          {report.ai_analysis && (
            <BentoCard className="p-4 mb-4 shadow-none bg-stone-50 dark:bg-stone-900/50">
              <Text className="font-display font-bold text-stone-700 dark:text-stone-300 text-xs mb-2 uppercase tracking-wider">
                🤖 Analisis AI
              </Text>
              <Text className="font-sans text-sm text-stone-700 dark:text-stone-200 leading-6">
                {report.ai_analysis}
              </Text>
            </BentoCard>
          )}

          {/* Comments */}
          <BentoCard className="p-5 shadow-none">
            <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-stone-100 dark:border-stone-800/60">
              <Text className="font-display font-black text-stone-900 dark:text-white text-base">
                Diskusi & Koordinasi
              </Text>
              <View className="flex-row items-center">
                <MessageSquare color={isDark ? '#6b7280' : '#9ca3af'} size={15} style={{ marginRight: 5 }} />
                <Text className="font-sans text-xs font-bold text-stone-400 dark:text-stone-500">
                  {comments.length}
                </Text>
              </View>
            </View>

            {isCommentsLoading ? (
              <ActivityIndicator size="small" color={isDark ? '#ffffff' : '#000000'} style={{ paddingVertical: 16 }} />
            ) : comments.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="font-sans text-stone-400 dark:text-stone-600 text-xs text-center leading-relaxed">
                  Belum ada diskusi. Kirim komentar untuk berkoordinasi.
                </Text>
              </View>
            ) : (
              <View className="mb-4">
                {comments.map((comment) => {
                  const commenter = comment.user || {};
                  const commenterRole = commenter.role?.toLowerCase() || '';
                  const isAdminComment = commenterRole === 'admin' || commenterRole === 'super_admin' || commenterRole === 'superadmin';
                  const isSuperAdminComment = commenterRole === 'super_admin' || commenterRole === 'superadmin';
                  const isOptimistic = comment.id?.toString().startsWith('optimistic-');

                  return (
                    <View
                      key={comment.id}
                      className={`flex-row items-start pb-3 mb-3 border-b border-stone-50 dark:border-stone-900/50 ${isOptimistic ? 'opacity-70' : ''}`}
                    >
                      <View className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 items-center justify-center mr-3 overflow-hidden border border-stone-200/50 dark:border-stone-700/40 shrink-0">
                        {commenter.avatar_url ? (
                          <Image source={{ uri: getImageUrl(commenter.avatar_url) }} className="w-full h-full" />
                        ) : (
                          <UserIcon color={isDark ? '#6b7280' : '#9ca3af'} size={14} />
                        )}
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center flex-wrap mb-1 gap-1.5">
                          <Text className="font-display text-xs font-black text-stone-900 dark:text-white">
                            {commenter.full_name || 'Admin'}
                          </Text>

                          {isSuperAdminComment ? (
                            <View className="flex-row items-center bg-stone-900 dark:bg-white px-2 py-0.5 rounded-full">
                              <Shield color={isDark ? '#000000' : '#ffffff'} size={9} style={{ marginRight: 3 }} />
                              <Text className="font-sans text-[8px] font-black text-white dark:text-black uppercase tracking-wider">
                                Super Admin
                              </Text>
                            </View>
                          ) : isAdminComment ? (
                            <View className="flex-row items-center bg-stone-700 dark:bg-stone-200 px-2 py-0.5 rounded-full">
                              <Shield color={isDark ? '#000000' : '#ffffff'} size={9} style={{ marginRight: 3 }} />
                              <Text className="font-sans text-[8px] font-black text-white dark:text-black uppercase tracking-wider">
                                Admin
                              </Text>
                            </View>
                          ) : null}

                          <Text className="font-sans text-[10px] text-stone-400 dark:text-stone-600 ml-auto">
                            {new Date(comment.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit', minute: '2-digit',
                            })} WIB
                          </Text>
                        </View>
                        <Text className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                          {comment.content}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Comment Input */}
            <View className="flex-row items-center border-t border-stone-100 dark:border-stone-800/60 pt-3 mt-1">
              <TextInput
                className="flex-1 bg-stone-100 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 px-4 py-3 rounded-2xl font-sans text-xs mr-2.5"
                placeholder="Tulis balasan atau instruksi koordinasi..."
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={handleSendComment}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={handleSendComment}
                disabled={!commentText.trim() || isSendingComment}
                className={`w-11 h-11 rounded-full items-center justify-center ${
                  commentText.trim() && !isSendingComment
                    ? 'bg-stone-900 dark:bg-white'
                    : 'bg-stone-200 dark:bg-stone-800'
                }`}
              >
                {isSendingComment ? (
                  <ActivityIndicator size="small" color={isDark ? '#000000' : '#ffffff'} />
                ) : (
                  <Send
                    color={
                      commentText.trim()
                        ? (isDark ? '#000000' : '#ffffff')
                        : (isDark ? '#4b5563' : '#9ca3af')
                    }
                    size={15}
                    style={{ marginLeft: 2 }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </BentoCard>
        </View>
      </ScrollView>

      {/* Sticky Moderation Footer */}
      <View className="p-4 bg-white dark:bg-zen-darkBg border-t border-stone-100 dark:border-stone-800/60">
        <Text className="font-display font-black text-stone-900 dark:text-white text-sm mb-3">
          Tindakan Moderasi
        </Text>

        {isUpdating ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color={isDark ? '#ffffff' : '#000000'} />
          </View>
        ) : (
          <View>
            {/* Save Toggle */}
            <TouchableOpacity
              onPress={handleToggleSave}
              disabled={isSaving}
              className={`w-full py-3.5 rounded-2xl flex-row items-center justify-center mb-3 border ${
                isSaved
                  ? 'bg-stone-900 dark:bg-white border-stone-900 dark:border-white'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
              }`}
            >
              <Bookmark
                color={isSaved ? (isDark ? '#000000' : '#ffffff') : (isDark ? '#6b7280' : '#9ca3af')}
                fill={isSaved ? (isDark ? '#000000' : '#ffffff') : 'none'}
                size={17}
                style={{ marginRight: 8 }}
              />
              <Text className={`font-display font-bold text-sm ${
                isSaved ? 'text-white dark:text-black' : 'text-stone-600 dark:text-stone-400'
              }`}>
                {isSaved ? 'Tersimpan — Hapus dari Daftar' : 'Simpan ke Daftar Pantauan'}
              </Text>
            </TouchableOpacity>

            {report.status === 'PENDING' && (
              <TouchableOpacity
                onPress={handleVerify}
                className="w-full bg-stone-900 dark:bg-white py-3.5 rounded-2xl flex-row items-center justify-center mb-3"
              >
                <CheckCircle color={isDark ? '#000000' : '#ffffff'} size={17} style={{ marginRight: 8 }} />
                <Text className="font-display font-black text-white dark:text-black text-sm uppercase tracking-wider">
                  Verifikasi Laporan
                </Text>
              </TouchableOpacity>
            )}

            {report.status === 'VALID' && (
              <TouchableOpacity
                onPress={handleResolve}
                className="w-full bg-stone-900 dark:bg-white py-3.5 rounded-2xl flex-row items-center justify-center mb-3"
              >
                <CheckCircle color={isDark ? '#000000' : '#ffffff'} size={17} style={{ marginRight: 8 }} />
                <Text className="font-display font-black text-white dark:text-black text-sm uppercase tracking-wider">
                  Tandai Selesai
                </Text>
              </TouchableOpacity>
            )}

            {report.status !== 'PENDING' && isSuperAdmin && (
              <TouchableOpacity
                onPress={handleCancel}
                className="w-full border border-stone-300 dark:border-stone-700 py-3.5 rounded-2xl flex-row items-center justify-center mb-3"
              >
                <XCircle color={isDark ? '#6b7280' : '#9ca3af'} size={17} style={{ marginRight: 8 }} />
                <Text className="font-display font-bold text-stone-600 dark:text-stone-400 text-sm">
                  Kembalikan ke Pending
                </Text>
              </TouchableOpacity>
            )}

            {report.status === 'RESOLVED' && !isSuperAdmin && (
              <View className="w-full bg-stone-100 dark:bg-stone-800/50 py-3 rounded-2xl items-center">
                <Text className="font-sans text-stone-500 dark:text-stone-400 text-xs">
                  Laporan telah diselesaikan.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
