import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { colors, radii, spacing, typography } from '@/lib/theme';
import type { PainMarker } from '@/types/database';

interface ClientPainPanelProps {
  markers: PainMarker[];
  loading: boolean;
}

function painTone(score: number): 'primary' | 'warning' | 'danger' {
  if (score <= 3) return 'primary';
  if (score <= 6) return 'warning';
  return 'danger';
}

function painColor(score: number): string {
  if (score <= 3) return colors.primary;
  if (score <= 6) return colors.accentAmber;
  return colors.danger;
}

/**
 * Trainer-side panel showing a live feed of pain signals emitted by the client
 * during live sessions. Subscribes to realtime via usePainMarkers in the parent.
 */
export function ClientPainPanel({ markers, loading }: ClientPainPanelProps) {
  const hasMarkers = markers.length > 0;

  return (
    <GlassCard style={styles.sectionCard}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>PAIN SIGNALS</Text>
        <View style={styles.realtimeDot}>
          <View style={[styles.dot, hasMarkers && styles.dotActive]} />
          <Text style={styles.liveText}>live</Text>
        </View>
      </View>

      {/* Empty state */}
      {!hasMarkers && !loading ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title="No pain reported"
          body="Pain signals from live sessions will appear here in real time."
        />
      ) : null}

      {/* Pain marker timeline */}
      {markers.slice(0, 10).map((marker) => {
        const color = painColor(marker.pain_score);
        const relTime = formatDistanceToNow(parseISO(marker.created_at), { addSuffix: true });

        return (
          <View key={marker.id} style={styles.markerRow}>
            {/* Score chip */}
            <View style={[styles.scoreChip, { borderColor: color + '55', backgroundColor: color + '12' }]}>
              <Text style={[styles.scoreText, { color }]}>{marker.pain_score}</Text>
              <Text style={[styles.scoreMax, { color }]}>/10</Text>
            </View>

            {/* Details */}
            <View style={styles.markerDetails}>
              <View style={styles.badgeRow}>
                {marker.body_region ? (
                  <Badge label={marker.body_region.toUpperCase()} tone={painTone(marker.pain_score)} />
                ) : null}
                <Badge label={marker.context.replace('_', ' ')} tone="neutral" />
              </View>
              <Text style={styles.relTime}>{relTime}</Text>
            </View>

            {/* Pain level icon */}
            <Ionicons
              name={marker.pain_score >= 7 ? 'alert-circle' : 'information-circle-outline'}
              size={16}
              color={color}
            />
          </View>
        );
      })}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  sectionCard: { gap: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  realtimeDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.borderDefault,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  liveText: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: 10,
    textTransform: 'lowercase',
  },
  markerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    minWidth: 44,
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  scoreMax: {
    fontFamily: typography.family.body,
    fontSize: 10,
  },
  markerDetails: {
    flex: 1,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  relTime: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: 10,
  },
});
