import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking, Platform, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { apiClient, getImageUrl } from '../../../api/client';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { BentoCard } from '../../../components/ui/BentoCard';
import { ArrowLeft, MapPin, ThumbsUp, Navigation, MessageSquare, Shield, Send, User as UserIcon } from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { WebView } from 'react-native-webview';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchReportDetails = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // We can now fetch the report directly by ID since the backend supports it.
      // This is crucial for PENDING reports which don't appear in public-reports
      const res = await apiClient.get(`/reports/${id}`);
      setReport(res.data?.data);
    } catch (e) {
      console.log('Error fetching report', e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReportDetails(!report);
      fetchComments();

      const interval = setInterval(() => {
        fetchReportDetails(false);
        fetchComments();
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }, [id, !report])
  );

  const handleUpvote = async () => {
    if (!report) return;
    try {
      await apiClient.post(`/reports/${id}/upvote`);
      // Optimistic update
      setReport({ ...report, upvote_count: (report.upvote_count || 0) + 1 });
    } catch (e) {
      console.log('Error upvoting', e);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zen-bg dark:bg-zen-darkBg">
        <ActivityIndicator size="large" color="#10b981" />
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

  return (
    <ScrollView className="flex-1 bg-zen-bg dark:bg-zen-darkBg">
      <View className="relative">
        {(report.image_urls && report.image_urls.length > 0) || report.image_url ? (
          <Image 
            source={{ uri: getImageUrl(report.image_urls?.[0] || report.image_url) }} 
            className="w-full h-64 bg-gray-200" 
          />
        ) : (
          <View className="w-full h-64 bg-gray-200 dark:bg-gray-800 items-center justify-center">
            <Text className="font-sans text-gray-400">Tidak ada foto</Text>
          </View>
        )}
        
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="absolute top-12 left-4 w-10 h-10 bg-black/30 rounded-full items-center justify-center"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
      </View>

      <View className="p-4 -mt-6">
        <BentoCard className="p-5 shadow-zen">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 mr-2">
              <Text className="font-display text-xl font-bold text-gray-900 dark:text-white mb-1">
                {report.category?.name || 'Laporan Umum'}
              </Text>
              <Text className="font-sans text-xs text-gray-500">
                Oleh {report.profile?.full_name || report.user?.full_name || 'Anonim'}
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

          <Text className="font-sans text-gray-800 dark:text-gray-200 leading-6">
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
                <Navigation color="#10b981" size={14} className="mr-1.5" />
                <Text className="font-sans font-bold text-xs text-zen-accent">Petunjuk Arah (Google Maps)</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View className="h-px w-full bg-gray-100 dark:bg-gray-800 my-4" />

          <View className="flex-row justify-between items-center">
            <TouchableOpacity 
              onPress={handleUpvote}
              className="flex-row items-center px-4 py-2 bg-zen-accent/10 rounded-full"
            >
              <ThumbsUp color="#10b981" size={18} className="mr-2" />
              <Text className="font-sans font-bold text-zen-accent">
                {report.upvote_count || 0} Dukungan
              </Text>
            </TouchableOpacity>
            
            <Text className="font-sans text-xs text-gray-400">
              {new Date(report.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </Text>
          </View>
        </BentoCard>

        {report.ai_analysis && (
          <View className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
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
            <Text className="font-display font-bold text-gray-900 dark:text-white text-base">Diskusi Warga</Text>
            <View className="flex-row items-center gap-1.5">
              <MessageSquare color="#10b981" size={16} />
              <Text className="font-sans text-xs font-bold text-gray-500">{comments.length} Komentar</Text>
            </View>
          </View>

          {isCommentsLoading ? (
            <ActivityIndicator size="small" color="#10b981" className="py-4" />
          ) : comments.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="font-sans text-gray-400 text-xs text-center leading-normal">
                Belum ada diskusi di laporan ini. Jadilah yang pertama memberikan masukan!
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
              placeholder="Tulis pendapat atau solusi Anda..."
              placeholderTextColor="#9ca3af"
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleSendComment}
            />
            <TouchableOpacity 
              onPress={handleSendComment}
              disabled={!commentText.trim() || isSendingComment}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                commentText.trim() && !isSendingComment ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
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
  );
}
