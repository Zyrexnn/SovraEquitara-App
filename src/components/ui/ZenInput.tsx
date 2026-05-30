import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface ZenInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function ZenInput({ label, error, className = '', ...props }: ZenInputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="font-sans text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
          {label}
        </Text>
      )}
      <TextInput
        className={`bg-gray-50 dark:bg-zinc-900/50 text-gray-900 dark:text-white px-4 py-4 rounded-2xl font-sans text-sm border border-gray-200 dark:border-zinc-800 ${
          error ? 'border-red-500 dark:border-red-500' : 'focus:border-black dark:focus:border-white'
        } ${className}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="font-sans text-[11px] text-red-500 mt-1.5 ml-1">{error}</Text>}
    </View>
  );
}
