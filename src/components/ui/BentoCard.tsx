import React from 'react';
import { View, ViewProps } from 'react-native';

export function BentoCard({ className = '', style, children, ...props }: ViewProps) {
  return (
    <View
      className={`bg-zen-card dark:bg-zen-cardDark border border-zen-border dark:border-zen-borderDark rounded-bento shadow-zen overflow-hidden p-6 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
