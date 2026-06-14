import { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/auth/AuthProvider';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { usePrograms } from '@/hooks/usePrograms';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

export default function TrainingHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  
  // Fetch real training programs from Supabase
  const { programs, loading, error, refresh } = usePrograms(profile?.id ?? null, 'client');

  // Find the active program
  const activeProgram = useMemo(() => {
    return programs.find((p) => p.status === 'active') ?? programs[0] ?? null;
  }, [programs]);

  const onRefresh = async () => {
    await refresh();
  };

  const handleStartWorkout = (programId: string, dayIndex: number) => {
    // Route to live session for the selected program day
    router.push(`/(client)/live/${programId}/${dayIndex}` as any);
  };

  // Prepare list items: we render the days of the active program
  const listData = useMemo(() => {
    if (!activeProgram) return [];
    return activeProgram.days.map((day, index) => ({
      id: `${activeProgram.id}-${index}`,
      dayIndex: index,
      dayLabel: day.label,
      exerciseCount: day.exercises?.length ?? 0,
      exercisesSummary: day.exercises?.map((ex) => ex.notes || 'Exercise').slice(0, 3).join(', ') ?? '',
      programId: activeProgram.id,
      programName: activeProgram.name
    }));
  }, [activeProgram]);

  return (
    <ScreenContainer scroll={false} ambient="tealGlass">
      <Header title="Training Hub" />
      
      <View style={styles.headerInfo}>
        {activeProgram ? (
          <GlassCard style={styles.activePlanCard} padding={12}>
            <View style={styles.planHeader}>
              <Badge label="ACTIVE PROTOCOL" tone="primary" />
              {activeProgram.focus && <Badge label={activeProgram.focus} tone="clinical" />}
            </View>
            <Text style={styles.planName}>{activeProgram.name}</Text>
            <Text style={styles.planMeta}>
              {activeProgram.duration_weeks ? `${activeProgram.duration_weeks} weeks` : ''} · {activeProgram.days.length} workouts per week
            </Text>
          </GlassCard>
        ) : (
          <GlassCard padding={12}>
            <Text style={styles.noPlanText}>No active training plan assigned.</Text>
          </GlassCard>
        )}
      </View>

      {error ? (
        <GlassCard style={styles.errorCard} padding={12}>
          <Text style={styles.errorText}>{error}</Text>
        </GlassCard>
      ) : null}

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="barbell-outline"
              title="No Workouts Found"
              body="When your coach or physiotherapist assigns a training plan, your daily workouts will appear here."
            />
          ) : null
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <GlassCard style={styles.workoutCard} padding={16}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.workoutIconBg}>
                  <Ionicons name="barbell-outline" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.workoutDayName}>{item.dayLabel}</Text>
                  <Text style={styles.workoutMeta}>{item.exerciseCount} exercises</Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleStartWorkout(item.programId, item.dayIndex)}
                style={styles.startBtn}
              >
                <Text style={styles.startBtnText}>Start</Text>
                <Ionicons name="play" size={12} color={colors.bgApp} />
              </Pressable>
            </View>
            {item.exerciseCount > 0 && (
              <View style={styles.cardDivider} />
            )}
            {item.exerciseCount > 0 && (
              <View style={styles.exercisePreview}>
                <Ionicons name="list" size={14} color={colors.textFaint} />
                <Text style={styles.previewText} numberOfLines={1}>
                  Includes sets for compound and recovery movements.
                </Text>
              </View>
            )}
          </GlassCard>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerInfo: {
    marginBottom: spacing.xs,
  },
  activePlanCard: {
    gap: 6,
  },
  planHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  planName: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.lg,
  },
  planMeta: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  noPlanText: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  listContainer: {
    gap: spacing.sm,
    paddingBottom: 40,
  },
  workoutCard: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutIconBg: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutDayName: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  workoutMeta: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  startBtnText: {
    color: colors.bgApp,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  exercisePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewText: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    flex: 1,
  },
  errorCard: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerDim,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
});
