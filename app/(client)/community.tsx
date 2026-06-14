import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

const FEED_ITEMS: { titleKey: string; metaKey: string }[] = [
  { titleKey: 'userTrial.community.feed1Title', metaKey: 'userTrial.community.feed1Meta' },
  { titleKey: 'userTrial.community.feed2Title', metaKey: 'userTrial.community.feed2Meta' },
  { titleKey: 'userTrial.community.feed3Title', metaKey: 'userTrial.community.feed3Meta' },
];

export default function ClientCommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <ScreenContainer ambient="tealGlass">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Header title={t('userTrial.community.title')} />
        <GlassCard style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.kicker}>{t('userTrial.community.pulseTitle')}</Text>
            <Pressable
              onPress={() => router.push('/(client)/messages')}
              style={({ pressed }) => [styles.openBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.openBtnText}>{t('userTrial.community.openMessages')}</Text>
            </Pressable>
          </View>
          <View style={styles.feed}>
            {FEED_ITEMS.map((item) => (
              <Pressable
                key={item.titleKey}
                onPress={() => router.push('/(client)/messages')}
                style={({ pressed }) => [styles.feedCard, pressed && { opacity: 0.92 }]}
              >
                <Text style={styles.feedTitle}>{t(item.titleKey)}</Text>
                <Text style={styles.feedMeta}>{t(item.metaKey)}</Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md },
  panel: {
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  kicker: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flex: 1,
  },
  openBtn: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface2,
  },
  openBtnText: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  feed: { gap: 8 },
  feedCard: {
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'flex-start',
  },
  feedTitle: { color: colors.textStrong, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  feedMeta: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 },
});
