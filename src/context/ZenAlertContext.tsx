import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, useColorScheme } from 'react-native';
import { Check, AlertTriangle, Info, X, HelpCircle } from 'lucide-react-native';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface ZenAlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ZenAlertContextType {
  showZenAlert: (options: ZenAlertOptions) => void;
  hideZenAlert: () => void;
}

const ZenAlertContext = createContext<ZenAlertContextType | undefined>(undefined);

export function ZenAlertProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ZenAlertOptions | null>(null);
  const [scaleAnim] = useState(new Animated.Value(0.85));
  const [fadeAnim] = useState(new Animated.Value(0));

  const showZenAlert = useCallback((opts: ZenAlertOptions) => {
    setOptions(opts);
    setVisible(true);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const hideZenAlert = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setOptions(null);
    });
  }, [scaleAnim, fadeAnim]);

  const handleConfirm = () => {
    if (options?.onConfirm) {
      options.onConfirm();
    }
    hideZenAlert();
  };

  const handleCancel = () => {
    if (options?.onCancel) {
      options.onCancel();
    }
    hideZenAlert();
  };

  // Render Icon according to Alert Type
  const renderIcon = () => {
    if (!options) return null;
    const type = options.type || 'info';

    let iconColor = isDark ? '#ffffff' : '#1c1917';
    let iconBg = 'bg-stone-100 dark:bg-stone-800 border-stone-200/50 dark:border-stone-700/60';
    let IconComp = Info;

    switch (type) {
      case 'success':
        iconBg = 'bg-stone-100 dark:bg-stone-900/60 border-stone-200/50 dark:border-stone-850';
        iconColor = isDark ? '#ffffff' : '#1c1917';
        IconComp = Check;
        break;
      case 'error':
        iconBg = 'bg-stone-100 dark:bg-stone-900/60 border-stone-200/50 dark:border-stone-850';
        iconColor = isDark ? '#ef4444' : '#dc2626'; // Pure error color accents
        IconComp = X;
        break;
      case 'warning':
        iconBg = 'bg-stone-100 dark:bg-stone-900/60 border-stone-200/50 dark:border-stone-850';
        iconColor = isDark ? '#f59e0b' : '#d97706'; // Pure warning color accents
        IconComp = AlertTriangle;
        break;
      case 'confirm':
        iconBg = 'bg-stone-100 dark:bg-stone-900/60 border-stone-200/50 dark:border-stone-850';
        iconColor = isDark ? '#a855f7' : '#8b5cf6'; // Violet highlight for confirmations
        IconComp = HelpCircle;
        break;
    }

    return (
      <View className={`w-14 h-14 rounded-full items-center justify-center border ${iconBg} shadow-sm`}>
        <IconComp color={iconColor} size={22} strokeWidth={2.5} />
      </View>
    );
  };

  return (
    <ZenAlertContext.Provider value={{ showZenAlert, hideZenAlert }}>
      {children}

      {visible && options && (
        <Modal
          transparent
          animationType="none"
          visible={visible}
          onRequestClose={hideZenAlert}
        >
          <View className="flex-1 items-center justify-center px-6">
            {/* Backdrop */}
            <Animated.View 
              style={{ opacity: fadeAnim }}
              className="absolute inset-0 bg-stone-950/40 dark:bg-black/70"
            />

            {/* Alert Card */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }}
              className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/80 rounded-[32px] p-6 shadow-2xl items-center"
            >
              {/* Icon */}
              {renderIcon()}

              {/* Title */}
              <Text className="font-display font-black text-base text-stone-900 dark:text-white mt-4.5 text-center tracking-tight">
                {options.title}
              </Text>

              {/* Message */}
              <Text className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-2 text-center leading-5 px-1.5">
                {options.message}
              </Text>

              {/* Action Buttons */}
              <View className="w-full flex-row gap-3 mt-6">
                {(options.type === 'confirm' || options.onCancel || options.cancelText) ? (
                  <>
                    <TouchableOpacity
                      onPress={handleCancel}
                      activeOpacity={0.8}
                      className="flex-1 py-3.5 bg-stone-100 dark:bg-stone-800 border border-stone-200/50 dark:border-stone-700/60 rounded-2xl items-center justify-center active:opacity-70"
                    >
                      <Text className="font-display font-bold text-xs text-stone-600 dark:text-stone-300">
                        {options.cancelText || 'Batal'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleConfirm}
                      activeOpacity={0.8}
                      className={`flex-1 py-3.5 rounded-2xl items-center justify-center active:opacity-85 ${
                        options.type === 'confirm' ? 'bg-purple-650' : 'bg-stone-900 dark:bg-white'
                      }`}
                    >
                      <Text className={`font-display font-bold text-xs ${options.type === 'confirm' ? 'text-white' : 'text-white dark:text-stone-950'}`}>
                        {options.confirmText || 'Ya'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                    className="w-full py-3.5 bg-stone-900 dark:bg-white rounded-2xl items-center justify-center active:opacity-85"
                  >
                    <Text className="font-display font-bold text-xs text-white dark:text-stone-950">
                      {options.confirmText || 'OK'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </ZenAlertContext.Provider>
  );
}

export function useZenAlert() {
  const context = useContext(ZenAlertContext);
  if (!context) {
    throw new Error('useZenAlert must be used within a ZenAlertProvider');
  }
  return context;
}
