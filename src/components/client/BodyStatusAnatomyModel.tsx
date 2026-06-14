import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import type { BodyRegion } from '@/components/client/BodyMapPreview';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface BodyStatusAnatomyModelProps {
  regions: BodyRegion[];
  selectedRegion: BodyRegion | null;
  view: 'anterior' | 'posterior';
  onChangeView: (view: 'anterior' | 'posterior') => void;
  onSelectRegion: (region: BodyRegion) => void;
  onAddNote: () => void;
  onOpenNotes: () => void;
}

const REGION_COORDS: Record<string, { x: number; y: number }> = {
  head: { x: 110, y: 28 },
  neck: { x: 110, y: 48 },
  shoulders: { x: 110, y: 70 },
  chest: { x: 110, y: 98 },
  upperBack: { x: 110, y: 98 },
  core: { x: 110, y: 130 },
  hips: { x: 110, y: 158 },
  quads: { x: 88, y: 198 },
  ham: { x: 132, y: 198 },
  knee: { x: 88, y: 232 },
  calves: { x: 132, y: 260 },
};

export function BodyStatusAnatomyModel({
  regions,
  selectedRegion,
  view,
  onChangeView,
  onSelectRegion,
  onAddNote,
  onOpenNotes,
}: BodyStatusAnatomyModelProps) {
  const { t } = useTranslation();
  const activeRegion = selectedRegion ?? regions[0] ?? null;

  return (
    <GlassCard variant="anatomy" style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>{t('userTrial.progress.bodyMap30Days')}</Text>
          <Text style={styles.title}>{t('userTrial.progress.digitalTwinBadge')}</Text>
        </View>
        <Pressable onPress={onOpenNotes} style={styles.notesButton} accessibilityLabel={t('userTrial.progress.openBioMapNotesA11y')}>
          <Text style={styles.notesButtonText}>{t('userTrial.progress.notes')}</Text>
        </Pressable>
      </View>

      <View style={styles.toggleRow}>
        {(['anterior', 'posterior'] as const).map((side) => (
          <Pressable
            key={side}
            onPress={() => onChangeView(side)}
            style={[styles.toggle, view === side && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, view === side && styles.toggleTextActive]}>
              {side === 'anterior' ? t('userTrial.progress.anterior') : t('userTrial.progress.posterior')}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.stage}>
        <Svg width={220} height={300} viewBox="0 0 220 300">
          <Circle cx={110} cy={28} r={17} fill={colors.surface3} stroke={colors.borderStrong} />
          <Path d="M92 58 C84 84 82 116 88 150 C92 172 128 172 132 150 C138 116 136 84 128 58 Z" fill={colors.surface2} stroke={colors.borderStrong} />
          <Line x1={88} y1={78} x2={48} y2={132} stroke={colors.surface2} strokeWidth={18} strokeLinecap="round" />
          <Line x1={132} y1={78} x2={172} y2={132} stroke={colors.surface2} strokeWidth={18} strokeLinecap="round" />
          <Line x1={97} y1={166} x2={82} y2={276} stroke={colors.surface2} strokeWidth={20} strokeLinecap="round" />
          <Line x1={123} y1={166} x2={138} y2={276} stroke={colors.surface2} strokeWidth={20} strokeLinecap="round" />
          <Ellipse cx={110} cy={156} rx={34} ry={19} fill={colors.surface3} stroke={colors.borderStrong} />
          {regions.map((region) => {
            const coords = REGION_COORDS[region.id] ?? REGION_COORDS.core;
            const active = activeRegion?.id === region.id;
            return (
              <Circle
                key={region.id}
                cx={coords.x}
                cy={coords.y}
                r={active ? 10 : 7}
                fill={toneColor(region.tone)}
                stroke={active ? colors.textStrong : colors.bgApp}
                strokeWidth={active ? 2 : 1}
                onPress={() => onSelectRegion(region)}
              />
            );
          })}
        </Svg>
        {activeRegion ? (
          <View style={styles.detailPill}>
            <View style={styles.detailTop}>
              <Text style={styles.detailTitle}>{activeRegion.label}</Text>
              <Badge label={activeRegion.tone} tone={activeRegion.tone === 'restricted' ? 'clinical' : activeRegion.tone === 'pain' ? 'danger' : 'neutral'} />
            </View>
            <Text style={styles.detailText}>{activeRegion.note ?? t('userTrial.progress.noCurrentNote')}</Text>
            <Text style={styles.detailMeta}>{t('userTrial.progress.lastExercise', { name: activeRegion.lastExercise ?? t('userTrial.progress.noLastExercise') })}</Text>
            <Pressable onPress={onAddNote} style={styles.addNote}>
              <Text style={styles.addNoteText}>{t('userTrial.progress.addNote')}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Pressable onPress={onAddNote} style={styles.quickLog} accessibilityLabel={t('userTrial.progress.quickLogA11y')}>
        <Text style={styles.quickLogText}>+</Text>
      </Pressable>
    </GlassCard>
  );
}

function toneColor(tone: BodyRegion['tone']) {
  switch (tone) {
    case 'pain':
      return colors.danger;
    case 'sore':
      return colors.warning;
    case 'restricted':
      return colors.clinical;
    case 'resolved':
      return colors.success;
    default:
      return colors.textFaint;
  }
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  kicker: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.label,
    textTransform: 'uppercase',
  },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md, marginTop: 2 },
  notesButton: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface2,
  },
  notesButtonText: { color: colors.textMuted, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  toggleRow: { flexDirection: 'row', gap: spacing.xs },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface2,
  },
  toggleActive: { borderColor: colors.primaryBorder, backgroundColor: colors.primaryDim },
  toggleText: { color: colors.textMuted, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  toggleTextActive: { color: colors.primary },
  stage: { alignItems: 'center', gap: spacing.sm },
  detailPill: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.lg,
    backgroundColor: colors.surface2,
    padding: spacing.md,
    gap: spacing.xs,
  },
  detailTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  detailTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  detailText: { color: colors.textSub, fontFamily: typography.family.body, fontSize: typography.size.sm },
  detailMeta: { color: colors.textFaint, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
  addNote: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryDim,
  },
  addNoteText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  quickLog: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  quickLogText: { color: colors.bgApp, fontFamily: typography.family.heading, fontSize: typography.size.xl },
});
