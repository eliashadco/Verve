import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { useConstraints } from '@/hooks/useConstraints';
import { useTranslation } from '@/lib/i18n';
import { colors, spacing, typography } from '@/lib/theme';

interface ClinicalSafetyNoticeProps {
  clientId: string | null;
}

export function ClinicalSafetyNotice({ clientId }: ClinicalSafetyNoticeProps) {
  const { t } = useTranslation();
  const { data: constraints, loading } = useConstraints(clientId);
  const [expanded, setExpanded] = useState(false);

  if (loading || !clientId || !constraints || constraints.length === 0) {
    return null;
  }

  // Get unique practitioners to list them in the summary
  const physioNames = Array.from(
    new Set(constraints.map((c) => c.physio_name || t('userTrial.programs.physio') || 'Physio'))
  );

  return (
    <GlassCard style={[styles.card, expanded && styles.cardExpanded]}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name="shield-half"
            size={20}
            color={colors.danger}
            style={styles.icon}
          />
          <View>
            <Text style={styles.kicker}>{t('userTrial.safety.clinicalSafetyCenter') || 'CLINICAL SAFETY CENTER'}</Text>
            <Text style={styles.title}>
              {t('userTrial.safety.activeRestrictions', { count: constraints.length }) ||
                `${constraints.length} Active Restriction${constraints.length > 1 ? 's' : ''}`}
            </Text>
            <Text style={styles.subtitle}>
              {t('userTrial.safety.assignedBy', { names: physioNames.join(', ') }) ||
                `Assigned by: ${physioNames.join(', ')}`}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {expanded && (
        <View style={styles.detailContainer}>
          <View style={styles.divider} />
          {constraints.map((item) => (
            <View key={item.id} style={styles.constraintRow}>
              <View style={styles.rowHeader}>
                <Text style={styles.targetName}>{item.target}</Text>
                <Badge
                  label={item.severity === 'hard' ? 'Hard' : 'Soft'}
                  tone={item.severity === 'hard' ? 'danger' : 'warning'}
                />
              </View>
              {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}
              {item.value ? (
                <Text style={styles.valueText}>
                  {t('userTrial.safety.limitValue', { val: item.value }) || `Limit: ${item.value}`}
                </Text>
              ) : null}
              <View style={styles.footerRow}>
                <Ionicons name="person-outline" size={12} color={colors.textFaint} />
                <Text style={styles.attributionText}>
                  {item.physio_name || 'Physiotherapist'} · {t('userTrial.safety.active') || 'Active'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  cardExpanded: {
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  icon: {
    marginRight: 2,
  },
  kicker: {
    color: colors.danger,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.label,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.base,
    marginTop: 2,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    marginTop: 1,
  },
  detailContainer: {
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  constraintRow: {
    backgroundColor: colors.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  targetName: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  notesText: {
    color: colors.textSub,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  valueText: {
    color: colors.accentAmber,
    fontFamily: typography.family.bodySemi,
    fontSize: typography.size.xs,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  attributionText: {
    color: colors.textFaint,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
});
