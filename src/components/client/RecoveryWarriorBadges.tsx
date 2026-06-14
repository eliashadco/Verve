import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { GlassCard } from '@/components/GlassCard';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface RecoveryWarriorBadgesProps {
  sessions: number;
  adherencePct: number;
}

const BADGE_KEYS = ['badge7Days', 'badgePainFree', 'badgeSquat', 'badgeAdherence', 'badgeEarlyBird', 'badgeMarathoner'];

export function RecoveryWarriorBadges({ sessions, adherencePct }: RecoveryWarriorBadgesProps) {
  const { t } = useTranslation();
  const unlocked = Math.min(BADGE_KEYS.length, Math.floor(sessions / 2));

  return (
    <GlassCard variant="stat" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('userTrial.progress.recoveryWarrior')}</Text>
        <View style={styles.ringWrap}>
          <Svg width={44} height={44} viewBox="0 0 44 44">
            <Circle cx={22} cy={22} r={17} stroke={colors.borderDefault} strokeWidth={5} fill="none" />
            <Circle
              cx={22}
              cy={22}
              r={17}
              stroke={colors.primary}
              strokeWidth={5}
              fill="none"
              strokeDasharray={`${Math.min(100, adherencePct) * 1.07}, 107`}
              strokeLinecap="round"
              rotation="-90"
              origin="22, 22"
            />
          </Svg>
          <Text style={styles.ringText}>{Math.round(adherencePct)}%</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {BADGE_KEYS.map((badgeKey, index) => {
          const active = index < unlocked;
          return (
            <View key={badgeKey} style={[styles.badge, active && styles.badgeActive]}>
              <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{t(`userTrial.progress.${badgeKey}`)}</Text>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    width: '48%',
    minHeight: 54,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  badgeActive: { borderColor: colors.primaryBorder, backgroundColor: colors.primaryDim },
  badgeText: { color: colors.textMuted, textAlign: 'center', fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  badgeTextActive: { color: colors.primary },
});
