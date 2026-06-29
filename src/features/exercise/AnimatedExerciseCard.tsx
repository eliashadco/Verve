import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Badge } from '@/components/Badge';
import { colors, radii, shadows, typography } from '@/lib/theme';
import type { Exercise } from '@/types/database';

interface AnimatedExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
}

const FALLBACK_GRADIENTS = [
  ['#0f172a', '#1e293b'],
  ['#1e1b4b', '#312e81'],
  ['#064e3b', '#065f46'],
  ['#450a0a', '#7f1d1d'],
];

export function AnimatedExerciseCard({ exercise, onPress }: AnimatedExerciseCardProps) {
  // Use a stable fallback gradient based on exercise ID
  const hash = exercise.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length] as [string, string];

  // Try to use thumbnail_url, fallback to video_url, or null.
  // Expo Image will automatically play GIFs/WebPs.
  const imageUrl = exercise.thumbnail_url || (exercise.video_url?.endsWith('.gif') || exercise.video_url?.endsWith('.webp') ? exercise.video_url : null);

  const primaryMuscle = exercise.primary_muscles?.[0]?.muscle;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={imageUrl}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            autoplay={true}
          />
        ) : (
          <LinearGradient colors={gradient} style={styles.placeholder}>
            <Ionicons name="barbell-outline" size={32} color="rgba(255,255,255,0.1)" />
          </LinearGradient>
        )}
        <View style={styles.overlay}>
          <View style={styles.badgesRow}>
            {exercise.difficulty && (
              <View style={styles.blurBadge}>
                <Text style={styles.blurBadgeText}>{exercise.difficulty}</Text>
              </View>
            )}
            {imageUrl && (
              <View style={[styles.blurBadge, styles.playBadge]}>
                <Ionicons name="play" size={10} color={colors.bgApp} />
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {exercise.name}
        </Text>
        <View style={styles.metaRow}>
          {primaryMuscle && (
            <Text style={styles.metaText}>{primaryMuscle}</Text>
          )}
          {exercise.equipment && (
            <>
              {primaryMuscle && <Text style={styles.metaDot}>·</Text>}
              <Text style={styles.metaText}>{exercise.equipment}</Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface2,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderDefault,
    marginBottom: 16,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: colors.surface1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  blurBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  playBadge: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  blurBadgeText: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  content: {
    padding: 12,
    gap: 4,
  },
  name: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: 11,
  },
  metaDot: {
    color: colors.textFaint,
    fontSize: 11,
  },
});
