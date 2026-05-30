import React from 'react';
import { View, Text } from 'react-native';

interface StatusBadgeProps {
  status: string; // Accept any string, normalize internally
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const normalized = (status || '').toUpperCase();

  let dotColor = '#9ca3af';
  let label = 'Unknown';
  let containerClass = 'bg-stone-100 dark:bg-stone-800/60 border-stone-200/60 dark:border-stone-700/40';
  let textClass = 'text-stone-500 dark:text-stone-400';

  switch (normalized) {
    case 'PENDING':
      dotColor = '#f59e0b';
      label = 'Menunggu';
      containerClass = 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30';
      textClass = 'text-amber-700 dark:text-amber-400';
      break;
    case 'VALID':
      dotColor = '#3b82f6';
      label = 'Diproses';
      containerClass = 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/30';
      textClass = 'text-blue-700 dark:text-blue-400';
      break;
    case 'RESOLVED':
      dotColor = '#10b981';
      label = 'Selesai';
      containerClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30';
      textClass = 'text-emerald-700 dark:text-emerald-400';
      break;
    case 'REJECTED':
      dotColor = '#ef4444';
      label = 'Ditolak';
      containerClass = 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/30';
      textClass = 'text-red-700 dark:text-red-400';
      break;
  }

  const isSmall = size === 'sm';

  return (
    <View className={`flex-row items-center self-start border rounded-full ${containerClass} ${isSmall ? 'px-2.5 py-1' : 'px-3 py-1.5'}`}>
      <View
        style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: dotColor, marginRight: 5 }}
      />
      <Text className={`font-sans font-bold ${isSmall ? 'text-[10px]' : 'text-xs'} ${textClass}`}>
        {label}
      </Text>
    </View>
  );
}
