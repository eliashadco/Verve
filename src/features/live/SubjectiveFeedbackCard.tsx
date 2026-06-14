import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface SubjectiveFeedbackCardProps {
  painScore: number;
  notes: string;
  onChangePain: (score: number) => void;
  onChangeNotes: (notes: string) => void;
}

export function SubjectiveFeedbackCard({
  painScore,
  notes,
  onChangePain,
  onChangeNotes,
}: SubjectiveFeedbackCardProps) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>Subjective Feedback</Text>
      <Text style={styles.subtitle}>Body pain hotspots (0-10)</Text>
      <View style={styles.painRow}>
        {Array.from({ length: 11 }, (_, value) => (
          <Pressable
            key={value}
            onPress={() => onChangePain(value)}
            style={[styles.painDot, painScore === value && styles.painDotActive]}
          >
            <Text style={[styles.painText, painScore === value && styles.painTextActive]}>{value}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={notes}
        onChangeText={onChangeNotes}
        placeholder="Session notes..."
        placeholderTextColor={colors.textFaint}
        multiline
        style={styles.notes}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  painRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  painDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  painDotActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primaryBorder,
  },
  painText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  painTextActive: { color: colors.primary, fontFamily: typography.family.bodyBold },
  notes: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    color: colors.textStrong,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    padding: spacing.sm,
    textAlignVertical: 'top',
  },
});
