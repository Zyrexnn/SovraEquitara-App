import React from 'react';
import { View, ViewProps } from 'react-native';

export function BentoCard({ className = '', style, children, ...props }: ViewProps) {
  return (
    <View
      className={`bg-zen-surface dark:bg-zen-darkSurface rounded-bento shadow-zen p-6 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
