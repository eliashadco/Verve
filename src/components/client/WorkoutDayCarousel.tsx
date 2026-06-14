import { useRef, useState, useEffect } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { useTranslation } from '@/lib/i18n';
import { colors, spacing, typography } from '@/lib/theme';

interface WorkoutDayCarouselProps {
  days: any[];
  activeIndex: number;
  onPressDay: (index: number) => void;
  onStartSession: (index: number) => void;
}

export function WorkoutDayCarousel({
  days,
  activeIndex,
  onPressDay,
  onStartSession,
}: WorkoutDayCarouselProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [previewsExpanded, setPreviewsExpanded] = useState<Record<number, boolean>>({});

  const cardWidth = width - 48; // Leaves 16px margins + 8px peek on next card
  const containerWidth = width;

  // Scroll to active index when it changes externally
  useEffect(() => {
    if (flatListRef.current && days.length > 0) {
      flatListRef.current.scrollToIndex({
        index: activeIndex,
        animated: true,
        viewPosition: 0.5, // Center the card
      });
    }
  }, [activeIndex, days.length]);

  const togglePreview = (index: number) => {
    setPreviewsExpanded((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const cellWidth = cardWidth + 12; // cardWidth + gap
    const index = Math.round(scrollOffset / cellWidth);
    if (index >= 0 && index < days.length && index !== activeIndex) {
      onPressDay(index);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isExpanded = !!previewsExpanded[index];
    const exercises = item.exercises || [];
    
    // Extract unique muscles for this day
    const muscles = Array.from(new Set(exercises.map((e: any) => e.muscle).filter(Boolean))) as string[];

    return (
      <View style={[styles.cardContainer, { width: cardWidth }]}>
        <GlassCard style={[styles.dayCard, activeIndex === index && styles.dayCardActive]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dayLabel}>
                {item.label || t('userTrial.programs.dayLabel', { n: index + 1 })}
              </Text>
              <Text style={styles.dayStats}>
                {t('userTrial.programs.exerciseCount', { count: exercises.length }) ||
                  `${exercises.length} Exercises`}
                {' · '}
                {t('userTrial.programs.targetLabel') || 'Target'}: {muscles.length > 0 ? muscles.join(', ') : 'General'}
              </Text>
            </View>
            {activeIndex === index && (
              <View style={styles.activeDot} />
            )}
          </View>

          {/* Thin progress bars/indicators for target muscles */}
          {muscles.length > 0 && (
            <View style={styles.musclesProgressRow}>
              {muscles.map((muscle) => (
                <View key={muscle} style={styles.muscleBarContainer}>
                  <Text style={styles.muscleBarLabel} numberOfLines={1}>{muscle}</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '80%' }]} />
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => togglePreview(index)}
              style={[styles.btnSecondary, isExpanded && styles.btnSecondaryActive]}
            >
              <Ionicons
                name={isExpanded ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.btnSecondaryText}>
                {isExpanded
                  ? t('userTrial.programs.hidePreview') || 'Hide Preview'
                  : t('userTrial.programs.previewExercises') || 'Preview Exercises'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onStartSession(index)}
              style={styles.btnPrimary}
            >
              <Ionicons name="play" size={14} color={colors.bgApp} />
              <Text style={styles.btnPrimaryText}>
                {t('userTrial.programs.startSession') || 'START SESSION'}
              </Text>
            </Pressable>
          </View>

          {isExpanded && (
            <View style={styles.previewContainer}>
              <View style={styles.previewDivider} />
              {exercises.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t('userTrial.programs.noExercisesPlanned') || 'No exercises planned for this day.'}
                </Text>
              ) : (
                exercises.map((ex: any, exIdx: number) => (
                  <View key={`${ex.id}-${exIdx}`} style={styles.exerciseRow}>
                    <View style={styles.exerciseNumberWrap}>
                      <Text style={styles.exerciseNumber}>{exIdx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {ex.sets} sets x {ex.reps} reps
                        {ex.targetRIR != null ? ` · RIR ${ex.targetRIR}` : ''}
                        {ex.tempo ? ` · ${ex.tempo}` : ''}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={days}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id || index}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 12} // card width + gap
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={[
          styles.flatListContent,
          { paddingHorizontal: 16 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: cardWidth + 12,
          offset: (cardWidth + 12) * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  flatListContent: {
    gap: 12,
  },
  cardContainer: {
    paddingVertical: 4,
  },
  dayCard: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dayCardActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
  dayStats: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  musclesProgressRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  muscleBarContainer: {
    flex: 1,
    minWidth: 80,
    gap: 2,
  },
  muscleBarLabel: {
    color: colors.textSub,
    fontFamily: typography.family.bodyMedium,
    fontSize: 10,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: colors.surfaceHover,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 1.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 8,
    backgroundColor: colors.primaryDim,
    paddingVertical: 8,
  },
  btnSecondaryActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  btnSecondaryText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingVertical: 8,
  },
  btnPrimaryText: {
    color: colors.bgApp,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  previewContainer: {
    marginTop: spacing.xs,
  },
  previewDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  exerciseNumberWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  exerciseNumber: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
  },
  exerciseName: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  exerciseMeta: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: 10,
    marginTop: 1,
  },
});
