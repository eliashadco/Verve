import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { usePrograms } from '@/hooks/usePrograms';
import { useTranslation } from '@/lib/i18n';
import { colors, layout, radii, shadows, spacing, typography } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Visible thumb tabs only; Progress/Messages/etc. live under More. Split 2 | FAB | 2 for even layout. */
const TAB_ORDER: { name: string; icon: IconName }[] = [
  { name: 'home', icon: 'home' },
  { name: 'programs', icon: 'journal-outline' },
  { name: 'booking', icon: 'calendar-outline' },
];

const LEFT_TAB_COUNT = 2;

const MORE_ROUTES = new Set(['community', 'hub', 'messages', 'progress']);

/** Outer diameter of the Live FAB; half sits above the nav pill. */
const LIVE_FAB_OUTER = 64;

export function UserTrialBottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { programs } = usePrograms(profile?.id ?? null, 'client');
  const [moreOpen, setMoreOpen] = useState(false);
  const activeRoute = state.routes[state.index];
  const activeProgram = programs.find(
    (program) => ['active', 'paused'].includes(program.status) && program.days.length > 0,
  );
  const orderedRoutes = TAB_ORDER.map((tab) => {
    const route = state.routes.find((candidate) => candidate.name === tab.name);
    return route ? { ...tab, route } : null;
  }).filter((tab): tab is NonNullable<typeof tab> => tab !== null);

  const goTo = (name: string) => {
    const route = state.routes.find((candidate) => candidate.name === name);
    if (!route) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const goToLive = () => {
    if (activeProgram) {
      router.push(`/(client)/live/${activeProgram.id}/0` as Href);
      return;
    }
    goTo('live');
  };

  const moreHighlighted = moreOpen || MORE_ROUTES.has(activeRoute.name);

  const pushSubRoute = (href: Href) => {
    setMoreOpen(false);
    router.push(href);
  };

  return (
    <>
      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <View style={styles.barContainer}>
          <View style={styles.bar}>
            <View style={styles.cluster}>
              {orderedRoutes.slice(0, LEFT_TAB_COUNT).map(({ route, icon }) => (
                <NavItem
                  key={route.key}
                  icon={icon}
                  label={String(descriptors[route.key].options.title ?? route.name)}
                  active={activeRoute.name === route.name}
                  onPress={() => goTo(route.name)}
                />
              ))}
            </View>
            <View style={styles.fabClearZone} pointerEvents="none" />
            <View style={styles.cluster}>
              {orderedRoutes.slice(LEFT_TAB_COUNT).map(({ route, icon }) => (
                <NavItem
                  key={route.key}
                  icon={icon}
                  label={String(descriptors[route.key].options.title ?? route.name)}
                  active={activeRoute.name === route.name}
                  onPress={() => goTo(route.name)}
                />
              ))}
              <NavItem
                icon="ellipsis-horizontal"
                label={t('tabs.client.more')}
                active={moreHighlighted}
                onPress={() => setMoreOpen((open) => !open)}
              />
            </View>
            <Pressable
              onPress={goToLive}
              style={[
                styles.liveFab,
                shadows.glow,
                { elevation: 14 },
                activeRoute.name === 'live' && styles.liveFabActive,
              ]}
              accessibilityLabel={String(
                descriptors[state.routes.find((route) => route.name === 'live')?.key ?? activeRoute.key]?.options.title ??
                  'Live',
              )}
            >
              <View style={styles.liveFabInner}>
                <Ionicons name="radio" color={colors.textStrong} size={24} />
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal visible={moreOpen} transparent animationType="fade" onRequestClose={() => setMoreOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMoreOpen(false)}>
          <Pressable style={styles.menuCard} onPress={() => undefined}>
            <Text style={styles.menuTitle}>{t('tabs.client.moreMenuTitle')}</Text>
            <Pressable
              style={styles.menuRow}
              onPress={() => pushSubRoute('/(client)/community')}
            >
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={styles.menuRowLabel}>{t('tabs.client.community')}</Text>
            </Pressable>
            <Pressable
              style={styles.menuRow}
              onPress={() => pushSubRoute('/(client)/progress')}
            >
              <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
              <Text style={styles.menuRowLabel}>{t('tabs.client.progress')}</Text>
            </Pressable>
            <Pressable
              style={styles.menuRow}
              onPress={() => pushSubRoute('/(client)/messages')}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
              <Text style={styles.menuRowLabel}>{t('tabs.client.messages')}</Text>
            </Pressable>
            <Pressable
              style={styles.menuRow}
              onPress={() => pushSubRoute('/(client)/hub')}
            >
              <Ionicons name="grid-outline" size={20} color={colors.primary} />
              <Text style={styles.menuRowLabel}>{t('tabs.client.hub')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function NavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.item, active && styles.itemActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} color={active ? colors.primary : colors.textMuted} size={18} />
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.transparent,
    overflow: 'visible',
  },
  barContainer: {
    overflow: 'visible',
  },
  bar: {
    position: 'relative',
    overflow: 'visible',
    minHeight: layout.tabBarHeight,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.xxl,
    backgroundColor: colors.surface3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    ...shadows.md,
  },
  cluster: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    minWidth: 0,
    gap: spacing.xs,
  },
  /** Keeps tab hit targets out of the Live FAB column; FAB is absolutely centered here. */
  fabClearZone: {
    width: LIVE_FAB_OUTER + 8,
    flexShrink: 0,
  },
  item: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.transparent,
    minWidth: 0,
  },
  itemActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primaryBorder,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  labelActive: {
    color: colors.primary,
  },
  liveFab: {
    position: 'absolute',
    left: '50%',
    marginLeft: -LIVE_FAB_OUTER / 2,
    top: -LIVE_FAB_OUTER / 2,
    width: LIVE_FAB_OUTER,
    height: LIVE_FAB_OUTER,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.bgApp,
    zIndex: 20,
  },
  liveFabActive: {
    borderColor: colors.primaryBorderStrong,
  },
  liveFabInner: {
    width: 54,
    height: 54,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 8, 0.55)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
    paddingHorizontal: spacing.lg,
  },
  menuCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    paddingVertical: spacing.sm,
    ...shadows.md,
  },
  menuTitle: {
    color: colors.textFaint,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  menuRowLabel: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
});
