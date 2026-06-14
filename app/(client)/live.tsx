import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/auth/AuthProvider';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { VerveButton } from '@/components/VerveButton';
import { usePrograms } from '@/hooks/usePrograms';
import { useConstraints } from '@/hooks/useConstraints';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography, shadows } from '@/lib/theme';

export default function LiveSessionPicker() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const router = useRouter();
  const { programs, loading, refresh } = usePrograms(profile?.id ?? null, 'client');
  const constraints = useConstraints(profile?.id ?? null);

  const active = programs.find((p) => p.status === 'active') ?? programs[0];

  // Modal and Readiness States
  const [modalVisible, setModalVisible] = useState(false);
  const [stagedDayIndex, setStagedDayIndex] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(8);
  const [soreness, setSoreness] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');

  const activeConstraints = useMemo(() => {
    return constraints.data.filter((c) => c.status === 'active');
  }, [constraints.data]);

  const handleOpenReadiness = (dayIndex: number) => {
    setStagedDayIndex(dayIndex);
    setEnergy(8);
    setSoreness('none');
    setModalVisible(true);
  };

  const handleConfirmStart = () => {
    if (stagedDayIndex === null || !active) return;
    setModalVisible(false);
    
    // Route to live session, passing readiness params
    router.push({
      pathname: `/(client)/live/${active.id}/${stagedDayIndex}`,
      params: {
        preEnergy: energy,
        preSoreness: soreness
      }
    } as any);
  };

  return (
    <ScreenContainer scroll={true}>
      <Header title={t('livePicker.title')} />
      <Text style={styles.lead}>{t('livePicker.lead')}</Text>

      {!active ? (
        <GlassCard>
          <EmptyState
            icon="barbell-outline"
            title={t('livePicker.emptyTitle')}
            body={t('livePicker.emptyBody')}
          />
        </GlassCard>
      ) : (
        <GlassCard style={{ gap: 12 }}>
          <Text style={styles.programName}>{active.name}</Text>
          {active.days.map((day, dayIndex) => (
            <Pressable
              key={dayIndex}
              onPress={() => handleOpenReadiness(dayIndex)}
              style={styles.dayBtn}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.dayLabel}>{t('livePicker.day', { n: String(dayIndex + 1) })}</Text>
                <Text style={styles.dayTitle}>{day.label}</Text>
                <Text style={styles.dayMeta}>
                  {t('livePicker.exerciseCount', { count: String(day.exercises.length) })}
                </Text>
              </View>
              <Ionicons name="play-circle" size={28} color={colors.primary} />
            </Pressable>
          ))}
        </GlassCard>
      )}

      {loading ? <Text style={{ color: colors.textFaint }}>{t('common.loading')}</Text> : null}
      <Pressable onPress={refresh}>
        <Text style={styles.refresh}>{t('livePicker.refresh')}</Text>
      </Pressable>

      {/* Pre-Session Readiness Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => undefined}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pre-Session Readiness</Text>
              <Text style={styles.modalSubtitle}>
                {active?.days[stagedDayIndex ?? 0]?.label ?? 'Workout Session'}
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {/* Active Clinical Restrictions Warning */}
              {activeConstraints.length > 0 && (
                <View style={styles.warningContainer}>
                  <View style={styles.warningHeader}>
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                    <Text style={styles.warningTitle}>Clinical Restrictions Enforced</Text>
                  </View>
                  {activeConstraints.map((c) => (
                    <Text key={c.id} style={styles.warningItem}>
                      • {c.target}: {c.notes ?? c.value ?? 'Enforced by Physio'}
                    </Text>
                  ))}
                </View>
              )}

              {/* Energy Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Energy Level</Text>
                <View style={styles.energySelector}>
                  {[2, 4, 6, 8, 10].map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setEnergy(level)}
                      style={[styles.energyBtn, energy === level && styles.energyBtnActive]}
                    >
                      <Text style={[styles.energyText, energy === level && styles.energyTextActive]}>
                        {level}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.energyHint}>
                  {energy <= 4 ? 'Low energy (Protocol loads will auto-tune down)' : energy <= 7 ? 'Moderate energy' : 'High energy (Full capacity)'}
                </Text>
              </View>

              {/* Soreness Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Muscle Soreness / Pain</Text>
                <View style={styles.sorenessSelector}>
                  {(['none', 'mild', 'moderate', 'severe'] as const).map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setSoreness(level)}
                      style={[styles.sorenessBtn, soreness === level && styles.sorenessBtnActive]}
                    >
                      <Text style={[styles.sorenessText, soreness === level && styles.sorenessTextActive]}>
                        {level.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.buttonRow}>
              <VerveButton
                label="Cancel"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={styles.halfBtn}
              />
              <VerveButton
                label="Start Session"
                onPress={handleConfirmStart}
                style={styles.halfBtn}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.textMuted, fontSize: typography.size.sm, marginBottom: spacing.sm },
  programName: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xl,
    marginBottom: spacing.xs
  },
  dayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    marginBottom: spacing.sm,
  },
  dayLabel: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dayTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base, marginTop: 2 },
  dayMeta: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 },
  refresh: { color: colors.primary, fontFamily: typography.family.bodyMedium, alignSelf: 'center', marginTop: 12 },

  // Modal / Bottom Sheet Styles
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 8, 0.7)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: 16,
    maxHeight: '85%',
    gap: 16,
    ...shadows.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    gap: 2,
  },
  modalTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xl,
  },
  modalSubtitle: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  modalScrollContent: {
    gap: 16,
    paddingBottom: 16,
  },
  warningContainer: {
    backgroundColor: colors.dangerDim,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    gap: 6,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningTitle: {
    color: colors.danger,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  warningItem: {
    color: colors.textSub,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    paddingLeft: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  energySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  energyBtn: {
    flex: 1,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyBtnActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primaryBorder,
  },
  energyText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  energyTextActive: {
    color: colors.primary,
  },
  energyHint: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
  sorenessSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  sorenessBtn: {
    flex: 1,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sorenessBtnActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primaryBorder,
  },
  sorenessText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
  },
  sorenessTextActive: {
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfBtn: {
    flex: 1,
  },
});
