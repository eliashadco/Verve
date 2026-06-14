import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/lib/theme';
import { getMuscleLabel } from '@/lib/programBuilder/muscles';
import { computeVolumeSnapshot, round1 } from '@/lib/programBuilder/volumeEngine';
import type { BuilderProgram } from '@/lib/programBuilder/types';

interface HeatmapMuscleDetailProps {
  visible: boolean;
  onClose: () => void;
  muscleKey: string;
  program: BuilderProgram;
  scope: 'all' | 'day';
  dayIndex: number;
}

export function HeatmapMuscleDetail({
  visible,
  onClose,
  muscleKey,
  program,
  scope,
  dayIndex,
}: HeatmapMuscleDetailProps) {
  const snapshot = computeVolumeSnapshot(program, { scope, dayIndex });
  const actual = round1(snapshot.setVolumes[muscleKey] || 0);
  const load = round1(snapshot.loadVolumes[muscleKey] || 0);
  const target = program.targets[muscleKey] || 0;
  const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
  const contributors = snapshot.contributors[muscleKey] || [];

  const sortedContributors = [...contributors].sort((a, b) => b.loadAmount - a.loadAmount);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{getMuscleLabel(muscleKey)}</Text>
              <Text style={styles.subtitle}>
                {scope === 'day' ? `Day ${dayIndex + 1} Scope` : 'All Days Scope'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMain} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <View style={styles.statBox}>
              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Planned Sets</Text>
                  <Text style={styles.statVal}>{actual} / {target || '—'} sets</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Load Volume</Text>
                  <Text style={styles.statVal}>{load} kg</Text>
                </View>
              </View>

              {target > 0 && (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Target Completion</Text>
                    <Text style={styles.progressPct}>{pct}%</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.min(100, pct)}%` }]} />
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Exercises & Contributions</Text>
            {sortedContributors.length === 0 ? (
              <Text style={styles.emptyText}>No exercises contribute to this muscle on this day.</Text>
            ) : (
              sortedContributors.map((c, idx) => {
                const estExLoad = round1(c.sets * c.reps * c.weight);
                return (
                  <View key={`${c.name}-${idx}`} style={styles.contributorRow}>
                    <View style={styles.contributorLeft}>
                      <Text style={styles.contributorName}>{c.name}</Text>
                      <Text style={styles.contributorDetail}>
                        {c.sets} sets × {c.reps} reps × {c.weight || '0'} kg
                      </Text>
                    </View>
                    <View style={styles.contributorRight}>
                      <Text style={styles.contributorAmount}>+{c.amount} sets</Text>
                      <Text style={styles.contributorLoad}>Load: {round1(c.loadAmount)} kg ({Math.round(c.factor * 100)}%)</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: 16,
    maxHeight: '70%',
    borderColor: colors.borderDefault,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  statBox: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    padding: 14,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: typography.family.bodyBold,
    textTransform: 'uppercase',
  },
  statVal: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
    marginTop: 4,
  },
  progressSection: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: typography.family.bodyBold,
    textTransform: 'uppercase',
  },
  progressPct: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: typography.size.sm,
    fontStyle: 'italic',
  },
  contributorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  contributorLeft: {
    flex: 1,
    marginRight: 12,
  },
  contributorName: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  contributorDetail: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  contributorRight: {
    alignItems: 'flex-end',
  },
  contributorAmount: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  contributorLoad: {
    color: colors.textFaint,
    fontSize: 9,
    marginTop: 2,
  },
});
