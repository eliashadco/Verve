import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { colors, spacing, typography } from '@/lib/theme';

interface TherapyRoutineCardProps {
  title: string;
  duration: string;
  equipment: string;
  safety: string;
  liveHref: Href;
  ctaLabel: string;
  liveFallbackNote?: string | null;
  exercises: TherapyExerciseDisplay[];
  completedIds: string[];
  onToggleExercise: (id: string) => void;
  onDemoVideo: (name: string) => void;
}

export interface TherapyExerciseDisplay {
  id: string;
  name: string;
  sets: string;
  reps: string;
  notes: string;
}

export function TherapyRoutineCard({
  title,
  duration,
  equipment,
  safety,
  liveHref,
  ctaLabel,
  liveFallbackNote,
  exercises,
  completedIds,
  onToggleExercise,
  onDemoVideo,
}: TherapyRoutineCardProps) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>
        {duration} · {equipment}
      </Text>
      <Badge label={safety} tone="warning" />
      <View style={styles.breakdown}>
        {exercises.map((exercise) => {
          const done = completedIds.includes(exercise.id);
          return (
            <View key={exercise.id} style={styles.exerciseRow}>
              <Pressable
                onPress={() => onToggleExercise(exercise.id)}
                style={[styles.checkbox, done && styles.checkboxDone]}
              >
                <Text style={styles.checkboxText}>{done ? '✓' : ''}</Text>
              </Pressable>
              <View style={styles.exerciseBody}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                <View style={styles.exerciseMetaRow}>
                  <Badge label={`${exercise.sets} x ${exercise.reps}`} tone="neutral" />
                  <Pressable onPress={() => onDemoVideo(exercise.name)}>
                    <Text style={styles.demoText}>Demo video</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <Link href={liveHref} asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      </Link>
      {liveFallbackNote ? <Text style={styles.fallbackNote}>{liveFallbackNote}</Text> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  meta: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm },
  cta: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 999,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  ctaText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  fallbackNote: { color: colors.textFaint, fontFamily: typography.family.body, fontSize: typography.size.xs, textAlign: 'center' },
  breakdown: { gap: spacing.sm },
  exerciseRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxText: { color: colors.bgApp, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  exerciseBody: { flex: 1, gap: 3 },
  exerciseName: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  exerciseNotes: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.xs },
  exerciseMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  demoText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
});
