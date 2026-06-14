import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { colors, radii, spacing, typography } from '@/lib/theme';

export interface TherapyPersonaDetails {
  label: string;
  icon: string;
  condition: string;
  goal: string;
  tip: string;
  tone: 'primary' | 'clinical' | 'warning' | 'success';
}

export const THERAPY_PERSONAS: Record<string, TherapyPersonaDetails> = {
  acl: {
    label: 'ACL / Knee Rehab',
    icon: '🦵',
    condition: 'ACL Reconstruction',
    goal: 'Return to Sport',
    tip: '⚠️ Avoid full knee flexion past 90° today — stop if swelling increases.',
    tone: 'warning',
  },
  back: {
    label: 'Back Pain',
    icon: '🔙',
    condition: 'Lower Back Pain',
    goal: 'Pain-Free Daily Life',
    tip: '💡 Keep spine neutral throughout — stop immediately if radicular pain occurs.',
    tone: 'clinical',
  },
  shoulder: {
    label: 'Shoulder Rehab',
    icon: '💪',
    condition: 'Rotator Cuff / Shoulder',
    goal: 'Full Range of Motion',
    tip: '🔵 Avoid overhead loading above protocol limits — report any clicking.',
    tone: 'primary',
  },
  general: {
    label: 'General Fitness',
    icon: '🎯',
    condition: 'General Fitness',
    goal: 'Strength & Mobility',
    tip: '✅ Quality over quantity — perfect form beats extra reps every time.',
    tone: 'success',
  },
};

interface Props {
  activePersona: string | null;
  onSelectPersona: (personaKey: string | null) => void;
  week?: number;
  phase?: number;
  phaseLabel?: string;
}

export function PersonaBanner({
  activePersona,
  onSelectPersona,
  week = 1,
  phase = 2,
  phaseLabel = 'Strength',
}: Props) {
  const meta = activePersona ? THERAPY_PERSONAS[activePersona] : null;

  if (!meta) {
    return (
      <GlassCard style={styles.cardSetup}>
        <View style={styles.headerSetup}>
          <View style={styles.badgeSetup}>
            <Text style={styles.badgeTextSetup}>SETUP</Text>
          </View>
          <Text style={styles.titleSetup}>What are you rehabbing?</Text>
        </View>
        <Text style={styles.descSetup}>
          Select your condition so Verve can personalise your care pathway, tips, and session guidance.
        </Text>
        <View style={styles.pickerRow}>
          {Object.entries(THERAPY_PERSONAS).map(([key, item]) => (
            <Pressable
              key={key}
              onPress={() => onSelectPersona(key)}
              style={styles.pickerBtn}
            >
              <Text style={styles.pickerBtnText}>
                {item.icon} {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>
    );
  }

  const tipStyleMap = {
    warning: { bg: colors.warningDim, border: 'rgba(245, 158, 11, 0.35)', text: colors.warning },
    clinical: { bg: colors.clinicalDim, border: colors.clinicalBorder, text: colors.clinical },
    primary: { bg: colors.primaryDim, border: colors.primaryBorder, text: colors.primary },
    success: { bg: colors.successDim, border: 'rgba(34, 197, 94, 0.35)', text: colors.success },
  };
  const toneStyle = tipStyleMap[meta.tone];

  return (
    <View style={styles.container}>
      <GlassCard style={styles.cardActive}>
        <View style={styles.activeRow}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>{meta.icon}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.conditionText}>{meta.condition}</Text>
            <Text style={styles.subtext}>
              Goal: {meta.goal} · Wk {week} · Ph {phase}: {phaseLabel}
            </Text>
          </View>
          <View style={styles.actionRow}>
            <View style={[styles.badgeActive, { backgroundColor: colors.surfaceHover }]}>
              <Text style={styles.badgeTextActive}>{meta.label}</Text>
            </View>
            <Pressable onPress={() => onSelectPersona(null)} style={styles.changeBtn}>
              <Ionicons name="swap-horizontal" size={14} color={colors.textMuted} />
              <Text style={styles.changeText}>Change</Text>
            </Pressable>
          </View>
        </View>
      </GlassCard>

      <View
        style={[
          styles.tipContainer,
          {
            backgroundColor: toneStyle.bg,
            borderColor: toneStyle.border,
          },
        ]}
      >
        <Text style={[styles.tipText, { color: toneStyle.text }]}>{meta.tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: spacing.md,
  },
  cardSetup: {
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.30)',
    padding: 16,
    marginBottom: spacing.md,
  },
  headerSetup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeSetup: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.xs,
  },
  badgeTextSetup: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  titleSetup: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  descSetup: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pickerBtn: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md,
  },
  pickerBtnText: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  cardActive: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: spacing.md,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  conditionText: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  subtext: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeActive: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  badgeTextActive: {
    color: colors.textSoft,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface1,
  },
  changeText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
  },
  tipContainer: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tipText: {
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
});
