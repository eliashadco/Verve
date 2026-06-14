import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { subscribeConstraintNotice } from '@/lib/constraintNotices';
import { colors, typography } from '@/lib/theme';

/**
 * Non-blocking top notice for constraint realtime (replaces a third-party toast).
 */
export function ConstraintNoticeHost() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearHide = () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };

    const unsub = subscribeConstraintNotice(({ message: next }) => {
      clearHide();
      setMessage(next);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(
          ({ finished }) => {
            if (finished) setMessage(null);
          },
        );
      }, 3800);
    });

    return () => {
      clearHide();
      unsub();
    };
  }, [opacity]);

  if (!message) return null;

  return (
    <Animated.View
      style={[styles.wrap, { top: insets.top + 8, opacity }]}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.card}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 12,
  },
  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  text: {
    color: colors.textMain,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
});
