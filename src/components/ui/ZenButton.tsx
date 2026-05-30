import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator, useColorScheme } from 'react-native';

interface ZenButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export function ZenButton({ label, variant = 'primary', isLoading, className = '', ...props }: ZenButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  let bgClass = 'bg-black dark:bg-white active:opacity-80';
  let textClass = 'text-white dark:text-black';

  if (variant === 'secondary') {
    bgClass = 'bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 active:bg-gray-50 dark:active:bg-zinc-900';
    textClass = 'text-black dark:text-white';
  } else if (variant === 'ghost') {
    bgClass = 'bg-transparent active:bg-gray-100 dark:active:bg-zinc-800';
    textClass = 'text-black dark:text-white';
  }

  return (
    <TouchableOpacity
      className={`py-4 px-6 rounded-2xl flex-row justify-center items-center ${bgClass} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? (isDark ? '#000000' : '#ffffff') : '#888888'} />
      ) : (
        <Text className={`font-display font-bold text-sm tracking-wide ${textClass}`}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
