import { useEffect } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';
import type { Exercise } from '@/types/database';

interface ExerciseDetailSheetProps {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
}

export function ExerciseDetailSheet({ visible, exercise, onClose }: ExerciseDetailSheetProps) {
  const { t } = useTranslation();
  const translateY = useSharedValue(520);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : 520, { duration: 220 });
  }, [visible, translateY]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd(() => {
      if (translateY.value > 120) runOnJS(onClose)();
      else translateY.value = withTiming(0, { duration: 180 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const muscles = [...(exercise?.primary_muscles ?? [])].sort((a, b) => b.contribution - a.contribution);

  const openVideo = async () => {
    if (!exercise?.video_url) return;
    const supported = await Linking.canOpenURL(exercise.video_url);
    if (supported) await Linking.openURL(exercise.video_url);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === 'ios' ? 'slide' : 'none'}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.sheet, animatedStyle]}>
            <View style={styles.sheetHeader}>
              <View style={styles.handle} />
              <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel={t('exerciseDetail.closeA11y')}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <GlassCard style={styles.contentCard}>
              <Text style={styles.title}>{exercise?.name ?? t('common.exercise')}</Text>
              <View style={styles.badges}>
                {exercise?.difficulty ? <Badge label={exercise.difficulty} tone="primary" /> : null}
                {exercise?.category ? <Badge label={exercise.category} tone="neutral" /> : null}
              </View>

              <Pressable
                onPress={() => void openVideo()}
                disabled={!exercise?.video_url}
                style={[styles.videoBtn, !exercise?.video_url && styles.videoBtnDisabled]}
              >
                <Ionicons name="play-circle-outline" size={16} color={exercise?.video_url ? colors.primary : colors.textFaint} />
                <Text style={[styles.videoText, !exercise?.video_url && styles.videoTextDisabled]}>
                  {exercise?.video_url ? t('exerciseDetail.openDemoVideo') : t('exerciseDetail.noDemoVideo')}
                </Text>
              </Pressable>

              <View style={styles.block}>
                <Text style={styles.blockTitle}>{t('exerciseDetail.setupCues')}</Text>
                <Text style={styles.blockBody}>{exercise?.setup_cues?.trim() || t('exerciseDetail.noSetupCues')}</Text>
              </View>

              <View style={styles.block}>
                <Text style={styles.blockTitle}>{t('exerciseDetail.executionCues')}</Text>
                <Text style={styles.blockBody}>{exercise?.execution_cues?.trim() || t('exerciseDetail.noExecutionCues')}</Text>
              </View>

              <View style={styles.block}>
                <Text style={styles.blockTitle}>{t('exerciseDetail.primaryMuscles')}</Text>
                {muscles.length === 0 ? (
                  <Text style={styles.blockBody}>{t('exerciseDetail.noMuscleData')}</Text>
                ) : (
                  muscles.map((muscle, index) => (
                    <View key={`${muscle.muscle}-${index}`} style={styles.muscleRow}>
                      <View style={styles.dot} />
                      <Text style={styles.muscleText}>
                        {t('exerciseDetail.muscleLine', { muscle: muscle.muscle, pct: muscle.contribution })}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </GlassCard>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 4, 8, 0.55)',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    padding: 12,
    gap: 8,
    minHeight: 360,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  closeBtn: { position: 'absolute', right: 2, top: 0, padding: 4 },
  contentCard: { gap: 10 },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xl,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 10,
    backgroundColor: colors.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  videoBtnDisabled: {
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
  },
  videoText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  videoTextDisabled: { color: colors.textFaint },
  block: { gap: 4 },
  blockTitle: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  blockBody: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  muscleText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
});
