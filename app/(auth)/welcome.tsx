import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VerveButton } from '@/components/VerveButton';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  key: string;
  title: string;
  body: string;
}

export default function Welcome() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [active, setActive] = useState(0);

  const slides = useMemo<Slide[]>(
    () => [
      { key: '1', title: t('welcome.slide1.title'), body: t('welcome.slide1.body') },
      { key: '2', title: t('welcome.slide2.title'), body: t('welcome.slide2.body') },
      { key: '3', title: t('welcome.slide3.title'), body: t('welcome.slide3.body') },
    ],
    [t],
  );

  const markWelcomeSeenAndGo = useCallback(
    async (href: '/(auth)/register' | '/(auth)/login') => {
      await AsyncStorage.setItem('welcome_seen', '1');
      router.replace(href);
    },
    [router],
  );

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / SCREEN_WIDTH);
    setActive(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const goToSlide = useCallback((index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
    setActive(index);
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Slide>) => (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <Animated.View entering={FadeIn.delay(index * 90).duration(380)}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </Animated.View>
      </View>
    ),
    [],
  );

  const onLastCTA = active === slides.length - 1;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        accessibilityRole="adjustable"
        accessibilityLabel={t('welcome.carouselA11y')}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <Pressable
              key={slide.key}
              onPress={() => goToSlide(index)}
              style={[styles.dot, index === active && styles.dotActive]}
              accessibilityLabel={t('welcome.dotA11y', { pos: String(index + 1) })}
              accessibilityState={{ selected: index === active }}
            />
          ))}
        </View>

        {onLastCTA ? (
          <View style={styles.ctaBlock}>
            <VerveButton label={t('welcome.getStarted')} onPress={() => void markWelcomeSeenAndGo('/(auth)/register')} />
            <View style={{ height: 12 }} />
            <Pressable
              onPress={() => void markWelcomeSeenAndGo('/(auth)/login')}
              accessibilityRole="button"
              accessibilityLabel={t('welcome.signInA11y')}
            >
              <Text style={styles.signIn}>{t('welcome.signIn')}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.hint}>{t('welcome.swipeMore')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: Math.min(26, SCREEN_WIDTH * 0.065),
    lineHeight: Math.min(34, SCREEN_WIDTH * 0.082),
    marginBottom: 14,
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.md,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 20,
    gap: 18,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderDefault,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 22,
  },
  ctaBlock: {
    marginTop: 4,
  },
  signIn: {
    textAlign: 'center',
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  hint: {
    textAlign: 'center',
    color: colors.textFaint,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
});
