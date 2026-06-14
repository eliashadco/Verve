import { useEffect } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';
import type { ClinicalConstraint } from '@/types/database';
import type { Violation, ViolationLevel } from '@/features/constraints/validate';

export type ConstraintRow = ClinicalConstraint & { physio_name?: string | null };

interface WhyBlockedSheetProps {
  visible: boolean;
  onClose: () => void;
  exerciseName: string;
  violations: Violation[];
  constraints: ConstraintRow[];
}

function violationTone(level: ViolationLevel): 'danger' | 'warning' | 'clinical' {
  if (level === 'hard') return 'danger';
  if (level === 'soft') return 'warning';
  return 'clinical';
}

function explanationKey(constraintType: string): string {
  switch (constraintType.toLowerCase()) {
    case 'blocked_exercise':
      return 'constraints.why.blocked_exercise';
    case 'blocked_movement':
      return 'constraints.why.blocked_movement';
    case 'load_limit':
      return 'constraints.why.load_limit';
    case 'rom_limit':
      return 'constraints.why.rom_limit';
    default:
      return 'constraints.why.blocked_exercise';
  }
}

export function WhyBlockedSheet({
  visible,
  onClose,
  exerciseName,
  violations,
  constraints,
}: WhyBlockedSheetProps) {
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
              <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel={t('common.close')}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <GlassCard style={styles.contentCard}>
                <Text style={styles.title}>{exerciseName}</Text>
                <Text style={styles.subtitle}>{t('constraints.why.sheetTitle')}</Text>

                {violations.map((violation) => {
                  const row = constraints.find((c) => c.id === violation.constraintId);
                  const key = explanationKey(violation.constraintType);
                  const explanation = t(key, {
                    target: row?.target ?? violation.detail,
                    value: row?.value ?? row?.target ?? violation.detail,
                  });

                  return (
                    <View key={violation.constraintId} style={styles.violationBlock}>
                      <View style={styles.badgeRow}>
                        <Badge
                          label={violation.badgeLabel}
                          tone={violationTone(violation.level)}
                        />
                      </View>

                      <Text style={styles.explanation}>{explanation}</Text>

                      {row?.notes?.trim() ? (
                        <View style={styles.quoteBlock}>
                          <View style={styles.quoteBorder} />
                          <View style={styles.quoteContent}>
                            <Text style={styles.quoteText}>"{row.notes.trim()}"</Text>
                            {row.physio_name ? (
                              <Text style={styles.attribution}>— {row.physio_name}</Text>
                            ) : null}
                          </View>
                        </View>
                      ) : null}

                      {row?.created_at ? (
                        <Text style={styles.footer}>
                          {t('constraints.why.setAgo', {
                            when: formatDistanceToNow(new Date(row.created_at), { addSuffix: true }),
                          })}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </GlassCard>
            </ScrollView>
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
    minHeight: 320,
    maxHeight: '80%',
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
  contentCard: { gap: 12 },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xl,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    marginTop: -4,
  },
  violationBlock: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  badgeRow: { flexDirection: 'row' },
  explanation: {
    color: colors.textSub,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  quoteBlock: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  quoteBorder: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.clinical,
  },
  quoteContent: { flex: 1, gap: 2 },
  quoteText: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  attribution: {
    color: colors.textFaint,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  footer: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
});
