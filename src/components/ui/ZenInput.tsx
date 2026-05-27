import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface ZenInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function ZenInput({ label, error, className = '', ...props }: ZenInputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="font-sans text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</Text>}
      <TextInput
        className={`bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans px-4 py-4 rounded-2xl ${
          error ? 'border border-red-500' : ''
        } ${className}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="font-sans text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}
