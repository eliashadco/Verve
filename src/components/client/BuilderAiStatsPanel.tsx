import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface BuilderAiStatsPanelProps {
  durationWeeks: number;
  frequencyDays: number;
  sessionsThisWeek: number;
  onDeferredAction: (label: string) => void;
}

const ACTION_KEYS = ['generateWithAi', 'autoBalance', 'suggestProgression'];

export function BuilderAiStatsPanel({
  durationWeeks,
  frequencyDays,
  sessionsThisWeek,
  onDeferredAction,
}: BuilderAiStatsPanelProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <GlassCard variant="inline" style={styles.card}>
        <Text style={styles.title}>{t('userTrial.programs.aiAssistant')}</Text>
        <Text style={styles.meta}>{t('userTrial.programs.aiDisabled')}</Text>
        <View style={styles.actions}>
          {ACTION_KEYS.map((actionKey) => {
            const label = t(`userTrial.programs.${actionKey}`);
            return (
            <Pressable key={actionKey} onPress={() => onDeferredAction(label)} style={styles.action}>
              <Text style={styles.actionText}>{label}</Text>
            </Pressable>
            );
          })}
        </View>
      </GlassCard>
      <GlassCard variant="inline" style={styles.card}>
        <Text style={styles.title}>{t('userTrial.programs.programStats')}</Text>
        <View style={styles.stats}>
          <Stat label={t('userTrial.programs.duration')} value={t('userTrial.programs.weeksShort', { count: durationWeeks })} />
          <Stat label={t('userTrial.programs.frequency')} value={t('userTrial.programs.frequencyShort', { count: frequencyDays })} />
          <Stat label={t('userTrial.programs.thisWeek')} value={`${sessionsThisWeek}`} />
        </View>
      </GlassCard>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: { gap: spacing.sm },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  meta: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm, lineHeight: 20 },
  actions: { gap: spacing.xs },
  action: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radii.md,
    backgroundColor: colors.primaryDim,
    padding: spacing.sm,
  },
  actionText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    padding: spacing.sm,
  },
  value: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  label: { color: colors.textFaint, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs, marginTop: 2 },
});
