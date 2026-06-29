import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface SubjectiveFeedbackCardProps {
  painScore: number;
  notes: string;
  /** e.g. "KNEE PAIN (DURING SET)" or fallback "BODY PAIN (DURING SET)" */
  painLabel?: string;
  /** Muscles being worked — shown as highlighted labels */
  highlightedMuscles?: string[];
  /**
   * When provided a "Report to Trainer" button appears once painScore >= painNotifyThreshold.
   * Called once per session (the parent controls the sent-guard via painReported).
   */
  onReportPain?: () => void;
  /** Set to true after the parent has successfully emitted the pain marker. */
  painReported?: boolean;
  /** Pain score threshold above which the report button appears. Default: 4. */
  painNotifyThreshold?: number;
  onChangePain: (score: number) => void;
  onChangeNotes: (notes: string) => void;
}

export function SubjectiveFeedbackCard({
  painScore,
  notes,
  painLabel = 'BODY PAIN (DURING SET)',
  highlightedMuscles,
  onReportPain,
  painReported = false,
  painNotifyThreshold = 4,
  onChangePain,
  onChangeNotes,
}: SubjectiveFeedbackCardProps) {
  const [showAnatomy, setShowAnatomy] = useState(true);
  const [justSent, setJustSent] = useState(false);

  const showReportBtn = !!onReportPain && painScore >= painNotifyThreshold && !painReported;
  const sentConfirmation = painReported || justSent;

  const handleReportPain = () => {
    setJustSent(true);
    onReportPain?.();
    setTimeout(() => setJustSent(false), 2500);
  };

  // Slider gradient color interpolation
  const sliderColor =
    painScore <= 3 ? colors.primary :
    painScore <= 6 ? colors.accentAmber :
    colors.danger;

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>SUBJECTIVE FEEDBACK</Text>

      {/* Anatomy placeholder with toggle */}
      <View style={styles.anatomySection}>
        <View style={styles.anatomyHeader}>
          <View style={{ flex: 1 }} />
          <View style={styles.anatomyIcons}>
            <Pressable onPress={() => {}} style={styles.iconBtn} accessibilityLabel="Edit pain points">
              <Ionicons name="create-outline" size={16} color={colors.textMuted} />
            </Pressable>
            <Pressable onPress={() => setShowAnatomy(!showAnatomy)} style={styles.iconBtn} accessibilityLabel="Toggle anatomy">
              <Ionicons name={showAnatomy ? 'eye' : 'eye-off'} size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {showAnatomy && (
          <View style={styles.anatomyPlaceholder}>
            <View style={styles.bodyOutline}>
              <Ionicons name="body" size={80} color={colors.textFaint} />
              {/* Muscle highlight labels */}
              {highlightedMuscles && highlightedMuscles.length > 0 && (
                <View style={styles.muscleOverlay}>
                  {highlightedMuscles.slice(0, 4).map((m) => (
                    <View key={m} style={styles.muscleHighlight}>
                      <View style={styles.muscleDot} />
                      <Text style={styles.muscleHighlightText}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Pain slider */}
      <View style={styles.painSection}>
        <Text style={styles.painLabel}>{painLabel}</Text>
        <View style={styles.sliderRow}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={painScore}
            onValueChange={onChangePain}
            minimumTrackTintColor={sliderColor}
            maximumTrackTintColor={colors.borderSubtle}
            thumbTintColor={sliderColor}
          />
          <Text style={[styles.painValue, { color: sliderColor }]}>{painScore}/10</Text>
        </View>

        {/* Report to Trainer CTA */}
        {showReportBtn && (
          <Pressable
            id="report-pain-btn"
            onPress={handleReportPain}
            style={styles.reportBtn}
            accessibilityLabel="Report pain to trainer"
          >
            <Ionicons name="alert-circle" size={14} color={colors.accentAmber} />
            <Text style={styles.reportBtnText}>Report to Trainer</Text>
          </Pressable>
        )}

        {/* Sent confirmation */}
        {sentConfirmation && (
          <View style={styles.sentRow}>
            <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
            <Text style={styles.sentText}>Trainer notified</Text>
          </View>
        )}
      </View>

      {/* Notes */}
      <TextInput
        value={notes}
        onChangeText={onChangeNotes}
        placeholder="How did each set feel? Note any pain or discomfort..."
        placeholderTextColor={colors.textFaint}
        multiline
        style={styles.notes}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  /* Anatomy */
  anatomySection: { gap: 4 },
  anatomyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  anatomyIcons: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anatomyPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  bodyOutline: { alignItems: 'center', position: 'relative' },
  muscleOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  muscleHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  muscleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  muscleHighlightText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: 9,
  },

  /* Pain slider */
  painSection: { gap: 4 },
  painLabel: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: { flex: 1, height: 32 },
  painValue: {
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
    width: 36,
    textAlign: 'right',
  },

  /* Notes */
  notes: {
    minHeight: 60,
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

  /* Report to Trainer */
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  reportBtnText: {
    color: colors.accentAmber,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
  },
  sentText: {
    color: colors.primary,
    fontFamily: typography.family.bodySemi,
    fontSize: typography.size.sm,
  },
});
