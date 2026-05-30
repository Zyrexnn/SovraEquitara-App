import React from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColorScheme } from 'nativewind';
import { logoSvgString } from './logo-svg-string';

interface AppLogoProps {
  width?: number | string;
  height?: number;
  className?: string;
}

export function AppLogo({ width = 220, height = 90, className = '' }: AppLogoProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Dynamic style for web platform
  const svgStyle: React.CSSProperties = isDark
    ? { filter: 'brightness(0) invert(1)', maxWidth: '100%', maxHeight: '100%' }
    : { maxWidth: '100%', maxHeight: '100%' };

  if (Platform.OS === 'web') {
    // Elegant React Native Web compatible inline SVG injection
    const webHtml = logoSvgString
      .replace('<svg', `<svg style="filter: ${isDark ? 'brightness(0) invert(1)' : 'none'}; max-width: 100%; max-height: 100%; width: auto; height: auto;"`);
    return (
      <View 
        style={{ width: width as any, height, alignItems: 'center', justifyContent: 'center' }} 
        className={className}
      >
        <div 
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: webHtml }} 
        />
      </View>
    );
  }

  // Inject a clean HTML wrapper for the SVG that scales perfectly
  // and dynamically adjusts colors using CSS filters in WebView
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: transparent;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          svg {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            ${isDark ? 'filter: brightness(0) invert(1);' : ''}
          }
        </style>
      </head>
      <body>
        ${logoSvgString}
      </body>
    </html>
  `;

  return (
    <View style={{ width: width as any, height }} className={`${className}`}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidHardwareAccelerationDisabled={true} // prevent blank canvas issues on older android versions
      />
    </View>
  );
}
