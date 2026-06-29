import { useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { colors, radii, shadows, typography } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface RadialOption {
  id: string;
  icon: IconName;
  label: string;
  onPress?: () => void;
}

interface RadialQuickMenuProps {
  options?: RadialOption[];
  /** Distance the option buttons fan out from the handle. */
  radius?: number;
}

const DEFAULT_OPTIONS: RadialOption[] = [
  { id: 'quick-add', icon: 'add-circle-outline', label: 'Quick Add' },
  { id: 'library', icon: 'library-outline', label: 'Library' },
  { id: 'timer', icon: 'timer-outline', label: 'Rest Timer' },
  { id: 'analytics', icon: 'stats-chart-outline', label: 'Insights' },
  { id: 'readiness', icon: 'pulse-outline', label: 'Readiness' },
];

const BTN = 48;
const HANDLE_W = 22;
const HANDLE_H = 60;

/**
 * Right-edge slide-in handle (vertically centered) that fans a semicircular
 * selection menu to the left. Drag the handle left or tap it to open.
 * Animation = native Animated; gesture = PanResponder (no extra native deps).
 */
export function RadialQuickMenu({ options = DEFAULT_OPTIONS, radius = 116 }: RadialQuickMenuProps) {
  const { height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const animateTo = (toOpen: boolean) => {
    openRef.current = toOpen;
    setOpen(toOpen);
    Animated.spring(progress, {
      toValue: toOpen ? 1 : 0,
      useNativeDriver: true,
      bounciness: toOpen ? 6 : 0,
      speed: 14,
    }).start();
    AccessibilityInfo.announceForAccessibility?.(toOpen ? 'Quick menu opened' : 'Quick menu closed');
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
        onPanResponderMove: (_e, g) => {
          // Dragging left (negative dx) opens; clamp 0..1 over `radius` px of travel.
          const base = openRef.current ? 1 : 0;
          const delta = -g.dx / radius;
          const next = Math.min(1, Math.max(0, base + delta));
          progress.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const movedLeft = g.dx < -radius * 0.25;
          const movedRight = g.dx > radius * 0.25;
          if (openRef.current) {
            animateTo(!movedRight ? true : false);
          } else {
            animateTo(movedLeft ? true : false);
          }
        },
      }),
    [radius],
  );

  // Even angular spread across a left-facing semicircle (-70° .. +70°).
  const placed = useMemo(() => {
    const n = options.length;
    const start = -70;
    const end = 70;
    return options.map((opt, i) => {
      const deg = n === 1 ? 0 : start + ((end - start) * i) / (n - 1);
      const rad = (deg * Math.PI) / 180;
      return {
        opt,
        dx: -Math.cos(rad) * radius, // fan to the left
        dy: Math.sin(rad) * radius,
      };
    });
  }, [options, radius]);

  const handleRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <>
      {open ? <Pressable style={styles.backdrop} onPress={() => animateTo(false)} accessibilityLabel="Close quick menu" /> : null}

      <View pointerEvents="box-none" style={[styles.anchor, { top: height / 2 }]}>
        {placed.map(({ opt, dx, dy }) => {
          const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
          const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
          const scale = progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.4, 0.6, 1] });
          return (
            <Animated.View
              key={opt.id}
              pointerEvents={open ? 'auto' : 'none'}
              style={[styles.optionWrap, { opacity: progress, transform: [{ translateX }, { translateY }, { scale }] }]}
            >
              <Pressable
                style={styles.optionBtn}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                onPress={() => {
                  opt.onPress?.();
                  animateTo(false);
                }}
              >
                <Ionicons name={opt.icon} size={20} color={colors.primary} />
              </Pressable>
              <Text style={styles.optionLabel} numberOfLines={1}>
                {opt.label}
              </Text>
            </Animated.View>
          );
        })}

        <Animated.View style={[styles.handle, { transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] }]} {...pan.panHandlers}>
          <Pressable
            onPress={() => animateTo(!openRef.current)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={open ? 'Close quick menu' : 'Open quick menu'}
            style={styles.handlePress}
          >
            <Animated.View style={{ transform: [{ rotate: handleRotate }] }}>
              <Ionicons name="chevron-back" size={16} color={colors.bgApp} />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 4, 8, 0.45)', zIndex: 40 },
  anchor: {
    position: 'absolute',
    right: 0,
    zIndex: 50,
    width: 1,
    height: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  handle: {
    position: 'absolute',
    right: 0,
    width: HANDLE_W,
    height: HANDLE_H,
    marginTop: -HANDLE_H / 2,
    borderTopLeftRadius: radii.md,
    borderBottomLeftRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
    elevation: 10,
  },
  handlePress: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  optionWrap: {
    position: 'absolute',
    right: 8,
    width: BTN,
    marginTop: -BTN / 2,
    alignItems: 'center',
    gap: 2,
  },
  optionBtn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  optionLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.bodySemi,
    fontSize: 8,
    textAlign: 'center',
  },
});
