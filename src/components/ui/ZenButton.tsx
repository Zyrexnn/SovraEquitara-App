import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';

interface ZenButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export function ZenButton({ label, variant = 'primary', isLoading, className = '', ...props }: ZenButtonProps) {
  let bgClass = 'bg-zen-accent active:bg-zen-accentHover';
  let textClass = 'text-white';

  if (variant === 'secondary') {
    bgClass = 'bg-gray-200 dark:bg-gray-800 active:bg-gray-300 dark:active:bg-gray-700';
    textClass = 'text-gray-900 dark:text-gray-100';
  } else if (variant === 'ghost') {
    bgClass = 'bg-transparent active:bg-gray-100 dark:active:bg-gray-800';
    textClass = 'text-zen-accent';
  }

  return (
    <TouchableOpacity
      className={`py-4 px-6 rounded-2xl flex-row justify-center items-center ${bgClass} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#10b981'} />
      ) : (
        <Text className={`font-display font-semibold text-base ${textClass}`}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
