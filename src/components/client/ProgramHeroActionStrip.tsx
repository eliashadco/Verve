import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';

import { useTranslation } from '@/lib/i18n';
import { colors, spacing, typography } from '@/lib/theme';

export interface ProgramHeroActionStripProps {
  programId: string;
  /** Day index for "today" from forecast, or fallback to active chip. */
  startDayIndex: number;
  activeDayIndex: number;
  onFocusDay: (index: number) => void;
  lowAdherenceDayIndex: number | null;
  onOpenBuilder: () => void;
  onAutoBalance: () => void;
  onSuggestProgression: () => void;
  onUseDraft: () => void;
}

export function ProgramHeroActionStrip({
  programId,
  startDayIndex,
  activeDayIndex,
  onFocusDay,
  lowAdherenceDayIndex,
  onOpenBuilder,
  onAutoBalance,
  onSuggestProgression,
  onUseDraft,
}: ProgramHeroActionStripProps) {
  const { t } = useTranslation();
  const dayForStart = Number.isFinite(startDayIndex) ? startDayIndex : activeDayIndex;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <Link href={`/(client)/live/${programId}/${dayForStart}`} asChild>
        <Pressable style={styles.chip}>
          <Text style={styles.chipText}>{t('userTrial.programs.heroActionStartToday')}</Text>
        </Pressable>
      </Link>
      <Pressable
        style={[styles.chip, lowAdherenceDayIndex == null && styles.chipMuted]}
        disabled={lowAdherenceDayIndex == null}
        onPress={() => {
          if (lowAdherenceDayIndex != null) onFocusDay(lowAdherenceDayIndex);
          else Alert.alert(t('userTrial.programs.heroActionTuneLow'), t('userTrial.programs.heroTuneLowNone'));
        }}
      >
        <Text style={styles.chipText}>{t('userTrial.programs.heroActionTuneLow')}</Text>
      </Pressable>
      <Pressable style={styles.chip} onPress={onOpenBuilder}>
        <Text style={styles.chipText}>{t('userTrial.programs.openBuilder')}</Text>
      </Pressable>
      <Pressable style={styles.chip} onPress={onUseDraft}>
        <Text style={styles.chipText}>{t('userTrial.programs.useDraft')}</Text>
      </Pressable>
      <Pressable style={styles.chip} onPress={onAutoBalance}>
        <Text style={styles.chipText}>{t('userTrial.programs.autoBalance')}</Text>
      </Pressable>
      <Pressable style={styles.chip} onPress={onSuggestProgression}>
        <Text style={styles.chipText}>{t('userTrial.programs.suggestProgression')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexDirection: 'row', gap: spacing.xs, paddingVertical: 2 },
  chip: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 10,
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipMuted: { opacity: 0.45 },
  chipText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
});
