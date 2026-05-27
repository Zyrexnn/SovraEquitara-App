import React from 'react';
import { View, Text } from 'react-native';

interface StatusBadgeProps {
  status: 'PENDING' | 'VALID' | 'RESOLVED' | 'REJECTED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let bgClass = '';
  let textClass = '';
  let label = '';

  switch (status) {
    case 'PENDING':
      bgClass = 'bg-status-pending/10';
      textClass = 'text-status-pending';
      label = 'Pending';
      break;
    case 'VALID':
      bgClass = 'bg-status-valid/10';
      textClass = 'text-status-valid';
      label = 'Diproses';
      break;
    case 'RESOLVED':
      bgClass = 'bg-status-resolved/10';
      textClass = 'text-status-resolved';
      label = 'Selesai';
      break;
    case 'REJECTED':
      bgClass = 'bg-status-rejected/10';
      textClass = 'text-status-rejected';
      label = 'Ditolak';
      break;
    default:
      bgClass = 'bg-gray-100';
      textClass = 'text-gray-500';
      label = 'Unknown';
  }

  return (
    <View className={`px-3 py-1 rounded-full ${bgClass} self-start`}>
      <Text className={`font-sans text-xs font-semibold ${textClass}`}>{label}</Text>
    </View>
  );
}
